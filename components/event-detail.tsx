"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { ArrowLeft, Calendar, MapPin, Clock, Share2, Heart, Users, Edit, Trash2, Loader2, Flag, Mail, Phone, CheckCircle2, XCircle, UserMinus, X } from "lucide-react"
import { MentionHighlightBadge } from "@/components/mention-highlight-badge"
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
import { ThemeIcon } from "@/components/theme-selector"
import { getFontFamily } from "@/components/font-selector"
import { PostEventCoverPrompt } from "@/components/post-event-cover-prompt"
import { shouldPromptCoverUpdate } from "@/lib/reminder-utils"
import { ReportDialog } from "@/components/report-dialog"
import { RsvpBanner, submitRsvp } from "@/components/rsvp-banner"
import { PartifulRsvpModal } from "@/components/partiful-rsvp-modal"
import { CohostManager } from "@/components/cohost-manager"
import { listCohosts, type Cohost } from "@/app/actions/itinerary-actions"
import { cn, parseLocalDate } from "@/lib/utils"

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
  packing_list_public?: boolean
  expenses_public?: boolean
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

interface InvitationInfo {
  id: string
  invitee_id?: string // the invitee's profile/user ID
  status: "pending" | "accepted" | "declined" | "tentative"
  created_at: string
  invitee_name?: string
  invitee_email?: string
  invitee_avatar?: string
  is_pending_invitation?: boolean // for non-user pending invitations
  contact?: string // email or phone for pending invitations
}

interface EventDetailProps {
  event: Event
  packingItems?: PackingItem[]
}

