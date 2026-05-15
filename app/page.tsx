"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { FeedPage } from "@/components/feed-page"
import { AppHeader } from "@/components/app-header"
import { FoundersListSignup } from "@/components/founders-list-signup"
import { useAuth } from "@/providers/auth-provider"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (user) {
    return (
      <div className="min-h-screen">
        <AppHeader />
        <main className="container mx-auto px-4 py-6">
          <FeedPage />
        </main>
      </div>
    )
  }

  // Manifesto homepage for non-authenticated visitors.
  // Per the Phase 1 rollout: a single statement of belief, no feature list,
  // no app screenshots, no "Get Started" CTA — only the Founders' List.
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#0a0a0a", color: "#f5f5f0", ["--manifesto-bg" as any]: "#0a0a0a" }}
    >
      <header className="px-6 sm:px-10 py-6 flex items-center justify-between text-sm tracking-[0.2em] uppercase">
        <span>Tinerary</span>
        <nav className="flex items-center gap-5">
          <Link href="/browse" className="hover:opacity-80">Browse</Link>
          <Link href="/auteurs" className="hover:opacity-80 hidden sm:inline">Auteurs</Link>
          <Link href="/journal" className="hover:opacity-80 hidden sm:inline">Journal</Link>
          <Link href="/auth" className="hover:opacity-80">Sign in</Link>
        </nav>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 sm:px-10 py-16">
        <div className="w-full max-w-3xl text-center">
          <p className="text-xs sm:text-sm tracking-[0.4em] uppercase opacity-70 mb-10">
            Beta — July 2026
          </p>

          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl leading-[1.15] mb-10">
            How you travel says who you are.
          </h1>

          <p className="text-base sm:text-lg leading-relaxed max-w-xl mx-auto opacity-90 mb-12">
            Tinerary is a taste-driven travel platform — authored, attributed, and shareable.
            Built for the way you actually travel, not the way a booking funnel wants you to.
          </p>

          <FoundersListSignup source="homepage" />

          <p className="mt-6 text-xs tracking-widest uppercase opacity-60">
            🟡
          </p>
        </div>
      </main>

      <footer className="px-6 sm:px-10 py-8 text-xs tracking-widest uppercase opacity-60 flex flex-wrap gap-x-6 gap-y-2 justify-center">
        <Link href="/browse" className="hover:opacity-100">Browse</Link>
        <Link href="/auteurs" className="hover:opacity-100">Auteurs</Link>
        <Link href="/journal" className="hover:opacity-100">Journal</Link>
        <Link href="/press" className="hover:opacity-100">Press</Link>
        <Link href="/issues" className="hover:opacity-100">Issues</Link>
        <Link href="/terms" className="hover:opacity-100">Terms</Link>
        <Link href="/privacy" className="hover:opacity-100">Privacy</Link>
      </footer>
    </div>
  )
}
