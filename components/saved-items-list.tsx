"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"
import { Bookmark, Calendar, MapPin, Clock } from "lucide-react"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/providers/auth-provider"

interface SavedItemsListProps {
  limit?: number
}

interface SavedItem {
  id: string
  created_at: string
  itineraries: {
    id: string
    title: string
    description: string | null
    location: string | null
    start_date: string | null
    end_date: string | null
    image_url: string | null
    duration: string | null
    user_id: string
    profiles: {
      name: string | null
      username: string | null
      avatar_url: string | null
    } | null
  } | null
}

export function SavedItemsList({ limit = 20 }: SavedItemsListProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [items, setItems] = useState<SavedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  useEffect(() => {
    async function fetchSavedItems() {
      try {
        setLoading(true)

        if (!user?.id) {
          setError("You must be logged in to view saved items")
          setLoading(false)
          return
        }

        const supabase = createClient()

        const { data, error: fetchError } = await supabase
          .from("saved_itineraries")
          .select(`
            id,
            created_at,
            itineraries:itinerary_id (
              id,
              title,
              description,
              location,
              start_date,
              end_date,
              image_url,
              duration,
              user_id,
              profiles:user_id (
                name,
                username,
                avatar_url
              )
            )
          `)
          .eq("user_id", user.id)
          .eq("type", "save")
          .order("created_at", { ascending: false })
          .limit(limit)

        if (fetchError) {
          setError("Failed to load saved items")
          console.error(fetchError)
        } else {
          setItems(data || [])
        }
      } catch (err) {
        setError("An error occurred while loading saved items")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchSavedItems()
  }, [limit, user?.id])

  const handleItemClick = (item: any) => {
    if (item.itineraries) {
      router.push(`/event/${item.itineraries.id}`)
    }
  }

  const handleUnsave = async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation()

    try {
      const supabase = createClient()

      await supabase.from("saved_itineraries").delete().eq("id", itemId)

      // Update local state
      setItems((prev) => prev.filter((item) => item.id !== itemId))
    } catch (err) {
      console.error("Error removing saved item:", err)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="h-48 w-full" />
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-10">
        <Bookmark className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No saved itineraries yet</h3>
        <p className="text-muted-foreground">Itineraries you save will appear here for easy access.</p>
        <Button variant="default" className="mt-4" onClick={() => router.push("/")}>
          Discover Itineraries
        </Button>
      </div>
    )
  }

  return (
    <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"}>
      {items.map((item) => {
        const itinerary = item.itineraries

        if (!itinerary) return null

        const startDate = itinerary.start_date ? new Date(itinerary.start_date) : null
        const endDate = itinerary.end_date ? new Date(itinerary.end_date) : null
        const daysDiff = startDate && endDate
          ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
          : itinerary.duration || 1

        return (
          <Card
            key={item.id}
            className={`overflow-hidden cursor-pointer transition-all hover:shadow-md ${
              viewMode === "list" ? "flex flex-row" : ""
            }`}
            onClick={() => handleItemClick(item)}
          >
            <div className={viewMode === "list" ? "w-1/3 relative" : "relative"}>
              <Image
                src={itinerary.image_url || "/placeholder.svg?height=200&width=400"}
                alt={itinerary.title || "Saved itinerary"}
                width={400}
                height={200}
                className={`object-cover ${viewMode === "list" ? "h-full" : "h-48 w-full"}`}
              />
              <Badge variant="secondary" className="absolute top-2 right-2">
                Itinerary
              </Badge>
            </div>

            <div className={viewMode === "list" ? "flex-1" : ""}>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg line-clamp-1">{itinerary.title}</h3>

                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>Saved {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                </div>

                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {itinerary.description || "No description available."}
                </p>

                <div className="flex flex-wrap gap-2 mt-3">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>{daysDiff} {daysDiff === 1 ? "day" : "days"}</span>
                  </div>

                  <div className="flex items-center text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span>{itinerary.location || "Various locations"}</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-4 pt-0 flex justify-between">
                <Button variant="link" size="sm" className="px-0">
                  View Details
                </Button>

                <Button variant="ghost" size="sm" onClick={(e) => handleUnsave(e, item.id)}>
                  Unsave
                </Button>
              </CardFooter>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
