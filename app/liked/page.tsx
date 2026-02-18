"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Heart, Calendar, MapPin, Loader2, Sparkles, Eye, Bookmark, TrendingUp, Search } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AppHeader } from "@/components/app-header"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/providers/auth-provider"

export default function LikedPage() {
  const { user } = useAuth()
  const [likedItineraries, setLikedItineraries] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("recent")

  useEffect(() => {
    async function fetchLikedItineraries() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const supabase = createClient()

        // Fetch liked itineraries
        const { data, error } = await supabase
          .from("saved_itineraries")
          .select(`
            id,
            created_at,
            type,
            itineraries:itinerary_id (
              id,
              title,
              description,
              location,
              start_date,
              end_date,
              image_url,
              is_public,
              profiles:user_id (
                name,
                username,
                avatar_url
              ),
              itinerary_metrics (
                like_count,
                save_count,
                view_count
              )
            )
          `)
          .eq("user_id", user.id)
          .eq("type", "like")
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Error fetching liked itineraries:", error)
          setLikedItineraries([])
        } else {
          setLikedItineraries(data || [])
        }
      } catch (error) {
        console.error("Error:", error)
        setLikedItineraries([])
      } finally {
        setLoading(false)
      }
    }

    fetchLikedItineraries()
  }, [user])

  const getFilteredAndSortedItems = () => {
    let items = likedItineraries

    // Filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      items = items.filter((item) => {
        const itinerary = item.itineraries
        if (itinerary) {
          return (
            itinerary.title?.toLowerCase().includes(query) ||
            itinerary.description?.toLowerCase().includes(query) ||
            itinerary.location?.toLowerCase().includes(query)
          )
        }
        return false
      })
    }

    // Sort
    if (sortBy === "title") {
      items = [...items].sort((a, b) =>
        (a.itineraries?.title || "").localeCompare(b.itineraries?.title || "")
      )
    } else if (sortBy === "date") {
      items = [...items].sort((a, b) =>
        new Date(a.itineraries?.start_date || 0).getTime() - new Date(b.itineraries?.start_date || 0).getTime()
      )
    } else if (sortBy === "popular") {
      items = [...items].sort((a, b) => {
        const aMetrics = Array.isArray(a.itineraries?.itinerary_metrics)
          ? a.itineraries.itinerary_metrics[0]
          : a.itineraries?.itinerary_metrics
        const bMetrics = Array.isArray(b.itineraries?.itinerary_metrics)
          ? b.itineraries.itinerary_metrics[0]
          : b.itineraries?.itinerary_metrics
        return (bMetrics?.like_count || 0) - (aMetrics?.like_count || 0)
      })
    }

    return items
  }

  const filteredItems = getFilteredAndSortedItems()

  const formatDate = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start.toDateString() === end.toDateString()) {
      return start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    }

    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
  }

  const getItineraryType = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    return start.toDateString() === end.toDateString() ? "Event" : "Trip"
  }

  const handleUnlike = async (e: React.MouseEvent, itemId: string, itineraryId: string) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      const supabase = createClient()

      // Delete the like from saved_itineraries
      const { error } = await supabase
        .from("saved_itineraries")
        .delete()
        .eq("id", itemId)

      if (error) {
        console.error("Error unliking itinerary:", error)
        return
      }

      // Update local state - remove the unliked item
      setLikedItineraries((prev) => prev.filter((item) => item.id !== itemId))

      // Optionally decrement the like count in metrics
      await supabase.rpc("decrement_like_count", { itinerary_id: itineraryId })
    } catch (error) {
      console.error("Error in unlike operation:", error)
    }
  }

  // Calculate total stats
  const totalLikes = likedItineraries.length
  const totalTrips = likedItineraries.filter((item) => {
    const itinerary = item.itineraries
    if (!itinerary) return false
    return getItineraryType(itinerary.start_date, itinerary.end_date) === "Trip"
  }).length
  const totalEvents = totalLikes - totalTrips

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-red-50/30 via-white to-pink-50/30">
      <AppHeader />

      <main className="flex-1 cute-section-bg">
        <div className="container px-4 py-6 md:py-10">
          {/* Cute Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/80 dark:bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 via-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-200">
                    <Heart className="h-6 w-6 text-white fill-white heart-icon-cute" />
                  </div>
                  <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-pink-400 sparkle" />
                </div>
                <div>
                  <h1 className="cute-section-header">Liked</h1>
                  <p className="text-sm text-muted-foreground">Your favorite trips & events</p>
                </div>
              </div>
            </div>
            {likedItineraries.length > 0 && (
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-50 to-violet-50 border border-pink-100">
                <Heart className="h-4 w-4 text-pink-500 fill-pink-500" />
                <span className="text-sm font-medium text-pink-600">{likedItineraries.length} liked</span>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          {!loading && user && likedItineraries.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-100">
                <CardContent className="p-4 text-center">
                  <Heart className="h-6 w-6 text-red-500 fill-red-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-red-600">{totalLikes}</div>
                  <div className="text-xs text-muted-foreground">Total Likes</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">{totalTrips}</div>
                  <div className="text-xs text-muted-foreground">Trips</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100">
                <CardContent className="p-4 text-center">
                  <Sparkles className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-600">{totalEvents}</div>
                  <div className="text-xs text-muted-foreground">Events</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Search and Sort */}
          {!loading && user && likedItineraries.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search your liked items..."
                  className="pl-10 border-2 focus:border-red-300 transition-colors"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border-2 rounded-md bg-white dark:bg-card hover:border-red-300 transition-colors cursor-pointer"
              >
                <option value="recent">Recently Liked</option>
                <option value="title">Title A-Z</option>
                <option value="date">By Date</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-100 to-violet-100 flex items-center justify-center mb-4">
                <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
              </div>
              <p className="text-muted-foreground">Loading your favorites...</p>
            </div>
          ) : !user ? (
            <div className="cute-empty-state">
              <div className="cute-empty-icon">
                <Heart className="h-12 w-12 text-pink-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2 cute-section-header">Sign in to see your likes</h2>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Create an account to save and like your favorite trips and events
              </p>
              <Link href="/auth" className="cute-cta-btn inline-flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Sign In
              </Link>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="cute-empty-state">
              <div className="cute-empty-icon relative">
                <Heart className="h-12 w-12 text-pink-400" />
                <Sparkles className="absolute top-0 right-2 h-5 w-5 text-violet-400 sparkle sparkle-delay-1" />
                <Sparkles className="absolute bottom-2 left-0 h-4 w-4 text-pink-400 sparkle sparkle-delay-2" />
                <Sparkles className="absolute top-4 -left-2 h-3 w-3 text-orange-400 sparkle sparkle-delay-3" />
              </div>
              <h2 className="text-xl font-semibold mb-2">
                {searchQuery ? "No matches found" : "No likes yet"}
              </h2>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                {searchQuery
                  ? "Try adjusting your search terms or explore new adventures"
                  : "Explore amazing trips and tap the heart to save your favorites here"}
              </p>
              <Link href="/app" className="cute-cta-btn inline-flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Discover Trips
              </Link>
            </div>
          ) : (
            <div className="insta-grid">
              {filteredItems.map((item) => {
                const itinerary = item.itineraries
                if (!itinerary) return null

                const profile = Array.isArray(itinerary.profiles) ? itinerary.profiles[0] : itinerary.profiles
                const itineraryType = getItineraryType(itinerary.start_date, itinerary.end_date)

                return (
                  <Link key={item.id} href={`/event/${itinerary.id}`}>
                    <div className="cute-card h-full group">
                      {/* Image Section */}
                      <div className="relative h-52 overflow-hidden">
                        {itinerary.image_url ? (
                          <img
                            src={itinerary.image_url}
                            alt={itinerary.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-pink-400 via-violet-400 to-orange-400 flex items-center justify-center">
                            <span className="text-3xl font-bold text-white/90">{itinerary.title[0]}</span>
                          </div>
                        )}

                        {/* Overlay */}
                        <div className="absolute inset-0 cute-card-overlay opacity-60" />

                        {/* Type Badge */}
                        <span className={`absolute top-3 left-3 ${itineraryType === "Trip" ? "cute-badge-trip" : "cute-badge-event"}`}>
                          {itineraryType}
                        </span>

                        {/* Unlike Button */}
                        <button
                          className="cute-action-btn liked absolute top-3 right-3"
                          onClick={(e) => handleUnlike(e, item.id, itinerary.id)}
                          aria-label="Unlike itinerary"
                        >
                          <Heart className="h-4 w-4 text-pink-500 fill-pink-500 heart-icon-cute" />
                        </button>

                        {/* Title on image */}
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="font-semibold text-white text-lg line-clamp-1 drop-shadow-md">
                            {itinerary.title}
                          </h3>
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="p-4 bg-white dark:bg-card">
                        {itinerary.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{itinerary.description}</p>
                        )}

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-pink-400" />
                            <span>{formatDate(itinerary.start_date, itinerary.end_date)}</span>
                          </div>
                        </div>

                        {itinerary.location && (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2">
                            <MapPin className="h-3.5 w-3.5 text-violet-400" />
                            <span className="line-clamp-1">{itinerary.location}</span>
                          </div>
                        )}

                        {profile && (
                          <div className="mt-3 pt-3 border-t border-pink-100 dark:border-pink-900/20">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <span className="text-pink-400">by</span>
                              <span className="font-medium">{profile.name || profile.username || "Anonymous"}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
