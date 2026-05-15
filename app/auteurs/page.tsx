import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Auteurs — Tinerary",
  description: "Twelve travel auteurs whose itineraries form Tinerary's first canon. Plus the founder.",
}

type Tier = "Anchor" | "Taste-Maker" | "Wildcard" | "Founder"

interface Auteur {
  name: string
  tier: Tier
  bio: string
}

const auteurs: Auteur[] = [
  { name: "Sid Fall", tier: "Founder", bio: "Founder of Tinerary. Senegalese-American filmmaker, screenwriter, and analyst. Her Dakar itinerary is Tinerary's opening chapter." },
  { name: "TBA — Chef-Author", tier: "Anchor", bio: "A cook in the Samin Nosrat / Ottolenghi orbit. Writes about ingredient origin and travels for it." },
  { name: "TBA — Filmmaker", tier: "Anchor", bio: "An A24-adjacent director known for location work. Travels for set, then comes back for the food." },
  { name: "TBA — Designer", tier: "Anchor", bio: "A fashion designer with a strong heritage narrative — the Wales Bonner / Bode conversation." },
  { name: "TBA — Writer", tier: "Anchor", bio: "A travel-adjacent writer with a literary reputation. The generational read on a place." },
  { name: "TBA — Editor", tier: "Taste-Maker", bio: "An independent travel editor — Cereal / Kinfolk tier. Smaller audience, outsized influence." },
  { name: "TBA — Community Founder", tier: "Taste-Maker", bio: "A Black travel community founder with editorial weight around heritage tourism." },
  { name: "TBA — Curator", tier: "Taste-Maker", bio: "A street-cast Are.na power user. Location-based channels read by other curators." },
  { name: "TBA — Substack Writer", tier: "Taste-Maker", bio: "A Substack travel writer under 30K subscribers with a 70% open rate." },
  { name: "TBA — Chef", tier: "Wildcard", bio: "A chef from a Senegalese, Nigerian, or Ethiopian restaurant doing serious press right now." },
  { name: "TBA — Musician", tier: "Wildcard", bio: "An artist who tours and notices — the Solange / Blood Orange / Arlo Parks tier." },
  { name: "TBA — Architect", tier: "Wildcard", bio: "An architect or interior designer whose feed is location-driven." },
  { name: "TBA — Poet", tier: "Wildcard", bio: "A poet or essayist. The unexpected one that signals Tinerary takes language seriously." },
]

const tiers: { label: Tier; description: string }[] = [
  { label: "Founder", description: "" },
  { label: "Anchor", description: "Names that carry their own editorial weight." },
  { label: "Taste-Maker", description: "Smaller audiences, outsized influence on the people the anchors influence." },
  { label: "Wildcard", description: "Non-travel. Signals Tinerary is a cultural project, not a category app." },
]

export default function AuteursPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <header className="border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between text-sm tracking-[0.2em] uppercase">
          <Link href="/">Tinerary</Link>
          <nav className="flex items-center gap-5">
            <Link href="/browse" className="hover:opacity-70">Browse</Link>
            <Link href="/journal" className="hover:opacity-70">Journal</Link>
            <Link href="/auth" className="hover:opacity-70">Sign in</Link>
          </nav>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-6 pt-16 pb-10">
        <p className="text-xs tracking-[0.4em] uppercase opacity-60 mb-3">Season One</p>
        <h1 className="font-serif text-4xl sm:text-6xl leading-tight mb-6">The Auteurs.</h1>
        <p className="text-base sm:text-lg opacity-80 max-w-2xl">
          Twelve hand-picked creators. Not the biggest accounts in their lane — the most respected.
          Each one drops a featured itinerary in their own voice. They are the platform's first canon.
        </p>
      </section>

      <main className="max-w-6xl mx-auto px-6 pb-24 space-y-16">
        {tiers.map((tier) => {
          const list = auteurs.filter((a) => a.tier === tier.label)
          if (list.length === 0) return null
          return (
            <section key={tier.label}>
              <div className="border-b border-neutral-200 pb-3 mb-8 flex flex-wrap items-baseline gap-4">
                <h2 className="font-serif text-2xl">{tier.label === "Founder" ? "The Founder" : `The ${tier.label}s`}</h2>
                {tier.description && <p className="text-sm opacity-70">{tier.description}</p>}
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
                {list.map((a) => (
                  <li key={a.name}>
                    <div className="aspect-[3/4] bg-neutral-100 mb-4 flex items-center justify-center text-3xl opacity-40">🟡</div>
                    <h3 className="font-serif text-xl mb-2">{a.name}</h3>
                    <p className="text-sm opacity-80 leading-relaxed">{a.bio}</p>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </main>
    </div>
  )
}
