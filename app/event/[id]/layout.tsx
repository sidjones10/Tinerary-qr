import type { Metadata } from "next"
import { createClient } from "@supabase/supabase-js"
import { getSiteUrl } from "@/lib/site-url"

/**
 * Per-itinerary share metadata.
 *
 * The page itself is a client component and cannot export `generateMetadata`,
 * so it lives here. Without it every shared itinerary link unfurls with the
 * generic site-wide card — which is the whole growth loop for a share-driven
 * app, so it is worth the extra request.
 *
 * Only public itineraries are described. A private one falls back to the
 * generic card rather than leaking its title into a link preview.
 */

interface LayoutParams {
  params: Promise<{ id: string }>
}

/** Anonymous read-only client: RLS keeps private itineraries out of the result. */
function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return null

  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function formatDateRange(start?: string | null, end?: string | null): string | null {
  if (!start) return null

  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }
  const startLabel = new Date(start).toLocaleDateString("en-US", opts)
  if (!end || end === start) return startLabel

  return `${startLabel} – ${new Date(end).toLocaleDateString("en-US", opts)}`
}

export async function generateMetadata({ params }: LayoutParams): Promise<Metadata> {
  const { id } = await params
  const siteUrl = getSiteUrl()
  const canonical = `${siteUrl}/event/${id}`

  const supabase = publicClient()
  if (!supabase) return { alternates: { canonical } }

  const { data: itinerary } = await supabase
    .from("itineraries")
    .select("title, description, location, image_url, start_date, end_date, is_public")
    .eq("id", id)
    .eq("is_public", true)
    .maybeSingle()

  if (!itinerary) {
    // Private, missing, or unreadable — fall back to the site-wide card.
    return { alternates: { canonical } }
  }

  const title = itinerary.title || "Itinerary"
  const dateRange = formatDateRange(itinerary.start_date, itinerary.end_date)

  const description =
    itinerary.description ||
    [itinerary.location, dateRange].filter(Boolean).join(" · ") ||
    "A trip worth copying, on Tinerary."

  const image = itinerary.image_url || `${siteUrl}/icons/icon-512x512.png`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "Tinerary",
      type: "article",
      images: [{ url: image, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  }
}

export default function EventLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
