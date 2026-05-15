import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Press — Tinerary",
  description: "Press kit, founder one-pager, and contact for editorial outreach.",
}

export default function PressPage() {
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

      <section className="max-w-3xl mx-auto px-6 pt-16 pb-10">
        <p className="text-xs tracking-[0.4em] uppercase opacity-60 mb-3">For editorial consideration</p>
        <h1 className="font-serif text-4xl sm:text-6xl leading-tight mb-6">Press.</h1>
        <p className="text-base sm:text-lg opacity-80">
          Sid Fall — Founder, Tinerary. Beta launching July 2026 · Austin, TX.
        </p>
      </section>

      <main className="max-w-3xl mx-auto px-6 pb-24 space-y-12 text-[17px] leading-relaxed">
        <section>
          <h2 className="font-serif text-2xl mb-3">The pitch in one line</h2>
          <p>
            Tinerary is a taste-driven travel platform built for the generation that grew up planning trips
            in group chats and saving Pinterest boards — launching July 2026 as the first travel product
            designed as a cultural object, not a booking funnel.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl mb-3">Why now</h2>
          <p>
            Booking.com, Airbnb, and TripAdvisor optimize for transaction. Google optimizes for search.
            None of them answer the question that actually drives Gen Z and young Millennial travel:
            <em> who travels like me, and where are they going?</em> Tinerary is a platform where
            itineraries are authored, attributed, and shareable — closer to a Letterboxd or Substack than an OTA.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl mb-3">Why this founder</h2>
          <p>
            Sid Fall is a 24-year-old Senegalese-American multi-hyphenate based in Texas — filmmaker,
            screenwriter, business analyst at a Texas law firm, and currently preparing for the LSAT while
            building Tinerary toward beta. She brings a perspective the travel category has structurally
            lacked: a founder whose own life is built across cultural worlds (Dakar, Austin, Los Angeles),
            whose creative practice spans film and product, and whose theory of travel is rooted in
            heritage rather than wanderlust.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl mb-3">The cultural angle</h2>
          <p>
            Tinerary launches with a roster of 12 Travel Auteurs — chefs, filmmakers, writers, and
            designers whose itineraries become the platform's first canon. The launch issue centers a
            Dakar itinerary built from three generations of Fall family routes — a deliberate signal that
            Tinerary's editorial center of gravity is not Paris or Tokyo by default.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl mb-3">Available for</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Founder profile</li>
            <li>Q&amp;A on the creator economy meets travel</li>
            <li>Op-ed on why travel media has failed travelers under 30</li>
            <li>Photography (Sid has a film background and shoots her own portraits)</li>
          </ul>
        </section>

        <section className="border-t border-neutral-200 pt-8">
          <h2 className="font-serif text-2xl mb-3">Contact</h2>
          <p>
            <a href="mailto:press@tinerary.com" className="underline">press@tinerary.com</a>
            <br />
            Founders' List: <Link href="/" className="underline">tinerary.com</Link>
          </p>
          <p className="mt-6 text-sm opacity-70">
            Brand assets, founder photography, and the press one-pager PDF are available on request.
            Full kit coming with the Phase 2 site update.
          </p>
        </section>
      </main>
    </div>
  )
}
