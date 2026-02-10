"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Calendar, MapPin, Heart, MessageCircle, Bookmark, ChevronLeft, ChevronRight, Loader2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SignupPromptDialog } from "@/components/signup-prompt-dialog"
import { ThemeIcon } from "@/components/theme-selector"
import { getFontFamily } from "@/components/font-selector"
import Link from "next/link"

interface FeaturedItinerary {
  id: string
  title: string
  description: string | null
  location: string | null
  startDate: string | null
  endDate: string | null
  imageUrl: string | null
  theme: string
  font: string
  likeCount: number
  viewCount: number
  createdAt: string
  host: {
    id: string
    name: string
    username: string | null
    avatarUrl: string | null
  } | null
  activityCount: number
  isEvent: boolean
}

export function GuestItineraryBrowser() {
  const [itineraries, setItineraries] = useState<FeaturedItinerary[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSignupPrompt, setShowSignupPrompt] = useState(false)
  const [promptReason, setPromptReason] = useState<"like" | "comment" | "save" | "limit_reached" | "general">("general")
  const [viewedCount, setViewedCount] = useState(0)

  useEffect(() => {
    fetchFeaturedItineraries()
  }, [])

  const fetchFeaturedItineraries = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/itineraries/featured")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch itineraries")
      }

      setItineraries(data.itineraries || [])
    } catch (err: any) {
      console.error("Error fetching featured itineraries:", err)
      setError(err.message || "Failed to load itineraries")
    } finally {
      setIsLoading(false)
    }
  }

  const handleNext = () => {
    const newIndex = currentIndex + 1
    const newViewedCount = viewedCount + 1

    if (newIndex >= itineraries.length) {
      // Reached the end, prompt sign up
      setPromptReason("limit_reached")
      setShowSignupPrompt(true)
      return
    }

    setCurrentIndex(newIndex)
    setViewedCount(newViewedCount)

    // After viewing 5 itineraries, prompt sign up
    if (newViewedCount >= 5) {
      setPromptReason("limit_reached")
      setShowSignupPrompt(true)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleLike = () => {
    setPromptReason("like")
    setShowSignupPrompt(true)
  }

  const handleComment = () => {
    setPromptReason("comment")
    setShowSignupPrompt(true)
  }

  const handleSave = () => {
    setPromptReason("save")
    setShowSignupPrompt(true)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return ""
    try {
      return format(new Date(dateStr), "MMM d, yyyy")
    } catch {
      return dateStr
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500 mb-4" />
        <p className="text-muted-foreground">Loading amazing itineraries...</p>
      </div>
    )
  }

  if (error || itineraries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          {error || "No itineraries available at the moment"}
        </p>
        <Button asChild>
          <Link href="/auth?tab=signup">Sign up to create your own</Link>
        </Button>
      </div>
    )
  }

  const currentItinerary = itineraries[currentIndex]

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 mb-4">
        {itineraries.map((_, index) => (
          <div
            key={index}
            className={`h-1.5 rounded-full transition-all ${
              index === currentIndex
                ? "w-8 bg-orange-500"
                : index < currentIndex
                ? "w-4 bg-orange-300"
                : "w-4 bg-gray-200"
            }`}
          />
        ))}
      </div>

      {/* Itinerary Card */}
      <Card className="overflow-hidden shadow-xl">
        {/* Cover Image */}
        <div className="relative h-64 md:h-80">
          {currentItinerary.imageUrl ? (
            <img
              src={currentItinerary.imageUrl}
              alt={currentItinerary.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-400 via-pink-400 to-purple-500 flex items-center justify-center">
              <span
                className="text-3xl md:text-4xl font-bold text-white text-center px-4"
                style={{ fontFamily: getFontFamily(currentItinerary.font) }}
              >
                {currentItinerary.title}
              </span>
            </div>
          )}

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Title overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-center gap-2 mb-2">
              <ThemeIcon theme={currentItinerary.theme} className="h-5 w-5 text-white" />
              <span className="text-white/80 text-sm">
                {currentItinerary.isEvent ? "Event" : "Trip"}
              </span>
            </div>
            <h3
              className="text-2xl md:text-3xl font-bold text-white mb-2"
              style={{ fontFamily: getFontFamily(currentItinerary.font) }}
            >
              {currentItinerary.title}
            </h3>
            <div className="flex items-center gap-4 text-white/90 text-sm">
              {currentItinerary.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {currentItinerary.location}
                </span>
              )}
              {currentItinerary.startDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(currentItinerary.startDate)}
                  {currentItinerary.endDate && currentItinerary.endDate !== currentItinerary.startDate && (
                    <> - {formatDate(currentItinerary.endDate)}</>
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Navigation arrows */}
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className={`absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all ${
              currentIndex === 0 ? "opacity-30 cursor-not-allowed" : ""
            }`}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Host info */}
          {currentItinerary.host && (
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={currentItinerary.host.avatarUrl || undefined} />
                <AvatarFallback>
                  {currentItinerary.host.name?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{currentItinerary.host.name}</p>
                {currentItinerary.host.username && (
                  <p className="text-sm text-muted-foreground">@{currentItinerary.host.username}</p>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          {currentItinerary.description && (
            <p
              className="text-gray-700 mb-4 line-clamp-3"
              style={{ fontFamily: getFontFamily(currentItinerary.font) }}
            >
              {currentItinerary.description}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <span className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              {currentItinerary.likeCount} likes
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {currentItinerary.viewCount || 0} views
            </span>
            <span>{currentItinerary.activityCount} activities</span>
          </div>

          {/* Action buttons - trigger sign up prompts */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLike}
              className="flex-1"
            >
              <Heart className="h-4 w-4 mr-2" />
              Like
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleComment}
              className="flex-1"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Comment
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              className="flex-1"
            >
              <Bookmark className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>

          {/* View full itinerary link */}
          <div className="mt-4 text-center">
            <Link
              href={`/event/${currentItinerary.id}`}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              View full itinerary →
            </Link>
          </div>
        </div>
      </Card>

      {/* Counter and CTA */}
      <div className="text-center mt-6">
        <p className="text-sm text-muted-foreground mb-3">
          Viewing {currentIndex + 1} of {itineraries.length} featured itineraries
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/auth?tab=signup">Sign up to see more</Link>
        </Button>
      </div>

      {/* Sign up prompt dialog */}
      <SignupPromptDialog
        isOpen={showSignupPrompt}
        onClose={() => setShowSignupPrompt(false)}
        reason={promptReason}
      />
    </div>
  )
}
