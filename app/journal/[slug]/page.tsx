import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"

export const revalidate = 300

interface PageProps {
  params: Promise<{ slug: string }>
}

async function fetchPost(slug: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("journal_posts")
    .select("slug, title, dek, body_markdown, cover_image_url, author_name, category, published_at")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle()
  if (error || !data) return null
  return data as {
    slug: string
    title: string
    dek: string | null
    body_markdown: string
    cover_image_url: string | null
    author_name: string | null
    category: string | null
    published_at: string | null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await fetchPost(slug)
  if (!post) return { title: "Journal — Tinerary" }
  return {
    title: `${post.title} — Tinerary Journal`,
    description: post.dek ?? "A dispatch from the Tinerary Journal.",
  }
}

export default async function JournalPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = await fetchPost(slug)
  if (!post) notFound()

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <header className="border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between text-sm tracking-[0.2em] uppercase">
          <Link href="/">Tinerary</Link>
          <nav className="flex items-center gap-5">
            <Link href="/journal" className="hover:opacity-70">Journal</Link>
            <Link href="/browse" className="hover:opacity-70">Browse</Link>
            <Link href="/auth" className="hover:opacity-70">Sign in</Link>
          </nav>
        </div>
      </header>

      <article className="max-w-2xl mx-auto px-6 pt-16 pb-24">
        {post.category && (
          <p className="text-xs tracking-[0.4em] uppercase opacity-60 mb-3">{post.category}</p>
        )}
        <h1 className="font-serif text-4xl sm:text-5xl leading-tight mb-4">{post.title}</h1>
        {post.dek && <p className="text-xl opacity-80 mb-6">{post.dek}</p>}
        <p className="text-xs tracking-widest uppercase opacity-60 mb-10">
          {post.author_name ?? "Tinerary"}
          {post.published_at && ` · ${new Date(post.published_at).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}`}
        </p>
        {post.cover_image_url && (
          <div className="mb-10 -mx-6 sm:mx-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.cover_image_url} alt={post.title} className="w-full h-auto" />
          </div>
        )}
        <div className="prose prose-neutral max-w-none prose-headings:font-serif prose-p:leading-relaxed whitespace-pre-wrap text-[17px] leading-relaxed">
          {post.body_markdown}
        </div>
      </article>
    </div>
  )
}
