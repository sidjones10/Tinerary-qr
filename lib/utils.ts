import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parse date-only strings (YYYY-MM-DD) as local time instead of UTC.
 * `new Date("2026-03-13")` is interpreted as UTC midnight, which can
 * display as the previous day in western timezones. This function
 * constructs the Date using local time components instead.
 */
export function parseLocalDate(dateString: string): Date {
  const parts = dateString.split("-")
  if (parts.length === 3) {
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
  }
  return new Date(dateString)
}