// Component to fetch and display photos
function PhotoGalleryLoader({ eventId, isOwner }: { eventId: string; isOwner: boolean }) {
  const [photos, setPhotos] = useState<EventPhoto[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPhotos = async (cancelled?: { current: boolean }) => {
    setLoading(true)
    const result = await getEventPhotos(eventId)
    if (cancelled?.current) return
    if (result.success && result.photos) {
      setPhotos(result.photos)
    }
    setLoading(false)
  }

  useEffect(() => {
    const cancelled = { current: false }
    fetchPhotos(cancelled)
    return () => { cancelled.current = true }
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
  const [canAccessComments, setCanAccessComments] = useState(false)
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [coverImage, setCoverImage] = useState(event.image_url as string | undefined)
  const [showCoverPrompt, setShowCoverPrompt] = useState(false)
  const [highlightsByActivity, setHighlightsByActivity] = useState<Record<string, any>>({})
  const [invitations, setInvitations] = useState<InvitationInfo[]>([])
  const [loadingInvitations, setLoadingInvitations] = useState(false)
  const [removingInvitationId, setRemovingInvitationId] = useState<string | null>(null)
  const [showRsvpModal, setShowRsvpModal] = useState(false)
  const [myInvitation, setMyInvitation] = useState<{ id: string; status: "pending" | "accepted" | "declined" | "tentative" } | null>(null)
  const [arrivedViaInviteLink, setArrivedViaInviteLink] = useState(false)
  const [attendeeCounts, setAttendeeCounts] = useState<{ going: number; maybe: number }>({ going: 1, maybe: 0 }) // 1 = host
  const [invitationsEnabled, setInvitationsEnabled] = useState<boolean>(event.invitations_enabled !== false)
  const [cohosts, setCohosts] = useState<Cohost[]>([])
  const isOwner = !!(user && user.id === event.user_id)
  const searchParams = useSearchParams()

  // Fetch co-hosts (admins) to display alongside the host (non-blocking)
  useEffect(() => {
    let cancelled = false
    listCohosts(event.id).then((res) => {
      if (cancelled || !res.success) return
      setCohosts(res.data.filter((c) => c.role === "admin" && c.user_id !== event.user_id))
    })
    return () => {
      cancelled = true
    }
  }, [event.id, event.user_id])

  // Track if user arrived via an invite link so we can show the RSVP banner
  useEffect(() => {
    if (searchParams.get("invite") === "true" && user && !isOwner) {
      setArrivedViaInviteLink(true)
    }
  }, [searchParams, user, isOwner])

  // Fetch mention highlights for this itinerary (non-blocking)
  useEffect(() => {
    let cancelled = false
    const fetchHighlights = async () => {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from("mention_highlights")
          .select(`
            id,
            booking_url,
            offer_text,
            badge_style,
            expires_at,
            business_mentions!inner (
              itinerary_id,
              activity_id,
              matched_text,
              business_id,
              businesses (
                id, name, logo, website
              )
            )
          `)
          .eq("business_mentions.itinerary_id", event.id)
          .gte("expires_at", new Date().toISOString())

        if (cancelled) return
        if (data) {
          const map: Record<string, any> = {}
          data.forEach((h: any) => {
            const mention = Array.isArray(h.business_mentions) ? h.business_mentions[0] : h.business_mentions
            if (mention?.activity_id) {
              map[mention.activity_id] = {
                ...h,
                business_mentions: mention,
              }
            }
          })
          setHighlightsByActivity(map)
        }
      } catch {
        // Highlights are optional; fail silently
      }
    }

    fetchHighlights()
    return () => { cancelled = true }
  }, [event.id])

  // Fetch invitations for this itinerary
  const fetchInvitations = async () => {
    setLoadingInvitations(true)
    try {
      const supabase = createClient()

      // Fetch user invitations (existing users)
      // RLS allows invitees to see their own invitation; owners see all.
      // For non-owners we query all invitations for this itinerary — RLS may
      // restrict what comes back, but accepted/tentative users typically have
      // attendee records visible to anyone.
      const { data: userInvites } = await supabase
        .from("itinerary_invitations")
        .select(`
          id, status, created_at,
          invitee:profiles!invitee_id (id, name, email, avatar_url)
        `)
        .eq("itinerary_id", event.id)
        .order("created_at", { ascending: false })

      // Fetch pending invitations (non-users) — only owners can see these
      let pendingInvites: any[] | null = null
      if (isOwner) {
        const { data } = await supabase
          .from("pending_invitations")
          .select("id, email, status, created_at")
          .eq("itinerary_id", event.id)
          .order("created_at", { ascending: false })
        pendingInvites = data
      }

      const allInvitations: InvitationInfo[] = []

      if (userInvites) {
        for (const inv of userInvites) {
          const invitee = inv.invitee as any
          allInvitations.push({
            id: inv.id,
            invitee_id: invitee?.id,
            status: inv.status as "pending" | "accepted" | "declined",
            created_at: inv.created_at,
            invitee_name: invitee?.name || "Unknown",
            invitee_email: isOwner ? invitee?.email : undefined,
            invitee_avatar: invitee?.avatar_url,
          })
        }
      }

      if (pendingInvites) {
        for (const inv of pendingInvites) {
          allInvitations.push({
            id: inv.id,
            status: inv.status as "pending",
            created_at: inv.created_at,
            is_pending_invitation: true,
            contact: inv.email, // could be email or phone
          })
        }
      }

      setInvitations(allInvitations)
    } catch (err) {
      console.error("Error fetching invitations:", err)
    } finally {
      setLoadingInvitations(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    const doFetch = async () => {
      await fetchInvitations()
    }
    doFetch()
    return () => { cancelled = true }
  }, [event.id, isOwner])

  // Fetch attendee counts (visible to everyone via itinerary_attendees + invitations)
  const fetchAttendeeCounts = async (cancelled?: { current: boolean }) => {
    const supabase = createClient()

    // Count accepted attendees (from itinerary_attendees table, accessible to all)
    const { count: attendeeCount } = await supabase
      .from("itinerary_attendees")
      .select("*", { count: "exact", head: true })
      .eq("itinerary_id", event.id)

    if (cancelled?.current) return

    // For tentative count, we need invitations — only owners can see all via RLS
    // For non-owners, this will return 0 (acceptable tradeoff)
    const { count: tentativeCount } = await supabase
      .from("itinerary_invitations")
      .select("*", { count: "exact", head: true })
      .eq("itinerary_id", event.id)
      .eq("status", "tentative")

    if (cancelled?.current) return

    setAttendeeCounts({
      going: Math.max(1, attendeeCount || 1), // At least the host
      maybe: tentativeCount || 0,
    })
  }

  useEffect(() => {
    const cancelled = { current: false }
    fetchAttendeeCounts(cancelled)
    return () => { cancelled.current = true }
  }, [event.id])

  // Fetch current user's invitation status (for non-owners)
  useEffect(() => {
    let cancelled = false
    const fetchMyInvitation = async () => {
      if (!user?.id || isOwner) return

      // Check localStorage cache first (fallback when Supabase queries fail)
      const cacheKey = `rsvp_${event.id}_${user.id}`
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          if (!cancelled && parsed.id && parsed.status) {
            setMyInvitation({ id: parsed.id, status: parsed.status })
          }
        } catch { /* ignore malformed cache */ }
      }

      const supabase = createClient()
      const { data, error } = await supabase
        .from("itinerary_invitations")
        .select("id, status")
        .eq("itinerary_id", event.id)
        .eq("invitee_id", user.id)
        .limit(1)
        .maybeSingle()

      if (!cancelled && data) {
        setMyInvitation({ id: data.id, status: data.status as any })
        // Update cache with fresh DB data
        localStorage.setItem(cacheKey, JSON.stringify({ id: data.id, status: data.status }))
      } else if (error) {
        // DB query failed (e.g. 500 from PostgREST) — cache already applied above
        console.warn("Failed to fetch invitation status from DB, using cache:", error.message)
      }
    }

    fetchMyInvitation()
    return () => { cancelled = true }
  }, [user?.id, event.id, isOwner])

  // Handle ?rsvp= query param from email links or invite links
  useEffect(() => {
    if (!user || isOwner) return
    const rsvpParam = searchParams.get("rsvp")
    if (!rsvpParam) return

    const validResponses = ["accept", "decline", "tentative"]
    if (!validResponses.includes(rsvpParam)) return

    const controller = new AbortController()

    const statusMap: Record<string, string> = {
      accept: "accepted",
      decline: "declined",
      tentative: "tentative",
    }

    // Only auto-submit if current status is different
    if (myInvitation && myInvitation.status === statusMap[rsvpParam]) {
      // Already at this status, just clean URL
    } else {
      // Use RPC-based submitRsvp (SECURITY DEFINER bypasses RLS)
      submitRsvp(rsvpParam as "accept" | "decline" | "tentative", { itineraryId: event.id })
        .then((result) => {
          if (controller.signal.aborted) return
          setMyInvitation({ id: result.invitationId!, status: statusMap[rsvpParam] as any })
          toast({
            title: rsvpParam === "accept" ? "You're going!" : rsvpParam === "tentative" ? "Marked as maybe" : "You've declined",
            description: `Your response for "${event.title}" has been saved.`,
          })
        })
        .catch((err) => {
          console.error("[RSVP] auto-submit failed:", err)
        })
    }

    // Clean up the URL
    const url = new URL(window.location.href)
    url.searchParams.delete("rsvp")
    url.searchParams.delete("invite")
    window.history.replaceState({}, "", url.toString())

    return () => controller.abort()
  }, [searchParams, myInvitation, user, isOwner])

  // Check if we should show the post-event cover update prompt
  useEffect(() => {
    if (isOwner && event.end_date && !event.cover_update_prompted) {
      const endDate = parseLocalDate(event.end_date)
      if (shouldPromptCoverUpdate(endDate)) {
        setShowCoverPrompt(true)
      }
    }
  }, [isOwner, event.end_date, event.cover_update_prompted])

  // Check access permissions for packing and expenses
  useEffect(() => {
    let cancelled = false
    const checkAccess = async () => {
      setCheckingAccess(true)

      // Owner always has access
      if (isOwner) {
        setCanAccessPacking(true)
        setCanAccessExpenses(true)
        setCanAccessComments(true)
        setCheckingAccess(false)
        return
      }

      const supabase = createClient()

      // Check if user is an accepted invitee for this itinerary
      const { data: invitation } = await supabase
        .from('itinerary_invitations')
        .select('id')
        .eq('itinerary_id', event.id)
        .eq('invitee_id', user?.id)
        .eq('status', 'accepted')
        .limit(1)
        .maybeSingle()

      if (cancelled) return

      const isAttendee = !!invitation

      // Attendees and owners can access private content
      setCanAccessPacking(isAttendee)
      setCanAccessExpenses(isAttendee)
      setCanAccessComments(isAttendee)

      setCheckingAccess(false)
    }

    checkAccess()
    return () => { cancelled = true }
  }, [user?.id, event.id, isOwner])

  // Function to fetch packing items
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

  // Fetch packing items (only if user has access)
  useEffect(() => {
    let cancelled = false
    const doFetch = async () => {
      await fetchPackingItems()
    }
    doFetch()
    return () => { cancelled = true }
  }, [event.id, canAccessPacking])

  // Check if user has liked this itinerary
  useEffect(() => {
    let cancelled = false
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

      if (!cancelled && !error && data !== null) {
        setLiked(data)
      }
    }

    checkLikeStatus()
    return () => { cancelled = true }
  }, [user?.id, event.id])

  // Check if it's a multi-day trip
  const startDate = parseLocalDate(event.start_date)
  const endDate = parseLocalDate(event.end_date)
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
      return format(parseLocalDate(dateString), "MMMM d, yyyy")
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

      // Use toggle_like RPC function which handles RLS properly
      const { data, error } = await supabase.rpc('toggle_like', {
        user_uuid: user.id,
        itinerary_uuid: event.id
      })

      if (error) throw error

      // Update state based on result
      if (data && data.length > 0) {
        const result = data[0]
        setLiked(result.is_liked)
        setLikeCount(result.new_like_count)

        toast({
          title: result.is_liked ? "Added to favorites" : "Removed from favorites",
          description: result.is_liked
            ? "This itinerary has been added to your favorites"
            : "This itinerary has been removed from your favorites",
        })
      } else {
        // Fallback: toggle based on previous state
        const newLikedState = !liked
        setLiked(newLikedState)
        setLikeCount(newLikedState ? likeCount + 1 : Math.max(0, likeCount - 1))

        toast({
          title: newLikedState ? "Added to favorites" : "Removed from favorites",
          description: newLikedState
            ? "This itinerary has been added to your favorites"
            : "This itinerary has been removed from your favorites",
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

    // Detect if input is a phone number or email
    const input = inviteEmail.trim()
    const digitsOnly = input.replace(/[\s\-().]/g, "")
    const isPhoneNumber = input.startsWith("+") || (/^\d+$/.test(digitsOnly) && digitsOnly.length >= 7)

    try {
      const response = await fetch("/api/invitations/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itineraryId: event.id,
          ...(isPhoneNumber ? { phoneNumbers: [input] } : { emails: [input] }),
          itineraryTitle: event.title,
          senderName: user.user_metadata?.name || user.email?.split("@")[0] || "Someone",
          eventDate: event.start_date || undefined,
          eventLocation: event.location || undefined,
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
      fetchInvitations() // Refresh the attendees list
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

  const handleRemoveInvitation = async (invitationId: string, isPending: boolean) => {
    if (!user) return
    setRemovingInvitationId(invitationId)
    try {
      const url = `/api/invitations/${invitationId}${isPending ? "?type=pending" : ""}`
      const response = await fetch(url, { method: "DELETE" })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Failed to remove invitation")
      }

      toast({
        title: "Invitation removed",
        description: "The invitation has been removed successfully.",
      })

      fetchInvitations()
      fetchAttendeeCounts()
    } catch (error: any) {
      console.error("Error removing invitation:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to remove invitation",
        variant: "destructive",
      })
    } finally {
      setRemovingInvitationId(null)
    }
  }

  return (
    <div className="relative min-h-screen">
      {/* Post-event cover update prompt */}
      {showCoverPrompt && isOwner && (
        <PostEventCoverPrompt
          itineraryId={event.id}
          itineraryTitle={event.title}
          eventType={event.start_date === event.end_date ? "event" : "trip"}
          currentCover={coverImage}
          onCoverUpdated={(newUrl) => {
            setCoverImage(newUrl)
            setShowCoverPrompt(false)
          }}
          onDismiss={() => setShowCoverPrompt(false)}
        />
      )}

      {/* Gaussian blur background */}
      {coverImage && (
        <div
          className="fixed inset-0 z-0"
          style={{
            backgroundImage: `url(${coverImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(25px)',
            transform: 'scale(1.1)',
          }}
        />
      )}
      {!coverImage && (
        <div
          className="fixed inset-0 z-0 bg-gradient-to-br from-orange-400 via-pink-400 to-purple-500"
          style={{
            filter: 'blur(25px)',
          }}
        />
      )}
      {/* Overlay for readability */}
      <div className="fixed inset-0 z-0 bg-white/60 dark:bg-black/70 backdrop-blur-sm" />

      {/* Content */}
      <div
        className="relative z-10 container px-4 py-6 md:py-10"
        style={{ fontFamily: getFontFamily((event.font as string) || "default") }}
      >
        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </button>

        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-xl overflow-hidden mb-6 shadow-2xl">
            {coverImage ? (
              <img
                src={coverImage}
                alt={event.title}
                className="w-full h-64 md:h-96 object-cover"
              />
            ) : (
              <div className="w-full h-64 md:h-96 bg-gradient-to-br from-orange-400 via-pink-400 to-purple-500 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
                <span
                  className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg z-10 text-center px-4"
                  style={{ fontFamily: getFontFamily((event.font as string) || "default") }}
                >
                  {event.title}
                </span>
              </div>
            )}

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-6 md:p-8">
            <div className="flex justify-between items-end">
              <div>
                <h1
                  className="text-3xl font-bold text-white mb-2"
                  style={{ fontFamily: getFontFamily((event.font as string) || "default") }}
                >
                  {event.title}
                </h1>
                <div className="flex items-center text-white/90 text-sm gap-2">
                  <ThemeIcon theme={(event.theme as string) || "default"} className="h-4 w-4" />
                  <Calendar className="h-4 w-4" />
                  <span>
                    {formatDate(event.start_date)}
                    {event.end_date && event.end_date !== event.start_date && <> - {formatDate(event.end_date)}</>}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/20 backdrop-blur-sm border-white/40 text-white hover:bg-white/30"
                  onClick={handleLike}
                  disabled={isLiking}
                >
                  <Heart className={`h-4 w-4 ${liked ? "fill-red-500 text-red-500" : ""}`} />
                  <span className="hidden sm:inline ml-2">{liked ? "Liked" : "Like"}</span>
                  {likeCount > 0 && <span className="ml-1">({likeCount})</span>}
                </Button>

                <ShareDialog
                  itineraryId={event.id}
                  title={event.title}
                  description={event.description}
                  userId={user?.id}
                  isOwner={isOwner}
                  invitationsEnabled={invitationsEnabled}
                  onInvitationsEnabledChange={setInvitationsEnabled}
                  trigger={
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white/20 backdrop-blur-sm border-white/40 text-white hover:bg-white/30"
                    >
                      <Share2 className="h-4 w-4" />
                      <span className="hidden sm:inline ml-2">Share</span>
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
                  showLabel={false}
                  variant="outline"
                />

                {!isOwner && event.is_public && user && (
                  <ReportDialog
                    itineraryId={event.id}
                    itineraryTitle={event.title}
                    trigger={
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white/20 backdrop-blur-sm border-white/40 text-white hover:bg-red-500/30"
                      >
                        <Flag className="h-4 w-4" />
                        <span className="hidden sm:inline ml-2">Report</span>
                      </Button>
                    }
                  />
                )}

                {isOwner && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white/20 backdrop-blur-sm border-white/40 text-white hover:bg-white/30"
                      asChild
                    >
                      <Link href={`/create?draftId=${event.id}`}>
                        <Edit className="h-4 w-4" />
                        <span className="hidden sm:inline ml-2">Edit</span>
                      </Link>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-red-500/20 backdrop-blur-sm border-red-300/40 text-white hover:bg-red-500/30"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="hidden sm:inline ml-2">{isDeleting ? "Deleting..." : "Delete"}</span>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4">
              {event.location && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{event.location}</span>
                </div>
              )}

              <div
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                  if (event.user_id) {
                    router.push(`/user/${event.user_id}`)
                  }
                }}
              >
                {event.host_avatar && (
                  <img
                    src={event.host_avatar}
                    alt={event.host_name}
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                  />
                )}
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Hosted by {event.host_name || "Anonymous"}
                  </div>
                  {event.host_username && (
                    <div className="text-xs text-muted-foreground">{event.host_username}</div>
                  )}
                </div>
              </div>

              {cohosts.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {cohosts
                      .filter((c) => c.profile?.avatar_url)
                      .map((c) => (
                        <img
                          key={c.user_id}
                          src={c.profile!.avatar_url as string}
                          alt={c.profile?.name || c.profile?.username || "Co-host"}
                          className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                        />
                      ))}
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Co-Hosted by{" "}
                    {cohosts.map((c, i) => (
                      <span key={c.user_id}>
                        <span
                          className="cursor-pointer hover:underline"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/user/${c.user_id}`)
                          }}
                        >
                          {c.profile?.name || c.profile?.username || "Co-host"}
                        </span>
                        {i < cohosts.length - 1 ? ", " : ""}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Attendee counter */}
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
              <Users className="h-4 w-4" />
              <span className="font-medium text-foreground">
                {attendeeCounts.going} going{attendeeCounts.maybe > 0 ? ` · ${attendeeCounts.maybe} maybe` : ""}
              </span>
            </div>
          </div>

          {event.description && (
            <p
              className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed"
              style={{ fontFamily: getFontFamily((event.font as string) || "default") }}
            >
              {event.description}
            </p>
          )}

          {!event.is_public && (
            <div className="mb-6 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300">
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
                <span className="text-amber-600 dark:text-amber-400">• Only visible to invited guests</span>
              </div>
            </div>
          )}
        </div>

        {/* RSVP Banner — shown to logged-in non-owners who have an invitation, or arrived via invite link (when invitations are enabled) */}
        {user && !isOwner && (myInvitation || (arrivedViaInviteLink && invitationsEnabled)) && (
          <RsvpBanner
            invitationId={myInvitation?.id}
            itineraryId={event.id}
            currentStatus={myInvitation?.status || "pending"}
            eventTitle={event.title}
            hostName={(event.host_name as string) || undefined}
            onStatusChange={(newStatus, newInvitationId) => {
              const invId = newInvitationId || myInvitation?.id || ""
              setMyInvitation({ id: invId, status: newStatus })

              // Persist to localStorage so status survives refresh even if DB query fails
              if (user) {
                const cacheKey = `rsvp_${event.id}_${user.id}`
                localStorage.setItem(cacheKey, JSON.stringify({ id: invId, status: newStatus }))
              }

              // Optimistically add/update the current user in the attendees list
              // so they appear immediately without waiting for the DB round-trip
              if (user) {
                setInvitations((prev) => {
                  const existing = prev.find((inv) => inv.invitee_id === user.id)
                  if (existing) {
                    return prev.map((inv) =>
                      inv.invitee_id === user.id
                        ? { ...inv, status: newStatus as any }
                        : inv
                    )
                  }
                  // Add new entry for the current user
                  return [
                    {
                      id: invId,
                      invitee_id: user.id,
                      status: newStatus as any,
                      created_at: new Date().toISOString(),
                      invitee_name: user.user_metadata?.name || user.email?.split("@")[0] || "You",
                      invitee_avatar: user.user_metadata?.avatar_url,
                    },
                    ...prev,
                  ]
                })
              }

              // Also refresh from DB (may return more data if RLS allows)
              fetchInvitations()
              fetchAttendeeCounts()
            }}
          />
        )}

        {/* Mutuals Section */}
        <div className="mb-8">
          <MutualsSection eventId={event.id} limit={8} showSeeAll={true} />
        </div>

        <Tabs defaultValue="schedule" className="mb-8">
          <div className="overflow-x-auto pb-2 mb-4">
            <TabsList className="inline-flex w-max">
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
              <TabsTrigger value="packing" className="relative">
                Packing List
                {isOwner && !event.packing_list_public && (
                  <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                    Private
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="expenses" className="relative">
                Expenses
                {isOwner && !event.expenses_public && (
                  <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                    Private
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="attendees">Attendees</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
            </TabsList>
          </div>

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
                      <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200 border-b pb-2">{day}</h3>
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
                                {activity.description && <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">{activity.description}</p>}
                                {highlightsByActivity[activity.id] && (
                                  <MentionHighlightBadge highlight={highlightsByActivity[activity.id]} />
                                )}
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
                            {activity.description && <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">{activity.description}</p>}
                            {highlightsByActivity[activity.id] && (
                              <MentionHighlightBadge highlight={highlightsByActivity[activity.id]} />
                            )}
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
                onItemsChange={fetchPackingItems}
              />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-4 mb-4">
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
                participants={(() => {
                  // Start with confirmed attendees
                  const attendees = (event.attendees as Attendee[] || []).length > 0
                    ? [...(event.attendees as Attendee[])]
                    : [{
                        id: event.user_id,
                        name: event.host_name || "Host",
                        avatar_url: event.host_avatar,
                      }]

                  // Add invited users from invitations state (registered users only)
                  const attendeeIds = new Set(attendees.map(a => a.id))
                  invitations.forEach(inv => {
                    // Skip non-user pending invitations (no profile/id to reference)
                    if (inv.is_pending_invitation || !inv.invitee_id) return
                    // Skip declined invitations
                    if (inv.status === "declined") return
                    // Skip if already in attendees list
                    if (attendeeIds.has(inv.invitee_id)) return

                    attendees.push({
                      id: inv.invitee_id,
                      name: inv.invitee_name || "Invited User",
                      avatar_url: inv.invitee_avatar,
                      role: inv.status === "tentative" ? "tentative" : "invited",
                    })
                    attendeeIds.add(inv.invitee_id)
                  })

                  return attendees
                })()}
                currentUserId={user?.id}
                isOwner={!!user?.id && user.id === event.user_id}
              />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-4 mb-4">
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
            <div className="mb-6 rounded-lg border bg-card p-4">
              <CohostManager itineraryId={event.id} isOwner={isOwner} />
            </div>
            {loadingInvitations ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : invitations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No attendees yet.</p>
                {isOwner && (
                  <Button className="mt-4" onClick={() => setShowInviteModal(true)}>
                    <Users className="h-4 w-4 mr-2" />
                    Invite Friends
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  {invitations.map((inv) => {
                    const isMe = !!(user && inv.invitee_id === user.id)
                    return (
                    <div
                      key={inv.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border bg-card",
                        isMe && "ring-1 ring-emerald-300 dark:ring-emerald-700"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {inv.invitee_avatar ? (
                          <img
                            src={inv.invitee_avatar}
                            alt={inv.invitee_name || ""}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                            {inv.is_pending_invitation ? (
                              inv.contact?.includes("@") ? (
                                <Mail className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Phone className="h-4 w-4 text-muted-foreground" />
                              )
                            ) : (
                              <Users className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium">
                            {inv.is_pending_invitation
                              ? inv.contact
                              : inv.invitee_name}
                            {isMe && <span className="text-xs text-muted-foreground ml-1">(You)</span>}
                          </p>
                          {!inv.is_pending_invitation && inv.invitee_email && (
                            <p className="text-xs text-muted-foreground">{inv.invitee_email}</p>
                          )}
                          {inv.is_pending_invitation && (
                            <p className="text-xs text-muted-foreground">Not yet signed up</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Current user sees a status badge that opens the Partiful-style RSVP modal */}
                        {!isOwner && user && inv.invitee_id === user.id ? (
                          <button
                            onClick={() => setShowRsvpModal(true)}
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-105 hover:shadow-md cursor-pointer",
                              myInvitation?.status === "accepted" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
                              myInvitation?.status === "tentative" && "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
                              myInvitation?.status === "declined" && "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
                              myInvitation?.status === "pending" && "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-300",
                              !myInvitation?.status && "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                            )}
                          >
                            <span className="text-sm">
                              {myInvitation?.status === "accepted" ? "👍" : myInvitation?.status === "tentative" ? "🤔" : myInvitation?.status === "declined" ? "😢" : "✉️"}
                            </span>
                            {myInvitation?.status === "accepted" ? "Going" : myInvitation?.status === "tentative" ? "Maybe" : myInvitation?.status === "declined" ? "Can't Go" : "RSVP"}
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {inv.status === "accepted" ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span className="text-xs text-green-600 dark:text-green-400">Going</span>
                              </>
                            ) : inv.status === "declined" ? (
                              <>
                                <XCircle className="h-4 w-4 text-red-500" />
                                <span className="text-xs text-red-600 dark:text-red-400">Can&apos;t Go</span>
                              </>
                            ) : inv.status === "tentative" ? (
                              <>
                                <Clock className="h-4 w-4 text-amber-500" />
                                <span className="text-xs text-amber-600 dark:text-amber-400">Maybe</span>
                              </>
                            ) : (
                              <>
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span className="text-xs text-muted-foreground">Pending</span>
                              </>
                            )}
                          </div>
                        )}
                        {isOwner && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveInvitation(inv.id, !!inv.is_pending_invitation)}
                            disabled={removingInvitationId === inv.id}
                            title="Remove invitation"
                          >
                            {removingInvitationId === inv.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <UserMinus className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                    )
                  })}
                </div>
                {isOwner && (
                  <div className="flex justify-center">
                    <Button variant="outline" onClick={() => setShowInviteModal(true)}>
                      <Users className="h-4 w-4 mr-2" />
                      Invite More
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="comments">
            {checkingAccess ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : canAccessComments ? (
              <CommentsSection
                itineraryId={event.id}
                currentUserId={user?.id}
                itineraryOwnerId={event.user_id}
              />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-4 mb-4">
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
                  <h3 className="text-lg font-semibold mb-2">Comments are Private</h3>
                  <p className="text-muted-foreground max-w-md">
                    Comments are only visible to the event creator and attendees.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Invite Friends Modal */}
        <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Friends</DialogTitle>
              <DialogDescription>
                Send an invitation to join &quot;{event.title}&quot; via email or phone number
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email or Phone Number</Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="friend@example.com or +1 555-123-4567"
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

        {/* Partiful-style RSVP Modal */}
        <PartifulRsvpModal
          open={showRsvpModal}
          onOpenChange={setShowRsvpModal}
          itineraryId={event.id}
          invitationId={myInvitation?.id}
          currentStatus={myInvitation?.status}
          userName={user?.user_metadata?.name || user?.email?.split("@")[0] || ""}
          onStatusChange={(newStatus, invId) => {
            setMyInvitation({ id: invId || myInvitation?.id || "", status: newStatus as any })
            setInvitations((prev) =>
              prev.map((inv) =>
                inv.invitee_id === user?.id ? { ...inv, status: newStatus as any } : inv
              )
            )
            fetchInvitations()
            fetchAttendeeCounts()
          }}
        />
      </div>
    </div>
  </div>
  )
}
