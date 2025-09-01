"use client"

import { useState } from "react"
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
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("profile")

  return (
    <ProtectedRoute>
      <div className="container px-4 py-6 md:py-10">
        <div className="mb-6">
          <Link href="/home" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Home
          </Link>
        </div>

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
      </div>
    </ProtectedRoute>
  )
}
