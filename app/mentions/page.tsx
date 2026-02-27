"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { AppHeader } from "@/components/app-header"
import { PageHeader } from "@/components/page-header"
import { PaywallGate } from "@/components/paywall-gate"
import { MentionsContent } from "./mentions-content"

export default function MentionsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1">
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
          <Link href="/pricing" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Pricing
          </Link>
          <PageHeader
            title="Organic Mention Highlights"
            description="When users mention your business in itineraries, highlight those mentions to add branding and booking links."
          />
          <PaywallGate gate="mentions">
            <MentionsContent />
          </PaywallGate>
          <nav className="mt-10 border-t pt-6">
            <p className="text-xs text-muted-foreground mb-3">Related pages</p>
            <div className="flex flex-wrap gap-2">
              <Link href="/business-profile" className="text-sm text-primary hover:underline">Business Dashboard</Link>
              <span className="text-muted-foreground">·</span>
              <Link href="/business" className="text-sm text-primary hover:underline">Business Plans</Link>
              <span className="text-muted-foreground">·</span>
              <Link href="/transactions" className="text-sm text-primary hover:underline">Transactions</Link>
            </div>
          </nav>
        </div>
      </main>
    </div>
  )
}
