import type { MetadataRoute } from "next"
import { createClient } from "@supabase/supabase-js"
import { getSiteUrl } from "@/lib/site-url"
import { PHASE_2_ENABLED, isPhase2Route } from "@/lib/phase2"

/** Re-generate at most hourly; the itinerary list changes slowly. */
export const revalidate = 3600

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1.0, changeFrequency: "daily" },
  { path: "/discover", priority: 0.9, changeFrequency: "daily" },
  { path: "/browse", priority: 0.8, changeFrequency: "daily" },
  { path: "/search", priority: 0.6, changeFrequency: "weekly" },
  { path: "/journal", priority: 0.6, changeFrequency: "weekly" },
  { path: "/press", priority: 0.4, changeFrequency: "monthly" },
  { path: "/pricing", priority: 0.4, changeFrequency: "monthly" },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()
  const now = new Date()

  const entries: MetadataRoute.Sitemap = STATIC_ROUTES
    // Phase 2 pages redirect non-admins away, so don't advertise them.
    .filter(({ path }) => PHASE_2_ENABLED || !isPhase2Route(path))
    .map(({ path, priority, changeFrequency }) => ({
      url: `${siteUrl}${path}`,
      lastModified: now,
      changeFrequency,
      priority,
    }))

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return entries

  try {
    const supabase = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    // RLS restricts this to public itineraries; the explicit filter documents
    // the intent and keeps the query cheap.
    const { data: itineraries } = await supabase
      .from("itineraries")
      .select("id, updated_at")
      .eq("is_public", true)
      .order("updated_at", { ascending: false })
      .limit(5000)

    for (const itinerary of itineraries ?? []) {
      entries.push({
        url: `${siteUrl}/event/${itinerary.id}`,
        lastModified: itinerary.updated_at ? new Date(itinerary.updated_at) : now,
        changeFrequency: "weekly",
        priority: 0.7,
      })
    }
  } catch (error) {
    // A sitemap is best-effort: serve the static routes rather than 500.
    console.error("sitemap: failed to load public itineraries", error)
  }

  return entries
}
