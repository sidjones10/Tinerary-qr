import { createEvents, type EventAttributes, type DateArray } from "ics"

export interface CalendarEvent {
  title: string
  description?: string
  location?: string
  startDate: string
  endDate: string
  url?: string
}

/**
 * Convert ISO date string to ICS date array format [year, month, day, hour, minute]
 */
function dateToArray(dateString: string): DateArray {
  const date = new Date(dateString)
  return [
    date.getFullYear(),
    date.getMonth() + 1, // ICS months are 1-indexed
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
  ]
}

/**
 * Export a single event to .ics file
 */
export async function exportEventToCalendar(event: CalendarEvent): Promise<{ success: boolean; error?: string }> {
  try {
    const icsEvent: EventAttributes = {
      start: dateToArray(event.startDate),
      end: dateToArray(event.endDate),
      title: event.title,
      description: event.description,
      location: event.location,
      url: event.url,
      status: "CONFIRMED",
      busyStatus: "BUSY",
      organizer: { name: "Tinerary", email: "noreply@tinerary.app" },
    }

    const { error, value } = createEvents([icsEvent])

    if (error) {
      console.error("ICS creation error:", error)
      return { success: false, error: error.message || "Failed to create calendar file" }
    }

    if (!value) {
      return { success: false, error: "No calendar data generated" }
    }

    // Create and trigger download
    const blob = new Blob([value], { type: "text/calendar;charset=utf-8" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `${sanitizeFilename(event.title)}.ics`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    return { success: true }
  } catch (error: any) {
    console.error("Export to calendar error:", error)
    return { success: false, error: error.message || "Failed to export to calendar" }
  }
}

/**
 * Export multiple events/activities to .ics file
 */
export async function exportMultipleEventsToCalendar(
  events: CalendarEvent[],
  filename: string = "events"
): Promise<{ success: boolean; error?: string }> {
  try {
    const icsEvents: EventAttributes[] = events.map((event) => ({
      start: dateToArray(event.startDate),
      end: dateToArray(event.endDate),
      title: event.title,
      description: event.description,
      location: event.location,
      url: event.url,
      status: "CONFIRMED",
      busyStatus: "BUSY",
      organizer: { name: "Tinerary", email: "noreply@tinerary.app" },
    }))

    const { error, value } = createEvents(icsEvents)

    if (error) {
      console.error("ICS creation error:", error)
      return { success: false, error: error.message || "Failed to create calendar file" }
    }

    if (!value) {
      return { success: false, error: "No calendar data generated" }
    }

    // Create and trigger download
    const blob = new Blob([value], { type: "text/calendar;charset=utf-8" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `${sanitizeFilename(filename)}.ics`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    return { success: true }
  } catch (error: any) {
    console.error("Export to calendar error:", error)
    return { success: false, error: error.message || "Failed to export to calendar" }
  }
}

/**
 * Sanitize filename for safe file downloads
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9]/gi, "_") // Replace non-alphanumeric with underscore
    .replace(/_{2,}/g, "_") // Replace multiple underscores with single
    .replace(/^_|_$/g, "") // Remove leading/trailing underscores
    .toLowerCase()
}

/**
 * Get calendar URL for major calendar services
 */
export function getCalendarUrls(event: CalendarEvent) {
  const startDate = new Date(event.startDate)
  const endDate = new Date(event.endDate)

  // Format dates for Google Calendar (YYYYMMDDTHHMMSSZ)
  const formatGoogleDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
  }

  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    event.title
  )}&dates=${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}&details=${encodeURIComponent(
    event.description || ""
  )}&location=${encodeURIComponent(event.location || "")}`

  // Format dates for Outlook (ISO format)
  const outlookCalendarUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(
    event.title
  )}&startdt=${startDate.toISOString()}&enddt=${endDate.toISOString()}&body=${encodeURIComponent(
    event.description || ""
  )}&location=${encodeURIComponent(event.location || "")}`

  return {
    google: googleCalendarUrl,
    outlook: outlookCalendarUrl,
    apple: null, // Apple Calendar uses .ics files
    other: null, // Other calendars use .ics files
  }
}
