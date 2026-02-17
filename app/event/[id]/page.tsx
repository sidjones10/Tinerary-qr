"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/providers/auth-provider"
import { Loader2, MapPin, Calendar, Heart, Eye, ArrowLeft, Clock } from "lucide-react"
import { EventDetail } from "@/components/event-detail"
import { EventNotFound } from "@/components/event-not-found"
import { EventPrivate } from "@/components/event-private"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThemeIcon } from "@/components/theme-selector"

// Add these helper functions at the top of the file, after the imports:
const formatDate = (dateString: string) => {
  if (!dateString) return ""
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  }
  return new Date(dateString).toLocaleDateString(undefined, options)
}

const formatDateRange = (startDate: string, endDate: string) => {
  if (!startDate || !endDate) return ""

  const start = new Date(startDate)
  const end = new Date(endDate)

  const startMonth = start.toLocaleDateString(undefined, { month: "short" })
  const endMonth = end.toLocaleDateString(undefined, { month: "short" })

  const startDay = start.getDate()
  const endDay = end.getDate()
  const year = end.getFullYear()

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}-${endDay}, ${year}`
  } else {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`
  }
}

// Function to check if a string is a valid UUID
const isValidUUID = (id: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

// Replace the getEventById function with this:
const getEventById = async (id: string) => {
  try {
    // Check if we have a valid ID
    if (!id) {
      throw new Error("No ID provided")
    }

    // For testing or demo purposes, return mock data for numeric IDs
    if (!isNaN(Number(id)) && !isValidUUID(id)) {
      return getMockEventData(id)
    }

    const supabase = createClient()

    // Fetch the itinerary with owner profile information and metrics
    const { data: itineraryData, error: itineraryError } = await supabase
      .from("itineraries")
      .select(`
        *,
        owner:profiles!itineraries_user_id_fkey(
          id,
          name,
          username,
          avatar_url,
          email
        ),
        metrics:itinerary_metrics(
          like_count,
          comment_count,
          save_count,
          view_count
        )
      `)
      .eq("id", id)
      .single()

    if (itineraryError) {
      console.error("Error fetching itinerary:", itineraryError)
      throw new Error(itineraryError.message)
    }

    if (!itineraryData) {
      console.error("No itinerary found with ID:", id)
      throw new Error("Itinerary not found")
    }

    // Fetch activities, packing items, expenses, and attendees in parallel for better performance
    const [
      { data: activitiesData, error: activitiesError },
      { data: packingData, error: packingError },
      { data: expensesData, error: expensesError },
      { data: attendeesData, error: attendeesError }
    ] = await Promise.all([
      supabase
        .from("activities")
        .select("*")
        .eq("itinerary_id", id)
        .order("start_time", { ascending: true }),
      supabase
        .from("packing_items")
        .select("*")
        .eq("itinerary_id", id),
      supabase
        .from("expenses")
        .select("*")
        .eq("itinerary_id", id),
      supabase
        .from("itinerary_attendees")
        .select(`
          user_id,
          role,
          profiles:user_id (
            id,
            name,
            username,
            avatar_url
          )
        `)
        .eq("itinerary_id", id)
    ])

    if (activitiesError) {
      console.error("Error fetching activities:", activitiesError)
    }

    if (packingError) {
      console.error("Error fetching packing items:", packingError)
    }

    if (expensesError) {
      console.error("Error fetching expenses:", expensesError)
    }

    if (attendeesError) {
      console.error("Error fetching attendees:", attendeesError)
    }

    // Determine if this is a trip or event based on date fields
    const isTrip = itineraryData.start_date !== itineraryData.end_date

    // Group activities by day for trips
    let days = []
    if (activitiesData && activitiesData.length > 0) {
      if (isTrip) {
        // For trips, group by day
        const dayMap = new Map()

        activitiesData.forEach((activity) => {
          const activityDate = new Date(activity.start_time).toDateString()
          if (!dayMap.has(activityDate)) {
            dayMap.set(activityDate, {
              day: dayMap.size + 1,
              date: activityDate,
              activities: [],
            })
          }
          dayMap.get(activityDate).activities.push({
            id: activity.id,
            title: activity.title,
            time: new Date(activity.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            location: activity.location,
            description: activity.description,
            going: 0, // Default values since we don't have this data yet
            maybe: 0,
            attendees: [],
          })
        })

        days = Array.from(dayMap.values())
      } else {
        // For single-day events, put all activities in one day
        days = [
          {
            day: 1,
            date: itineraryData.start_date,
            activities: activitiesData.map((activity) => ({
              id: activity.id,
              title: activity.title,
              time: new Date(activity.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              location: activity.location,
              description: activity.description,
              going: 0, // Default values
              maybe: 0,
              attendees: [],
            })),
          },
        ]
      }
    }

    // Extract owner information
    const owner = Array.isArray(itineraryData.owner) ? itineraryData.owner[0] : itineraryData.owner

    // Extract metrics
    const metrics = Array.isArray(itineraryData.metrics) ? itineraryData.metrics[0] : itineraryData.metrics

    // Format the data to match the expected structure
    return {
      id: itineraryData.id,
      user_id: itineraryData.user_id,
      title: itineraryData.title,
      type: isTrip ? "Trip" : "Event",
      image: itineraryData.image_url || "/placeholder.svg?height=400&width=800",
      image_url: itineraryData.image_url,
      start_date: itineraryData.start_date,
      end_date: itineraryData.end_date,
      date: isTrip
        ? formatDateRange(itineraryData.start_date, itineraryData.end_date)
        : formatDate(itineraryData.start_date),
      location: itineraryData.location,
      is_public: itineraryData.is_public,
      packing_list_public: itineraryData.packing_list_public,
      expenses_public: itineraryData.expenses_public,
      theme: itineraryData.theme,
      font: itineraryData.font,
      cover_update_prompted: itineraryData.cover_update_prompted,
      host_name: owner?.name || owner?.username || owner?.email?.split('@')[0] || "Anonymous",
      host_username: owner?.username ? `@${owner.username}` : null,
      host_avatar: owner?.avatar_url,
      organizer: {
        name: owner?.name || owner?.username || owner?.email?.split('@')[0] || "Anonymous",
        username: owner?.username ? `@${owner.username}` : "@anonymous",
        avatar: owner?.avatar_url || "/placeholder.svg?height=40&width=40",
      },
      likes: 0, // Legacy field for compatibility
      like_count: metrics?.like_count || 0,
      comment_count: metrics?.comment_count || 0,
      save_count: metrics?.save_count || 0,
      view_count: metrics?.view_count || 0,
      description: itineraryData.description,
      days: days,
      activities: activitiesData || [], // Include raw activities data for the EventDetail component
      // Format packing items
      packingList: packingData ? packingData.map((item: any) => ({
        id: item.id,
        name: item.name,
        category: item.category || "clothing",
        quantity: item.quantity || 1,
        packed: item.is_packed || false,
        url: item.url,
        tripId: id,
      })) : [],
      // Format expenses
      expenses: (() => {
        if (!expensesData || expensesData.length === 0) {
          return {
            categories: [],
            items: [],
            total: 0,
          }
        }

        const total = expensesData.reduce((sum: number, exp: any) => sum + Number(exp.amount), 0)
        const categoriesMap = new Map()

        expensesData.forEach((expense: any) => {
          const category = expense.category
          const amount = Number(expense.amount)
          if (categoriesMap.has(category)) {
            categoriesMap.set(category, categoriesMap.get(category) + amount)
          } else {
            categoriesMap.set(category, amount)
          }
        })

        return {
          categories: Array.from(categoriesMap.entries()).map(([name, amount]: [string, number]) => ({
            name,
            amount,
            percentage: total > 0 ? Math.round((amount / total) * 100) : 0
          })),
          items: expensesData.map((exp: any) => ({
            id: exp.id,
            category: exp.category,
            amount: Number(exp.amount),
            description: exp.description || "",
          })),
          total,
        }
      })(),
      // Format attendees/participants
      attendees: attendeesData ? attendeesData.map((attendee: any) => {
        const profile = Array.isArray(attendee.profiles) ? attendee.profiles[0] : attendee.profiles
        return {
          id: profile?.id || attendee.user_id,
          name: profile?.name || profile?.username || "Unknown",
          avatar_url: profile?.avatar_url,
          role: attendee.role || 'member'
        }
      }) : [],
      people: [],
      discussion: [],
    }
  } catch (error) {
    console.error("Error in getEventById:", error)
    throw error
  }
}

// Mock data function for testing
const getMockEventData = (id: string) => {
  return {
    id: id,
    title: "Weekend in NYC",
    type: "Trip",
    image: "/placeholder.svg?height=400&width=800",
    date: "Mar 15-17, 2025",
    location: "New York, NY",
    organizer: {
      name: "Alex Rodriguez",
      username: "@alexr",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    likes: 24,
    description:
      "Exploring the best of New York City with friends! We'll visit museums, try local restaurants, and catch a Broadway show.",
    days: [
      {
        day: 1,
        date: "Mar 15, 2025",
        activities: [
          {
            id: "a1",
            title: "Brunch at Sarabeth's",
            time: "10:00 AM",
            location: "Central Park South",
            description: "Meet up for brunch to start our NYC adventure!",
            going: 4,
            maybe: 2,
            attendees: [
              { name: "Alex Rodriguez", avatar: "/placeholder.svg?height=24&width=24" },
              { name: "Taylor Moore", avatar: "/placeholder.svg?height=24&width=24" },
              { name: "Jordan Davis", avatar: "/placeholder.svg?height=24&width=24" },
            ],
          },
          {
            id: "a2",
            title: "Metropolitan Museum of Art",
            time: "1:00 PM",
            location: "5th Avenue",
            description: "Explore one of the world's greatest art museums.",
            going: 5,
            maybe: 1,
            attendees: [
              { name: "Alex Rodriguez", avatar: "/placeholder.svg?height=24&width=24" },
              { name: "Taylor Moore", avatar: "/placeholder.svg?height=24&width=24" },
              { name: "Jordan Davis", avatar: "/placeholder.svg?height=24&width=24" },
            ],
          },
        ],
      },
      {
        day: 2,
        date: "Mar 16, 2025",
        activities: [
          {
            id: "a4",
            title: "Walk the High Line",
            time: "9:00 AM",
            location: "Chelsea",
            description: "Scenic elevated park built on a historic freight rail line.",
            going: 3,
            maybe: 2,
            attendees: [
              { name: "Alex Rodriguez", avatar: "/placeholder.svg?height=24&width=24" },
              { name: "Taylor Moore", avatar: "/placeholder.svg?height=24&width=24" },
              { name: "Jordan Davis", avatar: "/placeholder.svg?height=24&width=24" },
            ],
          },
        ],
      },
    ],
    expenses: {
      categories: [
        { name: "Accommodation", amount: 1200, percentage: 40 },
        { name: "Transportation", amount: 600, percentage: 20 },
        { name: "Food & Dining", amount: 900, percentage: 30 },
        { name: "Activities", amount: 300, percentage: 10 },
      ],
      items: [
        { name: "Hotel", paidBy: "Alex Rodriguez", amount: 1200, perPerson: 300 },
        { name: "Broadway Tickets", paidBy: "You", amount: 800, perPerson: 200 },
        { name: "Dinner at Carbone", paidBy: "Taylor Moore", amount: 450, perPerson: 112.5 },
      ],
      total: 2450,
    },
    packingList: [
      { id: "p1", name: "T-shirts (5)", category: "Clothing", packed: true },
      { id: "p2", name: "Jeans (2)", category: "Clothing", packed: true },
      { id: "p3", name: "Jacket", category: "Clothing", packed: false },
    ],
    people: [
      {
        name: "Alex Rodriguez",
        email: "alex@example.com",
        avatar: "/placeholder.svg?height=40&width=40",
        status: "Admin",
      },
      {
        name: "Taylor Moore",
        email: "taylor@example.com",
        avatar: "/placeholder.svg?height=40&width=40",
        status: "Admin",
      },
    ],
    discussion: [
      {
        id: "d1",
        user: { name: "Alex Rodriguez", avatar: "/placeholder.svg?height=32&width=32" },
        message: "Hey everyone! I'm so excited for our NYC trip! Does anyone have preferences for the Broadway show?",
        timestamp: "10:25 AM",
      },
    ],
  }
}

interface EventData {
  id: string
  title: string
  description: string | null
  start_date: string | null
  end_date: string | null
  destination: string | null
  user_id: string
  is_public: boolean
  packing_list_public?: boolean
  expenses_public?: boolean
  theme?: string
  font?: string
  cover_update_prompted?: boolean
  [key: string]: unknown
}

// Update the EventDetailPage component to use async data fetching
export default function EventPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [event, setEvent] = useState<EventData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [isPrivate, setIsPrivate] = useState(false)

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true)
        setError(null)
        setNotFound(false)
        setIsPrivate(false)

        // Use the getEventById function which has mock data fallback
        const eventData = await getEventById(id as string)

        // Check if we have the necessary data to determine privacy
        // For mock data, assume it's public
        const isMockData = !isNaN(Number(id)) && !isValidUUID(id as string)

        if (!isMockData && eventData.is_public === false && (!user || user.id !== eventData.user_id)) {
          setIsPrivate(true)
          return
        }

        setEvent(eventData)
      } catch (err: any) {
        console.error("Error fetching event:", err)
        if (err.message === "Itinerary not found") {
          setNotFound(true)
        } else {
          setError(err.message || "An error occurred while fetching the event")
        }
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchEvent()
    }
  }, [id, user])

  // Track view when event loads successfully
  useEffect(() => {
    if (!event || !id) return
    const supabase = createClient()
    // Increment view count in metrics (non-blocking)
    supabase.rpc("increment_view_count", { itinerary_id: id }).catch(() => {})
    // Track in user_interactions for analytics (non-blocking)
    if (user?.id) {
      supabase
        .from("user_interactions")
        .insert({ user_id: user.id, itinerary_id: id, interaction_type: "view" })
        .then(({ error }) => { if (error) console.error("Failed to track view:", error) })
    }
  }, [event?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (notFound) {
    return <EventNotFound />
  }

  if (isPrivate) {
    return <EventPrivate />
  }

  if (error || !event) {
    return (
      <div className="container px-4 py-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-muted-foreground mb-6">{error || "Failed to load this itinerary"}</p>
        </div>
      </div>
    )
  }

  // Guest view: mirror the discover page card style
  if (!user) {
    return <GuestEventView event={event} />
  }

  return <EventDetail event={event} />
}

// ── Guest-facing itinerary view (mirrors discover page) ──────────────
function GuestEventView({ event }: { event: any }) {
  const fmtDate = (d: string | null) => {
    if (!d) return ""
    try {
      return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    } catch { return d }
  }

  const days: any[] = event.days || []
  const description: string = event.description || ""

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header – same as discover page */}
      <header className="bg-white shadow-sm py-4 sticky top-0 z-40">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild aria-label="Go back">
              <Link href="/discover?guest=true">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-xl font-bold">Discover Itineraries</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/auth">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/auth?tab=signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main card – styled like a discover card, but full-width detail */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="overflow-hidden">
          {/* Hero image */}
          <div className="relative h-64 md:h-80">
            {event.image_url ? (
              <img
                src={event.image_url}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-orange-400 via-pink-400 to-purple-500 flex items-center justify-center">
                <span className="text-3xl font-bold text-white text-center px-6">
                  {event.title}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-center gap-2 mb-2">
                <ThemeIcon theme={event.theme || "default"} className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white">{event.title}</h2>
            </div>
          </div>

          {/* Content area */}
          <div className="p-6">
            {/* Host */}
            {event.organizer && (
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={event.organizer.avatar || undefined} />
                  <AvatarFallback className="text-sm">
                    {event.organizer.name?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <span className="text-sm font-medium">{event.organizer.name || "Anonymous"}</span>
                  {event.organizer.username && (
                    <span className="text-xs text-muted-foreground ml-1">{event.organizer.username}</span>
                  )}
                </div>
              </div>
            )}

            {/* Details row */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
              {event.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {event.location}
                </span>
              )}
              {event.date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {event.date}
                </span>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground pb-4 mb-4 border-b">
              <span className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                {event.like_count || 0}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {event.view_count || 0}
              </span>
            </div>

            {/* Description */}
            {description && (
              <p className="text-sm text-gray-700 leading-relaxed mb-6">{description}</p>
            )}

            {/* Activities preview */}
            {days.length > 0 && (
              <div className="space-y-4 mb-6">
                <h3 className="text-sm font-semibold text-gray-900">Itinerary</h3>
                {days.map((day: any, dayIdx: number) => (
                  <div key={dayIdx}>
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Day {day.day}{day.date ? ` - ${typeof day.date === "string" && day.date.length > 10 ? fmtDate(day.date) : day.date}` : ""}
                    </p>
                    <div className="space-y-2">
                      {(day.activities || []).map((act: any) => (
                        <div
                          key={act.id}
                          className="flex items-start gap-3 rounded-lg bg-gray-50 p-3"
                        >
                          <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{act.title}</p>
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-0.5">
                              {act.time && <span>{act.time}</span>}
                              {act.location && <span>- {act.location}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CTA */}
            <div className="rounded-lg bg-blue-50 border border-blue-100 p-4 text-center">
              <p className="text-sm text-blue-800 mb-3">
                Sign up for free to like, save, and create your own itineraries!
              </p>
              <div className="flex justify-center gap-3">
                <Button variant="outline" asChild>
                  <Link href="/auth">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth?tab=signup">Sign Up Free</Link>
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Back to discover */}
        <div className="text-center mt-6">
          <Button variant="ghost" asChild>
            <Link href="/discover?guest=true">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Discover
            </Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
