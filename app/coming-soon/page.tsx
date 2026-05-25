"use client"

import Link from "next/link"
import { FoundersListSignup } from "@/components/founders-list-signup"
import { TINERARY_YELLOW } from "@/lib/brand"

export default function ComingSoonPage() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#0a0a0a", color: "#f5f5f0" }}
    >
      <header className="px-6 sm:px-10 py-6 flex items-center justify-between text-sm tracking-[0.2em] uppercase">
        <Link href="/" style={{ color: TINERARY_YELLOW }} className="hover:opacity-80">
          Tinerary
        </Link>
        <nav className="flex items-center gap-5">
          <Link href="/" className="hover:opacity-80 hidden sm:inline">Home</Link>
          <Link href="/auth" className="hover:opacity-80">Sign in</Link>
          <Link href="/auth?tab=signup" className="hover:opacity-80">Sign up</Link>
        </nav>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 sm:px-10 py-16">
        <div className="w-full max-w-2xl text-center">
          <p className="text-xs sm:text-sm tracking-[0.4em] uppercase opacity-70 mb-10">
            Early access
          </p>

          <h1 className="font-serif text-3xl sm:text-5xl leading-[1.15] mb-8">
            This part isn&apos;t open yet.
          </h1>

          <p className="text-base sm:text-lg leading-relaxed max-w-xl mx-auto opacity-90 mb-12">
            Tinerary is in a private launch. The rest of the app is rolling out to a
            small group of authors first. Leave your email and we&apos;ll bring you in.
          </p>

          <FoundersListSignup source="coming-soon" />

          <p className="mt-10 text-xs tracking-widest uppercase opacity-60">
            <Link href="/" className="hover:opacity-100">Back to home</Link>
          </p>
        </div>
      </main>

      <footer className="px-6 sm:px-10 py-8 text-xs tracking-widest uppercase opacity-60 flex flex-wrap gap-x-6 gap-y-2 justify-center">
        <Link href="/journal" className="hover:opacity-100">Journal</Link>
        <Link href="/press" className="hover:opacity-100">Press</Link>
        <Link href="/terms" className="hover:opacity-100">Terms</Link>
        <Link href="/privacy" className="hover:opacity-100">Privacy</Link>
      </footer>
    </div>
  )
}
