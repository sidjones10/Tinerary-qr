"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Search, Grid, List, Bookmark, Calendar, MapPin, Sparkles, Loader2 } from "lucide-react"

import { AppHeader } from "@/components/app-header"
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

  const handleUnsave = async (e: React.MouseEvent, itemId: string) => {
    e.preventDefault()
    e.stopPropagation()

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

  const getItineraryType = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    return daysDiff > 1 ? "Trip" : "Event"
  }

  const formatDate = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

    if (daysDiff === 1) {
      return start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    }

    return `${daysDiff} days`
  }

  const renderGridView = () => (
    <div className="insta-grid">
      {filteredItems.map((item) => {
        const itinerary = item.itineraries

        if (!itinerary) return null

        const itineraryType = getItineraryType(itinerary.start_date, itinerary.end_date)
        const profile = Array.isArray(itinerary.profiles) ? itinerary.profiles[0] : itinerary.profiles

        return (
          <Link key={item.id} href={`/event/${itinerary.id}`}>
            <div className="cute-card h-full group">
              {/* Image Section */}
              <div className="relative h-52 overflow-hidden">
                <Image
                  src={itinerary.image_url || "/placeholder.svg?height=400&width=600"}
                  alt={itinerary.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />

                {/* Overlay */}
                <div className="absolute inset-0 cute-card-overlay opacity-60" />

                {/* Type Badge */}
                <span className={`absolute top-3 left-3 ${itineraryType === "Trip" ? "cute-badge-trip" : "cute-badge-event"}`}>
                  {itineraryType}
                </span>

                {/* Unsave Button */}
                <button
                  className="cute-action-btn saved absolute top-3 right-3"
                  onClick={(e) => handleUnsave(e, item.id)}
                  aria-label="Unsave itinerary"
                >
                  <Bookmark className="h-4 w-4 text-violet-500 fill-violet-500 bookmark-icon-cute" />
                </button>

                {/* Title on image */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="font-semibold text-white text-lg line-clamp-1 drop-shadow-md">
                    {itinerary.title}
                  </h3>
                </div>
              </div>

              {/* Content Section */}
              <div className="p-4 bg-white dark:bg-card">
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-violet-400" />
                    <span className="line-clamp-1">{itinerary.location || "No location"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 text-pink-400" />
                  <span>{formatDate(itinerary.start_date, itinerary.end_date)}</span>
                </div>

                <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                  {itinerary.description || "No description available."}
                </p>

                {profile && (
                  <div className="mt-3 pt-3 border-t border-violet-100 dark:border-violet-900/20">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <span className="text-violet-400">by</span>
                      <span className="font-medium">{profile.name || profile.username || "Anonymous"}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )

  const renderListView = () => (
    <div className="space-y-4">
      {filteredItems.map((item) => {
        const itinerary = item.itineraries

        if (!itinerary) return null

        const itineraryType = getItineraryType(itinerary.start_date, itinerary.end_date)
        const profile = Array.isArray(itinerary.profiles) ? itinerary.profiles[0] : itinerary.profiles

        return (
          <Link key={item.id} href={`/event/${itinerary.id}`}>
            <div className="cute-card overflow-hidden group">
              <div className="flex flex-col sm:flex-row">
                <div className="relative h-48 sm:h-auto sm:w-48 flex-shrink-0 overflow-hidden">
                  <Image
                    src={itinerary.image_url || "/placeholder.svg?height=400&width=600"}
                    alt={itinerary.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <span className={`absolute bottom-2 left-2 ${itineraryType === "Trip" ? "cute-badge-trip" : "cute-badge-event"}`}>
                    {itineraryType}
                  </span>
                </div>

                <div className="flex-1 p-4 bg-white dark:bg-card">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-lg mb-2 cute-section-header">{itinerary.title}</h3>
                    <button
                      className="cute-action-btn saved"
                      onClick={(e) => handleUnsave(e, item.id)}
                      aria-label="Unsave itinerary"
                    >
                      <Bookmark className="h-4 w-4 text-violet-500 fill-violet-500 bookmark-icon-cute" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                    <MapPin className="h-3.5 w-3.5 text-violet-400" />
                    <span>{itinerary.location || "No location"}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                    <Calendar className="h-3.5 w-3.5 text-pink-400" />
                    <span>{formatDate(itinerary.start_date, itinerary.end_date)}</span>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {itinerary.description || "No description available."}
                  </p>

                  {profile && (
                    <div className="mt-3 pt-3 border-t border-violet-100 dark:border-violet-900/20">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className="text-violet-400">by</span>
                        <span className="font-medium">{profile.name || profile.username || "Anonymous"}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex-1 cute-section-bg">
        <div className="container px-4 py-6 md:py-10">
          {/* Cute Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-400 via-violet-500 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-200">
                    <Bookmark className="h-6 w-6 text-white fill-white bookmark-icon-cute" />
                  </div>
                  <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-violet-400 sparkle" />
                </div>
                <div>
                  <h1 className="cute-section-header">Saved</h1>
                  <p className="text-sm text-muted-foreground">Your collection</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {savedItems.length > 0 && (
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-50 to-pink-50 border border-violet-100">
                  <Bookmark className="h-4 w-4 text-violet-500 fill-violet-500" />
                  <span className="text-sm font-medium text-violet-600">{savedItems.length} saved</span>
                </div>
              )}

              {/* View Toggle */}
              <div className="cute-toggle-group">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`cute-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
                  aria-label="Grid view"
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`cute-toggle-btn ${viewMode === "list" ? "active" : ""}`}
                  aria-label="List view"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6 max-w-md">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-400" />
            <input
              type="text"
              placeholder="Search your saved items..."
              className="cute-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-100 to-pink-100 flex items-center justify-center mb-4">
                <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
              </div>
              <p className="text-muted-foreground">Loading your collection...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="cute-empty-state">
              <div className="cute-empty-icon relative">
                <Bookmark className="h-12 w-12 text-violet-400" />
                <Sparkles className="absolute top-0 right-2 h-5 w-5 text-pink-400 sparkle sparkle-delay-1" />
                <Sparkles className="absolute bottom-2 left-0 h-4 w-4 text-violet-400 sparkle sparkle-delay-2" />
                <Sparkles className="absolute top-4 -left-2 h-3 w-3 text-orange-400 sparkle sparkle-delay-3" />
              </div>
              <h2 className="text-xl font-semibold mb-2">
                {searchQuery ? "No matches found" : "No saved items yet"}
              </h2>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                {searchQuery
                  ? "Try a different search term"
                  : "Bookmark trips and events you want to revisit later"}
              </p>
              {!searchQuery && (
                <Link href="/" className="cute-cta-btn inline-flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Discover Itineraries
                </Link>
              )}
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
