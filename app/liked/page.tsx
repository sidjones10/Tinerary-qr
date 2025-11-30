"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Heart, Calendar, MapPin, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AppHeader } from "@/components/app-header"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/providers/auth-provider"

export default function LikedPage() {
  const { user } = useAuth()
  const [likedItineraries, setLikedItineraries] = useState([])
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex-1 bg-gradient-to-b from-gray-50 to-white">
        <div className="container px-4 py-6 md:py-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Heart className="h-6 w-6 text-red-500 fill-red-500" />
                Liked Trips & Events
              </h1>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !user ? (
            <div className="text-center py-12">
              <Heart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h2 className="text-xl font-semibold mb-2">Sign in to see your liked trips</h2>
              <p className="text-muted-foreground mb-6">Save your favorite trips and events by signing in</p>
              <Link
                href="/auth"
                className="inline-flex items-center justify-center px-6 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Sign In
              </Link>
            </div>
          ) : likedItineraries.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h2 className="text-xl font-semibold mb-2">No liked trips yet</h2>
              <p className="text-muted-foreground mb-6">
                Start exploring and like trips that interest you
              </p>
              <Link
                href="/app"
                className="inline-flex items-center justify-center px-6 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Discover Trips
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {likedItineraries.map((item) => {
                const itinerary = item.itineraries
                if (!itinerary) return null

                const profile = Array.isArray(itinerary.profiles) ? itinerary.profiles[0] : itinerary.profiles
                const metrics = Array.isArray(itinerary.itinerary_metrics)
                  ? itinerary.itinerary_metrics[0]
                  : itinerary.itinerary_metrics

                return (
                  <Link key={item.id} href={`/event/${itinerary.id}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                      <div className="relative h-48">
                        {itinerary.image_url ? (
                          <img
                            src={itinerary.image_url}
                            alt={itinerary.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-orange-400 via-pink-400 to-purple-500 flex items-center justify-center">
                            <span className="text-2xl font-bold text-white">{itinerary.title[0]}</span>
                          </div>
                        )}
                        <Badge
                          className={`absolute top-3 left-3 ${
                            getItineraryType(itinerary.start_date, itinerary.end_date) === "Trip"
                              ? "bg-blue-500"
                              : "bg-purple-500"
                          }`}
                        >
                          {getItineraryType(itinerary.start_date, itinerary.end_date)}
                        </Badge>
                        <button
                          className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-colors"
                          onClick={(e) => handleUnlike(e, item.id, itinerary.id)}
                          aria-label="Unlike itinerary"
                        >
                          <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                        </button>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2 line-clamp-1">{itinerary.title}</h3>
                        {itinerary.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{itinerary.description}</p>
                        )}
                        <div className="flex items-center text-sm text-muted-foreground mb-2">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{formatDate(itinerary.start_date, itinerary.end_date)}</span>
                        </div>
                        {itinerary.location && (
                          <div className="flex items-center text-sm text-muted-foreground mb-3">
                            <MapPin className="h-3 w-3 mr-1" />
                            <span className="line-clamp-1">{itinerary.location}</span>
                          </div>
                        )}
                        {profile && (
                          <div className="text-xs text-muted-foreground">
                            by {profile.name || profile.username || "Anonymous"}
                          </div>
                        )}
                      </CardContent>
                    </Card>
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
