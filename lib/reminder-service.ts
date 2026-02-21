import { createClient } from "@/lib/supabase/server"
import { createNotification, NotificationType, getUserNotificationPreferences } from "@/lib/notification-service"
import { sendCountdownReminderEmail, sendEventStartedEmail } from "@/lib/email-notifications"

// Re-export pure utilities so existing server-side imports still work
export {
  REMINDER_INTERVALS,
  REMINDER_LABELS,
  getReminderTypeForTime,
  formatTimeRemaining,
  getUpcomingReminders,
  shouldPromptCoverUpdate,
} from "@/lib/reminder-utils"
export type { ReminderType } from "@/lib/reminder-utils"

import type { ReminderType } from "@/lib/reminder-utils"
import { REMINDER_LABELS } from "@/lib/reminder-utils"

/**
 * Check if a reminder has already been sent
 */
export async function hasReminderBeenSent(
  itineraryId: string,
  userId: string,
  reminderType: ReminderType
): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("itinerary_reminders")
    .select("id")
    .eq("itinerary_id", itineraryId)
    .eq("user_id", userId)
    .eq("reminder_type", reminderType)
    .maybeSingle()

  return !!data && !error
}

/**
 * Record that a reminder was sent
 */
export async function recordReminderSent(
  itineraryId: string,
  userId: string,
  reminderType: ReminderType
): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("itinerary_reminders")
    .insert({
      itinerary_id: itineraryId,
      user_id: userId,
      reminder_type: reminderType,
    })

  if (error) {
    // Unique constraint violation means it was already recorded
    if (error.code === "23505") {
      return true
    }
    console.error("Error recording reminder:", error)
    return false
  }

  return true
}

/**
 * Send a countdown reminder notification (in-app + email)
 */
export async function sendCountdownReminder(
  userId: string,
  itineraryId: string,
  itineraryTitle: string,
  reminderType: ReminderType,
  eventType: "event" | "trip" = "event",
  options?: {
    eventDate?: string
    location?: string
    sendEmail?: boolean
  }
): Promise<{ success: boolean; error?: string }> {
  // Check if already sent
  const alreadySent = await hasReminderBeenSent(itineraryId, userId, reminderType)
  if (alreadySent) {
    return { success: true } // Already sent, no need to send again
  }

  // Check user's notification preferences
  const prefs = await getUserNotificationPreferences(userId)
  if (!prefs.tripReminders) {
    return { success: true } // User has disabled trip reminders
  }

  let title: string
  let message: string
  const emoji = eventType === "trip" ? "✈️" : "🎉"
  const timeLabel = REMINDER_LABELS[reminderType]

  if (reminderType === "started") {
    title = `${emoji} Your ${eventType} has started!`
    message = `"${itineraryTitle}" is happening now. Have an amazing time!`
  } else if (reminderType === "post_event_cover") {
    title = `📸 Update your ${eventType} cover?`
    message = `Your ${eventType} "${itineraryTitle}" has ended. Would you like to update the cover with photos from the ${eventType}?`
  } else {
    title = `${emoji} ${timeLabel} until your ${eventType}!`
    message = `"${itineraryTitle}" starts in ${timeLabel}. Get ready!`
  }

  // Send in-app notification
  const result = await createNotification({
    userId,
    type: "system_message" as NotificationType,
    title,
    message,
    linkUrl: `/event/${itineraryId}`,
    metadata: {
      reminderType,
      itineraryId,
      itineraryTitle,
    },
  })

  // Also send email if enabled (default: send for major milestones)
  const shouldSendEmail = options?.sendEmail !== false &&
    prefs.email &&
    ["5_days", "2_days", "1_day", "2_hours", "started"].includes(reminderType)

  if (shouldSendEmail) {
    try {
      const supabase = await createClient()
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, name")
        .eq("id", userId)
        .single()

      if (profile?.email) {
        if (reminderType === "started") {
          await sendEventStartedEmail({
            email: profile.email,
            name: profile.name || undefined,
            itineraryTitle,
            itineraryId,
            location: options?.location,
            eventType,
          })
        } else {
          await sendCountdownReminderEmail({
            email: profile.email,
            name: profile.name || undefined,
            itineraryTitle,
            itineraryId,
            timeRemaining: timeLabel,
            eventDate: options?.eventDate || new Date().toISOString(),
            location: options?.location,
            eventType,
          })
        }
      }
    } catch (emailError) {
      console.error("Failed to send reminder email:", emailError)
      // Don't fail the whole operation if email fails
    }
  }

  if (result.success) {
    await recordReminderSent(itineraryId, userId, reminderType)
  }

  return result
}

