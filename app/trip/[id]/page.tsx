"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Share2, Calendar, MapPin, Send, ArrowRight, ArrowLeft, Clock, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ExpenseEstimator } from "@/components/expense-estimator"
import { useToast } from "@/components/ui/use-toast"
import { PackingList } from "@/components/packing-list"
import { getPackingItems } from "@/app/actions/packing-items"
import { supabase } from "@/lib/supabase-client"
import { Skeleton } from "@/components/ui/skeleton"

// Define the PackingItem interface
interface PackingItem {
  id: string
  name: string
  category: string
  packed: boolean
  url?: string
}

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

export default function TripPage() {
  const params = useParams()
  const id = params.id as string

  const [trip, setTrip] = useState<Itinerary | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isFollowing, setIsFollowing] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isRSVPed, setIsRSVPed] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [comments, setComments] = useState([
    {
      id: 1,
      user: {
        name: "Alex Kim",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      text: "This looks amazing! I'm definitely in for this trip! 🙌",
      timestamp: "2h ago",
    },
    {
      id: 2,
      user: {
        name: "Jordan Taylor",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      text: "Can't wait for this! Do we need to bring anything specific?",
      timestamp: "1h ago",
    },
  ])
  const [privacySetting, setPrivacySetting] = useState("public")
  const [showRSVPDialog, setShowRSVPDialog] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const { toast } = useToast()

  // Packing list state
  const [items, setItems] = useState<PackingItem[]>([
    { id: "1", name: "T-shirts (5)", category: "clothing", packed: true },
    { id: "2", name: "Jeans", category: "clothing", packed: true },
    { id: "3", name: "Swimwear", category: "clothing", packed: false, url: "https://example.com/swimwear" },
    { id: "4", name: "Toothbrush", category: "toiletries", packed: true },
    { id: "5", name: "Shampoo", category: "toiletries", packed: false },
    { id: "6", name: "Sunscreen", category: "toiletries", packed: false, url: "https://example.com/sunscreen" },
  ])

  const categories = [
    { id: "clothing", name: "Clothing", icon: "👕" },
    { id: "toiletries", name: "Toiletries", icon: "🧴" },
    { id: "accessories", name: "Accessories", icon: "👓" },
    { id: "electronics", name: "Electronics", icon: "📱" },
    { id: "food", name: "Food & Drinks", icon: "🍎" },
  ]

  const toggleItemPacked = (id: string) => {
    setItems(items.map((item) => (item.id === id ? { ...item, packed: !item.packed } : item)))
  }

  const packedCount = items.filter((item) => item.packed).length
  const totalCount = items.length
  const progressPercentage = Math.round((packedCount / totalCount) * 100) || 0

  const handleFollow = () => {
    setIsFollowing(!isFollowing)
  }

  const handleLike = () => {
    setIsLiked(!isLiked)
  }

  const handleSave = () => {
    setIsSaved(!isSaved)
  }

  const handleRSVP = (response: "yes" | "no" | "maybe") => {
    setIsRSVPed(response === "yes")
    setShowRSVPDialog(false)
  }

  const handleCommentSubmit = () => {
    if (commentText.trim()) {
      const newComment = {
        id: comments.length + 1,
        user: {
          name: "You",
          avatar: "/placeholder.svg?height=40&width=40",
        },
        text: commentText,
        timestamp: "Just now",
      }
      setComments([...comments, newComment])
      setCommentText("")
    }
  }

  const handleInvite = () => {
    // Handle invite logic
    setInviteEmail("")
    setShowInviteDialog(false)
  }

  const handlePrivacyChange = (setting: string) => {
    setPrivacySetting(setting)
  }

  useEffect(() => {
    async function fetchTrip() {
      try {
        setLoading(true)

        // Fetch the trip
        const { data: tripData, error: tripError } = await supabase
          .from("itineraries")
          .select("*")
          .eq("id", id)
          .single()

        if (tripError) {
          throw new Error(tripError.message)
        }

        if (!tripData) {
          throw new Error("Trip not found")
        }

        setTrip(tripData)

        // Fetch activities for this trip
        const { data: activitiesData, error: activitiesError } = await supabase
          .from("activities")
          .select("*")
          .eq("itinerary_id", id)
          .order("start_time", { ascending: true })

        if (activitiesError) {
          console.error("Error fetching activities:", activitiesError)
          // Don't throw here, we can still show the trip without activities
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
      fetchTrip()
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

  // Calculate trip duration in days
  const getTripDuration = () => {
    if (!trip || !trip.start_date || !trip.end_date) return 1

    const start = new Date(trip.start_date)
    const end = new Date(trip.end_date)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays + 1 // Include both start and end days
  }

  const packingItems = await getPackingItems(params.id)
  const [activeTab, setActiveTab] = useState("overview")

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
          <h1 className="text-2xl font-bold mb-4 text-red-600">Error Loading Trip</h1>
          <p className="mb-6">{error}</p>
          <Button asChild>
            <Link href="/">Return Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="container px-4 py-6 md:py-10">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
        <div className="max-w-3xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Trip Not Found</h1>
          <p className="mb-6">The trip you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <Link href="/">Return Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Group activities by day
  const tripDuration = getTripDuration()
  const dayTabs = Array.from({ length: tripDuration }, (_, i) => `Day ${i + 1}`)

  // Create a map of activities by day
  const activitiesByDay: Record<string, Activity[]> = {}

  // Initialize each day with an empty array
  dayTabs.forEach((day) => {
    activitiesByDay[day] = []
  })

  // Add a "All Days" category for activities without a specific day
  activitiesByDay["All Days"] = []

  // For now, just put all activities in "Day 1" as a placeholder
  // In a real app, you'd determine the day based on the activity date
  if (activities.length > 0) {
    activitiesByDay["Day 1"] = activities
  }

  return (
    <div className="pb-20">
      <div className="container px-4 py-6 md:py-10">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>

        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{trip.title}</h1>
              <div className="flex items-center mt-2 text-muted-foreground">
                <Calendar className="h-4 w-4 mr-1" />
                <span className="text-sm">
                  {formatDate(trip.start_date)}
                  {trip.end_date && trip.end_date !== trip.start_date &&
                    ` - ${formatDate(trip.end_date)}`}
                </span>
              </div>
              {trip.location && (
                <div className="flex items-center mt-1 text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="text-sm">{trip.location}</span>
                </div>
              )}
            </div>
            <Button variant="outline" size="sm" className="flex items-center">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>

          {trip.cover_image_url ? (
            <img
              src={trip.cover_image_url || "/placeholder.svg"}
              alt={trip.title}
              className="w-full h-64 object-cover rounded-lg mb-8"
            />
          ) : (
            <div className="w-full h-64 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg mb-8 flex items-center justify-center">
              <span className="text-lg text-muted-foreground">No cover image</span>
            </div>
          )}

          {trip.description && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-2">About this Trip</h2>
              <p className="text-gray-700 whitespace-pre-line">{trip.description}</p>
            </div>
          )}

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Itinerary</h2>

            <Tabs defaultValue="Day 1" className="w-full">
              <TabsList className="grid grid-cols-4 mb-4">
                {dayTabs.map(day => (
                  <TabsTrigger key={day} value={day}>{day}</TabsTrigger>
                ))}
                {activities.length > 0 && (
                  <TabsTrigger value="All Days">All</TabsTrigger>
                )}
              </TabsList>

              {dayTabs.map(day => (
                <TabsContent key={day} value={day}>
                  {activitiesByDay[day].length > 0 ? (
                    <div className="space-y-4">
                      {activitiesByDay[day].map((activity) => (
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
                          {activity.description && (
                            <p className="mt-2 text-sm text-gray-600">{activity.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No activities planned for {day}.</p>
                  )}
                </TabsContent>
              ))}

              {activities.length > 0 && (
                <TabsContent value="All Days">
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
                        {activity.description && (
                          <p className="mt-2 text-sm text-gray-600">{activity.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </div>

          <div className="flex items-center justify-between pb-8 border-t pt-4">
            <div className="flex items-center text-sm text-muted-foreground">
              <User className="h-4 w-4 mr-1" />
              <span>Created by {trip.user_id}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Created {new Date(trip.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
      {/* Hero Image */}
      {/* <div className="relative h-64 md:h-80 w-full">
        <img src="/placeholder.svg?height=400&width=800" alt="Trip to Bali" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div> */}

      {/* Quick Actions */}
      {/* <div className="absolute top-4 right-4 flex gap-2">
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30"
            onClick={handleLike}
          >
            <Heart className={`h-5 w-5 ${isLiked ? "fill-red-500 text-red-500" : "text-white"}`} />
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30"
                onClick={() => {
                  // Open share dialog
                  const shareDialog = document.querySelector('[role="dialog"]')
                  if (shareDialog) {
                    ;(shareDialog as HTMLElement).click()
                  }
                }}
              >
                <Share2 className="h-5 w-5 text-white" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Share this trip</DialogTitle>
                <DialogDescription>Share this amazing trip with your friends and family</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-4 gap-4 py-4">
                <Button variant="outline" className="flex flex-col items-center gap-2 h-auto p-4">
                  <img src="/placeholder.svg?height=24&width=24" alt="Instagram" className="h-6 w-6" />
                  <span className="text-xs">Instagram</span>
                </Button>
                <Button variant="outline" className="flex flex-col items-center gap-2 h-auto p-4">
                  <img src="/placeholder.svg?height=24&width=24" alt="WhatsApp" className="h-6 w-6" />
                  <span className="text-xs">WhatsApp</span>
                </Button>
                <Button variant="outline" className="flex flex-col items-center gap-2 h-auto p-4">
                  <img src="/placeholder.svg?height=24&width=24" alt="Twitter" className="h-6 w-6" />
                  <span className="text-xs">Twitter</span>
                </Button>
                <Button variant="outline" className="flex flex-col items-center gap-2 h-auto p-4">
                  <img src="/placeholder.svg?height=24&width=24" alt="Facebook" className="h-6 w-6" />
                  <span className="text-xs">Facebook</span>
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Input value="https://tinerary.app/trip/bali-2023" readOnly />
                <Button variant="secondary">Copy</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="secondary"
            size="icon"
            className="rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30"
            onClick={handleSave}
          >
            <BookmarkPlus className={`h-5 w-5 ${isSaved ? "fill-yellow-500 text-yellow-500" : "text-white"}`} />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30"
              >
                <MoreHorizontal className="h-5 w-5 text-white" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Save offline
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Camera className="h-4 w-4 mr-2" />
                Add trip photos
              </DropdownMenuItem>
              <DropdownMenuItem>Report</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div> */}

      {/* Privacy Setting */}
      {/* <div className="absolute top-4 left-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 text-white"
              >
                {privacySetting === "public" ? (
                  <>
                    <Globe className="h-4 w-4 mr-2" /> Public
                  </>
                ) : privacySetting === "friends" ? (
                  <>
                    <Users2 className="h-4 w-4 mr-2" /> Friends
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" /> Private
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handlePrivacyChange("public")}>
                <Globe className="h-4 w-4 mr-2" />
                Public
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePrivacyChange("friends")}>
                <Users2 className="h-4 w-4 mr-2" />
                Friends only
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePrivacyChange("private")}>
                <Lock className="h-4 w-4 mr-2" />
                Private
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div> */}

      {/* Title and Info */}
      {/* <div className="absolute bottom-4 left-4 right-4 text-white">
          <h1 className="text-2xl font-bold">Weekend in Bali</h1>
          <div className="flex flex-wrap items-center gap-y-1 gap-x-3 mt-1">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              <span className="text-sm">June 15-18, 2023</span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              <span className="text-sm">Bali, Indonesia</span>
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              <span className="text-sm">4 people</span>
            </div>
          </div>
        </div>
      </div> */}

      {/* Creator Info and Follow */}
      {/* <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center">
          <Avatar className="h-10 w-10">
            <AvatarImage src="/placeholder.svg?height=40&width=40" alt="Creator" />
            <AvatarFallback>CR</AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <div className="font-medium">Created by Maya Johnson</div>
            <div className="text-sm text-muted-foreground">Travel enthusiast • 24 trips</div>
          </div>
        </div>
        <Button
          variant={isFollowing ? "outline" : "default"}
          size="sm"
          onClick={handleFollow}
          className={isFollowing ? "border-pink-500 text-pink-500" : "bg-pink-500 hover:bg-pink-600"}
        >
          {isFollowing ? "Following" : "Follow"}
        </Button>
      </div> */}

      {/* RSVP Button for Whole Trip */}
      {/* <div className="px-4 py-3 bg-gradient-to-r from-orange-100 to-pink-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Interested in this trip?</h3>
            <p className="text-sm text-muted-foreground">Let the organizer know you want to join</p>
          </div>
          <Button className="bg-pink-500 hover:bg-pink-600" onClick={() => setShowRSVPDialog(true)}>
            {isRSVPed ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" /> RSVP'd
              </>
            ) : (
              "RSVP to Trip"
            )}
          </Button>
        </div>
      </div> */}

      {/* RSVP Modal for Whole Trip */}
      {/* <ItineraryRsvpModal
        open={showRSVPDialog}
        onOpenChange={setShowRSVPDialog}
        itineraryId={params.id as string}
        userId="current-user-id" // This would come from your auth context
        itineraryTitle="Weekend in Bali"
      /> */}

      {/* Invite Friends */}
      {/* <div className="px-4 py-3 border-b">
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <Users className="h-4 w-4 mr-2" />
              Invite more friends
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Friends</DialogTitle>
              <DialogDescription>Share this trip with friends and family</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email address
                </label>
                <Input
                  id="email"
                  placeholder="friend@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Or share via</label>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <img src="/placeholder.svg?height=20&width=20" alt="WhatsApp" className="h-5 w-5 mr-2" />
                    WhatsApp
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <img src="/placeholder.svg?height=20&width=20" alt="Messages" className="h-5 w-5 mr-2" />
                    Messages
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleInvite} className="bg-pink-500 hover:bg-pink-600">
                Send Invite
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div> */}

      {/* Tabs */}
      {/* <Tabs defaultValue="overview" className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="packing">Packing</TabsTrigger>
          <TabsTrigger value="discussion">Discussion</TabsTrigger>
        </TabsList> */}

      {/* Overview Tab */}
      {/* <TabsContent value="overview" className="p-4 space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">About this trip</h2>
            <p className="text-sm text-muted-foreground">
              Join us for an unforgettable weekend in Bali! We'll be exploring beautiful beaches, visiting ancient
              temples, and enjoying the local cuisine. This trip is perfect for those who want to experience the culture
              and natural beauty of Bali in a short time.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Highlights</h2>
            <ul className="space-y-2">
              {["Sunset at Tanah Lot Temple", "Ubud Monkey Forest", "Tegallalang Rice Terraces", "Uluwatu Beach"].map(
                (highlight, index) => (
                  <li key={index} className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mr-2 mt-0.5">
                      {index + 1}
                    </div>
                    <span>{highlight}</span>
                  </li>
                ),
              )}
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Estimated Budget</h2>
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Accommodation (3 nights)</span>
                    <span className="font-medium">$300</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Activities</span>
                    <span className="font-medium">$150</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Food & Drinks</span>
                    <span className="font-medium">$120</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transportation</span>
                    <span className="font-medium">$80</span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                    <span>Total per person</span>
                    <span>$650</span>
                  </div>
                </div>
                <Button
                  className="w-full mt-4 bg-pink-500 hover:bg-pink-600"
                  onClick={() => {
                    toast({
                      title: "Add Expense",
                      description: "This would open the expense form in a real app.",
                    })
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add expense
                </Button>
              </CardContent>
            </Card>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Who's going</h2>
              <Button variant="link" size="sm" className="text-pink-500 p-0">
                See all
              </Button>
            </div>
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <Avatar key={i} className="border-2 border-background">
                  <AvatarImage src={`/placeholder.svg?height=40&width=40&text=${i}`} />
                  <AvatarFallback>U{i}</AvatarFallback>
                </Avatar>
              ))}
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted text-muted-foreground text-sm font-medium border-2 border-background">
                +2
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities" className="p-4 space-y-6">
          <div className="space-y-4">
            {[
              {
                day: "Day 1 - Friday, June 15",
                activities: [
                  {
                    time: "10:00 AM",
                    title: "Arrival & Check-in",
                    location: "Kuta Beach Hotel",
                    description: "Check in to our hotel and freshen up",
                  },
                  {
                    time: "2:00 PM",
                    title: "Tanah Lot Temple",
                    location: "Tabanan",
                    description: "Visit the iconic sea temple and watch the sunset",
                  },
                  {
                    time: "7:00 PM",
                    title: "Welcome Dinner",
                    location: "Jimbaran Bay",
                    description: "Seafood dinner on the beach",
                  },
                ],
              },
              {
                day: "Day 2 - Saturday, June 16",
                activities: [
                  {
                    time: "9:00 AM",
                    title: "Ubud Tour",
                    location: "Ubud",
                    description: "Visit the Monkey Forest and local markets",
                  },
                  {
                    time: "1:00 PM",
                    title: "Lunch at Organic Cafe",
                    location: "Ubud Center",
                    description: "Enjoy local organic cuisine",
                  },
                  {
                    time: "3:00 PM",
                    title: "Tegallalang Rice Terraces",
                    location: "Tegallalang",
                    description: "Explore the beautiful rice paddies",
                  },
                ],
              },
            ].map((day, dayIndex) => (
              <div key={dayIndex}>
                <h3 className="font-semibold text-lg mb-3">{day.day}</h3>
                <div className="space-y-3">
                  {day.activities.map((activity, actIndex) => (
                    <Card key={actIndex}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{activity.time}</div>
                            <div className="text-lg font-semibold mt-1">{activity.title}</div>
                            <div className="flex items-center text-sm text-muted-foreground mt-1">
                              <MapPin className="h-3 w-3 mr-1" />
                              {activity.location}
                            </div>
                            <p className="text-sm mt-2">{activity.description}</p>
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                RSVP
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>RSVP to {activity.title}</DialogTitle>
                                <DialogDescription>
                                  Let everyone know if you'll be joining this activity
                                </DialogDescription>
                              </DialogHeader>
                              <div className="flex justify-center gap-4 py-4">
                                <Button variant="outline" className="flex-1">
                                  Can't Go
                                </Button>
                                <Button className="flex-1 bg-pink-500 hover:bg-pink-600">I'll Be There</Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Packing Tab */}
        <TabsContent value="packing" className="p-4">
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Packing List</h2>
              <Link href={`/trip/${params.id}/packing`}>
                <Button variant="outline" size="sm" className="flex items-center">
                  View Full Packing List
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Inline Packing List */}
            <PackingList simplified={true} items={items} onToggleItem={toggleItemPacked} />

            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <div className="h-6 w-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center mr-2">
                  $
                </div>
                Expense Estimator
              </h2>
              <ExpenseEstimator />
            </div>
          </div>
        </TabsContent>

        {/* Discussion Tab */}
        <TabsContent value="discussion" className="p-4">
          <div className="space-y-4">
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar>
                    <AvatarImage src={comment.user.avatar} alt={comment.user.name} />
                    <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="font-medium">{comment.user.name}</div>
                      <p className="text-sm mt-1">{comment.text}</p>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>{comment.timestamp}</span>
                      <button className="hover:text-foreground">Like</button>
                      <button className="hover:text-foreground">Reply</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-4">
              <Avatar>
                <AvatarImage src="/placeholder.svg?height=40&width=40" alt="You" />
                <AvatarFallback>You</AvatarFallback>
              </Avatar>
              <div className="flex-1 flex">
                <Input
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="rounded-r-none"
                />
                <Button
                  className="rounded-l-none bg-pink-500 hover:bg-pink-600"
                  onClick={handleCommentSubmit}
                  disabled={!commentText.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
  </div>
  )
}
