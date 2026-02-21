// Pure utility functions for reminders - safe to import in client components.
// Server-side functions (Supabase queries) live in reminder-service.ts.

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
    // Tolerance must be wide enough that a 1-minute cron will land inside it.
    // Use the larger of 10% of the interval or 90 seconds (> 1 cron tick).
    const tolerance = Math.max(interval * 0.1, 90 * 1000)
    if (Math.abs(millisUntilStart - interval) <= tolerance) {
      return type as ReminderType
    }
  }

  // Check if event just started (within 3 minutes of start time)
  if (millisUntilStart <= 0 && millisUntilStart >= -3 * 60 * 1000) {
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
