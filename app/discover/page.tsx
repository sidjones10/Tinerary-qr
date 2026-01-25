"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  Heart,
  MessageCircle,
  Calendar,
  MapPin,
  ChevronRight,
  Search,
  Filter,
  Compass,
  TrendingUp,
  Sparkles,
  Zap,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { discoverItineraries, trackUserInteraction, type ItineraryWithScores } from "@/lib/discovery-algorithm"

export default function DiscoverPage() {
  const router = useRouter()
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState("for-you")
  const [itineraries, setItineraries] = useState<ItineraryWithScores[]>([])
  const [trendingItineraries, setTrendingItineraries] = useState<ItineraryWithScores[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [showSearch, setShowSearch] = useState(false)

  const categories = ["All", "Weekend Trips", "Beach", "Mountains", "City", "Food", "Adventure", "Relaxation"]

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUserId(user?.id || null)
    }

    fetchUser()
  }, [supabase])

  useEffect(() => {
    const fetchItineraries = async () => {
      setLoading(true)

      try {
        // Prepare filters
        const filters: any = {
          limit: 20,
        }

        if (searchQuery) {
          filters.searchQuery = searchQuery
        }

        if (selectedCategory !== "All") {
          filters.categories = [selectedCategory]
        }

        // Fetch personalized recommendations
        const forYouResults = await discoverItineraries(userId, filters)
        setItineraries(forYouResults)

        // Fetch trending itineraries
        const trendingResults = await discoverItineraries(userId, {
          ...filters,
          // Sort by trending score instead of personalized score
          sortBy: "trending_score",
        })
        setTrendingItineraries(trendingResults)
      } catch (error) {
        console.error("Error fetching itineraries:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchItineraries()
  }, [userId, searchQuery, selectedCategory])

  const handleCardClick = async (id: string) => {
    // Track the view interaction
    if (userId) {
      await trackUserInteraction(userId, id, "view")
    }

    // Navigate to the itinerary page
    router.push(`/event/${id}`)
  }

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleLike = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (userId) {
      await trackUserInteraction(userId, id, "like")

      // Update the UI optimistically
      setItineraries((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                metrics: {
                  ...item.metrics,
                  like_count: (item.metrics?.like_count || 0) + 1,
                },
              }
            : item,
        ),
      )
    } else {
      // Prompt to sign in
      router.push("/login")
    }
  }

  const handleSave = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (userId) {
      await trackUserInteraction(userId, id, "save")

      // Show feedback
      alert("Itinerary saved to your profile!")
    } else {
      // Prompt to sign in
      router.push("/login")
    }
  }

  const renderItineraryCard = (itinerary: ItineraryWithScores, index: number) => {
    const metrics = itinerary.metrics || {
      view_count: 0,
      like_count: 0,
      comment_count: 0,
    }

    // Determine badge type
    let badge = null
    if (itinerary.popularityScore > 0.8) {
      badge = "Popular"
    } else if (itinerary.freshnessScore > 0.9) {
      badge = "New"
    } else if (itinerary.relevanceScore > 0.9) {
      badge = "For You"
    }

    return (
      <Card
        key={itinerary.id}
        className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => handleCardClick(itinerary.id)}
      >
        <div className="relative h-48">
          <Image
            src={itinerary.image_url || "/placeholder.svg?height=300&width=500"}
            alt={itinerary.title}
            fill
            className="object-cover"
            loading="lazy"
          />
          {badge && (
            <Badge className="absolute top-2 left-2 bg-pink-500">
              {badge === "Popular" ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : badge === "New" ? (
                <Sparkles className="h-3 w-3 mr-1" />
              ) : (
                <Zap className="h-3 w-3 mr-1" />
              )}
              {badge}
            </Badge>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
            <h3 className="text-white font-bold text-lg">{itinerary.title}</h3>
            <div className="flex flex-wrap items-center gap-y-1 gap-x-3 mt-1">
              {itinerary.start_date && itinerary.end_date && (
                <div className="flex items-center text-white/90 text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>
                    {new Date(itinerary.start_date).toLocaleDateString()} -
                    {new Date(itinerary.end_date).toLocaleDateString()}
                  </span>
                </div>
              )}
              {itinerary.location && (
                <div className="flex items-center text-white/90 text-xs">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span>{itinerary.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Avatar className="h-6 w-6">
                <AvatarImage
                  src={itinerary.creator?.avatar_url || "/placeholder.svg?height=40&width=40"}
                  alt={itinerary.creator?.name || "User"}
                />
                <AvatarFallback>{(itinerary.creator?.name || "U").charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-xs ml-2">{itinerary.creator?.name || "User"}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                className="flex items-center text-xs text-muted-foreground hover:text-pink-500 transition-colors"
                onClick={(e) => handleLike(e, itinerary.id)}
              >
                <Heart className="h-3 w-3 mr-1" />
                {metrics.like_count || 0}
              </button>
              <div className="flex items-center text-xs text-muted-foreground">
                <MessageCircle className="h-3 w-3 mr-1" />
                {metrics.comment_count || 0}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => e.stopPropagation()}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="19" cy="12" r="1" />
                      <circle cx="5" cy="12" r="1" />
                    </svg>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => handleSave(e, itinerary.id)}>Save</DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      // Share functionality
                      navigator
                        .share?.({
                          title: itinerary.title,
                          text: `Check out this itinerary: ${itinerary.title}`,
                          url: `${window.location.origin}/trip/${itinerary.id}`,
                        })
                        .catch(console.error)
                    }}
                  >
                    Share
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="min-h-screen bg-gradient-to-b from-orange-50 to-pink-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="container px-4 py-3 max-w-md mx-auto">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 text-transparent bg-clip-text">
              Discover
            </h1>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-gray-500" onClick={() => setShowSearch(!showSearch)}>
                <Search className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-500">
                <Filter className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {showSearch && (
            <div className="mt-3">
              <Input
                placeholder="Search itineraries..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full"
              />
            </div>
          )}

          <div className="mt-3">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="for-you">For You</TabsTrigger>
              <TabsTrigger value="trending">Trending</TabsTrigger>
            </TabsList>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container px-4 py-4 max-w-md mx-auto">
        <TabsContent value="for-you" className="mt-0 space-y-4">
          {/* Categories */}
          <ScrollArea className="w-full whitespace-nowrap pb-2">
            <div className="flex gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={category === selectedCategory ? "default" : "outline"}
                  size="sm"
                  className={category === selectedCategory ? "bg-pink-500 hover:bg-pink-600" : ""}
                  onClick={() => handleCategoryClick(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </ScrollArea>

          {/* Trip Cards */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
              </div>
            ) : itineraries.length > 0 ? (
              itineraries.map((itinerary, index) => renderItineraryCard(itinerary, index))
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No itineraries found</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery("")
                    setSelectedCategory("All")
                  }}
                >
                  Clear filters
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="trending" className="mt-0 space-y-4">
          {/* Featured Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold flex items-center">
                <Zap className="h-4 w-4 text-yellow-500 mr-1" />
                Featured This Week
              </h2>
              <Button variant="link" size="sm" className="text-pink-500 p-0">
                See all
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-pink-500" />
              </div>
            ) : trendingItineraries.length > 0 ? (
              renderItineraryCard(trendingItineraries[0], 0)
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No featured itineraries</p>
              </Card>
            )}
          </div>

          {/* Trending Categories */}
          <div>
            <h2 className="font-semibold mb-2 flex items-center">
              <Compass className="h-4 w-4 text-blue-500 mr-1" />
              Trending Categories
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {["Beach Getaways", "Mountain Retreats", "City Breaks", "Food Tours"].map((category) => (
                <Button
                  key={category}
                  variant="outline"
                  className="h-auto py-3 justify-start"
                  onClick={() => {
                    setSelectedCategory(category.split(" ")[0])
                    setActiveTab("for-you")
                  }}
                >
                  {category}
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </Button>
              ))}
            </div>
          </div>

          {/* Trending Trips */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold flex items-center">
                <TrendingUp className="h-4 w-4 text-pink-500 mr-1" />
                Trending Now
              </h2>
              <Button variant="link" size="sm" className="text-pink-500 p-0">
                See all
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-pink-500" />
              </div>
            ) : trendingItineraries.length > 1 ? (
              <div className="space-y-3">
                {trendingItineraries.slice(1, 3).map((itinerary, index) => (
                  <Card
                    key={itinerary.id}
                    className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleCardClick(itinerary.id)}
                  >
                    <div className="flex h-24">
                      <div className="w-1/3 relative">
                        <Image
                          src={itinerary.image_url || "/placeholder.svg?height=300&width=500"}
                          alt={itinerary.title}
                          fill
                          className="object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="w-2/3 p-3 flex flex-col justify-between">
                        <div>
                          <h3 className="font-semibold">{itinerary.title}</h3>
                          {itinerary.start_date && (
                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                              <Calendar className="h-3 w-3 mr-1" />
                              <span>{new Date(itinerary.start_date).toLocaleDateString()}</span>
                            </div>
                          )}
                          {itinerary.location && (
                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span>{itinerary.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No trending itineraries</p>
              </div>
            )}
          </div>
        </TabsContent>
      </div>
    </Tabs>
  )
}
