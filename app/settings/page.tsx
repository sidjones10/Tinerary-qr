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
import { LanguageSettings } from "@/components/language-settings"
import { HelpSupportSettings } from "@/components/help-support-settings"
import { BusinessSettings } from "@/components/business-settings"
import { Navbar } from "@/components/navbar"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useTranslation } from "react-i18next"

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
        {activeSection === "language" && <LanguageSettings />}
        {activeSection === "help" && <HelpSupportSettings />}
        {activeSection === "business" && <BusinessSettings />}
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

function SettingsTitle() {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-4 mb-6">
      <Link
        href="/"
        className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/80 dark:bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all text-muted-foreground hover:text-foreground"
        aria-label="Go back"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <h1 className="text-3xl font-bold">{t("settings.title")}</h1>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <Navbar />
        <div className="container px-4 py-6 md:py-10">
          <SettingsTitle />
          <Suspense fallback={<SettingsLoading />}>
            <SettingsContent />
          </Suspense>
        </div>
      </div>
    </ProtectedRoute>
  )
}
