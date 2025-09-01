"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { SpecialDeals } from "@/components/special-deals"
import { AppHeader } from "@/components/app-header"

export default function DealsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex-1">
        <div className="container px-4 py-6 md:py-10">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>

          <h1 className="text-3xl font-bold tracking-tight text-gray-800 mb-6">Special Deals</h1>

          <div className="space-y-10">
            <SpecialDeals />
          </div>
        </div>
      </main>
    </div>
  )
}
