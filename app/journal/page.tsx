import Link from "next/link"
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Journal — Tinerary",
  description: "Dispatches, essays, and founder notes from Tinerary.",
}

export const revalidate = 300

interface JournalPost {
  slug: string
  title: string
  dek: string | null
  cover_image_url: string | null
  author_name: string | null
  category: string | null
  published_at: string | null
}

async function fetchPosts(): Promise<JournalPost[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("journal_posts")
    .select("slug, title, dek, cover_image_url, author_name, category, published_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(50)
  if (error || !data) return []
  return data as JournalPost[]
}

export default async function JournalPage() {
  const posts = await fetchPosts()

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <header className="border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between text-sm tracking-[0.2em] uppercase">
          <Link href="/">Tinerary</Link>
          <nav className="flex items-center gap-5">
            <Link href="/browse" className="hover:opacity-70">Browse</Link>
            <Link href="/auteurs" className="hover:opacity-70">Auteurs</Link>
            <Link href="/press" className="hover:opacity-70">Press</Link>
          </nav>
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-6 pt-16 pb-12">
        <p className="text-xs tracking-[0.4em] uppercase opacity-60 mb-3">The Journal</p>
        <h1 className="font-serif text-4xl sm:text-6xl leading-tight mb-6">Dispatches.</h1>
        <p className="text-base sm:text-lg opacity-80">
          Essays, auteur notes, and reading-room readouts. Edited like a print object.
        </p>
      </section>

      <main className="max-w-3xl mx-auto px-6 pb-24">
        {posts.length === 0 ? (
          <div className="border border-dashed border-neutral-300 p-12 text-center">
            <p className="opacity-70">No journal entries yet. Issue 00 launches in June.</p>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-200">
            {posts.map((post) => (
              <li key={post.slug} className="py-8">
                <Link href={`/journal/${post.slug}`} className="group flex flex-col sm:flex-row gap-6">
                  {post.cover_image_url && (
                    <div className="sm:w-48 aspect-[4/3] bg-neutral-100 overflow-hidden flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={post.cover_image_url}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    {post.category && (
                      <p className="text-xs tracking-[0.2em] uppercase opacity-60 mb-2">{post.category}</p>
                    )}
                    <h2 className="font-serif text-2xl leading-snug mb-2 group-hover:underline">{post.title}</h2>
                    {post.dek && <p className="text-base opacity-80 mb-3">{post.dek}</p>}
                    <p className="text-xs tracking-widest uppercase opacity-60">
                      {post.author_name ?? "Tinerary"}
                      {post.published_at && ` · ${new Date(post.published_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })}`}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
