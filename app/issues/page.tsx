import Link from "next/link"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Issues — Tinerary",
  description: "Seasonal drops from Tinerary. Sign in to view.",
}

interface Issue {
  slug: string
  number: string
  title: string
  season: string | null
  cover_image_url: string | null
  description: string | null
  release_date: string | null
}

export default async function IssuesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth?redirectTo=/issues")
  }

  const { data } = await supabase
    .from("issues")
    .select("slug, number, title, season, cover_image_url, description, release_date")
    .eq("is_published", true)
    .order("release_date", { ascending: false })

  const issues = (data ?? []) as Issue[]

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <header className="border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between text-sm tracking-[0.2em] uppercase">
          <Link href="/">Tinerary</Link>
          <nav className="flex items-center gap-5">
            <Link href="/browse" className="hover:opacity-70">Browse</Link>
            <Link href="/auteurs" className="hover:opacity-70">Auteurs</Link>
            <Link href="/journal" className="hover:opacity-70">Journal</Link>
          </nav>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-6 pt-16 pb-12">
        <p className="text-xs tracking-[0.4em] uppercase opacity-60 mb-3">For members</p>
        <h1 className="font-serif text-4xl sm:text-6xl leading-tight mb-6">Issues.</h1>
        <p className="text-base sm:text-lg opacity-80 max-w-2xl">
          Tinerary runs in seasons. Each one is a drop — a zine, a soundtrack, a reading-room event, a
          set of itineraries you can't get anywhere else. Welcome inside.
        </p>
      </section>

      <main className="max-w-6xl mx-auto px-6 pb-24">
        {issues.length === 0 ? (
          <div className="border border-dashed border-neutral-300 p-12 text-center">
            <p className="opacity-70 mb-2">Issue 00 ships June 2026.</p>
            <p className="text-sm opacity-60">Founders' List members will be first to receive a copy.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {issues.map((issue) => (
              <li key={issue.slug}>
                <div className="aspect-[3/4] bg-neutral-100 overflow-hidden mb-4">
                  {issue.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={issue.cover_image_url} alt={issue.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl opacity-40">🟡</div>
                  )}
                </div>
                <p className="text-xs tracking-[0.2em] uppercase opacity-60 mb-2">Issue {issue.number}{issue.season ? ` · ${issue.season}` : ""}</p>
                <h3 className="font-serif text-xl leading-snug mb-2">{issue.title}</h3>
                {issue.description && <p className="text-sm opacity-80">{issue.description}</p>}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
