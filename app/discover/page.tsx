"use client"

import { useEffect } from "react"
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
  ChevronDown,
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
import { Loader2 } from "lucide-react"

export default function DiscoverRedirectPage() {
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
  const [likedItineraries, setLikedItineraries] = useState<Set<string>>(new Set())
  const [showScrollPrompt, setShowScrollPrompt] = useState(false)
  const [scrollPromptTimer, setScrollPromptTimer] = useState<NodeJS.Timeout | null>(null)

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

  // Fetch user's liked itineraries
  useEffect(() => {
    const fetchLikedItineraries = async () => {
      if (!userId) return

      try {
        const { data, error } = await supabase
          .from("saved_itineraries")
          .select("itinerary_id")
          .eq("user_id", userId)
          .eq("type", "like")

        if (error) throw error

        if (data) {
          setLikedItineraries(new Set(data.map((item) => item.itinerary_id)))
        }
      } catch (error) {
        console.error("Error fetching liked itineraries:", error)
      }
    }

    fetchLikedItineraries()
  }, [userId, supabase])

  // Scroll prompt logic (TikTok-style)
  useEffect(() => {
    // Check if user has seen the prompt today
    const lastPromptDate = localStorage.getItem("discoverScrollPromptDate")
    const today = new Date().toDateString()

    if (lastPromptDate !== today) {
      // Show prompt after 5 seconds if user is still on first item
      const timer = setTimeout(() => {
        setShowScrollPrompt(true)
        // Hide after 3 seconds
        setTimeout(() => setShowScrollPrompt(false), 3000)
      }, 5000)

      setScrollPromptTimer(timer)

      // Mark as shown for today
      localStorage.setItem("discoverScrollPromptDate", today)
    }

    return () => {
      if (scrollPromptTimer) {
        clearTimeout(scrollPromptTimer)
      }
    }
  }, [])

  // Hide scroll prompt when user scrolls
  useEffect(() => {
    const handleScroll = () => {
      if (showScrollPrompt) {
        setShowScrollPrompt(false)
      }
      if (scrollPromptTimer) {
        clearTimeout(scrollPromptTimer)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [showScrollPrompt, scrollPromptTimer])

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
      try {
        // Use toggle_like RPC function to properly like/unlike
        const { data, error } = await supabase.rpc('toggle_like', {
          user_uuid: userId,
          itinerary_uuid: id
        })

        if (error) throw error

        // Update the UI with the actual like count from the database
        if (data && data.length > 0) {
          const result = data[0]

          // Update liked itineraries set
          setLikedItineraries((prev) => {
            const newSet = new Set(prev)
            if (result.is_liked) {
              newSet.add(id)
            } else {
              newSet.delete(id)
            }
            return newSet
          })

          setItineraries((prev) =>
            prev.map((item) =>
              item.id === id
                ? {
                    ...item,
                    metrics: {
                      ...item.metrics,
                      like_count: result.new_like_count,
                    },
                  }
                : item,
            ),
          )

          // Also update trending itineraries if this item is there
          setTrendingItineraries((prev) =>
            prev.map((item) =>
              item.id === id
                ? {
                    ...item,
                    metrics: {
                      ...item.metrics,
                      like_count: result.new_like_count,
                    },
                  }
                : item,
            ),
          )

          // Track interaction for analytics
          if (result.is_liked) {
            await trackUserInteraction(userId, id, "like")
          }
        }
      } catch (error) {
        console.error("Error toggling like:", error)
      }
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

    // Determine if it's a trip or event
    const isTrip = itinerary.start_date && itinerary.end_date && itinerary.start_date !== itinerary.end_date
    const itineraryType = isTrip ? "Trip" : "Event"

    // Check if user has liked this itinerary
    const isLiked = likedItineraries.has(itinerary.id)

    // Generate a default cover image based on location or category
    const getDefaultCoverImage = () => {
      const location = itinerary.location?.toLowerCase() || ""
      const categories = itinerary.itinerary_categories || []

      if (location.includes("beach") || categories.some((c: any) => c.category?.name?.toLowerCase().includes("beach"))) {
        return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop"
      } else if (location.includes("mountain") || categories.some((c: any) => c.category?.name?.toLowerCase().includes("mountain"))) {
        return "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop"
      } else if (location.includes("city") || categories.some((c: any) => c.category?.name?.toLowerCase().includes("city"))) {
        return "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&h=600&fit=crop"
      } else if (categories.some((c: any) => c.category?.name?.toLowerCase().includes("food"))) {
        return "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop"
      }
      // Default travel image
      return "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop"
    }

    return (
      <Card
        key={itinerary.id}
        className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => handleCardClick(itinerary.id)}
      >
        <div className="relative h-48">
          <Image
            src={itinerary.image_url || getDefaultCoverImage()}
            alt={itinerary.title}
            fill
            className="object-cover"
            loading="lazy"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-white font-bold text-lg flex-1">{itinerary.title}</h3>
              <Badge variant="secondary" className="bg-white/90 text-black text-xs shrink-0">
                {itineraryType}
              </Badge>
            </div>
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
            <div
              className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
              onClick={(e) => {
                e.stopPropagation()
                if (itinerary.user_id) {
                  router.push(`/user/${itinerary.user_id}`)
                }
              }}
            >
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
                className={`flex items-center text-xs transition-colors ${
                  isLiked ? "text-pink-500" : "text-muted-foreground hover:text-pink-500"
                }`}
                onClick={(e) => handleLike(e, itinerary.id)}
              >
                <Heart className={`h-3 w-3 mr-1 ${isLiked ? "fill-pink-500" : ""}`} />
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
        <div className="container px-4 py-3 max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-6xl mx-auto">
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
      <div className="container px-4 py-4 max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-6xl mx-auto relative">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
              </div>
            ) : itineraries.length > 0 ? (
              itineraries.map((itinerary, index) => renderItineraryCard(itinerary, index))
            ) : (
              <div className="col-span-full text-center py-12">
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
                {trendingItineraries.slice(1, 3).map((itinerary, index) => {
                  const getDefaultCoverImage = () => {
                    const location = itinerary.location?.toLowerCase() || ""
                    const categories = itinerary.itinerary_categories || []

                    if (location.includes("beach") || categories.some((c: any) => c.category?.name?.toLowerCase().includes("beach"))) {
                      return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop"
                    } else if (location.includes("mountain") || categories.some((c: any) => c.category?.name?.toLowerCase().includes("mountain"))) {
                      return "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop"
                    } else if (location.includes("city") || categories.some((c: any) => c.category?.name?.toLowerCase().includes("city"))) {
                      return "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&h=600&fit=crop"
                    } else if (categories.some((c: any) => c.category?.name?.toLowerCase().includes("food"))) {
                      return "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop"
                    }
                    return "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop"
                  }

                  return (
                    <Card
                      key={itinerary.id}
                      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleCardClick(itinerary.id)}
                    >
                      <div className="flex h-24">
                        <div className="w-1/3 relative">
                          <Image
                            src={itinerary.image_url || getDefaultCoverImage()}
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
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No trending itineraries</p>
              </div>
            )}
          </div>
        </TabsContent>
      </div>

      {/* Scroll Prompt (TikTok-style) */}
      {showScrollPrompt && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-black/70 text-white px-4 py-2 rounded-full flex items-center gap-2">
            <span className="text-sm">Scroll for more</span>
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
      )}
    </Tabs>
    // Redirect to the main page which has the discovery feed
    router.replace("/")
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}
