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
          <h2 className="font-serif text-2xl mb-3">The pitch</h2>
          <p>
            Tinerary drives what happens after the flights and hotels are booked. Takes ideas out of the
            group chat. Brings idea boards to life.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl mb-3">Why now</h2>
          <p>
            Booking agents get you to your location — Tinerary guides you while you're there. And more
            importantly, it answers:<em> who travels like me, and where are they going?</em> Tinerary is
            a platform where itineraries are authored, attributed, and shareable.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl mb-3">Why this founder</h2>
          <p>
            Sid Fall wants to change the pitfalls of traveling. Too often, individuals are told "Go here,"
            "See this," but are not given the full roadmap or guide that makes them feel comfortable
            enough to throw it away later. That's why.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl mb-3">The angle</h2>
          <p>
            Tinerary is a curation site. You document how you travel — for yourself, for others — or
            peruse like a record store on a rainy day.
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
