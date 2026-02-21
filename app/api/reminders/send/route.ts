import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  getItinerariesNeedingReminders,
  getItinerariesNeedingCoverPrompt,
  getActivitiesNeedingReminders,
  sendCountdownReminder,
  sendActivityReminder,
} from "@/lib/reminder-service"

// This endpoint should be called by a cron job every minute
// Vercel Cron or similar can be configured to call this endpoint

export async function POST(request: NextRequest) {
  try {
    // Verify the request is authorized (use a secret key for cron jobs)
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    // If CRON_SECRET is set, require it for authorization
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const results = {
      countdownReminders: { sent: 0, failed: 0, errors: [] as string[] },
      activityReminders: { sent: 0, failed: 0, errors: [] as string[] },
      coverPrompts: { sent: 0, failed: 0, errors: [] as string[] },
    }

    // Send countdown reminders
    const remindersNeeded = await getItinerariesNeedingReminders()
    for (const reminder of remindersNeeded) {
      try {
        const result = await sendCountdownReminder(
          reminder.userId,
          reminder.itineraryId,
          reminder.title,
          reminder.reminderType,
          "event" // Could determine from itinerary type
        )
        if (result.success) {
          results.countdownReminders.sent++
        } else {
          results.countdownReminders.failed++
          if (result.error) {
            results.countdownReminders.errors.push(result.error)
          }
        }
      } catch (error: any) {
        results.countdownReminders.failed++
        results.countdownReminders.errors.push(error.message || "Unknown error")
      }
    }

    // Send activity/stop reminders
    const activityRemindersNeeded = await getActivitiesNeedingReminders()
    for (const reminder of activityRemindersNeeded) {
      try {
        const result = await sendActivityReminder(
          reminder.userId,
          reminder.itineraryId,
          reminder.activityId,
          reminder.activityTitle,
          reminder.itineraryTitle,
          reminder.reminderType,
        )
        if (result.success) {
          results.activityReminders.sent++
        } else {
          results.activityReminders.failed++
          if (result.error) {
            results.activityReminders.errors.push(result.error)
          }
        }
      } catch (error: any) {
        results.activityReminders.failed++
        results.activityReminders.errors.push(error.message || "Unknown error")
      }
    }

    // Send post-event cover update prompts
    const coverPromptsNeeded = await getItinerariesNeedingCoverPrompt()
    for (const prompt of coverPromptsNeeded) {
      try {
        const result = await sendCountdownReminder(
          prompt.userId,
          prompt.itineraryId,
          prompt.title,
          "post_event_cover",
          "event"
        )
        if (result.success) {
          results.coverPrompts.sent++

          // Mark the itinerary as prompted
          const supabase = await createClient()
          await supabase
            .from("itineraries")
            .update({ cover_update_prompted: true })
            .eq("id", prompt.itineraryId)
        } else {
          results.coverPrompts.failed++
          if (result.error) {
            results.coverPrompts.errors.push(result.error)
          }
        }
      } catch (error: any) {
        results.coverPrompts.failed++
        results.coverPrompts.errors.push(error.message || "Unknown error")
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    })
  } catch (error: any) {
    console.error("Error in reminder cron job:", error)
    return NextResponse.json(
      { error: error.message || "Failed to send reminders" },
      { status: 500 }
    )
  }
}

// Also support GET for easy testing
export async function GET(request: NextRequest) {
  return POST(request)
}
