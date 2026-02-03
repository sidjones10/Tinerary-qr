"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, MapPin, Calendar, Grid3X3, Bookmark, Share2, MoreHorizontal, ExternalLink, FileEdit, Settings, Loader2, Trash2, Edit } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { getUserDrafts, deleteDraft, type EventDraft } from "@/app/actions/draft-actions"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface UserProfile {
  id: string
  name: string | null
  display_name: string | null
  username: string | null
  avatar_url: string | null
  bio: string | null
  location: string | null
  website: string | null
  created_at: string
}

interface Itinerary {
  id: string
  title: string
  description: string | null
  cover_image: string | null
  start_date: string | null
  end_date: string | null
  is_public: boolean
  created_at: string
  type: string | null
}

export default function UnifiedProfilePage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [itineraries, setItineraries] = useState<Itinerary[]>([])
  const [drafts, setDrafts] = useState<EventDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [draftsLoading, setDraftsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [deletingDraftId, setDeletingDraftId] = useState<string | null>(null)
  const [draftToDelete, setDraftToDelete] = useState<string | null>(null)

  const isOwnProfile = currentUserId === userId

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient()

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)

      // Fetch the profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()

      if (profileError) {
        console.error("Error fetching profile:", profileError)
        setError("User not found")
        setLoading(false)
        return
      }

      setProfile(profileData)

      // Fetch itineraries - all for own profile, only public for others
      const isOwn = user?.id === userId
      let query = supabase
        .from("itineraries")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (!isOwn) {
        query = query.eq("is_public", true)
      }

      const { data: itinerariesData, error: itinerariesError } = await query

      if (!itinerariesError && itinerariesData) {
        setItineraries(itinerariesData)
      }

      // Fetch drafts if own profile
      if (isOwn) {
        setDraftsLoading(true)
        try {
          const { success, drafts: userDrafts } = await getUserDrafts()
          if (success && userDrafts) {
            setDrafts(userDrafts)
          }
        } catch (err) {
          console.error("Error fetching drafts:", err)
        } finally {
          setDraftsLoading(false)
        }
      }

      setLoading(false)
    }

    if (userId) {
      fetchProfile()
    }
  }, [userId])

  const handleShare = async () => {
    const url = `${window.location.origin}/user/${userId}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: profile?.name || profile?.display_name || "User Profile",
          url: url,
        })
      } catch (err) {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(url)
      alert("Profile link copied to clipboard!")
    }
  }

  const handleDeleteDraft = async (draftId: string) => {
    setDeletingDraftId(draftId)
    try {
      const { success } = await deleteDraft(draftId)
      if (success) {
        setDrafts(drafts.filter(d => d.id !== draftId))
      }
    } catch (err) {
      console.error("Error deleting draft:", err)
    } finally {
      setDeletingDraftId(null)
    }
  }

  const getInitials = (name: string | null) => {
    if (!name) return "?"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return ""
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const displayName = profile?.name || profile?.display_name || "Anonymous"

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex items-center justify-between px-4 h-14">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Skeleton className="h-5 w-32" />
            <div className="w-10" />
          </div>
        </header>
        <div className="px-4 py-6">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-16 w-full max-w-md" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex items-center justify-between px-4 h-14">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <span className="font-semibold">Profile</span>
            <div className="w-10" />
          </div>
        </header>
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <p className="text-muted-foreground text-lg">User not found</p>
          <Button variant="outline" className="mt-4 cute-cta-btn" onClick={() => router.push("/discover")}>
            Back to Discover
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between px-4 h-14">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="font-semibold">{profile.username || displayName}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share Profile
              </DropdownMenuItem>
              {profile.website && (
                <DropdownMenuItem asChild>
                  <a href={profile.website} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Visit Website
                  </a>
                </DropdownMenuItem>
              )}
              {isOwnProfile && (
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Profile Info */}
      <div className="px-4 py-6">
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
            <AvatarImage src={profile.avatar_url || undefined} alt={displayName} />
            <AvatarFallback className="text-2xl bg-gradient-to-br from-pink-500 to-purple-600 text-white">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>

          <h1 className="mt-4 text-xl font-bold">{displayName}</h1>

          {profile.username && (
            <p className="text-muted-foreground">@{profile.username}</p>
          )}

          {profile.bio && (
            <p className="mt-3 text-sm text-foreground/80 max-w-md leading-relaxed">
              {profile.bio}
            </p>
          )}

          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
            {profile.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{profile.location}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Joined {formatDate(profile.created_at)}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mt-6 py-4 border-y w-full max-w-sm">
            <div className="text-center">
              <p className="text-xl font-bold">{itineraries.length}</p>
              <p className="text-xs text-muted-foreground">Itineraries</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold">0</p>
              <p className="text-xs text-muted-foreground">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold">0</p>
              <p className="text-xs text-muted-foreground">Following</p>
            </div>
          </div>

          {/* Action Buttons */}
          {!isOwnProfile && (
            <div className="flex items-center gap-3 mt-4 w-full max-w-sm">
              <Button
                className={`flex-1 ${isFollowing ? "bg-muted text-foreground hover:bg-muted/80" : "cute-cta-btn"}`}
                onClick={() => setIsFollowing(!isFollowing)}
              >
                {isFollowing ? "Following" : "Follow"}
              </Button>
              <Button variant="outline" className="flex-1">
                Message
              </Button>
              <Button variant="outline" size="icon" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          )}

          {isOwnProfile && (
            <div className="flex items-center gap-3 mt-4">
              <Button variant="outline" className="gap-2" asChild>
                <Link href="/settings?section=profile">
                  <FileEdit className="h-4 w-4" />
                  Edit Profile
                </Link>
              </Button>
              <Button variant="outline" size="icon" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="itineraries" className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-12 px-4">
          <TabsTrigger
            value="itineraries"
            className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none"
          >
            <Grid3X3 className="h-4 w-4 mr-2" />
            Itineraries
          </TabsTrigger>
          {isOwnProfile && (
            <TabsTrigger
              value="drafts"
              className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none"
            >
              <FileEdit className="h-4 w-4 mr-2" />
              Drafts
            </TabsTrigger>
          )}
          <TabsTrigger
            value="saved"
            className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none"
          >
            <Bookmark className="h-4 w-4 mr-2" />
            Saved
          </TabsTrigger>
        </TabsList>

        <TabsContent value="itineraries" className="mt-0">
          {itineraries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="cute-empty-icon mb-4">
                <Grid3X3 className="h-8 w-8 text-primary" />
              </div>
              <p className="text-muted-foreground mb-4">
                {isOwnProfile ? "You haven't created any itineraries yet" : "No public itineraries yet"}
              </p>
              {isOwnProfile && (
                <Button className="cute-cta-btn" asChild>
                  <Link href="/create">Create Your First Itinerary</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-0.5 p-0.5">
              {itineraries.map((itinerary) => (
                <Link
                  key={itinerary.id}
                  href={`/event/${itinerary.id}`}
                  className="relative aspect-square group"
                >
                  <img
                    src={itinerary.cover_image || "/placeholder.svg"}
                    alt={itinerary.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-center p-2">
                      <p className="font-semibold text-sm line-clamp-2">{itinerary.title}</p>
                      {itinerary.start_date && (
                        <p className="text-xs mt-1">{formatDate(itinerary.start_date)}</p>
                      )}
                      {isOwnProfile && !itinerary.is_public && (
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-yellow-500/80 rounded">Private</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {isOwnProfile && (
          <TabsContent value="drafts" className="mt-0 px-4 py-4">
            {draftsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : drafts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="cute-empty-icon mb-4">
                  <FileEdit className="h-8 w-8 text-primary" />
                </div>
                <p className="text-muted-foreground mb-4">No drafts saved</p>
                <Button className="cute-cta-btn" asChild>
                  <Link href="/create">Start Creating</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {drafts.map((draft) => (
                  <Card key={draft.id} className="cute-card overflow-hidden">
                    {draft.cover_image && (
                      <div className="aspect-video w-full overflow-hidden">
                        <img
                          src={draft.cover_image}
                          alt={draft.title || "Draft"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg line-clamp-1">{draft.title || "Untitled Draft"}</CardTitle>
                      <CardDescription>
                        Last edited {formatDate(draft.updated_at || draft.created_at)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {draft.description || "No description"}
                      </p>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push(`/create?draft=${draft.id}`)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        disabled={deletingDraftId === draft.id}
                        onClick={() => setDraftToDelete(draft.id)}
                      >
                        {deletingDraftId === draft.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}

        <TabsContent value="saved" className="mt-0">
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="cute-empty-icon mb-4">
              <Bookmark className="h-8 w-8 text-primary" />
            </div>
            <p className="text-muted-foreground">
              {isOwnProfile ? "Your saved items will appear here" : "Saved items are private"}
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Draft Confirmation Dialog */}
      <Dialog open={!!draftToDelete} onOpenChange={(open) => !open && setDraftToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Draft?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your draft.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraftToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (draftToDelete) {
                  handleDeleteDraft(draftToDelete)
                  setDraftToDelete(null)
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
