import { createClient } from "@/lib/supabase/client"
import { createNotification, NotificationType, getUserNotificationPreferences } from "@/lib/notification-service"
import { sendCountdownReminderEmail, sendEventStartedEmail } from "@/lib/email-notifications"

// Reminder intervals in milliseconds
export const REMINDER_INTERVALS = {
  "5_days": 5 * 24 * 60 * 60 * 1000,      // 5 days
  "2_days": 2 * 24 * 60 * 60 * 1000,      // 2 days
  "1_day": 1 * 24 * 60 * 60 * 1000,       // 1 day
  "15_hours": 15 * 60 * 60 * 1000,         // 15 hours
  "10_hours": 10 * 60 * 60 * 1000,         // 10 hours
  "5_hours": 5 * 60 * 60 * 1000,           // 5 hours
  "2_hours": 2 * 60 * 60 * 1000,           // 2 hours
  "45_minutes": 45 * 60 * 1000,            // 45 minutes
  "20_minutes": 20 * 60 * 1000,            // 20 minutes
  "10_minutes": 10 * 60 * 1000,            // 10 minutes
  "5_minutes": 5 * 60 * 1000,              // 5 minutes
  "started": 0,                            // Event started
} as const

export type ReminderType = keyof typeof REMINDER_INTERVALS | "post_event_cover"

// Human readable labels for reminder types
export const REMINDER_LABELS: Record<ReminderType, string> = {
  "5_days": "5 days",
  "2_days": "2 days",
  "1_day": "1 day",
  "15_hours": "15 hours",
  "10_hours": "10 hours",
  "5_hours": "5 hours",
  "2_hours": "2 hours",
  "45_minutes": "45 minutes",
  "20_minutes": "20 minutes",
  "10_minutes": "10 minutes",
  "5_minutes": "5 minutes",
  "started": "started",
  "post_event_cover": "post event",
}

/**
 * Get the appropriate reminder type based on time until event
 */
export function getReminderTypeForTime(millisUntilStart: number): ReminderType | null {
  // Sorted from longest to shortest
  const intervals = Object.entries(REMINDER_INTERVALS)
    .filter(([key]) => key !== "started")
    .sort(([, a], [, b]) => b - a)

  for (const [type, interval] of intervals) {
    // Check if we're within a reasonable window (within 10% of the interval or 5 minutes)
    const tolerance = Math.min(interval * 0.1, 5 * 60 * 1000)
    if (Math.abs(millisUntilStart - interval) <= tolerance) {
      return type as ReminderType
    }
  }

  // Check if event just started (within 2 minutes of start time)
  if (millisUntilStart <= 0 && millisUntilStart >= -2 * 60 * 1000) {
    return "started"
  }

  return null
}

/**
 * Format time remaining for display
 */
export function formatTimeRemaining(millisUntilStart: number): string {
  if (millisUntilStart <= 0) {
    return "started"
  }

  const days = Math.floor(millisUntilStart / (24 * 60 * 60 * 1000))
  const hours = Math.floor((millisUntilStart % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
  const minutes = Math.floor((millisUntilStart % (60 * 60 * 1000)) / (60 * 1000))

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''}`
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`
  } else {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`
  }
}

/**
 * Check if a reminder has already been sent
 */
export async function hasReminderBeenSent(
  itineraryId: string,
  userId: string,
  reminderType: ReminderType
): Promise<boolean> {
  const supabase = createClient()

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
  const supabase = createClient()

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
      const supabase = createClient()
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
 * Get upcoming reminders for an itinerary (for display purposes)
 */
export function getUpcomingReminders(startDate: Date): { type: ReminderType; time: Date }[] {
  const now = new Date()
  const reminders: { type: ReminderType; time: Date }[] = []

  for (const [type, interval] of Object.entries(REMINDER_INTERVALS)) {
    if (type === "started") continue

    const reminderTime = new Date(startDate.getTime() - interval)
    if (reminderTime > now) {
      reminders.push({
        type: type as ReminderType,
        time: reminderTime,
      })
    }
  }

  // Sort by time (earliest first)
  return reminders.sort((a, b) => a.time.getTime() - b.time.getTime())
}

/**
 * Check if post-event cover update should be prompted (1 day after event ends)
 */
export function shouldPromptCoverUpdate(endDate: Date): boolean {
  const now = new Date()
  const oneDayAfterEnd = new Date(endDate.getTime() + 24 * 60 * 60 * 1000)
  const twoDaysAfterEnd = new Date(endDate.getTime() + 2 * 24 * 60 * 60 * 1000)

  return now >= oneDayAfterEnd && now < twoDaysAfterEnd
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
  const supabase = createClient()
  const now = new Date()

  // Get itineraries with countdown reminders enabled that haven't ended yet
  const { data: itineraries, error } = await supabase
    .from("itineraries")
    .select("id, user_id, title, start_date, end_date")
    .eq("countdown_reminders_enabled", true)
    .gte("start_date", now.toISOString().split("T")[0])
    .order("start_date", { ascending: true })

  if (error || !itineraries) {
    console.error("Error fetching itineraries for reminders:", error)
    return []
  }

  const remindersNeeded: {
    itineraryId: string
    userId: string
    title: string
    startDate: Date
    reminderType: ReminderType
  }[] = []

  for (const itinerary of itineraries) {
    const startDate = new Date(itinerary.start_date)
    const millisUntilStart = startDate.getTime() - now.getTime()
    const reminderType = getReminderTypeForTime(millisUntilStart)

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
 * Get itineraries that need post-event cover update prompts
 */
export async function getItinerariesNeedingCoverPrompt(): Promise<{
  itineraryId: string
  userId: string
  title: string
}[]> {
  const supabase = createClient()
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