/**
 * Get all itineraries that need reminders sent
 * This should be called by a cron job
 */
export async function getItinerariesNeedingReminders(): Promise<{
  itineraryId: string
  userId: string
  title: string
  startDate: Date
  reminderType: ReminderType
}[]> {
  const { getReminderTypeForTime } = await import("@/lib/reminder-utils")
  const supabase = await createClient()
  const now = new Date()

  // Get itineraries with countdown reminders enabled that haven't ended yet
  const { data: itineraries, error } = await supabase
    .from("itineraries")
    .select("id, user_id, title, start_date, end_date, time")
    .eq("countdown_reminders_enabled", true)
    .gte("start_date", now.toISOString().split("T")[0])
    .order("start_date", { ascending: true })

  if (error || !itineraries) {
    console.error("Error fetching itineraries for reminders:", error)
    return []
  }

  // Day-based reminder types that work even without a specific time
  const dayBasedReminders = new Set(["5_days", "2_days", "1_day"])

  const remindersNeeded: {
    itineraryId: string
    userId: string
    title: string
    startDate: Date
    reminderType: ReminderType
  }[] = []

  for (const itinerary of itineraries) {
    // Combine start_date + time to get the actual event datetime
    let startDate: Date
    if (itinerary.time) {
      // Time is stored as "HH:MM" (e.g. "14:30")
      startDate = new Date(`${itinerary.start_date}T${itinerary.time}:00`)
    } else {
      // No time set — use start of day (midnight)
      startDate = new Date(itinerary.start_date)
    }

    const millisUntilStart = startDate.getTime() - now.getTime()
    const reminderType = getReminderTypeForTime(millisUntilStart)

    // If no time is set, only send day-based reminders (5d, 2d, 1d)
    // Skip hour/minute reminders since we don't know the actual time
    if (reminderType && !itinerary.time && !dayBasedReminders.has(reminderType) && reminderType !== "started") {
      continue
    }

    if (reminderType) {
      remindersNeeded.push({
        itineraryId: itinerary.id,
        userId: itinerary.user_id,
        title: itinerary.title,
        startDate,
        reminderType,
      })
    }
  }

  return remindersNeeded
}

/**
 * Get activities/stops that need reminders sent
 * Activities have their own start_time (TIMESTAMPTZ), so we can send
 * precise reminders (45m, 20m, 5m) regardless of whether the itinerary
 * has a time set.
 */
