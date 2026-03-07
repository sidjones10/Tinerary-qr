/**
 * Compute the expires_at timestamp for an invitation.
 *
 * Rules:
 * - If the event has a start_date in the future → expire at start_date (midnight UTC).
 * - Otherwise (no start_date or event already started) → expire 7 days from now.
 */
export function computeInvitationExpiry(eventStartDate: string | null | undefined): string {
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

  if (eventStartDate) {
    const start = new Date(eventStartDate)
    if (!isNaN(start.getTime()) && start.getTime() > Date.now()) {
      return start.toISOString()
    }
  }

  return new Date(Date.now() + SEVEN_DAYS_MS).toISOString()
}
