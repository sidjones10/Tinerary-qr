"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/providers/auth-provider"
import { DiscoveryFeed } from "@/components/discovery-feed"
import { useTranslation } from "react-i18next"

export default function DiscoverPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading: authLoading } = useAuth()
  const isGuestMode = searchParams?.get("guest") === "true"
  const { t } = useTranslation()

  // If user is logged in and not in guest mode, redirect to home
  useEffect(() => {
    if (!authLoading && user && !isGuestMode) {
      router.replace("/")
    }
  }, [user, authLoading, isGuestMode, router])

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const isGuest = !user

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      {/* Header */}
      <header className="bg-white dark:bg-card shadow-sm py-4 sticky top-0 z-40">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild aria-label="Go back">
              <Link href="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-xl font-bold">{t("discover.title")}</h1>
          </div>
          {isGuest && (
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link href="/auth">{t("nav.signIn")}</Link>
              </Button>
              <Button asChild>
                <Link href="/auth?tab=signup">{t("nav.signUp")}</Link>
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Soft guest notice — no counter, no hard wall */}
      {isGuest && (
        <div className="bg-amber-50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-900/20">
          <div className="container mx-auto px-4 py-2 text-center text-sm text-amber-900/80 dark:text-amber-200/70">
            You're browsing as a guest.{" "}
            <Link href="/auth?tab=signup" className="font-medium underline underline-offset-2">
              Create an account
            </Link>{" "}
            to save itineraries and follow auteurs.
          </div>
        </div>
      )}

      {/* Discovery feed — open scroll for everyone */}
      <main className="container mx-auto px-4 py-4">
        <DiscoveryFeed />
      </main>
    </div>
  )
}
