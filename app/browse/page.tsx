import Link from "next/link"
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { BrowseList, type BrowseItem } from "@/components/browse-list"

export const metadata: Metadata = {
  title: "Browse — Tinerary",
  description: "A curated preview of this week's trending itineraries on Tinerary.",
}

export const revalidate = 600

const TRENDING_LIMIT = 20

async function fetchTrending(): Promise<BrowseItem[]> {
  const supabase = await createClient()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from("itineraries")
    .select(`
      id,
      title,
      description,
      location,
      image_url,
      created_at,
      profiles ( username, full_name, avatar_url ),
      itinerary_metrics ( trending_score, like_count, view_count )
    `)
    .eq("is_public", true)
    .gte("created_at", sevenDaysAgo)
    .limit(TRENDING_LIMIT)

  if (error || !data) return []

  return (data as any[])
    .map((row) => ({
      id: row.id as string,
      title: row.title as string,
      description: (row.description ?? null) as string | null,
      location: (row.location ?? null) as string | null,
      image_url: (row.image_url ?? null) as string | null,
      author: {
        username: row.profiles?.username ?? null,
        full_name: row.profiles?.full_name ?? null,
        avatar_url: row.profiles?.avatar_url ?? null,
      },
      trending_score: Number(row.itinerary_metrics?.trending_score ?? 0),
      like_count: Number(row.itinerary_metrics?.like_count ?? 0),
    }))
    .sort((a, b) => b.trending_score - a.trending_score || b.like_count - a.like_count)
    .slice(0, TRENDING_LIMIT)
}

export default async function BrowsePage() {
  const items = await fetchTrending()

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <header className="border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between text-sm tracking-[0.2em] uppercase">
          <Link href="/">Tinerary</Link>
          <nav className="flex items-center gap-5">
            <Link href="/auteurs" className="hover:opacity-70">Auteurs</Link>
            <Link href="/journal" className="hover:opacity-70">Journal</Link>
            <Link href="/auth" className="hover:opacity-70">Sign in</Link>
          </nav>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-12 pb-6">
        <p className="text-xs tracking-[0.4em] uppercase opacity-60 mb-3">The Browser</p>
        <h1 className="font-serif text-3xl sm:text-5xl leading-tight mb-4">This week, trending.</h1>
        <p className="max-w-2xl text-base sm:text-lg opacity-80">
          A curated preview — the twenty itineraries the Tinerary community is reading right now.
          Open to everyone. The full library is inside the app.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 border border-neutral-300 px-4 py-2 text-xs tracking-widest uppercase">
          <span aria-hidden>🟡</span>
          <span>You're viewing a curated preview · {items.length} of many</span>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-6 pb-24">
        {items.length === 0 ? (
          <div className="border border-dashed border-neutral-300 p-12 text-center">
            <p className="opacity-70">No trending itineraries yet this week. Check back soon.</p>
          </div>
        ) : (
          <BrowseList items={items} />
        )}

        <div className="mt-12 border-t border-neutral-200 pt-10 text-center">
          <p className="text-sm tracking-widest uppercase opacity-60 mb-3">End of the preview</p>
          <p className="text-lg mb-6 max-w-xl mx-auto">
            You've seen what's trending this week. The rest of Tinerary lives inside.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/auth?tab=signup"
              className="px-5 py-3 bg-neutral-900 text-white text-sm tracking-widest uppercase hover:opacity-90"
            >
              Create an account
            </Link>
            <Link
              href="/"
              className="px-5 py-3 border border-neutral-900 text-sm tracking-widest uppercase hover:bg-neutral-50"
            >
              Join the Founders' List
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
