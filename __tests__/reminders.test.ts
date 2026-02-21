/**
 * Tests for Itinerary Reminders
 *
 * Tests validate:
 * - Reminder interval definitions
 * - getReminderTypeForTime logic
 * - formatTimeRemaining utility
 * - shouldPromptCoverUpdate logic
 * - Cron endpoint structure
 * - Database schema for itinerary_reminders
 * - Client vs server Supabase usage in reminder-service
 */
import { describe, it, expect } from "vitest"
import * as fs from "fs"
import * as path from "path"
import {
  REMINDER_INTERVALS,
  REMINDER_LABELS,
  getReminderTypeForTime,
  formatTimeRemaining,
  shouldPromptCoverUpdate,
  getUpcomingReminders,
} from "../lib/reminder-service"

const basePath = path.resolve(__dirname, "..")

// ------------------------------------------------------------------
// 1. Reminder Intervals
// ------------------------------------------------------------------
describe("Reminders – Interval Definitions", () => {
  it("defines 12 reminder intervals (including started)", () => {
    expect(Object.keys(REMINDER_INTERVALS)).toHaveLength(12)
  })

  it("intervals are in descending order of time", () => {
    const values = Object.entries(REMINDER_INTERVALS)
      .filter(([k]) => k !== "started")
      .map(([, v]) => v)
    // Each value should be >= the next
    for (let i = 0; i < values.length - 1; i++) {
      expect(values[i]).toBeGreaterThanOrEqual(values[i + 1])
    }
  })

  it("has human-readable labels for every interval", () => {
    const intervalKeys = Object.keys(REMINDER_INTERVALS)
    for (const key of intervalKeys) {
      expect(REMINDER_LABELS).toHaveProperty(key)
    }
    // post_event_cover is an extra label
    expect(REMINDER_LABELS).toHaveProperty("post_event_cover")
  })
})

// ------------------------------------------------------------------
// 2. getReminderTypeForTime
// ------------------------------------------------------------------
describe("Reminders – getReminderTypeForTime", () => {
  it("returns '5_days' when ~5 days remain", () => {
    const fiveDaysMs = 5 * 24 * 60 * 60 * 1000
    expect(getReminderTypeForTime(fiveDaysMs)).toBe("5_days")
  })

  it("returns '2_days' when ~2 days remain", () => {
    const twoDaysMs = 2 * 24 * 60 * 60 * 1000
    expect(getReminderTypeForTime(twoDaysMs)).toBe("2_days")
  })

  it("returns '1_day' when ~1 day remains", () => {
    const oneDayMs = 1 * 24 * 60 * 60 * 1000
    expect(getReminderTypeForTime(oneDayMs)).toBe("1_day")
  })

  it("returns '2_hours' when ~2 hours remain", () => {
    const twoHoursMs = 2 * 60 * 60 * 1000
    expect(getReminderTypeForTime(twoHoursMs)).toBe("2_hours")
  })

  it("returns '5_minutes' when ~5 minutes remain", () => {
    const fiveMinMs = 5 * 60 * 1000
    expect(getReminderTypeForTime(fiveMinMs)).toBe("5_minutes")
  })

  it("returns 'started' when event just started (within 2 min)", () => {
    expect(getReminderTypeForTime(0)).toBe("started")
    expect(getReminderTypeForTime(-60000)).toBe("started") // 1 min past
  })

  it("returns null for times that don't match any interval", () => {
    // Halfway between intervals
    const randomMs = 3 * 24 * 60 * 60 * 1000 // 3 days – no matching interval
    expect(getReminderTypeForTime(randomMs)).toBeNull()
  })

  it("returns null for events far in the past (> 2 min past start)", () => {
    expect(getReminderTypeForTime(-5 * 60 * 1000)).toBeNull()
  })
})

// ------------------------------------------------------------------
// 3. formatTimeRemaining
// ------------------------------------------------------------------
describe("Reminders – formatTimeRemaining", () => {
  it("returns 'started' for <= 0", () => {
    expect(formatTimeRemaining(0)).toBe("started")
    expect(formatTimeRemaining(-1000)).toBe("started")
  })

  it("formats days correctly", () => {
    expect(formatTimeRemaining(2 * 24 * 60 * 60 * 1000)).toBe("2 days")
    expect(formatTimeRemaining(1 * 24 * 60 * 60 * 1000)).toBe("1 day")
  })

  it("formats hours correctly when < 1 day", () => {
    expect(formatTimeRemaining(5 * 60 * 60 * 1000)).toBe("5 hours")
    expect(formatTimeRemaining(1 * 60 * 60 * 1000)).toBe("1 hour")
  })

  it("formats minutes correctly when < 1 hour", () => {
    expect(formatTimeRemaining(30 * 60 * 1000)).toBe("30 minutes")
    expect(formatTimeRemaining(1 * 60 * 1000)).toBe("1 minute")
  })
})

