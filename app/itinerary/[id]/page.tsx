"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Calendar, Clock, MapPin, Share2, User } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

// Define types for our data
interface Activity {
  id: string
  title: string
  description: string | null
  location: string | null
  start_time: string
  end_time: string
}

interface Itinerary {
  id: string
  title: string
  description: string | null
  location: string | null
  start_date: string
  end_date: string
  is_public: boolean
  cover_image_url: string | null
  user_id: string
  created_at: string
}

export default function ItineraryPage() {
  const params = useParams()
  const id = params.id as string

  const [itinerary, setItinerary] = useState<Itinerary | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchItinerary() {
      try {
        setLoading(true)

        // Fetch the itinerary
        const { data: itineraryData, error: itineraryError } = await supabase
          .from("itineraries")
          .select("*")
          .eq("id", id)
          .single()

        if (itineraryError) {
          throw new Error(itineraryError.message)
        }

        if (!itineraryData) {
          throw new Error("Itinerary not found")
        }

        setItinerary(itineraryData)

        // Fetch activities for this itinerary
        const { data: activitiesData, error: activitiesError } = await supabase
          .from("activities")
          .select("*")
          .eq("itinerary_id", id)
          .order("start_time", { ascending: true })

        if (activitiesError) {
          console.error("Error fetching activities:", activitiesError)
          // Don't throw here, we can still show the itinerary without activities
        }

        setActivities(activitiesData || [])
      } catch (err) {
        console.error("Error fetching data:", err)
        setError(err instanceof Error ? err.message : "An unknown error occurred")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchItinerary()
    }
  }, [id])

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  // Format time for display
  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString)
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } catch (e) {
      return timeString // Return the original string if parsing fails
    }
  }

  if (loading) {
    return (
      <div className="container px-4 py-6 md:py-10">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
        <div className="max-w-3xl mx-auto">
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <Skeleton className="h-64 w-full mb-8 rounded-lg" />
          <Skeleton className="h-8 w-1/3 mb-4" />
          <Skeleton className="h-24 w-full mb-4" />
          <Skeleton className="h-24 w-full mb-4" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container px-4 py-6 md:py-10">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
        <div className="max-w-3xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Error Loading Itinerary</h1>
          <p className="mb-6">{error}</p>
          <Button asChild>
            <Link href="/">Return Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!itinerary) {
    return (
      <div className="container px-4 py-6 md:py-10">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
        <div className="max-w-3xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Itinerary Not Found</h1>
          <p className="mb-6">The itinerary you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <Link href="/">Return Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container px-4 py-6 md:py-10">
      <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Link>

      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{itinerary.title}</h1>
            <div className="flex items-center mt-2 text-muted-foreground">
              <Calendar className="h-4 w-4 mr-1" />
              <span className="text-sm">
                {formatDate(itinerary.start_date)}
                {itinerary.end_date &&
                  itinerary.end_date !== itinerary.start_date &&
                  ` - ${formatDate(itinerary.end_date)}`}
              </span>
            </div>
            {itinerary.location && (
              <div className="flex items-center mt-1 text-muted-foreground">
                <MapPin className="h-4 w-4 mr-1" />
                <span className="text-sm">{itinerary.location}</span>
              </div>
            )}
          </div>
          <Button variant="outline" size="sm" className="flex items-center">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>

        {itinerary.cover_image_url ? (
          <img
            src={itinerary.cover_image_url || "/placeholder.svg"}
            alt={itinerary.title}
            className="w-full h-64 object-cover rounded-lg mb-8"
          />
        ) : (
          <div className="w-full h-64 bg-gradient-to-r from-orange-100 to-pink-100 rounded-lg mb-8 flex items-center justify-center">
            <span className="text-lg text-muted-foreground">No cover image</span>
          </div>
        )}

        {itinerary.description && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-2">About</h2>
            <p className="text-gray-700 whitespace-pre-line">{itinerary.description}</p>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Activities</h2>
          {activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="p-4 border rounded-lg bg-white shadow-sm">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">{activity.title}</h3>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTime(activity.start_time)}
                    </div>
                  </div>
                  {activity.location && (
                    <div className="flex items-center mt-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3 mr-1" />
                      {activity.location}
                    </div>
                  )}
                  {activity.description && <p className="mt-2 text-sm text-gray-600">{activity.description}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No activities have been added yet.</p>
          )}
        </div>

        <div className="flex items-center justify-between pb-8 border-t pt-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <User className="h-4 w-4 mr-1" />
            <span>Created by {itinerary.user_id}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Created {new Date(itinerary.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  )
}
