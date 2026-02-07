"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/providers/auth-provider"
import { Loader2 } from "lucide-react"
import { AppHeader } from "@/components/app-header"
import { FeedPage } from "@/components/feed-page"

export default function DashboardPage() {
  const { user, isLoading, refreshSession } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // After mounting, give auth state time to settle, then check
  useEffect(() => {
    if (!mounted) return

    // If still loading auth, wait
    if (isLoading) return

    // If we have a user, we're good
    if (user) {
      setAuthChecked(true)
      return
    }

    // No user yet - try refreshing session once (handles race condition after OAuth callback)
    const checkAuth = async () => {
      await refreshSession()
      // Small delay to let state update
      setTimeout(() => {
        setAuthChecked(true)
      }, 100)
    }

    checkAuth()
  }, [mounted, isLoading, user, refreshSession])

  // Redirect to auth if confirmed no user
  useEffect(() => {
    if (authChecked && !user) {
      router.push("/auth?redirectTo=/dashboard")
    }
  }, [authChecked, user, router])

  // Show loading while checking auth
  if (!mounted || isLoading || (!user && !authChecked)) {
    return (
      <div className="flex h-screen w-full items-center justify-center" style={{ background: "linear-gradient(to bottom, #ffecd2, #fcb69f 40%, #ffffff 80%)" }}>
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B6B]" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center" style={{ background: "linear-gradient(to bottom, #ffecd2, #fcb69f 40%, #ffffff 80%)" }}>
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B6B]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="container mx-auto px-4 py-6">
        <FeedPage />
      </main>
    </div>
  )
}
