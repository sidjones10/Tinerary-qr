"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ArrowLeft, Calendar, MapPin, Clock, Share2, Heart, Users, Edit, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/providers/auth-provider"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { ShareDialog } from "@/components/share-dialog"
import { EnhancedExpenseTracker } from "@/components/enhanced-expense-tracker"
import { CommentsSection } from "@/components/comments-section"
import { PackingList } from "@/components/packing-list"
import { EventMap } from "@/components/event-map"
import { PhotoGallery } from "@/components/photo-gallery"
import { getEventPhotos, type EventPhoto } from "@/lib/photo-service"
import { CalendarExportButton } from "@/components/calendar-export-button"
import { MutualsSection } from "@/components/mutuals-section"

interface Activity {
  id: string
  title: string
  description: string | null
  start_time: string | null
  end_time: string | null
  location: string | null
  [key: string]: unknown
}

interface Event {
  id: string
  title: string
  description: string | null
  start_date: string | null
  end_date: string | null
  destination: string | null
  user_id: string
  like_count?: number
  activities?: Activity[]
  [key: string]: unknown
}

interface PackingItem {
  id: string
  item_name: string
  category: string | null
  packed: boolean
  [key: string]: unknown
}

interface Attendee {
  id: string
  name: string
  avatar_url?: string
  role?: string
}

interface EventDetailProps {
  event: Event
  packingItems?: PackingItem[]
}