export async function getActivitiesNeedingReminders(): Promise<{
  activityId: string
  activityTitle: string
  itineraryId: string
  itineraryTitle: string
  userId: string
  startTime: Date
  reminderType: ReminderType
}[]> {
  const { getReminderTypeForTime } = await import("@/lib/reminder-utils")
  const supabase = await createClient()
  const now = new Date()

  // Only check activities that start within the next 5 days (no need to scan further)
  const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)

  const { data: activities, error } = await supabase
    .from("activities")
    .select(`
      id, title, start_time, itinerary_id, user_id,
      itineraries!inner(title, countdown_reminders_enabled)
    `)
    .eq("itineraries.countdown_reminders_enabled", true)
    .gte("start_time", now.toISOString())
    .lte("start_time", fiveDaysFromNow.toISOString())
    .order("start_time", { ascending: true })

  if (error || !activities) {
    console.error("Error fetching activities for reminders:", error)
    return []
  }

  // For activities, use shorter reminder intervals: 45m, 20m, 10m, 5m, started
  const activityReminderTypes = new Set([
    "45_minutes", "20_minutes", "10_minutes", "5_minutes", "started"
  ])

  const remindersNeeded: {
    activityId: string
    activityTitle: string
    itineraryId: string
    itineraryTitle: string
    userId: string
    startTime: Date
    reminderType: ReminderType
  }[] = []

  for (const activity of activities) {
    if (!activity.start_time) continue

    const startTime = new Date(activity.start_time)
    const millisUntilStart = startTime.getTime() - now.getTime()
    const reminderType = getReminderTypeForTime(millisUntilStart)

    // Only send activity-appropriate reminders (short-range)
    if (reminderType && activityReminderTypes.has(reminderType)) {
      const itinerary = activity.itineraries as any
      remindersNeeded.push({
        activityId: activity.id,
        activityTitle: activity.title,
        itineraryId: activity.itinerary_id,
        itineraryTitle: itinerary?.title || "your event",
        userId: activity.user_id,
        startTime,
        reminderType,
      })
    }
  }

  return remindersNeeded
}

/**
 * Send a reminder for an individual activity/stop
 */
export async function sendActivityReminder(
  userId: string,
  itineraryId: string,
  activityId: string,
  activityTitle: string,
  itineraryTitle: string,
  reminderType: ReminderType,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Check if already sent (using activity_id to distinguish from itinerary-level reminders)
  const { data: existing } = await supabase
    .from("itinerary_reminders")
    .select("id")
    .eq("itinerary_id", itineraryId)
    .eq("user_id", userId)
    .eq("activity_id", activityId)
    .eq("reminder_type", reminderType)
    .maybeSingle()

  if (existing) {
    return { success: true } // Already sent
  }

  // Check user preferences
  const prefs = await getUserNotificationPreferences(userId)
  if (!prefs.tripReminders) {
    return { success: true }
  }

  const timeLabel = REMINDER_LABELS[reminderType]
  let title: string
  let message: string

  if (reminderType === "started") {
    title = `📍 "${activityTitle}" is starting now!`
    message = `Your activity in "${itineraryTitle}" is happening now.`
  } else {
    title = `⏰ ${timeLabel} until "${activityTitle}"`
    message = `Your activity in "${itineraryTitle}" starts in ${timeLabel}.`
  }

  const result = await createNotification({
    userId,
    type: "system_message" as NotificationType,
    title,
    message,
    linkUrl: `/event/${itineraryId}`,
    metadata: {
      reminderType,
      itineraryId,
      activityId,
      activityTitle,
    },
  })

  if (result.success) {
    // Record with activity_id so we don't send duplicates
    await supabase.from("itinerary_reminders").insert({
      itinerary_id: itineraryId,
      user_id: userId,
      activity_id: activityId,
      reminder_type: reminderType,
    })
  }

  return result
}

/**
 * Get itineraries that need post-event cover update prompts
 */
export async function getItinerariesNeedingCoverPrompt(): Promise<{
  itineraryId: string
  userId: string
  title: string
}[]> {
  const supabase = await createClient()
  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)

  // Get itineraries that ended 1-2 days ago and haven't been prompted
  const { data: itineraries, error } = await supabase
    .from("itineraries")
    .select("id, user_id, title, end_date")
    .eq("cover_update_prompted", false)
    .lte("end_date", yesterday.toISOString().split("T")[0])
    .gte("end_date", twoDaysAgo.toISOString().split("T")[0])

  if (error || !itineraries) {
    console.error("Error fetching itineraries for cover prompts:", error)
    return []
  }

  return itineraries.map((it) => ({
    itineraryId: it.id,
    userId: it.user_id,
    title: it.title,
  }))
}
