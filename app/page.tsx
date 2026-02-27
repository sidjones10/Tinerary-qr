"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FeedPage } from "@/components/feed-page"
import { AppHeader } from "@/components/app-header"
import { useAuth } from "@/providers/auth-provider"
import { Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const [mounted, setMounted] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch by showing loading on initial render
  if (!mounted || isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (user) {
    return (
      <div className="min-h-screen">
        <AppHeader />
        <main className="container mx-auto px-4 py-6">
          <FeedPage />
        </main>
      </div>
    )
  }

  // Landing page for non-authenticated users
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white dark:bg-card shadow-sm py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Tinerary</h1>
          <div className="space-x-2">
            <Button variant="outline" asChild>
              <Link href="/auth">{t("nav.signIn")}</Link>
            </Button>
            <Button asChild>
              <Link href="/discover?guest=true">{t("home.browseItineraries")}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">{t("home.planYourJourney")}</h2>
          <p className="text-xl mb-8">{t("home.browseFreely")}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-lg">
              <h3 className="text-2xl font-semibold mb-4">{t("home.browseWithoutSignUp")}</h3>
              <p className="mb-6">
                {t("home.exploreDestinations")}
              </p>
              <Button variant="outline" size="lg" asChild>
                <Link href="/discover?guest=true">{t("home.startBrowsing")}</Link>
              </Button>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-8 rounded-lg">
              <h3 className="text-2xl font-semibold mb-4">{t("home.createOwn")}</h3>
              <p className="mb-6">{t("home.signUpToCreate")}</p>
              <Button size="lg" asChild>
                <Link href="/auth?tab=signup">{t("home.signUpNow")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-100 dark:bg-card py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mb-4">
            <Link href="/pricing" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:underline">
              Pricing
            </Link>
            <span className="text-gray-400 dark:text-gray-600">|</span>
            <Link href="/business" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:underline">
              For Business
            </Link>
            <span className="text-gray-400 dark:text-gray-600">|</span>
            <Link href="/creators" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:underline">
              For Creators
            </Link>
            <span className="text-gray-400 dark:text-gray-600">|</span>
            <Link href="/terms" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:underline">
              {t("home.termsOfService")}
            </Link>
            <span className="text-gray-400 dark:text-gray-600">|</span>
            <Link href="/privacy" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:underline">
              {t("home.privacyPolicy")}
            </Link>
          </div>
          <p className="text-gray-600 dark:text-gray-400">&copy; {new Date().getFullYear()} Tinerary. {t("home.allRightsReserved")}</p>
        </div>
      </footer>
    </div>
  )
}
