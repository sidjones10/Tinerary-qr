"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { Loader2, MapPin, Calendar, Heart, Eye, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/providers/auth-provider"
import { SignupPromptDialog } from "@/components/signup-prompt-dialog"
import { ThemeIcon } from "@/components/theme-selector"
import { createClient } from "@/lib/supabase/client"

interface Itinerary {
  id: string
  title: string
  description: string | null
  location: string | null
  start_date: string | null
  end_date: string | null
  image_url: string | null
  theme: string
  like_count: number
  view_count: number
  profiles: {
    id: string
    name: string | null
    username: string | null
    avatar_url: string | null
  } | null
  itinerary_metrics: {
    like_count: number
    view_count: number
  }[] | null
}

const GUEST_VIEW_LIMIT = 5
const GUEST_VIEWS_KEY = "tinerary_guest_views"

export default function DiscoverPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading: authLoading } = useAuth()
  const isGuestMode = searchParams?.get("guest") === "true"

  const [itineraries, setItineraries] = useState<Itinerary[]>([])
  const [isLoading, setIsLoading] = useState(true)
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

  // Fetch itineraries
  useEffect(() => {
    const fetchItineraries = async () => {
      try {
        setIsLoading(true)
        const supabase = createClient()

        const { data: rawData, error } = await supabase
          .from("itineraries")
          .select(`
            id,
            title,
            description,
            location,
            start_date,
            end_date,
            image_url,
            theme,
            itinerary_metrics (
              like_count,
              view_count
            ),
            profiles:user_id (
              id,
              name,
              username,
              avatar_url
            )
          `)
          .eq("is_public", true)
          .order("created_at", { ascending: false })
          .limit(20)

        if (error) throw error

        // Map metrics from the join into flat fields for the UI
        const mapped = (rawData || []).map((item: any) => ({
          ...item,
          like_count: item.itinerary_metrics?.[0]?.like_count || 0,
          view_count: item.itinerary_metrics?.[0]?.view_count || 0,
        }))

        // Sort by like_count descending
        mapped.sort((a: any, b: any) => b.like_count - a.like_count)

        setItineraries(mapped)
      } catch (err) {
        console.error("Error fetching itineraries:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchItineraries()
  }, [])

  const handleItineraryClick = (itineraryId: string) => {
    if (isGuestMode && !user) {
      const newCount = guestViewCount + 1
      setGuestViewCount(newCount)
      localStorage.setItem(GUEST_VIEWS_KEY, newCount.toString())

      // If this is the 5th view, show signup prompt
      if (newCount >= GUEST_VIEW_LIMIT) {
        setPromptReason("limit_reached")
        setShowSignupPrompt(true)
        return // Don't navigate, show prompt instead
      }
    }

    // Navigate to itinerary
    router.push(`/event/${itineraryId}`)
  }

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) {
      setPromptReason("like")
      setShowSignupPrompt(true)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return ""
    try {
      return format(new Date(dateStr), "MMM d, yyyy")
    } catch {
      return dateStr
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
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

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : itineraries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No itineraries found</p>
            <Button asChild>
              <Link href="/auth?tab=signup">Sign up to create one</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {itineraries.map((itinerary) => (
              <Card
                key={itinerary.id}
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleItineraryClick(itinerary.id)}
              >
                {/* Image */}
                <div className="relative h-48">
                  {itinerary.image_url ? (
                    <img
                      src={itinerary.image_url}
                      alt={itinerary.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-400 via-pink-400 to-purple-500 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white text-center px-4">
                        {itinerary.title}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <ThemeIcon theme={itinerary.theme || "default"} className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white line-clamp-2">{itinerary.title}</h3>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  {/* Host */}
                  {itinerary.profiles && (
                    <div className="flex items-center gap-2 mb-3">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={itinerary.profiles.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {itinerary.profiles.name?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">
                        {itinerary.profiles.name || "Anonymous"}
                      </span>
                    </div>
                  )}

                  {/* Details */}
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
                    {itinerary.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {itinerary.location}
                      </span>
                    )}
                    {itinerary.start_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(itinerary.start_date)}
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <button
                        onClick={handleLike}
                        className="flex items-center gap-1 hover:text-red-500 transition-colors"
                      >
                        <Heart className="h-4 w-4" />
                        {itinerary.like_count || 0}
                      </button>
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {itinerary.view_count || 0}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Click to view
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Footer with legal links */}
      <footer className="bg-gray-100 py-6 mt-8">
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
