"use client"

import { useState, useEffect } from "react"
import { Plus, Loader2, Calendar, MapPin, FileText, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EventCard } from "@/components/event-card"
import { DiscoveryFeed } from "@/components/discovery-feed"
import { useAuth } from "@/providers/auth-provider"
import { getUserFeed, getPersonalizedRecommendations, type FeedItem } from "@/lib/feed-service"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { useRouter } from "next/navigation"

// Sample data
const exampleEvents = [
  {
    id: "1",
    title: "Weekend in NYC",
    type: "Trip" as const,
    image: "/placeholder.svg?height=400&width=600",
    date: "Mar 15-17, 2025",
    location: "New York, NY",
    organizer: {
      name: "Alex Rodriguez",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    attendees: 6,
  },
  {
    id: "2",
    title: "Coachella Music Festival",
    type: "Event" as const,
    image: "/placeholder.svg?height=400&width=600",
    date: "Apr 10, 2025 • 12:00 PM - 11:00 PM",
    location: "Indio, CA",
    organizer: {
      name: "Taylor Moore",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    attendees: 12,
  },
  {
    id: "3",
    title: "Rooftop Birthday Party",
    type: "Event" as const,
    image: "/placeholder.svg?height=400&width=600",
    date: "Mar 22, 2025 • 8:00 PM - 1:00 AM",
    location: "Downtown LA",
    organizer: {
      name: "You",
    },
    isOrganizer: true,
    attendees: 25,
  },
  {
    id: "4",
    title: "Wine Tasting Tour",
    type: "Event" as const,
    image: "/placeholder.svg?height=400&width=600",
    date: "Mar 28, 2025 • 2:00 PM - 6:00 PM",
    location: "Napa Valley, CA",
    organizer: {
      name: "Jordan Davis",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    attendees: 8,
  },
  {
    id: "5",
    title: "Tokyo Adventure",
    type: "Trip" as const,
    image: "/placeholder.svg?height=400&width=600",
    date: "May 5-15, 2025",
    location: "Tokyo, Japan",
    organizer: {
      name: "Jordan Davis",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    attendees: 4,
  },
  {
    id: "6",
    title: "Beach Bonfire",
    type: "Event" as const,
    image: "/placeholder.svg?height=400&width=600",
    date: "Jun 15, 2025 • 7:00 PM - 11:00 PM",
    location: "Santa Monica, CA",
    organizer: {
      name: "Samantha Lee",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    attendees: 15,
  },
]

// Past events
const pastEvents = [
  {
    id: "7",
    title: "Hiking Trip",
    type: "Trip" as const,
    image: "/placeholder.svg?height=400&width=600",
    date: "Feb 10-12, 2025",
    location: "Yosemite, CA",
    organizer: {
      name: "Mike Johnson",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    attendees: 8,
  },
  {
    id: "8",
    title: "Art Gallery Opening",
    type: "Event" as const,
    image: "/placeholder.svg?height=400&width=600",
    date: "Jan 15, 2025 • 7:00 PM - 10:00 PM",
    location: "San Francisco, CA",
    organizer: {
      name: "Emma Wilson",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    attendees: 35,
  },
]

export function FeedPage() {
  const [feedTab, setFeedTab] = useState<"forYou" | "discover">("forYou")
  const [timeTab, setTimeTab] = useState<"upcoming" | "past">("upcoming")
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [drafts, setDrafts] = useState<any[]>([])
  const [discoveryItems, setDiscoveryItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [feedStats, setFeedStats] = useState({ upcoming: 0, past: 0, total: 0 })
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  // Fetch user's drafts
  useEffect(() => {
    const fetchDrafts = async () => {
      if (!user?.id) {
        setDrafts([])
        return
      }

      try {
        const { data, error } = await supabase
          .from("drafts")
          .select("*")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })

        if (error) {
          console.error("Error fetching drafts:", error)
          setDrafts([])
        } else {
          setDrafts(data || [])
        }
      } catch (error) {
        console.error("Error in fetchDrafts:", error)
        setDrafts([])
      }
    }

    if (feedTab === "forYou") {
      fetchDrafts()
    }
  }, [user?.id, feedTab, supabase])

  // Fetch user's feed (created + invited trips)
  useEffect(() => {
    const fetchFeed = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const result = await getUserFeed(user.id, {
          status: timeTab,
          limit: 50,
        })

        if (result.success) {
          // Deduplicate items by ID (safety measure)
          const uniqueItems = result.items.filter(
            (item, index, self) => index === self.findIndex((t) => t.id === item.id)
          )

          setFeedItems(uniqueItems)
          setFeedStats({
            upcoming: result.upcoming,
            past: result.past,
            total: result.total,
          })
        } else {
          console.error("Error fetching feed:", result.error)
          setFeedItems([])
        }
      } catch (error) {
        console.error("Error in fetchFeed:", error)
        setFeedItems([])
      } finally {
        setLoading(false)
      }
    }

    if (feedTab === "forYou") {
      fetchFeed()
    }
  }, [user?.id, timeTab, feedTab])

  // Fetch personalized discovery
  useEffect(() => {
    const fetchDiscovery = async () => {
      if (!user?.id) return

      setLoading(true)
      try {
        const result = await getPersonalizedRecommendations(user.id, 20)

        if (result.success) {
          setDiscoveryItems(result.items)
        } else {
          console.error("Error fetching discovery:", result.error)
          setDiscoveryItems([])
        }
      } catch (error) {
        console.error("Error in fetchDiscovery:", error)
        setDiscoveryItems([])
      } finally {
        setLoading(false)
      }
    }

    if (feedTab === "discover") {
      fetchDiscovery()
    }
  }, [user?.id, feedTab])

  // Delete draft
  const handleDeleteDraft = async (draftId: string) => {
    if (!confirm("Are you sure you want to delete this draft?")) return

    try {
      const { error } = await supabase.from("drafts").delete().eq("id", draftId)

      if (error) throw error

      // Remove from local state
      setDrafts(drafts.filter((d) => d.id !== draftId))

      toast({
        title: "Draft deleted",
        description: "Your draft has been deleted successfully.",
      })
    } catch (error: any) {
      console.error("Error deleting draft:", error)
      toast({
        title: "Error",
        description: "Failed to delete draft",
        variant: "destructive",
      })
    }
  }

  // Convert FeedItem to EventCard format
  const convertToEventCard = (item: FeedItem) => {
    const startDate = new Date(item.start_date)
    const endDate = new Date(item.end_date)

    // Determine if it's an Event or Trip
    // Same day = Event, multi-day = Trip
    const isTrip = startDate.toDateString() !== endDate.toDateString()

    // Format date string
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
      dateStr = `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
    }

    const metrics = Array.isArray(item.metrics) ? item.metrics[0] : item.metrics

    return {
      id: item.id,
      title: item.title,
      type: isTrip ? ("Trip" as const) : ("Event" as const),
      image: item.image_url || "/placeholder.svg?height=400&width=600",
      date: dateStr,
      location: item.location || "Location TBD",
      organizer: {
        name: item.owner?.name || "Unknown",
        avatar: item.owner?.avatar_url || "/placeholder.svg?height=40&width=40",
      },
      isOrganizer: !item.is_invited,
      attendees: 0, // We'll need to fetch this separately if needed
      like_count: metrics?.like_count || 0,
      comment_count: metrics?.comment_count || 0,
    }
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(to bottom, #ffecd2, #fcb69f 40%, #ffffff 80%)" }}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Your Feed</h1>
          <Button asChild className="btn-sunset">
            <Link href="/create">
              <Plus className="h-4 w-4 mr-2" />
              Create New
            </Link>
          </Button>
        </div>

        {/* Feed Tabs */}
        <div className="bg-white rounded-full p-1 mb-6 inline-flex w-full max-w-md">
          <button
            className={`flex-1 px-6 py-2 rounded-full text-sm font-medium transition-colors ${
              feedTab === "forYou" ? "bg-[#FF9B7D] text-white" : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setFeedTab("forYou")}
          >
            For You
          </button>
          <button
            className={`flex-1 px-6 py-2 rounded-full text-sm font-medium transition-colors ${
              feedTab === "discover" ? "bg-[#FF9B7D] text-white" : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setFeedTab("discover")}
          >
            Discover
          </button>
        </div>

        {feedTab === "forYou" && (
          <>
            {/* Drafts Section */}
            {drafts.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Drafts
                    <Badge variant="secondary">{drafts.length}</Badge>
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {drafts.map((draft) => (
                    <div
                      key={draft.id}
                      className="relative border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
                    >
                      <Badge
                        variant="outline"
                        className="absolute top-3 right-3 bg-yellow-50 text-yellow-700 border-yellow-200"
                      >
                        Draft
                      </Badge>
                      <div className="pr-16">
                        <h3 className="font-semibold text-lg mb-1">{draft.title || "Untitled"}</h3>
                        {draft.location && (
                          <div className="flex items-center text-sm text-muted-foreground mb-2">
                            <MapPin className="h-3 w-3 mr-1" />
                            {draft.location}
                          </div>
                        )}
                        {draft.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {draft.description}
                          </p>
                        )}
                        <div className="text-xs text-muted-foreground mb-3">
                          Last edited: {new Date(draft.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => router.push(`/create?draftId=${draft.id}`)}
                        >
                          Continue Editing
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteDraft(draft.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Time Tabs - Only show for "For You" tab */}
            <div className="bg-white rounded-full p-1 mb-8 inline-flex w-full max-w-md">
              <button
                className={`flex-1 px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                  timeTab === "upcoming" ? "bg-[#FF9B7D] text-white" : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setTimeTab("upcoming")}
              >
                Upcoming
              </button>
              <button
                className={`flex-1 px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                  timeTab === "past" ? "bg-[#FF9B7D] text-white" : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setTimeTab("past")}
              >
                Past
              </button>
            </div>

            {/* Event Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : feedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  No {timeTab} trips yet
                </h3>
                <p className="text-gray-500 mb-4">
                  {timeTab === "upcoming"
                    ? "Create your first trip or get invited to one!"
                    : "Your past adventures will appear here"}
                </p>
                {timeTab === "upcoming" && (
                  <Button asChild className="btn-sunset">
                    <Link href="/create">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Trip
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {feedItems.map((item) => (
                  <EventCard key={item.id} event={convertToEventCard(item)} />
                ))}
              </div>
            )}
          </>
        )}

        {feedTab === "discover" && (
          <div className="h-[calc(100vh-250px)]">
            <DiscoveryFeed />
          </div>
        )}
      </div>
    </div>
  )
}
