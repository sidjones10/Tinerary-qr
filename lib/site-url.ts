/**
 * The canonical public origin for this deployment.
 *
 * Used for absolute URLs in metadata, sitemaps and share links. Falls back
 * through the explicit app URL, the site URL, Vercel's per-deploy host, and
 * finally localhost so a dev server still produces valid absolute URLs.
 */
export function getSiteUrl(): string {
  const explicit =
    process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL

  if (explicit) return stripTrailingSlash(explicit)

  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`

  return "http://localhost:3000"
}

function stripTrailingSlash(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url
}

/** The origin as a URL, for Next's `metadataBase`. */
export function getSiteUrlObject(): URL {
  return new URL(getSiteUrl())
}