// ------------------------------------------------------------------
// 4. shouldPromptCoverUpdate
// ------------------------------------------------------------------
describe("Reminders – shouldPromptCoverUpdate", () => {
  it("returns false if event hasn't ended yet", () => {
    const futureEnd = new Date(Date.now() + 24 * 60 * 60 * 1000)
    expect(shouldPromptCoverUpdate(futureEnd)).toBe(false)
  })

  it("returns false if event ended less than 1 day ago", () => {
    const recentEnd = new Date(Date.now() - 12 * 60 * 60 * 1000)
    expect(shouldPromptCoverUpdate(recentEnd)).toBe(false)
  })

  it("returns true if event ended 1-2 days ago", () => {
    const oneDayAgoEnd = new Date(Date.now() - 30 * 60 * 60 * 1000)
    expect(shouldPromptCoverUpdate(oneDayAgoEnd)).toBe(true)
  })

  it("returns false if event ended more than 2 days ago", () => {
    const oldEnd = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    expect(shouldPromptCoverUpdate(oldEnd)).toBe(false)
  })
})

// ------------------------------------------------------------------
// 5. getUpcomingReminders
// ------------------------------------------------------------------
describe("Reminders – getUpcomingReminders", () => {
  it("returns future reminders sorted by time", () => {
    const startDate = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000) // 6 days from now
    const reminders = getUpcomingReminders(startDate)

    // Should include multiple reminders (5 days, 2 days, 1 day, etc.)
    expect(reminders.length).toBeGreaterThan(0)

    // Verify sorted ascending
    for (let i = 0; i < reminders.length - 1; i++) {
      expect(reminders[i].time.getTime()).toBeLessThanOrEqual(
        reminders[i + 1].time.getTime()
      )
    }
  })

  it("returns no reminders for events that start soon (< 5 min)", () => {
    const startDate = new Date(Date.now() + 2 * 60 * 1000) // 2 min from now
    const reminders = getUpcomingReminders(startDate)
    expect(reminders.length).toBe(0)
  })

  it("excludes 'started' type from upcoming reminders", () => {
    const startDate = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000)
    const reminders = getUpcomingReminders(startDate)
    const types = reminders.map((r) => r.type)
    expect(types).not.toContain("started")
  })
})

// ------------------------------------------------------------------
// 6. Cron Endpoint
// ------------------------------------------------------------------
describe("Reminders – Cron Endpoint Structure", () => {
  it("reminders/send route file exists", () => {
    expect(
      fs.existsSync(path.join(basePath, "app/api/reminders/send/route.ts"))
    ).toBe(true)
  })

  it("exports both POST and GET handlers", async () => {
    const routeModule = await import("../app/api/reminders/send/route")
    expect(typeof routeModule.POST).toBe("function")
    expect(typeof routeModule.GET).toBe("function")
  })

  it("verifies CRON_SECRET authorization", () => {
    const routeSrc = fs.readFileSync(
      path.join(basePath, "app/api/reminders/send/route.ts"),
      "utf-8"
    )
    expect(routeSrc).toContain("CRON_SECRET")
    expect(routeSrc).toContain("Unauthorized")
  })
})

// ------------------------------------------------------------------
// 7. Database Schema
// ------------------------------------------------------------------
describe("Reminders – Database Schema", () => {
  it("countdown_reminders_enabled column exists in migrations", () => {
    const migrationPath = path.join(
      basePath,
      "supabase/migrations/029_add_countdown_reminders.sql"
    )
    if (fs.existsSync(migrationPath)) {
      const migration = fs.readFileSync(migrationPath, "utf-8")
      expect(migration).toContain("countdown_reminders_enabled")
      expect(migration).toContain("itinerary_reminders")
    }
  })
})

// ------------------------------------------------------------------
// 8. Supabase client usage: server-side for cron context
// ------------------------------------------------------------------
describe("Reminders – Supabase Client Usage", () => {
  it("reminder-service uses server-side Supabase (correct for cron context)", () => {
    const serviceSrc = fs.readFileSync(
      path.join(basePath, "lib/reminder-service.ts"),
      "utf-8"
    )
    expect(serviceSrc).toContain('@/lib/supabase/server')
    expect(serviceSrc).not.toContain('@/lib/supabase/client')
  })

  it("all createClient calls are awaited (server client is async)", () => {
    const serviceSrc = fs.readFileSync(
      path.join(basePath, "lib/reminder-service.ts"),
      "utf-8"
    )
    // Every createClient() call should be preceded by await
    const allCalls = serviceSrc.match(/createClient\(\)/g) || []
    const awaitedCalls = serviceSrc.match(/await createClient\(\)/g) || []
    expect(allCalls.length).toBe(awaitedCalls.length)
  })

  it("pure utility functions are in reminder-utils.ts (safe for client components)", () => {
    const utilsSrc = fs.readFileSync(
      path.join(basePath, "lib/reminder-utils.ts"),
      "utf-8"
    )
    // reminder-utils should NOT import server-side code
    expect(utilsSrc).not.toContain("supabase/server")
    expect(utilsSrc).toContain("shouldPromptCoverUpdate")
    expect(utilsSrc).toContain("REMINDER_INTERVALS")
  })
})
