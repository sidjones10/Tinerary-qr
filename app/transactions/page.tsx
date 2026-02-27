import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { AppHeader } from "@/components/app-header"
import { PageHeader } from "@/components/page-header"
import { TransactionsContent } from "./transactions-content"

export default function TransactionsPage() {
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
            title="Transactions & Commission"
            description="Track bookings, commissions, and revenue from Tinerary transactions."
          />
          <TransactionsContent />
          <nav className="mt-10 border-t pt-6">
            <p className="text-xs text-muted-foreground mb-3">Related pages</p>
            <div className="flex flex-wrap gap-2">
              <Link href="/business-profile" className="text-sm text-primary hover:underline">Business Profile</Link>
              <span className="text-muted-foreground">·</span>
              <Link href="/mentions" className="text-sm text-primary hover:underline">Mention Highlights</Link>
              <span className="text-muted-foreground">·</span>
              <Link href="/affiliate" className="text-sm text-primary hover:underline">Affiliate Marketing</Link>
            </div>
          </nav>
        </div>
      </main>
    </div>
  )
}
