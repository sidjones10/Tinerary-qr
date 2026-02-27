"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { AppHeader } from "@/components/app-header"
import { PageHeader } from "@/components/page-header"
import { PaywallGate } from "@/components/paywall-gate"
import { TransactionsContent } from "./transactions-content"

export default function TransactionsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1">
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
          <Link href="/business-profile" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Business Hub
          </Link>
          <PageHeader
            title="Transactions & Commission"
            description="Track bookings, commissions, and revenue from Tinerary transactions."
          />
          <PaywallGate gate="transactions">
            <TransactionsContent />
          </PaywallGate>
        </div>
      </main>
    </div>
  )
}
