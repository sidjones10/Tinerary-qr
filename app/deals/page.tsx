"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { SpecialDeals } from "@/components/special-deals"
import { AppHeader } from "@/components/app-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function DealsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex-1">
        <div className="container px-4 py-6 md:py-10">
          <Link href="/explore" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Explore
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <h1 className="text-3xl font-bold tracking-tight text-gray-800">Special Deals</h1>
            <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-0">
              Now on Explore
            </Badge>
          </div>
          <p className="text-muted-foreground mb-8">
            Deals have moved to the <Link href="/explore" className="text-orange-600 font-medium hover:underline">Explore page</Link> for a better experience. You can still view all deals below.
          </p>

          <div className="space-y-10">
            <SpecialDeals />
          </div>

          <div className="mt-8 text-center">
            <Button asChild className="btn-sunset">
              <Link href="/explore">Browse all on Explore</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
