"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Heart, MessageCircle, Calendar, MapPin, Users, Search, Bell, Loader2, Sparkles, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from "@/lib/supabase-client"

// Define types for our data
type User = {
  id: string
  email: string
  avatar_url?: string
}

type Itinerary = {
  id: string
  title: string
  description: string
  location: string
  start_date: string
  end_date: string
  image_url: string | null
  user_id: string
  created_at: string
  is_draft?: boolean
  user?: User
}

type Activity = {
  id: string
  title: string
  image: string
  location: string
}

type Event = {
  id: string
  title: string
  image: string
  date: string
  time: string
  location: string
}

// This is the personalized feed that shows content tailored to the user
// It should be accessible from the main navigation
export default function ForYouPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [recommendedItineraries, setRecommendedItineraries] = useState<Itinerary[]>([])
  const [friendsItineraries, setFriendsItineraries] = useState<Itinerary[]>([])
  const [nearbyActivities, setNearbyActivities] = useState<Activity[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)

      try {
        // Get current user
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (session?.user) {
          setCurrentUser({
            id: session.user.id,
            email: session.user.email || "",
            avatar_url: session.user.user_metadata?.avatar_url,
          })
        }

        // Fetch recommended itineraries (newest public itineraries) with user data in single query
        const { data: recommended, error: recommendedError } = await supabase
          .from("itineraries")
          .select(`
          id,
          title,
          description,
          location,
          start_date,
          end_date,
          image_url,
          user_id,
          created_at,
          profiles:user_id (
            id,
            email,
            avatar_url
          )
        `)
          .eq("is_public", true)
          .order("created_at", { ascending: false })
          .limit(5)

        // Also fetch user's own drafts if logged in
        let userDrafts: any[] = []
        if (session?.user) {
          const { data: drafts, error: draftsError } = await supabase
            .from("drafts")
            .select(`
            id,
            title,
            description,
            location,
            start_date,
            end_date,
            image_url,
            user_id,
            created_at
          `)
            .eq("user_id", session.user.id)
            .order("created_at", { ascending: false })
            .limit(3)

          if (!draftsError && drafts) {
            // Mark drafts and add user info
            userDrafts = drafts.map(draft => ({
              ...draft,
              is_draft: true,
              profiles: {
                id: session.user.id,
                email: session.user.email,
                avatar_url: session.user.user_metadata?.avatar_url
              }
            }))
          }
        }

        if (recommendedError) {
          console.error("Error fetching recommended itineraries:", recommendedError)
        } else {
          // Transform the data to match expected format
          const itinerariesWithUsers = (recommended || []).map((itinerary) => {
            const profile = Array.isArray(itinerary.profiles) ? itinerary.profiles[0] : itinerary.profiles
            return {
              ...itinerary,
              is_draft: false,
              user: profile || { id: itinerary.user_id, email: "Anonymous", avatar_url: null },
            }
          })

          // Transform drafts
          const draftsWithUsers = userDrafts.map((draft) => {
            const profile = Array.isArray(draft.profiles) ? draft.profiles[0] : draft.profiles
            return {
              ...draft,
              user: profile || { id: draft.user_id, email: "Anonymous", avatar_url: null },
            }
          })

          // Combine drafts and published itineraries, with drafts first
          const combinedItineraries = [...draftsWithUsers, ...itinerariesWithUsers]

          setRecommendedItineraries(combinedItineraries || [])
          // For demo purposes, we'll use the same data for friends' itineraries
          setFriendsItineraries(itinerariesWithUsers?.slice(0, 2) || [])
        }

        // For demo purposes, we'll use static data for nearby activities and upcoming events
        setNearbyActivities([
          {
            id: "beach-day",
            title: "Beach Day",
            image: "/placeholder.svg?height=150&width=150",
            location: "Santa Monica",
          },
          {
            id: "wine-tasting",
            title: "Wine Tasting",
            image: "/placeholder.svg?height=150&width=150",
            location: "Napa Valley",
          },
        ])

        setUpcomingEvents([
          {
            id: "music-festival",
            title: "Summer Music Festival",
            image: "/placeholder.svg?height=300&width=500",
            date: "June 30, 2023",
            time: "12:00 PM - 10:00 PM",
            location: "Central Park",
          },
        ])
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleCardClick = (id: string, isDraft: boolean = false) => {
    if (isDraft) {
      router.push(`/create?draft=${id}`)
    } else {
      router.push(`/event/${id}`)
    }
  }

  // Format date range for display
  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)

    // If same day, just show one date
    if (start.toDateString() === end.toDateString()) {
      return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(start)
    }

    // If same month and year, show range like "June 15-18, 2023"
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
      return `${new Intl.DateTimeFormat("en-US", { month: "short" }).format(start)} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`
    }

    // Otherwise show full range
    return `${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(start)} - ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(end)}`
  }

  // Generate a default cover image based on location
  const getDefaultCoverImage = (location: string) => {
    const loc = location?.toLowerCase() || ""

    if (loc.includes("beach")) {
      return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop"
    } else if (loc.includes("mountain")) {
      return "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop"
    } else if (loc.includes("city")) {
      return "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&h=600&fit=crop"
    }
    // Default travel image
    return "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop"
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-pink-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="container px-4 py-3 max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 text-transparent bg-clip-text">
              For You
            </h1>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-500"
                onClick={() => router.push("/notifications")}
              >
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-500" onClick={() => router.push("/search")}>
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container px-4 py-4 max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-6xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-pink-500 mb-4" />
            <p className="text-muted-foreground">Loading your personalized feed...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Recommended for You */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-lg">Recommended for You</h2>
                <Button variant="link" size="sm" className="text-pink-500 p-0">
                  See all
                </Button>
              </div>

              {recommendedItineraries.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recommendedItineraries.map((itinerary) => (
                    <Card
                      key={itinerary.id}
                      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleCardClick(itinerary.id, itinerary.is_draft)}
                    >
                      <div className="relative h-48">
                        <Image
                          src={itinerary.image_url || getDefaultCoverImage(itinerary.location)}
                          alt={itinerary.title}
                          fill
                          className="object-cover"
                          loading="lazy"
                        />
                        {itinerary.is_draft ? (
                          <Badge className="absolute top-2 right-2 bg-yellow-500 hover:bg-yellow-600">
                            <Clock className="h-3 w-3 mr-1" />
                            Draft
                          </Badge>
                        ) : (
                          <Badge className="absolute top-2 left-2 bg-pink-500">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Perfect Match
                          </Badge>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                          <h3 className="text-white font-bold text-lg">{itinerary.title}</h3>
                          <div className="flex flex-wrap items-center gap-y-1 gap-x-3 mt-1">
                            <div className="flex items-center text-white/90 text-xs">
                              <Calendar className="h-3 w-3 mr-1" />
                              <span>{formatDateRange(itinerary.start_date, itinerary.end_date)}</span>
                            </div>
                            <div className="flex items-center text-white/90 text-xs">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span>{itinerary.location}</span>
                            </div>
                            <div className="flex items-center text-white/90 text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              <span>4 people</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Avatar className="h-6 w-6">
                              <AvatarImage
                                src={itinerary.user?.avatar_url || "/placeholder.svg?height=40&width=40"}
                                alt="Creator"
                              />
                              <AvatarFallback>{itinerary.user?.email?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs ml-2">{itinerary.user?.email?.split("@")[0] || "Anonymous"}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Heart className="h-3 w-3 mr-1" />
                              {Math.floor(Math.random() * 100) + 1}
                            </div>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <MessageCircle className="h-3 w-3 mr-1" />
                              {Math.floor(Math.random() * 30)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-6 text-center">
                  <p className="text-muted-foreground mb-4">No recommendations yet. Create your first itinerary!</p>
                  <Button
                    onClick={() => router.push("/create")}
                    className="bg-gradient-to-r from-orange-500 to-pink-500 text-white"
                  >
                    Create Itinerary
                  </Button>
                </Card>
              )}
            </div>

            {/* Friends' Trips */}
            {friendsItineraries.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-lg">Friends' Trips</h2>
                  <Button variant="link" size="sm" className="text-pink-500 p-0">
                    See all
                  </Button>
                </div>

                <div className="space-y-3">
                  {friendsItineraries.map((trip) => (
                    <Card
                      key={trip.id}
                      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleCardClick(trip.id)}
                    >
                      <div className="flex h-24">
                        <div className="w-1/3 relative">
                          <Image
                            src={trip.image_url || getDefaultCoverImage(trip.location)}
                            alt={trip.title}
                            fill
                            className="object-cover"
                            loading="lazy"
                          />
                        </div>
                        <div className="w-2/3 p-3 flex flex-col justify-between">
                          <div>
                            <h3 className="font-semibold">{trip.title}</h3>
                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                              <Calendar className="h-3 w-3 mr-1" />
                              <span>{formatDateRange(trip.start_date, trip.end_date)}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Avatar className="h-5 w-5">
                                <AvatarImage
                                  src={trip.user?.avatar_url || "/placeholder.svg?height=40&width=40"}
                                  alt={trip.user?.email}
                                />
                                <AvatarFallback>{trip.user?.email?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                              </Avatar>
                              <span className="text-xs ml-1">{trip.user?.email?.split("@")[0] || "Anonymous"}</span>
                            </div>
                            <Badge variant="outline" className="text-xs h-5">
                              {Math.floor(Math.random() * 5) + 1} mutual friends
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Near You */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-lg">Popular Near You</h2>
                <Button variant="link" size="sm" className="text-pink-500 p-0">
                  See all
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {nearbyActivities.map((activity) => (
                  <Card
                    key={activity.id}
                    className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleCardClick(activity.id)}
                  >
                    <div className="relative h-24">
                      <Image
                        src={activity.image || "/placeholder.svg"}
                        alt={activity.title}
                        fill
                        className="object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="text-center text-white">
                          <div className="font-medium text-sm">{activity.title}</div>
                          <div className="text-xs">{activity.location}</div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Upcoming Events */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-lg">Upcoming Events</h2>
                <Button variant="link" size="sm" className="text-pink-500 p-0">
                  See all
                </Button>
              </div>

              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <Card
                    key={event.id}
                    className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleCardClick(event.id)}
                  >
                    <div className="flex h-24">
                      <div className="w-1/3 relative">
                        <Image
                          src={event.image || "/placeholder.svg"}
                          alt={event.title}
                          fill
                          className="object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="w-2/3 p-3">
                        <h3 className="font-semibold">{event.title}</h3>
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{event.date}</span>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{event.time}</span>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span>{event.location}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
