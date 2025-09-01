"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"
import { Bookmark, Calendar, MapPin, Users, Star, Clock } from "lucide-react"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase-client"

interface SavedItemsListProps {
  type?: "itinerary" | "promotion"
  limit?: number
}

export function SavedItemsList({ type, limit = 20 }: SavedItemsListProps) {
  const router = useRouter()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  useEffect(() => {
    async function fetchSavedItems() {
      try {
        setLoading(true)

        const supabase = createClient()

        // Get user session
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) {
          router.push("/login?redirect=/saved")
          return
        }

        const userId = session.user.id

        let query = supabase
          .from("user_saved_items")
          .select(`
            *,
            itinerary:itinerary_id(*),
            promotion:promotion_id(*)
          `)
          .eq("user_id", userId)
          .order("created_at", { ascending: false })

        if (type) {
          query = query.eq("item_type", type)
        }

        if (limit) {
          query = query.limit(limit)
        }

        const { data, error: fetchError } = await query

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
  }, [type, limit, router])

  const handleItemClick = (item: any) => {
    if (item.item_type === "itinerary" && item.itinerary) {
      router.push(`/itinerary/${item.itinerary.id}`)
    } else if (item.item_type === "promotion" && item.promotion) {
      router.push(`/promotion/${item.promotion.id}`)
    }
  }

  const handleUnsave = async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation()

    try {
      const supabase = createClient()

      await supabase.from("user_saved_items").delete().eq("id", itemId)

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
        <h3 className="text-lg font-medium">No saved items yet</h3>
        <p className="text-muted-foreground">Items you save will appear here for easy access.</p>
        <Button variant="default" className="mt-4" onClick={() => router.push("/explore")}>
          Explore Itineraries
        </Button>
      </div>
    )
  }

  return (
    <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"}>
      {items.map((item) => {
        const isItinerary = item.item_type === "itinerary" && item.itinerary
        const isPromotion = item.item_type === "promotion" && item.promotion

        if (!isItinerary && !isPromotion) return null

        const data = isItinerary ? item.itinerary : item.promotion

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
                src={data.cover_image || "/placeholder.svg?height=200&width=400"}
                alt={data.title || "Saved item"}
                width={400}
                height={200}
                className={`object-cover ${viewMode === "list" ? "h-full" : "h-48 w-full"}`}
              />
              <Badge variant="secondary" className="absolute top-2 right-2 capitalize">
                {item.item_type}
              </Badge>
            </div>

            <div className={viewMode === "list" ? "flex-1" : ""}>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg line-clamp-1">{data.title}</h3>

                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>Saved {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                </div>

                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {data.description ||
                    (isItinerary
                      ? `An itinerary with ${data.activities?.length || 0} activities`
                      : `A promotion with ${data.discounted_price || 0} ${data.currency || "USD"}`)}
                </p>

                <div className="flex flex-wrap gap-2 mt-3">
                  {isItinerary && (
                    <>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{data.duration || 0} days</span>
                      </div>

                      <div className="flex items-center text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>{data.location || "Various locations"}</span>
                      </div>

                      {data.collaborators && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Users className="h-3 w-3 mr-1" />
                          <span>{data.collaborators.length} collaborators</span>
                        </div>
                      )}
                    </>
                  )}

                  {isPromotion && (
                    <>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>{data.location || "Various locations"}</span>
                      </div>

                      <div className="flex items-center text-xs text-muted-foreground">
                        <Star className="h-3 w-3 mr-1" />
                        <span>{data.rating || "4.5"} rating</span>
                      </div>

                      <Badge variant="outline" className="text-xs">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: data.currency || "USD",
                        }).format(data.discounted_price || 0)}
                      </Badge>
                    </>
                  )}
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
