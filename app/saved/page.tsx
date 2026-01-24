"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Search, Grid, List, Bookmark, Calendar, MapPin, Users, Star, Sparkles, Heart, Eye, TrendingUp, Filter } from "lucide-react"

import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabase-client"

export default function SavedItemsPage() {
  const [viewMode, setViewMode] = useState("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [savedItems, setSavedItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState("recent") // recent, title, date

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
              ),
              itinerary_metrics (
                like_count,
                save_count,
                view_count
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

  const getFilteredAndSortedItems = () => {
    let items = savedItems

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
    }

    return items
  }

  const filteredItems = getFilteredAndSortedItems()

  const handleUnsave = async (itemId) => {
    try {
      const { error } = await supabase.from("saved_itineraries").delete().eq("id", itemId)

      if (error) {
        console.error("Error removing saved item:", error.message || "Unknown error")
        return
      }

      // Update local state with animation
      setSavedItems(savedItems.filter((item) => item.id !== itemId))
    } catch (error: any) {
      console.error("Error in unsave operation:", error.message || error.toString())
    }
  }

  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredItems.map((item, index) => {
        const itinerary = item.itineraries

        if (!itinerary) return null

        const startDate = new Date(itinerary.start_date)
        const endDate = new Date(itinerary.end_date)
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
        const isTrip = daysDiff > 1

        const profile = Array.isArray(itinerary.profiles) ? itinerary.profiles[0] : itinerary.profiles
        const metrics = Array.isArray(itinerary.itinerary_metrics)
          ? itinerary.itinerary_metrics[0]
          : itinerary.itinerary_metrics

        return (
          <div
            key={item.id}
            className="group animate-in fade-in slide-in-from-bottom-4"
            style={{ animationDelay: `${index * 50}ms`, animationFillMode: "backwards" }}
          >
            <Card className="overflow-hidden h-full flex flex-col hover:shadow-2xl transition-all duration-300 border-2 hover:border-orange-200 hover:-translate-y-1">
              <Link href={`/event/${itinerary.id}`} className="block">
                <div className="relative h-52 overflow-hidden">
                  {itinerary.image_url ? (
                    <Image
                      src={itinerary.image_url}
                      alt={itinerary.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-400 via-pink-400 to-purple-500 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
                      <span className="text-5xl font-bold text-white drop-shadow-lg z-10">
                        {itinerary.title?.[0] || "?"}
                      </span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/90 backdrop-blur-md hover:bg-white shadow-lg transition-all hover:scale-110"
                    onClick={(e) => {
                      e.preventDefault()
                      handleUnsave(item.id)
                    }}
                  >
                    <Bookmark className="h-4 w-4 fill-orange-500 text-orange-500" />
                    <span className="sr-only">Unsave</span>
                  </Button>

                  <Badge
                    className={`absolute bottom-3 left-3 ${
                      isTrip
                        ? "bg-gradient-to-r from-blue-500 to-cyan-400"
                        : "bg-gradient-to-r from-purple-500 to-pink-400"
                    } border-0 text-white font-semibold shadow-lg`}
                  >
                    {isTrip ? "Trip" : "Event"}
                  </Badge>
                </div>
              </Link>

              <CardContent className="flex-1 p-5">
                <Link href={`/event/${itinerary.id}`}>
                  <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
                    {itinerary.title}
                  </h3>

                  <div className="flex items-center text-sm text-muted-foreground mb-2">
                    <MapPin className="h-4 w-4 mr-1.5 text-orange-500 flex-shrink-0" />
                    <span className="line-clamp-1">{itinerary.location}</span>
                  </div>

                  <div className="flex items-center text-sm text-muted-foreground mb-3">
                    <Calendar className="h-4 w-4 mr-1.5 text-purple-500 flex-shrink-0" />
                    <span>
                      {daysDiff} {daysDiff === 1 ? "day" : "days"} • {startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>

                  {itinerary.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                      {itinerary.description}
                    </p>
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
                        <AvatarFallback className="text-xs bg-gradient-to-br from-orange-200 to-pink-200">
                          {profile.name?.[0] || profile.username?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">
                        by {profile.name || profile.username || "Anonymous"}
                      </span>
                    </div>
                  )}
                </Link>
              </CardContent>
            </Card>
          </div>
        )
      })}
    </div>
  )

  const renderListView = () => (
    <div className="space-y-4">
      {filteredItems.map((item, index) => {
        const itinerary = item.itineraries

        if (!itinerary) return null

        const startDate = new Date(itinerary.start_date)
        const endDate = new Date(itinerary.end_date)
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
        const isTrip = daysDiff > 1

        const profile = Array.isArray(itinerary.profiles) ? itinerary.profiles[0] : itinerary.profiles
        const metrics = Array.isArray(itinerary.itinerary_metrics)
          ? itinerary.itinerary_metrics[0]
          : itinerary.itinerary_metrics

        return (
          <div
            key={item.id}
            className="animate-in fade-in slide-in-from-left-4"
            style={{ animationDelay: `${index * 30}ms`, animationFillMode: "backwards" }}
          >
            <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-2 hover:border-orange-200">
              <div className="flex flex-col sm:flex-row">
                <Link href={`/event/${itinerary.id}`} className="relative h-56 sm:h-auto sm:w-72 flex-shrink-0">
                  {itinerary.image_url ? (
                    <Image
                      src={itinerary.image_url}
                      alt={itinerary.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-400 via-pink-400 to-purple-500 flex items-center justify-center">
                      <span className="text-5xl font-bold text-white">{itinerary.title?.[0] || "?"}</span>
                    </div>
                  )}
                  <Badge
                    className={`absolute bottom-3 left-3 ${
                      isTrip
                        ? "bg-gradient-to-r from-blue-500 to-cyan-400"
                        : "bg-gradient-to-r from-purple-500 to-pink-400"
                    } border-0 text-white font-semibold`}
                  >
                    {isTrip ? "Trip" : "Event"}
                  </Badge>
                </Link>

                <div className="flex-1 p-6">
                  <div className="flex justify-between items-start mb-3">
                    <Link href={`/event/${itinerary.id}`}>
                      <h3 className="font-bold text-xl mb-1 group-hover:text-orange-600 transition-colors">
                        {itinerary.title}
                      </h3>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full hover:bg-orange-50 transition-all hover:scale-110"
                      onClick={() => handleUnsave(item.id)}
                    >
                      <Bookmark className="h-4 w-4 fill-orange-500 text-orange-500" />
                      <span className="sr-only">Unsave</span>
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-orange-500" />
                      <span>{itinerary.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-purple-500" />
                      <span>
                        {daysDiff} {daysDiff === 1 ? "day" : "days"}
                      </span>
                    </div>
                  </div>

                  {itinerary.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{itinerary.description}</p>
                  )}

                  <div className="flex items-center justify-between">
                    {/* Metrics */}
                    {metrics && (
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Heart className="h-4 w-4 text-red-400" />
                          <span>{metrics.like_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Eye className="h-4 w-4 text-blue-400" />
                          <span>{metrics.view_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Bookmark className="h-4 w-4 text-orange-400" />
                          <span>{metrics.save_count || 0}</span>
                        </div>
                      </div>
                    )}

                    {/* Creator */}
                    {profile && (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={profile.avatar_url} alt={profile.name} />
                          <AvatarFallback className="text-xs bg-gradient-to-br from-orange-200 to-pink-200">
                            {profile.name?.[0] || profile.username?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">
                          {profile.name || profile.username || "Anonymous"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-orange-50/30 via-white to-pink-50/30">
      <AppHeader />

      <main className="flex-1">
        <div className="container px-4 py-6 md:py-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                  <Bookmark className="h-8 w-8 text-orange-500 fill-orange-500" />
                  Saved Collection
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {savedItems.length} {savedItems.length === 1 ? "item" : "items"} saved for later
                </p>
              </div>
            </div>

            <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value)}>
              <ToggleGroupItem value="grid" aria-label="Grid view" className="data-[state=on]:bg-orange-100 data-[state=on]:text-orange-600">
                <Grid className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view" className="data-[state=on]:bg-orange-100 data-[state=on]:text-orange-600">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Search and Sort */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search your saved items..."
                className="pl-10 border-2 focus:border-orange-300 transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border-2 rounded-md bg-white hover:border-orange-300 transition-colors cursor-pointer"
              >
                <option value="recent">Recently Saved</option>
                <option value="title">Title A-Z</option>
                <option value="date">By Date</option>
              </select>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="text-center py-20">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
                <Sparkles className="absolute inset-0 m-auto h-8 w-8 text-orange-500 animate-pulse" />
              </div>
              <p className="text-lg text-muted-foreground">Loading your saved collection...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-20">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-100 to-pink-100 rounded-full"></div>
                <Bookmark className="absolute inset-0 m-auto h-12 w-12 text-orange-400 opacity-60" />
              </div>
              <h3 className="text-2xl font-bold mb-2">
                {searchQuery ? "No matches found" : "No saved itineraries yet"}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {searchQuery
                  ? "Try adjusting your search terms or explore new itineraries"
                  : "Start exploring amazing trips and save your favorites for later"}
              </p>
              <Button
                className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white border-0 shadow-lg"
                asChild
              >
                <Link href="/app">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Discover Itineraries
                </Link>
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
