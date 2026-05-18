/**
 * Private-launch access control.
 *
 * While `HOME_ONLY_MODE` is on, the app is in a soft-launch state:
 * everyone can reach the home page, sign in / sign up, and the legal/
 * info pages, but the rest of the product (feed, create, dashboard,
 * discover, etc.) is reachable only by:
 *
 *   - admins (email in NEXT_PUBLIC_ADMIN_EMAIL, or profiles.is_admin /
 *     profiles.role = 'admin'), and
 *   - an allowlisted set of creators (email in NEXT_PUBLIC_ALLOWED_EMAILS,
 *     or profiles.role = 'creator').
 *
 * Sign up / sign in are intentionally left fully working — gating happens
 * after authentication, not by removing auth.
 *
 * This module is React-free so it can be shared by the Edge middleware
 * and client components alike.
 */

/** Master switch for the soft launch. Set to `false` to open the app up. */
export const HOME_ONLY_MODE = true

function parseEmails(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

/** Admin emails (same env var the admin dashboard uses). */
export const ADMIN_EMAILS = parseEmails(process.env.NEXT_PUBLIC_ADMIN_EMAIL)

/** Extra emails allowed to use the full app (the "select few" creators). */
export const ALLOWED_EMAILS = parseEmails(process.env.NEXT_PUBLIC_ALLOWED_EMAILS)

/**
 * Paths reachable by everyone, even while in home-only mode.
 * `/` is matched exactly; the rest match the segment and any sub-path.
 */
const PUBLIC_PREFIXES = [
  "/auth", // sign in/up, OAuth callback, password reset
  "/terms",
  "/privacy",
  "/press",
  "/journal",
  "/issues", // linked from the home footer; public feedback page
  "/coming-soon",
  "/offline",
]

/** True for the home page, public/legal pages, and static asset files. */
export function isPublicPath(path: string): boolean {
  if (path === "/") return true

  // Static assets served from the app dir (e.g. /icon.svg, /robots.txt,
  // /manifest.webmanifest) — anything whose last segment has a file extension.
  const lastSegment = path.slice(path.lastIndexOf("/") + 1)
  if (lastSegment.includes(".")) return true

  return PUBLIC_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(prefix + "/"),
  )
}

interface ProfileRoleFields {
  is_admin?: boolean | null
  role?: string | null
}

export interface AccessResult {
  isAdmin: boolean
  isAllowed: boolean
}

/**
 * Resolve a user's access level from their email and profile role fields.
 * Pure — callers supply the profile they fetched (middleware or client).
 */
export function resolveAccess(
  email: string | null | undefined,
  profile: ProfileRoleFields | null | undefined,
): AccessResult {
  const normalizedEmail = (email ?? "").trim().toLowerCase()

  const isAdmin =
    (normalizedEmail !== "" && ADMIN_EMAILS.includes(normalizedEmail)) ||
    profile?.is_admin === true ||
    profile?.role === "admin"

  const isAllowed =
    isAdmin ||
    (normalizedEmail !== "" && ALLOWED_EMAILS.includes(normalizedEmail)) ||
    profile?.role === "creator"

  return { isAdmin, isAllowed }
}
