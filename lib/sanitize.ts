/**
 * Input sanitization utilities for user-generated content.
 *
 * These helpers strip or escape dangerous patterns before content is stored
 * or rendered. They complement (but don't replace) React's built-in JSX
 * escaping and Supabase's parameterized queries.
 */

/**
 * Escape HTML special characters to prevent XSS when content is rendered
 * in non-React contexts (e.g. email templates, raw HTML).
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/**
 * Strip HTML tags entirely from a string.
 * Use when you want plain-text output only.
 */
export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "")
}

/**
 * Sanitize a user-provided string for safe storage and display.
 *
 * - Trims whitespace
 * - Removes null bytes and other control characters (except newlines/tabs)
 * - Optionally limits length
 */
export function sanitizeText(str: string, maxLength?: number): string {
  // Remove null bytes and non-printable control chars (keep \n, \r, \t)
  let cleaned = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim()

  if (maxLength && cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength)
  }

  return cleaned
}

/**
 * Sanitize a user-provided URL to prevent javascript: and data: injection.
 * Returns the URL if it's safe, or an empty string if it's not.
 */
export function sanitizeUrl(url: string): string {
  const trimmed = url.trim()
  // Block javascript:, data:, vbscript: and other dangerous protocols
  if (/^(javascript|data|vbscript|blob):/i.test(trimmed)) {
    return ""
  }
  return trimmed
}
