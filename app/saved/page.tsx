"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Search, Grid, List, Bookmark, Calendar, MapPin, Users, Star } from "lucide-react"

import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { supabase } from "@/lib/supabase-client"

export default function SavedItemsPage() {
  const [viewMode, setViewMode] = useState("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [savedItems, setSavedItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSavedItems() {
      setLoading(true)

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          setSavedItems([])
          setLoading(false)
          return
        }

        // Query saved_itineraries with type = 'save'
        const { data, error } = await supabase
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
              user_id,
              profiles:user_id (
                name,
                username,
                avatar_url
              )
            )
          `)
          .eq("user_id", session.user.id)
          .eq("type", "save")
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Error fetching saved items:", error.message || "Unknown error")
          setSavedItems([])
        } else {
          setSavedItems(data || [])
        }
      } catch (error: any) {
        console.error("Error in saved items fetch:", error.message || error.toString())
        setSavedItems([])
      } finally {
        setLoading(false)
      }
    }

    fetchSavedItems()
  }, [])

  const getFilteredItems = () => {
    if (!searchQuery) return savedItems

    const query = searchQuery.toLowerCase()
    return savedItems.filter((item) => {
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

  const filteredItems = getFilteredItems()

  const handleUnsave = async (itemId) => {
    try {
      const { error } = await supabase.from("saved_itineraries").delete().eq("id", itemId)

      if (error) {
        console.error("Error removing saved item:", error.message || "Unknown error")
        return
      }

      // Update local state
      setSavedItems(savedItems.filter((item) => item.id !== itemId))
    } catch (error: any) {
      console.error("Error in unsave operation:", error.message || error.toString())
    }
  }

  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredItems.map((item) => {
        const itinerary = item.itineraries

        if (!itinerary) return null

        const startDate = new Date(itinerary.start_date)
        const endDate = new Date(itinerary.end_date)
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

        return (
          <Card key={item.id} className="overflow-hidden h-full flex flex-col">
            <div className="relative h-48">
              <Image
                src={itinerary.image_url || "/placeholder.svg?height=400&width=600"}
                alt={itinerary.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/30 hover:bg-black/50 text-white"
                onClick={() => handleUnsave(item.id)}
              >
                <Bookmark className="h-4 w-4 fill-current" />
                <span className="sr-only">Unsave</span>
              </Button>
              <Badge className="absolute bottom-2 left-2 bg-violet-500">
                {daysDiff > 1 ? "Trip" : "Event"}
              </Badge>
            </div>

            <CardContent className="flex-1 p-4">
              <h3 className="font-semibold text-lg mb-1 line-clamp-1">{itinerary.title}</h3>

              <div className="flex items-center text-sm text-muted-foreground mb-2">
                <MapPin className="h-3.5 w-3.5 mr-1" />
                <span className="line-clamp-1">{itinerary.location}</span>
              </div>

              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                <span>{daysDiff} {daysDiff === 1 ? "day" : "days"}</span>
              </div>

              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {itinerary.description || "No description available."}
              </p>
            </CardContent>

            <CardFooter className="p-4 pt-0">
              <Button asChild className="w-full">
                <Link href={`/event/${itinerary.id}`}>
                  View Details
                </Link>
              </Button>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )

  const renderListView = () => (
    <div className="space-y-4">
      {filteredItems.map((item) => {
        const itinerary = item.itineraries

        if (!itinerary) return null

        const startDate = new Date(itinerary.start_date)
        const endDate = new Date(itinerary.end_date)
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

        return (
          <Card key={item.id} className="overflow-hidden">
            <div className="flex flex-col sm:flex-row">
              <div className="relative h-48 sm:h-auto sm:w-48">
                <Image
                  src={itinerary.image_url || "/placeholder.svg?height=400&width=600"}
                  alt={itinerary.title}
                  fill
                  className="object-cover"
                />
                <Badge className="absolute bottom-2 left-2 bg-violet-500">
                  {daysDiff > 1 ? "Trip" : "Event"}
                </Badge>
              </div>

              <div className="flex-1 p-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg mb-1">{itinerary.title}</h3>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleUnsave(item.id)}>
                    <Bookmark className="h-4 w-4 fill-current" />
                    <span className="sr-only">Unsave</span>
                  </Button>
                </div>

                <div className="flex items-center text-sm text-muted-foreground mb-2">
                  <MapPin className="h-3.5 w-3.5 mr-1" />
                  <span>{itinerary.location}</span>
                </div>

                <div className="flex items-center text-sm text-muted-foreground mb-2">
                  <Calendar className="h-3.5 w-3.5 mr-1" />
                  <span>{daysDiff} {daysDiff === 1 ? "day" : "days"}</span>
                </div>

                <p className="text-sm text-muted-foreground mb-4">{itinerary.description || "No description available."}</p>

                <Button asChild>
                  <Link href={`/event/${itinerary.id}`}>
                    View Details
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex-1 bg-background">
        <div className="container px-4 py-6 md:py-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
              <h1 className="text-2xl font-bold">Saved Items</h1>
            </div>

            <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value)}>
              <ToggleGroupItem value="grid" aria-label="Grid view">
                <Grid className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search saved items..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading saved itineraries...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <Bookmark className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
              <h3 className="mt-4 text-lg font-medium">No saved itineraries</h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? "No saved itineraries match your search"
                  : "You haven't saved any itineraries yet"}
              </p>
              <Button
                className="mt-4 bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white border-0"
                asChild
              >
                <Link href="/">Discover Itineraries</Link>
              </Button>
            </div>
          ) : viewMode === "grid" ? (
            renderGridView()
          ) : (
            renderListView()
          )}
        </div>
      </main>
    </div>
  )
}
