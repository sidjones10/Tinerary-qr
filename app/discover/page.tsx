"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/providers/auth-provider"
import { SignupPromptDialog } from "@/components/signup-prompt-dialog"
import { DiscoveryFeed } from "@/components/discovery-feed"

const GUEST_VIEW_LIMIT = 5
const GUEST_VIEWS_KEY = "tinerary_guest_views"

export default function DiscoverPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading: authLoading } = useAuth()
  const isGuestMode = searchParams?.get("guest") === "true"

  const [guestViewCount, setGuestViewCount] = useState(0)
  const [showSignupPrompt, setShowSignupPrompt] = useState(false)
  const [promptReason, setPromptReason] = useState<"like" | "comment" | "save" | "limit_reached" | "general">("general")

  // If user is logged in and not in guest mode, redirect to home
  useEffect(() => {
    if (!authLoading && user && !isGuestMode) {
      router.replace("/")
    }
  }, [user, authLoading, isGuestMode, router])

  // Load guest view count from localStorage
  useEffect(() => {
    if (isGuestMode && typeof window !== "undefined") {
      const stored = localStorage.getItem(GUEST_VIEWS_KEY)
      if (stored) {
        const count = parseInt(stored, 10)
        setGuestViewCount(count)
        // If already at limit, show prompt immediately
        if (count >= GUEST_VIEW_LIMIT) {
          setPromptReason("limit_reached")
          setShowSignupPrompt(true)
        }
      }
    }
  }, [isGuestMode])

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm py-4 sticky top-0 z-40">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild aria-label="Go back">
              <Link href="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-xl font-bold">Discover Itineraries</h1>
          </div>
          <div className="flex items-center gap-2">
            {isGuestMode && (
              <span className="text-sm text-muted-foreground mr-2">
                {guestViewCount}/{GUEST_VIEW_LIMIT} free views
              </span>
            )}
            <Button variant="outline" asChild>
              <Link href="/auth">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/auth?tab=signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Guest mode banner */}
      {isGuestMode && (
        <div className="bg-blue-50 border-b border-blue-100">
          <div className="container mx-auto px-4 py-3">
            <p className="text-sm text-blue-800 text-center">
              You&apos;re browsing as a guest. View up to {GUEST_VIEW_LIMIT} itineraries, then sign up for unlimited access!
              <span className="font-medium ml-2">({GUEST_VIEW_LIMIT - guestViewCount} views remaining)</span>
            </p>
          </div>
        </div>
      )}

      {/* TikTok-style Discovery Feed */}
      <main className="flex-1 container mx-auto px-4 py-4">
        <DiscoveryFeed />
      </main>

      {/* Footer with legal links */}
      <footer className="bg-gray-100 py-6">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center gap-4 mb-2">
            <Link href="/terms" className="text-sm text-gray-600 hover:text-gray-900 hover:underline">
              Terms of Service
            </Link>
            <span className="text-gray-400">|</span>
            <Link href="/privacy" className="text-sm text-gray-600 hover:text-gray-900 hover:underline">
              Privacy Policy
            </Link>
          </div>
          <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} Tinerary. All rights reserved.</p>
        </div>
      </footer>

      {/* Signup prompt dialog */}
      <SignupPromptDialog
        isOpen={showSignupPrompt}
        onClose={() => setShowSignupPrompt(false)}
        reason={promptReason}
      />
    </div>
  )
}
