"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { AppHeader } from "@/components/app-header"
import { PageHeader } from "@/components/page-header"
import { PaywallGate } from "@/components/paywall-gate"
import { AffiliateContent } from "./affiliate-content"

export default function AffiliatePage() {
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
            title="Affiliate Marketing & Packing List Commerce"
            description="Earn through referral links, experience promotions, and auto-matched packing list product links."
          />
          <PaywallGate gate="affiliate">
            <AffiliateContent />
          </PaywallGate>
          <nav className="mt-10 border-t pt-6">
            <p className="text-xs text-muted-foreground mb-3">Related pages</p>
            <div className="flex flex-wrap gap-2">
              <Link href="/creator-tier" className="text-sm text-primary hover:underline">Creator Dashboard</Link>
              <span className="text-muted-foreground">·</span>
              <Link href="/transactions" className="text-sm text-primary hover:underline">Transactions</Link>
              <span className="text-muted-foreground">·</span>
              <Link href="/coins" className="text-sm text-primary hover:underline">Tinerary Coins</Link>
            </div>
          </nav>
        </div>
      </main>
    </div>
  )
}
