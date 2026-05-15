"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"

export interface BrowseItem {
  id: string
  title: string
  description: string | null
  location: string | null
  image_url: string | null
  author: {
    username: string | null
    full_name: string | null
    avatar_url: string | null
  }
  trending_score: number
  like_count: number
}

const PAGE_SIZE = 8

export function BrowseList({ items }: { items: BrowseItem[] }) {
  const [visible, setVisible] = useState(Math.min(PAGE_SIZE, items.length))
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (visible >= items.length) return
    const node = sentinelRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible((v) => Math.min(v + PAGE_SIZE, items.length))
        }
      },
      { rootMargin: "200px" },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [visible, items.length])

  return (
    <>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.slice(0, visible).map((item) => {
          const authorName = item.author.full_name || item.author.username || "Anonymous"
          return (
            <li key={item.id}>
              <Link href={`/itinerary/${item.id}`} className="group block">
                <div className="aspect-[4/5] w-full bg-neutral-100 overflow-hidden">
                  {item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl opacity-40">🟡</div>
                  )}
                </div>
                <div className="pt-4">
                  {item.location && (
                    <p className="text-xs tracking-[0.2em] uppercase opacity-60 mb-2">{item.location}</p>
                  )}
                  <h3 className="font-serif text-xl leading-snug mb-2 group-hover:underline">{item.title}</h3>
                  <p className="text-sm opacity-70">By {authorName}</p>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
      {visible < items.length && (
        <div ref={sentinelRef} className="h-12 flex items-center justify-center text-xs tracking-widest uppercase opacity-50 mt-8">
          Loading more…
        </div>
      )}
    </>
  )
}
