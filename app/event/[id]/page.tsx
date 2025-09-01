"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase-client"
import { useAuth } from "@/providers/auth-provider"
import { Loader2 } from "lucide-react"
import { EventDetail } from "@/components/event-detail"
import { EventNotFound } from "@/components/event-not-found"
import { EventPrivate } from "@/components/event-private"

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
    console.log("Fetching event with ID:", id)

    // Check if we have a valid ID
    if (!id) {
      throw new Error("No ID provided")
    }

    // For testing or demo purposes, return mock data for numeric IDs
    if (!isNaN(Number(id)) && !isValidUUID(id)) {
      console.log("Using mock data for numeric ID:", id)
      return getMockEventData(id)
    }

    const supabase = createClient()

    // Fetch the itinerary
    const { data: itineraryData, error: itineraryError } = await supabase
      .from("itineraries")
      .select("*")
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

    console.log("Fetched itinerary data:", itineraryData)

    // Fetch activities for this itinerary
    const { data: activitiesData, error: activitiesError } = await supabase
      .from("activities")
      .select("*")
      .eq("itinerary_id", id)
      .order("start_time", { ascending: true })

    if (activitiesError) {
      console.error("Error fetching activities:", activitiesError)
    }

    console.log("Fetched activities:", activitiesData || [])

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

    // Format the data to match the expected structure
    return {
      id: itineraryData.id,
      title: itineraryData.title,
      type: isTrip ? "Trip" : "Event",
      image: itineraryData.cover_image_url || "/placeholder.svg?height=400&width=800",
      date: isTrip
        ? formatDateRange(itineraryData.start_date, itineraryData.end_date)
        : formatDate(itineraryData.start_date),
      location: itineraryData.location,
      organizer: {
        name: "Trip Creator", // We'll need to fetch user data in a real implementation
        username: "@creator",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      likes: 0, // Default value
      description: itineraryData.description,
      days: days,
      // Include other default properties needed by the UI
      expenses: {
        categories: [
          { name: "Accommodation", amount: 0, percentage: 0 },
          { name: "Transportation", amount: 0, percentage: 0 },
          { name: "Food & Dining", amount: 0, percentage: 0 },
          { name: "Activities", amount: 0, percentage: 0 },
        ],
        items: [],
        total: 0,
      },
      packingList: [],
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

// Update the EventDetailPage component to use async data fetching
export default function EventPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [event, setEvent] = useState<any>(null)
  const [activities, setActivities] = useState<any[]>([])
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

        const supabase = createClient()

        // Fetch the event
        const { data: eventData, error: eventError } = await supabase
          .from("itineraries")
          .select("*")
          .eq("id", id)
          .single()

        if (eventError) {
          if (eventError.code === "PGRST116") {
            setNotFound(true)
          } else {
            setError(eventError.message)
          }
          return
        }

        // Check if event is private and user is not the owner
        if (!eventData.is_public && (!user || user.id !== eventData.user_id)) {
          setIsPrivate(true)
          return
        }

        setEvent(eventData)

        // Fetch activities for this event
        const { data: activitiesData, error: activitiesError } = await supabase
          .from("activities")
          .select("*")
          .eq("itinerary_id", id)
          .order("start_time", { ascending: true })

        if (activitiesError) {
          console.error("Error fetching activities:", activitiesError)
        } else {
          setActivities(activitiesData || [])
        }
      } catch (err: any) {
        console.error("Error fetching event:", err)
        setError(err.message || "An error occurred while fetching the event")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchEvent()
    }
  }, [id, user])

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

  if (error) {
    return (
      <div className="container px-4 py-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
        </div>
      </div>
    )
  }

  return <EventDetail event={event} activities={activities} />
}
