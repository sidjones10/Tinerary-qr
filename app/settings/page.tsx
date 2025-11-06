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
import { Navbar } from "@/components/navbar"

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("profile")

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <Navbar />
        <div className="container px-4 py-6 md:py-10">

          <h1 className="text-3xl font-bold mb-6">Settings</h1>

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
      </div>
    </ProtectedRoute>
  )
}
