"use client"

import { useState, useRef, useEffect } from "react"
import { Bookmark, Calendar, Heart, MapPin, MessageCircle, Share2, Star, Sparkles } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getTrendingItineraries, recordInteraction } from "@/lib/feed-service"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/providers/auth-provider"
import { useToast } from "@/components/ui/use-toast"
import { ShareDialog } from "@/components/share-dialog"
import { InlineComments } from "@/components/inline-comments"
import { FeedItemSkeleton } from "@/components/skeleton-screens"
import Link from "next/link"
import confetti from "canvas-confetti"

interface DiscoveryItem {
  id: string
  title: string
  description: string | null
  destination: string | null
  is_public: boolean
  user_id: string
  image_url?: string | null
  owner?: {
    name: string | null
    avatar_url: string | null
    username: string | null
  }
  metrics?: {
    view_count: number
    save_count: number
    trending_score: number
  }
  categories?: {
    category: string
  }[]
  [key: string]: unknown
}

export function DiscoveryFeed() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [discoveryItems, setDiscoveryItems] = useState<DiscoveryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set())
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set())
  const [commentsOpenFor, setCommentsOpenFor] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [lastTap, setLastTap] = useState<number>(0)
  const [showHeartAnimation, setShowHeartAnimation] = useState(false)
  const [showScrollPrompt, setShowScrollPrompt] = useState(false)
  const [hasScrolled, setHasScrolled] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  // Prevent hydration errors
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch discovery feed and saved items
  const fetchDiscovery = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const result = await getTrendingItineraries(user?.id || null, 30)
      if (result.success && result.items) {
        setDiscoveryItems(result.items)

        // Show success toast on refresh
        if (isRefresh) {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.4 },
            colors: ['#F97316', '#EC4899'],
          })
          toast({
            title: "Feed refreshed!",
            description: `Found ${result.items.length} amazing trips`,
          })
        }
      }

      // Fetch user's saved items to show correct state
      if (user?.id) {
        const supabase = createClient()
        const { data: savedData } = await supabase
          .from("saved_itineraries")
          .select("itinerary_id, type")
          .eq("user_id", user.id)

        if (savedData) {
          const savedIds = new Set(savedData.filter(s => s.type === 'save').map((s) => s.itinerary_id))
          const likedIds = new Set(savedData.filter(s => s.type === 'like').map((s) => s.itinerary_id))
          setSavedItems(savedIds)
          setLikedItems(likedIds)
        }
      }
    } catch (error) {
      console.error("Error fetching discovery:", error)
      toast({
        title: "Couldn't load feed",
        description: "Pull down to try again",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDiscovery()
  }, [user?.id])

  // Record view when scrolling to a new item
  useEffect(() => {
    if (user?.id && discoveryItems[currentIndex]) {
      recordInteraction(user.id, discoveryItems[currentIndex].id, "view")
    }
  }, [currentIndex, user?.id, discoveryItems])

  // Handle like action
  const handleLike = async (itemId: string) => {
    if (!user?.id) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to like itineraries",
        variant: "destructive",
      })
      return
    }

    try {
      const supabase = createClient()
      const isCurrentlyLiked = likedItems.has(itemId)
      const newLiked = new Set(likedItems)

      if (isCurrentlyLiked) {
        // Unlike: Remove from saved_itineraries
        const { error } = await supabase
          .from("saved_itineraries")
          .delete()
          .eq("user_id", user.id)
          .eq("itinerary_id", itemId)
          .eq("type", "like")

        if (error) {
          console.error("Error unliking:", error)
          throw error
        }

        newLiked.delete(itemId)
      } else {
        // Like: Add to saved_itineraries
        const { error } = await supabase
          .from("saved_itineraries")
          .insert({
            user_id: user.id,
            itinerary_id: itemId,
            type: "like",
            created_at: new Date().toISOString(),
          })

        if (error) {
          // Check if already liked (duplicate)
          if (error.code === "23505") {
            newLiked.add(itemId)
            setLikedItems(newLiked)
            return
          }
          console.error("Error liking:", error)
          throw error
        }

        newLiked.add(itemId)
        // Record interaction for analytics
        await recordInteraction(user.id, itemId, "like")
      }

      setLikedItems(newLiked)
    } catch (error) {
      console.error("Error toggling like:", error)
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive",
      })
    }
  }

  // Handle save action
  const handleSave = async (itemId: string) => {
    if (!user?.id) return

    const newSaved = new Set(savedItems)
    const wasSaved = savedItems.has(itemId)

    if (wasSaved) {
      newSaved.delete(itemId)
      // Remove save from database
      try {
        const supabase = createClient()
        await supabase
          .from("saved_itineraries")
          .delete()
          .eq("user_id", user.id)
          .eq("itinerary_id", itemId)
          .eq("type", "save")
      } catch (error) {
        console.warn("Could not remove save from database:", error)
      }
    } else {
      newSaved.add(itemId)
      // Record interaction and save to database
      await recordInteraction(user.id, itemId, "save")

      // Save to saved_itineraries table with type = 'save'
      try {
        const supabase = createClient()
        await supabase.from("saved_itineraries").insert({
          user_id: user.id,
          itinerary_id: itemId,
          type: "save",
          created_at: new Date().toISOString(),
        })
      } catch (error) {
        console.warn("Could not save to database:", error)
      }
    }
    setSavedItems(newSaved)
  }

  // Pull-to-refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return

    const currentTouch = e.touches[0].clientY
    const diff = currentTouch - touchStart

    // If scrolled to top and pulling down
    if (scrollRef.current && scrollRef.current.scrollTop === 0 && diff > 80) {
      // Trigger refresh
      if (!refreshing) {
        fetchDiscovery(true)
        setTouchStart(null)
      }
    }
  }

  const handleTouchEnd = () => {
    setTouchStart(null)
  }

  // Double-tap to like (TikTok-style)
  const handleDoubleTap = (e: React.MouseEvent | React.TouchEvent, itemId: string) => {
    const currentTime = new Date().getTime()
    const tapLength = currentTime - lastTap

    if (tapLength < 300 && tapLength > 0) {
      // Double tap detected!
      if (!likedItems.has(itemId)) {
        handleLike(itemId)

        // Show heart animation
        setShowHeartAnimation(true)
        confetti({
          particleCount: 20,
          spread: 40,
          origin: { y: 0.6 },
          colors: ['#EC4899', '#F43F5E'],
        })
        setTimeout(() => setShowHeartAnimation(false), 1000)
      }
    }

    setLastTap(currentTime)
  }

  // Format sample data for display
  const formatDiscoveryItem = (item: any) => {
    const startDate = new Date(item.start_date)
    const endDate = new Date(item.end_date)

    // Determine if it's an Event or Trip
    // Same day = Event, multi-day = Trip
    const isTrip = startDate.toDateString() !== endDate.toDateString()

    let dateStr = ""
    if (!isTrip) {
      // Event (single day)
      dateStr = startDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      })
    } else {
      // Trip (multi-day)
      dateStr = `${startDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
      })} - ${endDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      })}`
    }

    // Metrics comes as an array from Supabase join, so we need to access the first element
    const metrics = Array.isArray(item.metrics) && item.metrics.length > 0 ? item.metrics[0] : null

    // Generate a gradient background if no image is provided
    const getDefaultBackground = (id: string, title: string) => {
      const gradients = [
        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
        "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
        "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
        "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
        "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
        "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
        "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
      ]
      // Use hash of id to pick a consistent gradient
      const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      return gradients[hash % gradients.length]
    }

    return {
      id: item.id,
      title: item.title,
      type: isTrip ? "trip" : "event",
      date: dateStr,
      image: item.image_url || null,
      defaultBackground: !item.image_url ? getDefaultBackground(item.id, item.title) : null,
      location: item.location || "Somewhere amazing",
      likes: metrics?.like_count || 0,
      comments: metrics?.comment_count || 0,
      saves: metrics?.save_count || 0,
      views: metrics?.view_count || 0,
      description: item.description || "",
      user: {
        name: item.owner?.name || "Travel Enthusiast",
        username: `@${item.owner?.username || "traveler"}`,
        avatar: item.owner?.avatar_url || "/placeholder.svg?height=40&width=40",
      },
      highlights: item.highlights || [],
      promoted: false,
    }
  }

  // Prevent hydration errors by not rendering until mounted
  if (!mounted || loading) {
    return <FeedItemSkeleton />
  }

  if (discoveryItems.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-b from-orange-50 to-pink-50 rounded-xl">
        <div className="text-center">
          <MapPin className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No trips to discover yet</h3>
          <p className="text-gray-500">Check back soon for amazing adventures!</p>
        </div>
      </div>
    )
  }

  const formattedItems = discoveryItems.map(formatDiscoveryItem)

  // Sample data - keeping this as fallback
  const fallbackItems = [
    {
      id: "1",
      title: "Weekend in NYC",
      type: "trip",
      date: "Mar 15-17, 2025",
      image: "/placeholder.svg?height=600&width=400",
      location: "New York, NY",
      likes: 2453,
      comments: 128,
      saves: 342,
      description:
        "The perfect 3-day NYC itinerary! Includes all the must-see spots, best restaurants, and hidden gems.",
      user: {
        name: "Alex Rodriguez",
        username: "@alexr",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      highlights: ["The Met Museum", "Central Park", "Broadway Show", "Brooklyn Bridge"],
      promoted: false,
    },
    {
      id: "2",
      title: "Sunset Rooftop Bar",
      type: "business",
      date: "Open Daily 4PM-2AM",
      image: "/placeholder.svg?height=600&width=400",
      location: "Downtown LA",
      likes: 3842,
      comments: 215,
      saves: 567,
      description:
        "Experience breathtaking views and craft cocktails at our rooftop oasis. Happy hour specials daily 4-7PM!",
      user: {
        name: "Skyline Lounge",
        username: "@skylinelounge",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      highlights: ["Craft Cocktails", "Live DJ Weekends", "Small Plates", "Sunset Views"],
      promoted: true,
    },
    {
      id: "3",
      title: "Tokyo Adventure",
      type: "trip",
      date: "May 5-15, 2025",
      image: "/placeholder.svg?height=600&width=400",
      location: "Tokyo, Japan",
      likes: 8932,
      comments: 456,
      saves: 1203,
      description: "10 days in Tokyo! From traditional temples to futuristic neighborhoods, this itinerary has it all.",
      user: {
        name: "Jordan Davis",
        username: "@jordand",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      highlights: ["Shibuya Crossing", "Meiji Shrine", "Robot Restaurant", "Mt. Fuji Day Trip"],
      promoted: false,
    },
    {
      id: "4",
      title: "Coastal Luxury Resort",
      type: "business",
      date: "Booking available now",
      image: "/placeholder.svg?height=600&width=400",
      location: "Malibu, CA",
      likes: 5621,
      comments: 342,
      saves: 891,
      description:
        "Escape to our beachfront paradise with private cabanas, spa services, and ocean-view dining. Special weekend packages available!",
      user: {
        name: "Malibu Shores Resort",
        username: "@malibushores",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      highlights: ["Beachfront Access", "Full-Service Spa", "Ocean View Dining", "Luxury Suites"],
      promoted: true,
    },
  ]

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
      const itemHeight = scrollHeight / discoveryItems.length
      const newIndex = Math.floor((scrollTop + clientHeight / 2) / itemHeight)

      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < discoveryItems.length) {
        setCurrentIndex(newIndex)
      }
    }
  }

  const itemsToDisplay = formattedItems.length > 0 ? formattedItems : fallbackItems

  // Scroll prompt effect for first-time users
  useEffect(() => {
    // Check localStorage for first-time visit today
    const today = new Date().toDateString()
    const lastVisit = localStorage.getItem('discover_last_visit')

    if (lastVisit !== today) {
      setShowScrollPrompt(true)
      localStorage.setItem('discover_last_visit', today)
    }

    // Also show prompt if lingering on first item for 5 seconds
    const timer = setTimeout(() => {
      if (!hasScrolled && currentIndex === 0) {
        setShowScrollPrompt(true)
      }
    }, 5000)

    return () => clearTimeout(timer)
  }, [hasScrolled, currentIndex])

  // Hide prompt when user scrolls
  useEffect(() => {
    if (currentIndex > 0) {
      setHasScrolled(true)
      setShowScrollPrompt(false)
    }
  }, [currentIndex])

  return (
    <div className="relative h-[calc(100vh-200px)] min-h-[500px] max-h-[800px] w-full overflow-hidden rounded-xl bg-gradient-to-b from-white to-orange-50 shadow-2xl">
      {/* Pull to refresh indicator */}
      {refreshing && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-orange-500 animate-spin" />
          <span className="text-sm font-medium">Refreshing...</span>
        </div>
      )}

      {/* Scroll prompt for first-time users */}
      {showScrollPrompt && !hasScrolled && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-black/70 backdrop-blur-md px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-white">
            <span className="text-sm font-medium">Swipe up to explore more</span>
            <span className="text-lg">👆</span>
          </div>
        </div>
      )}

      <div
        ref={scrollRef}
        className="h-full w-full overflow-y-auto overflow-x-hidden snap-y snap-mandatory scrollbar-hide"
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {itemsToDisplay.map((item, index) => (
          <div key={item.id} className="relative h-[calc(100vh-200px)] min-h-[500px] max-h-[800px] w-full snap-start snap-always">
            <div
              className="relative h-full w-full"
              onClick={(e) => handleDoubleTap(e, item.id)}
              onTouchEnd={(e) => handleDoubleTap(e, item.id)}
            >
              {item.image ? (
                <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
              ) : (
                <div
                  className="h-full w-full flex items-center justify-center"
                  style={{ background: item.defaultBackground || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                >
                  <div className="text-white/30 text-9xl font-bold">
                    {item.title.charAt(0).toUpperCase()}
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

              {/* Double-tap heart animation */}
              {showHeartAnimation && currentIndex === index && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  <Heart className="h-32 w-32 text-red-500 fill-red-500 animate-ping" />
                  <Heart className="h-32 w-32 text-red-500 fill-red-500 absolute animate-pulse" />
                </div>
              )}

              {/* Promoted badge */}
              {item.promoted && (
                <div className="absolute top-4 right-4 z-10">
                  <Badge className="bg-gradient-to-r from-amber-400 to-orange-400 border-0 flex items-center gap-1">
                    <Star className="h-3 w-3 fill-white" />
                    Promoted
                  </Badge>
                </div>
              )}

              {/* Content overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
                <div className="flex items-start justify-between mb-4">
                  <div className="max-w-[80%]">
                    <Badge
                      className={
                        item.type === "trip"
                          ? "bg-gradient-to-r from-blue-400 to-cyan-300 hover:from-blue-500 hover:to-cyan-400 border-0 text-sm px-3 py-1"
                          : item.type === "business"
                            ? "bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 border-0 text-sm px-3 py-1"
                            : "bg-gradient-to-r from-purple-400 to-pink-300 hover:from-purple-500 hover:to-pink-400 border-0 text-sm px-3 py-1"
                      }
                    >
                      {item.type === "trip" ? "Trip" : item.type === "business" ? "Business" : "Event"}
                    </Badge>
                    <h2 className="text-2xl md:text-3xl font-bold mt-3">{item.title}</h2>
                    <div className="flex items-center text-sm md:text-base mt-2 opacity-90">
                      <MapPin className="mr-1 h-4 w-4" />
                      {item.location}
                      <span className="mx-2">•</span>
                      <Calendar className="mr-1 h-4 w-4" />
                      {item.date}
                    </div>
                  </div>
                </div>

                <p className="text-sm md:text-base mb-5 leading-relaxed opacity-90 max-w-[90%]">{item.description}</p>

                {item.highlights && item.highlights.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 md:gap-3 mb-5">
                    {item.highlights.map((highlight, i) => (
                      <div
                        key={i}
                        className="flex items-center bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 text-xs md:text-sm"
                      >
                        {highlight}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 border-2 border-white">
                      <AvatarImage src={item.user.avatar} alt={item.user.name} />
                      <AvatarFallback>{item.user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{item.user.name}</p>
                      <p className="text-xs opacity-80">{item.user.username}</p>
                    </div>
                  </div>

                  <Link href={`/event/${item.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-gradient-to-r from-orange-500 to-pink-500 backdrop-blur-sm border-white/20 text-white hover:from-orange-600 hover:to-pink-600 font-semibold shadow-lg transition-all hover:scale-105"
                    >
                      {item.type === "business" ? "Learn More" : "View Trip"}
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Side action buttons */}
              <div className="absolute right-4 bottom-1/3 flex flex-col gap-4">
                <div className="flex flex-col items-center">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleLike(item.id)}
                    className={`h-12 w-12 rounded-full backdrop-blur-sm border-white/20 transition-all ${
                      likedItems.has(item.id)
                        ? "bg-gradient-to-br from-red-500 to-pink-500 text-white shadow-lg scale-110"
                        : "bg-black/30 text-white hover:bg-black/50"
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${likedItems.has(item.id) ? "fill-current" : ""}`} />
                  </Button>
                  <span className="text-xs text-white mt-1 font-bold">{item.likes + (likedItems.has(item.id) ? 1 : 0)}</span>
                </div>
                <div className="flex flex-col items-center">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCommentsOpenFor(item.id)}
                    className="h-12 w-12 rounded-full bg-black/30 backdrop-blur-sm border-white/20 text-white hover:bg-black/50 transition-all hover:scale-110"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </Button>
                  <span className="text-xs text-white mt-1 font-bold">{item.comments}</span>
                </div>
                <div className="flex flex-col items-center">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleSave(item.id)}
                    className={`h-12 w-12 rounded-full backdrop-blur-sm border-white/20 transition-all ${
                      savedItems.has(item.id)
                        ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg scale-110"
                        : "bg-black/30 text-white hover:bg-black/50"
                    }`}
                  >
                    <Bookmark className={`h-5 w-5 ${savedItems.has(item.id) ? "fill-current" : ""}`} />
                  </Button>
                  <span className="text-xs text-white mt-1 font-bold">{item.saves + (savedItems.has(item.id) ? 1 : 0)}</span>
                </div>
                <div className="flex flex-col items-center">
                  <ShareDialog
                    itineraryId={item.id}
                    title={item.title}
                    description={item.description}
                    userId={user?.id}
                    trigger={
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-12 w-12 rounded-full bg-black/30 backdrop-blur-sm border-white/20 text-white hover:bg-black/50 transition-all hover:scale-110"
                      >
                        <Share2 className="h-5 w-5" />
                      </Button>
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Scroll indicator */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-10">
        {itemsToDisplay.map((_, index) => (
          <div
            key={index}
            className={`h-1 rounded-full transition-all ${
              index === currentIndex
                ? "bg-gradient-to-r from-orange-400 to-pink-400 w-3 shadow-lg"
                : "bg-white/50 w-1.5 hover:bg-white/70"
            }`}
          />
        ))}
      </div>

      {/* Fun floating "Discover" badge */}
      <div className="absolute top-4 left-4 z-10">
        <Badge className="bg-gradient-to-r from-orange-500 to-pink-500 border-0 text-white font-bold px-4 py-2 text-sm shadow-xl animate-pulse">
          <Sparkles className="h-4 w-4 mr-1" />
          Discover
        </Badge>
      </div>

      {/* Inline Comments Sheet */}
      {commentsOpenFor && (
        <InlineComments
          itineraryId={commentsOpenFor}
          open={commentsOpenFor !== null}
          onOpenChange={(open) => !open && setCommentsOpenFor(null)}
          initialCommentCount={itemsToDisplay.find((item) => item.id === commentsOpenFor)?.comments || 0}
        />
      )}
    </div>
  )
}
// Force rebuild Mon Feb  9 01:12:37 UTC 2026
