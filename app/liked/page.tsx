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

      <main className="flex-1">
        <div className="container px-4 py-6 md:py-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
                  <div className="relative">
                    <Heart className="h-8 w-8 text-red-500 fill-red-500 animate-pulse" />
                    <Heart className="h-8 w-8 text-red-500 fill-red-500 absolute inset-0 animate-ping opacity-20" />
                  </div>
                  Liked Adventures
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {totalLikes} {totalLikes === 1 ? "favorite" : "favorites"} • {totalTrips} trips • {totalEvents} events
                </p>
              </div>
            </div>
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
                className="px-4 py-2 border-2 rounded-md bg-white hover:border-red-300 transition-colors cursor-pointer"
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
            <div className="flex items-center justify-center py-20">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-red-200 border-t-red-500 rounded-full animate-spin"></div>
                <Heart className="absolute inset-0 m-auto h-8 w-8 text-red-500 fill-red-500 animate-pulse" />
              </div>
            </div>
          ) : !user ? (
            <div className="text-center py-20">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-red-100 to-pink-100 rounded-full"></div>
                <Heart className="absolute inset-0 m-auto h-12 w-12 text-red-400 opacity-60" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Sign in to see your liked trips</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Save your favorite trips and events by signing in
              </p>
              <Button className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white border-0 shadow-lg" asChild>
                <Link href="/auth">
                  <Heart className="mr-2 h-4 w-4" />
                  Sign In
                </Link>
              </Button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-20">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-red-100 to-pink-100 rounded-full"></div>
                <Heart className="absolute inset-0 m-auto h-12 w-12 text-red-400 opacity-60" />
              </div>
              <h2 className="text-2xl font-bold mb-2">
                {searchQuery ? "No matches found" : "No liked trips yet"}
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {searchQuery
                  ? "Try adjusting your search terms or explore new adventures"
                  : "Start exploring and like trips that interest you"}
              </p>
              <Button className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white border-0 shadow-lg" asChild>
                <Link href="/app">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Discover Trips
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item, index) => {
                const itinerary = item.itineraries
                if (!itinerary) return null

                const profile = Array.isArray(itinerary.profiles) ? itinerary.profiles[0] : itinerary.profiles
                const metrics = Array.isArray(itinerary.itinerary_metrics)
                  ? itinerary.itinerary_metrics[0]
                  : itinerary.itinerary_metrics

                const isTrip = getItineraryType(itinerary.start_date, itinerary.end_date) === "Trip"

                return (
                  <div
                    key={item.id}
                    className="group animate-in fade-in slide-in-from-bottom-4"
                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: "backwards" }}
                  >
                    <Link href={`/event/${itinerary.id}`}>
                      <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 hover:border-red-200 hover:-translate-y-1 h-full">
                        <div className="relative h-52 overflow-hidden">
                          {itinerary.image_url ? (
                            <img
                              src={itinerary.image_url}
                              alt={itinerary.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-red-400 via-pink-400 to-purple-500 flex items-center justify-center relative overflow-hidden">
                              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
                              <span className="text-5xl font-bold text-white drop-shadow-lg z-10">
                                {itinerary.title[0]}
                              </span>
                            </div>
                          )}

                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                          <Badge
                            className={`absolute top-3 left-3 ${
                              isTrip
                                ? "bg-gradient-to-r from-blue-500 to-cyan-400"
                                : "bg-gradient-to-r from-purple-500 to-pink-400"
                            } border-0 text-white font-semibold shadow-lg`}
                          >
                            {isTrip ? "Trip" : "Event"}
                          </Badge>

                          <button
                            className="absolute top-3 right-3 p-2.5 rounded-full bg-white/90 backdrop-blur-md hover:bg-white transition-all hover:scale-110 shadow-lg group/heart"
                            onClick={(e) => handleUnlike(e, item.id, itinerary.id)}
                            aria-label="Unlike itinerary"
                          >
                            <Heart className="h-4 w-4 text-red-500 fill-red-500 group-hover/heart:scale-125 transition-transform" />
                          </button>
                        </div>

                        <CardContent className="p-5">
                          <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-red-600 transition-colors">
                            {itinerary.title}
                          </h3>

                          {itinerary.description && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
                              {itinerary.description}
                            </p>
                          )}

                          <div className="flex items-center text-sm text-muted-foreground mb-2">
                            <Calendar className="h-4 w-4 mr-1.5 text-purple-500 flex-shrink-0" />
                            <span className="line-clamp-1">{formatDate(itinerary.start_date, itinerary.end_date)}</span>
                          </div>

                          {itinerary.location && (
                            <div className="flex items-center text-sm text-muted-foreground mb-4">
                              <MapPin className="h-4 w-4 mr-1.5 text-red-500 flex-shrink-0" />
                              <span className="line-clamp-1">{itinerary.location}</span>
                            </div>
                          )}

                          {/* Metrics */}
                          {metrics && (
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                              <div className="flex items-center gap-1">
                                <Heart className="h-3.5 w-3.5 text-red-400" />
                                <span>{metrics.like_count || 0}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Eye className="h-3.5 w-3.5 text-blue-400" />
                                <span>{metrics.view_count || 0}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Bookmark className="h-3.5 w-3.5 text-orange-400" />
                                <span>{metrics.save_count || 0}</span>
                              </div>
                            </div>
                          )}

                          {/* Creator */}
                          {profile && (
                            <div className="flex items-center gap-2 pt-3 border-t">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={profile.avatar_url} alt={profile.name} />
                                <AvatarFallback className="text-xs bg-gradient-to-br from-red-200 to-pink-200">
                                  {profile.name?.[0] || profile.username?.[0] || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground">
                                by {profile.name || profile.username || "Anonymous"}
                              </span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
