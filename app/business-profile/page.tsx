"use client"

import { AppHeader } from "@/components/app-header"
import { PaywallGate } from "@/components/paywall-gate"
import { BusinessProfileContent } from "./business-profile-content"

export default function BusinessProfilePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1">
        <div className="container px-4 py-6 md:py-10">
          <PaywallGate gate="business_profile">
            <BusinessProfileContent />
          </PaywallGate>
        </div>
      </main>
    </div>
  )
}
