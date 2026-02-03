"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { SettingsNav } from "@/components/settings-nav"
import { ProfileSettings } from "@/components/profile-settings"
import { AccountSettings } from "@/components/account-settings"
import { NotificationSettings } from "@/components/notification-settings"
import { AppearanceSettings } from "@/components/appearance-settings"
import { PrivacySettings } from "@/components/privacy-settings"
import { PaymentSettings } from "@/components/payment-settings"
import { LanguageSettings } from "@/components/language-settings"
import { HelpSupportSettings } from "@/components/help-support-settings"
import { Navbar } from "@/components/navbar"
import { Loader2 } from "lucide-react"

function SettingsContent() {
  const searchParams = useSearchParams()
  const sectionParam = searchParams.get("section")
  const [activeSection, setActiveSection] = useState(sectionParam || "profile")

  // Update active section when URL param changes
  useEffect(() => {
    if (sectionParam) {
      setActiveSection(sectionParam)
    }
  }, [sectionParam])

  return (
    <div className="grid md:grid-cols-[250px_1fr] gap-8">
      <SettingsNav activeSection={activeSection} setActiveSection={setActiveSection} />

      <div>
        {activeSection === "profile" && <ProfileSettings />}
        {activeSection === "account" && <AccountSettings />}
        {activeSection === "notifications" && <NotificationSettings />}
        {activeSection === "appearance" && <AppearanceSettings />}
        {activeSection === "privacy" && <PrivacySettings />}
        {activeSection === "payment" && <PaymentSettings />}
        {activeSection === "language" && <LanguageSettings />}
        {activeSection === "help" && <HelpSupportSettings />}
      </div>
    </div>
  )
}

function SettingsLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <Navbar />
        <div className="container px-4 py-6 md:py-10">
          <h1 className="text-3xl font-bold mb-6">Settings</h1>
          <Suspense fallback={<SettingsLoading />}>
            <SettingsContent />
          </Suspense>
        </div>
      </div>
    </ProtectedRoute>
  )
}
