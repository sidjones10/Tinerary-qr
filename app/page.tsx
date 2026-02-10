"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FeedPage } from "@/components/feed-page"
import { AppHeader } from "@/components/app-header"
import { useAuth } from "@/providers/auth-provider"
import { GuestItineraryBrowser } from "@/components/guest-itinerary-browser"
import { Loader2, Sparkles, Users, Calendar, MapPin } from "lucide-react"

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

  // Landing page for non-authenticated users with guest browsing
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-orange-50 via-white to-purple-50">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm py-4 sticky top-0 z-50">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-purple-500 bg-clip-text text-transparent">
            Tinerary
          </h1>
          <div className="space-x-2">
            <Button variant="outline" asChild>
              <Link href="/auth">Sign In</Link>
            </Button>
            <Button asChild className="bg-orange-500 hover:bg-orange-600">
              <Link href="/auth?tab=signup">Sign Up Free</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-12 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Plan Your Perfect Journey
          </h2>
          <p className="text-xl text-muted-foreground mb-2 max-w-2xl mx-auto">
            Discover amazing trips and events created by travelers worldwide.
          </p>
          <p className="text-sm text-orange-600 font-medium mb-8">
            Browse 5 featured itineraries as a guest — sign up for unlimited access!
          </p>
        </section>

        {/* Guest Itinerary Browser */}
        <section className="container mx-auto px-4 pb-12">
          <GuestItineraryBrowser />
        </section>

        {/* Features Section */}
        <section className="bg-white py-16">
          <div className="container mx-auto px-4">
            <h3 className="text-2xl font-bold text-center mb-12">
              Why join Tinerary?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center p-6">
                <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-7 w-7 text-orange-500" />
                </div>
                <h4 className="font-semibold mb-2">Create & Share</h4>
                <p className="text-sm text-muted-foreground">
                  Build beautiful itineraries for trips and events, then share them with friends or the world.
                </p>
              </div>
              <div className="text-center p-6">
                <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-7 w-7 text-purple-500" />
                </div>
                <h4 className="font-semibold mb-2">Connect</h4>
                <p className="text-sm text-muted-foreground">
                  Follow travelers, join conversations, and get inspired by a community of adventurers.
                </p>
              </div>
              <div className="text-center p-6">
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-7 w-7 text-blue-500" />
                </div>
                <h4 className="font-semibold mb-2">Discover</h4>
                <p className="text-sm text-muted-foreground">
                  Explore destinations, find local events, and plan your next adventure with ease.
                </p>
              </div>
            </div>

            <div className="text-center mt-12">
              <Button size="lg" asChild className="bg-orange-500 hover:bg-orange-600">
                <Link href="/auth?tab=signup">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Get Started Free
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-100 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600">&copy; {new Date().getFullYear()} Tinerary. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