// Component to fetch and display photos
function PhotoGalleryLoader({ eventId, isOwner }: { eventId: string; isOwner: boolean }) {
  const [photos, setPhotos] = useState<EventPhoto[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPhotos = async () => {
    setLoading(true)
    const result = await getEventPhotos(eventId)
    if (result.success && result.photos) {
      setPhotos(result.photos)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchPhotos()
  }, [eventId])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return <PhotoGallery itineraryId={eventId} photos={photos} isOwner={isOwner} onPhotosChange={fetchPhotos} />
}

export function EventDetail({ event }: EventDetailProps) {
  // Extract activities from the event (they come from the database join)
  const activities = event.activities || []
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(event.like_count || 0)
  const [isLiking, setIsLiking] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [isSendingInvite, setIsSendingInvite] = useState(false)
  const [packingItems, setPackingItems] = useState<PackingItem[]>([])
  const [canAccessPacking, setCanAccessPacking] = useState(false)
  const [canAccessExpenses, setCanAccessExpenses] = useState(false)
  const [checkingAccess, setCheckingAccess] = useState(true)
  const isOwner = user && user.id === event.user_id

  // Check access permissions for packing and expenses
  useEffect(() => {
    const checkAccess = async () => {
      setCheckingAccess(true)
      const supabase = createClient()

      // Owner always has access - this is a fallback in case RPC function fails
      const isUserOwner = user?.id === event.user_id

      // Try RPC function first, but fall back to owner check if it fails
      try {
        // Check packing list access
        const { data: packingAccess, error: packingError } = await supabase.rpc('can_access_private_content', {
          user_uuid: user?.id || null,
          itinerary_uuid: event.id,
          content_type: 'packing'
        })

        // Check expenses access
        const { data: expensesAccess, error: expensesError } = await supabase.rpc('can_access_private_content', {
          user_uuid: user?.id || null,
          itinerary_uuid: event.id,
          content_type: 'expenses'
        })

        // If RPC returns null (function may not exist), fall back to owner check
        setCanAccessPacking(packingAccess ?? isUserOwner)
        setCanAccessExpenses(expensesAccess ?? isUserOwner)

        // Log errors for debugging
        if (packingError) console.warn('Packing access RPC error:', packingError)
        if (expensesError) console.warn('Expenses access RPC error:', expensesError)
      } catch (error) {
        console.warn('Access check failed, falling back to owner check:', error)
        // Fall back to owner check if RPC completely fails
        setCanAccessPacking(isUserOwner)
        setCanAccessExpenses(isUserOwner)
      }

      setCheckingAccess(false)
    }

    checkAccess()
  }, [user?.id, event.id, event.user_id])

  // Fetch packing items (only if user has access)
  useEffect(() => {
    const fetchPackingItems = async () => {
      if (!canAccessPacking) return

      const supabase = createClient()
      const { data } = await supabase
        .from('packing_items')
        .select('*')
        .eq('itinerary_id', event.id)
        .order('created_at', { ascending: true })

      if (data) {
        // Transform database column names to match component interface
        const transformedItems = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          packed: item.is_packed ?? false,
          tripId: item.itinerary_id,
          category: item.category,
          quantity: item.quantity,
          url: item.url,
        }))
        setPackingItems(transformedItems)
      }
    }
    fetchPackingItems()
  }, [event.id, canAccessPacking])

  // Check if user has liked this itinerary
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!user?.id) {
        setLiked(false)
        return
      }

      const supabase = createClient()
      const { data, error } = await supabase.rpc('user_has_liked', {
        user_uuid: user.id,
        itinerary_uuid: event.id
      })

      if (!error && data !== null) {
        setLiked(data)
      }
    }

    checkLikeStatus()
  }, [user?.id, event.id])

  // Check if it's a multi-day trip
  const startDate = new Date(event.start_date)
  const endDate = new Date(event.end_date)
  const isMultiDay = startDate.toDateString() !== endDate.toDateString()

  // Group activities by day for multi-day trips
  const groupedActivities = activities.reduce((acc: any, activity: any) => {
    const day = activity.day || "Unassigned"
    if (!acc[day]) {
      acc[day] = []
    }
    acc[day].push(activity)
    return acc
  }, {})

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMMM d, yyyy")
    } catch (e) {
      return dateString
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${event.title}"? This action cannot be undone.`)) {
      return
    }

    setIsDeleting(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.from("itineraries").delete().eq("id", event.id)

      if (error) throw error

      toast({
        title: "Event deleted",
        description: "Your event has been successfully deleted.",
      })

      router.push("/dashboard")
    } catch (error: any) {
      console.error("Error deleting event:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete event",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleLike = async () => {
    if (!user?.id) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to like itineraries",
        variant: "destructive",
      })
      return
    }

    setIsLiking(true)

    try {
      const supabase = createClient()

      if (liked) {
        // Unlike: Remove from saved_itineraries
        const { error } = await supabase
          .from("saved_itineraries")
          .delete()
          .eq("user_id", user.id)
          .eq("itinerary_id", event.id)
          .eq("type", "like")

        if (error) throw error

        setLiked(false)
        setLikeCount(Math.max(0, likeCount - 1))

        toast({
          title: "Removed from favorites",
          description: "This itinerary has been removed from your favorites",
        })
      } else {
        // Like: Add to saved_itineraries
        const { error } = await supabase
          .from("saved_itineraries")
          .insert({
            user_id: user.id,
            itinerary_id: event.id,
            type: "like",
            created_at: new Date().toISOString(),
          })

        if (error) {
          // Already liked (duplicate key)
          if (error.code === "23505") {
            setLiked(true)
            return
          }
          throw error
        }

        setLiked(true)
        setLikeCount(likeCount + 1)

        toast({
          title: "Added to favorites",
          description: "This itinerary has been added to your favorites",
        })
      }
    } catch (error: any) {
      console.error("Error toggling like:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update favorite status",
        variant: "destructive",
      })
    } finally {
      setIsLiking(false)
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail || !user) return

    setIsSendingInvite(true)

    try {
      const response = await fetch("/api/invitations/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itineraryId: event.id,
          emails: [inviteEmail],
          itineraryTitle: event.title,
          senderName: user.user_metadata?.name || user.email?.split("@")[0] || "Someone",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send invitation")
      }

      toast({
        title: "Invitation sent!",
        description: `An invitation has been sent to ${inviteEmail}`,
      })

      setInviteEmail("")
      setShowInviteModal(false)
    } catch (error: any) {
      console.error("Error sending invitation:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      })
    } finally {
      setIsSendingInvite(false)
    }
  }

  return (
    <div className="container px-4 py-6 md:py-10">
      <Link href="/app" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Link>

      <div className="max-w-4xl mx-auto">
        <div className="relative rounded-xl overflow-hidden mb-6">
          {event.image_url ? (
            <img
              src={event.image_url || "/placeholder.svg"}
              alt={event.title}
              className="w-full h-64 md:h-96 object-cover"
            />
          ) : (
            <div className="w-full h-64 md:h-96 bg-gradient-to-br from-orange-400 via-pink-400 to-purple-500 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
              <span className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg z-10 text-center px-4">{event.title}</span>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-6 md:p-8">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{event.title}</h1>
                <div className="flex items-center text-white/90 text-sm">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>
                    {formatDate(event.start_date)}
                    {event.end_date && event.end_date !== event.start_date && <> - {formatDate(event.end_date)}</>}
                  </span>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/20 backdrop-blur-sm border-white/40 text-white hover:bg-white/30"
                  onClick={handleLike}
                  disabled={isLiking}
                >
                  <Heart className={`h-4 w-4 mr-2 ${liked ? "fill-red-500 text-red-500" : ""}`} />
                  {liked ? "Liked" : "Like"}
                  {likeCount > 0 && <span className="ml-1">({likeCount})</span>}
                </Button>

                <ShareDialog
                  itineraryId={event.id}
                  title={event.title}
                  description={event.description}
                  userId={user?.id}
                  trigger={
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white/20 backdrop-blur-sm border-white/40 text-white hover:bg-white/30"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  }
                />

                <CalendarExportButton
                  event={{
                    title: event.title,
                    description: event.description || undefined,
                    location: event.location || undefined,
                    startDate: event.start_date,
                    endDate: event.end_date,
                    url: typeof window !== "undefined" ? window.location.href : undefined,
                  }}
                  size="sm"
                  showLabel={true}
                  variant="outline"
                />

                {isOwner && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white/20 backdrop-blur-sm border-white/40 text-white hover:bg-white/30"
                      asChild
                    >
                      <Link href={`/create?draftId=${event.id}`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Link>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-red-500/20 backdrop-blur-sm border-red-300/40 text-white hover:bg-red-500/30"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {isDeleting ? "Deleting..." : "Delete"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-start mb-4">
            {event.location && (
              <div className="flex items-center text-sm text-muted-foreground mr-4">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{event.location}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              {event.host_avatar && (
                <img
                  src={event.host_avatar}
                  alt={event.host_name}
                  className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                />
              )}
              <div>
                <div className="text-sm font-medium text-gray-900">
                  Hosted by {event.host_name || "Anonymous"}
                </div>
                {event.host_username && (
                  <div className="text-xs text-muted-foreground">{event.host_username}</div>
                )}
              </div>
            </div>
          </div>

          {event.description && (
            <p className="text-gray-700 mb-6 leading-relaxed">{event.description}</p>
          )}

          {!event.is_public && (
            <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-amber-800">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium">Private Event</span>
                <span className="text-amber-600">• Only visible to invited guests</span>
              </div>
            </div>
          )}
        </div>

        {/* Mutuals Section */}
        <div className="mb-8 rounded-xl bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 p-8 shadow-xl">
          <MutualsSection eventId={event.id} limit={8} showSeeAll={true} />
        </div>

        <Tabs defaultValue="schedule" className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="packing">Packing List</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="attendees">Attendees</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule">
            {activities.length > 0 ? (
              <div className="space-y-6">
                {isMultiDay ? (
                  // Multi-day trip: group by day
                  Object.entries(groupedActivities)
                    .sort((a, b) => {
                      // Sort by day number (Day 1, Day 2, etc.)
                      const dayA = a[0].match(/\d+/)?.[0] || "0"
                      const dayB = b[0].match(/\d+/)?.[0] || "0"
                      return parseInt(dayA) - parseInt(dayB)
                    })
                    .map(([day, dayActivities]: [string, any]) => (
                    <div key={day}>
                      <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b pb-2">{day}</h3>
                      <div className="space-y-3">
                        {dayActivities.map((activity: any) => (
                          <Card key={activity.id} className="overflow-hidden">
                            <CardContent className="p-4">
                              <div>
                                <h4 className="font-medium">{activity.title}</h4>
                                {activity.location && (
                                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    <span>{activity.location}</span>
                                  </div>
                                )}
                                {activity.start_time && (
                                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                                    <Clock className="h-3 w-3 mr-1" />
                                    <span>
                                      {new Date(activity.start_time).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </div>
                                )}
                                {activity.description && <p className="text-sm mt-2 text-gray-600">{activity.description}</p>}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  // Single day event: show all activities
                  <div className="space-y-3">
                    {activities.map((activity: any) => (
                      <Card key={activity.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div>
                            <h4 className="font-medium">{activity.title}</h4>
                            {activity.location && (
                              <div className="flex items-center text-sm text-muted-foreground mt-1">
                                <MapPin className="h-3 w-3 mr-1" />
                                <span>{activity.location}</span>
                              </div>
                            )}
                            {activity.start_time && (
                              <div className="flex items-center text-sm text-muted-foreground mt-1">
                                <Clock className="h-3 w-3 mr-1" />
                                <span>
                                  {new Date(activity.start_time).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            )}
                            {activity.description && <p className="text-sm mt-2 text-gray-600">{activity.description}</p>}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No activities have been added to this event yet.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="details">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-1">Date & Time</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(event.start_date)}
                      {event.end_date && event.end_date !== event.start_date && <> - {formatDate(event.end_date)}</>}
                    </p>
                  </div>

                  {event.location && (
                    <div>
                      <h3 className="font-medium mb-1">Location</h3>
                      <p className="text-sm text-muted-foreground mb-3">{event.location}</p>
                      <EventMap location={event.location} title={event.title} className="h-64" />
                    </div>
                  )}

                  <div>
                    <h3 className="font-medium mb-1">Visibility</h3>
                    <p className="text-sm text-muted-foreground">
                      {event.is_public
                        ? "Public - Anyone can see this event"
                        : "Private - Only invited people can see this event"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="photos">
            <PhotoGalleryLoader eventId={event.id} isOwner={isOwner} />
          </TabsContent>

          <TabsContent value="packing">
            {checkingAccess ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : canAccessPacking ? (
              <PackingList
                simplified={false}
                items={packingItems}
                tripId={event.id}
              />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-amber-100 p-4 mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-amber-600"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Packing List is Private</h3>
                  <p className="text-muted-foreground max-w-md">
                    This packing list is only visible to the event owner and invited guests.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="expenses">
            {checkingAccess ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : canAccessExpenses ? (
              <EnhancedExpenseTracker
                itineraryId={event.id}
                participants={(event.attendees as Attendee[] || []).length > 0 ? (event.attendees as Attendee[]) : [
                  {
                    id: event.user_id,
                    name: event.host_name || "Host",
                    avatar_url: event.host_avatar,
                  },
                ]}
                currentUserId={user?.id}
              />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-amber-100 p-4 mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-amber-600"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Expenses are Private</h3>
                  <p className="text-muted-foreground max-w-md">
                    Expense details are only visible to the event owner and invited guests.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="attendees">
            <div className="text-center py-8">
              <p className="text-muted-foreground">No attendees yet.</p>
              {isOwner && (
                <Button className="mt-4" onClick={() => setShowInviteModal(true)}>
                  <Users className="h-4 w-4 mr-2" />
                  Invite Friends
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="comments">
            <CommentsSection
              itineraryId={event.id}
              currentUserId={user?.id}
            />
          </TabsContent>
        </Tabs>

        {/* Invite Friends Modal */}
        <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Friends</DialogTitle>
              <DialogDescription>
                Send an invitation to join &quot;{event.title}&quot; via email
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="friend@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && inviteEmail) {
                      handleInvite()
                    }
                  }}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowInviteModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInvite} disabled={!inviteEmail || isSendingInvite}>
                  {isSendingInvite ? "Sending..." : "Send Invitation"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
