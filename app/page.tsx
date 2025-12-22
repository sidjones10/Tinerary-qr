"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FeedPage } from "@/components/feed-page"
import { AppHeader } from "@/components/app-header"
import { useAuth } from "@/providers/auth-provider"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const [mounted, setMounted] = useState(false)

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
      <header className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Tinerary</h1>
          <div className="space-x-2">
            <Button variant="outline" asChild>
              <Link href="/auth">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/app">Browse Itineraries</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Plan Your Perfect Journey</h2>
          <p className="text-xl mb-8">Browse itineraries freely. Sign in to create and save your own travel plans.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-blue-50 p-8 rounded-lg">
              <h3 className="text-2xl font-semibold mb-4">Browse Without Signing Up</h3>
              <p className="mb-6">
                Explore destinations, view public itineraries, and get inspired for your next trip.
              </p>
              <Button variant="outline" size="lg" asChild>
                <Link href="/app">Start Browsing</Link>
              </Button>
            </div>

            <div className="bg-green-50 p-8 rounded-lg">
              <h3 className="text-2xl font-semibold mb-4">Create Your Own Itineraries</h3>
              <p className="mb-6">Sign up to create, save, and share your personalized travel plans.</p>
              <Button size="lg" asChild>
                <Link href="/auth?tab=signup">Sign Up Now</Link>
              </Button>
            </div>
          </div>

          <div className="mt-12">
            <h3 className="text-2xl font-semibold mb-4">Preview Our Auth Flow</h3>
            <p className="mb-6">See how our authentication system works before signing up.</p>
            <Button variant="outline" asChild>
              <Link href="/preview/auth">View Auth Preview</Link>
            </Button>
          </div>
        </div>
      </main>

      <footer className="bg-gray-100 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600">&copy; {new Date().getFullYear()} Tinerary. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
