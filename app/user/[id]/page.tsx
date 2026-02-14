"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, MapPin, Calendar, Grid3X3, Bookmark, Share2, MoreHorizontal, ExternalLink, FileEdit, Settings, Loader2, Trash2, Edit, MessageCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { getUserDrafts, deleteDraft, type EventDraft } from "@/app/actions/draft-actions"
import { FollowButton } from "@/components/follow-button"
import { getFollowCounts } from "@/lib/follow-service"
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [deletingDraftId, setDeletingDraftId] = useState<string | null>(null)
  const [draftToDelete, setDraftToDelete] = useState<string | null>(null)
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 })

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

      // Fetch follow counts
      const countsResult = await getFollowCounts(userId)
      if (countsResult.success && countsResult.counts) {
        setFollowCounts(countsResult.counts)
      }

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
      <div className="min-h-screen bg-gradient-to-b from-orange-50 via-pink-50 to-white">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-orange-100">
          <div className="flex items-center justify-between px-4 h-14">
            <Button variant="ghost" size="icon" aria-label="Go back" onClick={() => router.back()} className="hover:bg-orange-100">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Skeleton className="h-5 w-32" />
            <div className="w-10" />
          </div>
        </header>
        <div className="px-4 py-8">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-28 w-28 rounded-full" />
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
      <div className="min-h-screen bg-gradient-to-b from-orange-50 via-pink-50 to-white">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-orange-100">
          <div className="flex items-center justify-between px-4 h-14">
            <Button variant="ghost" size="icon" aria-label="Go back" onClick={() => router.back()} className="hover:bg-orange-100">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <span className="font-semibold text-gray-800">Profile</span>
            <div className="w-10" />
          </div>
        </header>
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-200 to-pink-200 flex items-center justify-center mb-4">
            <span className="text-3xl">😢</span>
          </div>
          <p className="text-gray-500 text-lg mb-4">User not found</p>
          <Button
            className="bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 text-white rounded-full px-6"
            onClick={() => router.push("/")}
          >
            Back to Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-pink-50/50 to-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-orange-100">
        <div className="flex items-center justify-between px-4 h-14">
          <Button variant="ghost" size="icon" aria-label="Go back" onClick={() => router.back()} className="hover:bg-orange-100 rounded-full">
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </Button>
          <span className="font-semibold text-gray-800">{profile.username ? `@${profile.username}` : displayName}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="More options" className="hover:bg-orange-100 rounded-full">
                <MoreHorizontal className="h-5 w-5 text-gray-700" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuItem onClick={handleShare} className="rounded-lg">
                <Share2 className="h-4 w-4 mr-2" />
                Share Profile
              </DropdownMenuItem>
              {profile.website && (
                <DropdownMenuItem asChild className="rounded-lg">
                  <a href={profile.website} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Visit Website
                  </a>
                </DropdownMenuItem>
              )}
              {isOwnProfile && (
                <DropdownMenuItem asChild className="rounded-lg">
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
      <div className="px-4 py-8">
        <div className="flex flex-col items-center text-center">
          {/* Avatar with gradient ring */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full p-1 -m-1" />
            <Avatar className="h-28 w-28 border-4 border-white shadow-xl relative">
              <AvatarImage src={profile.avatar_url || undefined} alt={displayName} />
              <AvatarFallback className="text-2xl bg-gradient-to-br from-orange-400 to-pink-500 text-white font-bold">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
          </div>

          <h1 className="mt-5 text-2xl font-bold text-gray-900">{displayName}</h1>

          {profile.username && (
            <p className="text-orange-600 font-medium">@{profile.username}</p>
          )}

          {profile.bio && (
            <p className="mt-4 text-gray-600 max-w-md leading-relaxed px-4">
              {profile.bio}
            </p>
          )}

          <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
            {profile.location && (
              <div className="flex items-center gap-1 bg-white/60 px-3 py-1 rounded-full">
                <MapPin className="h-3.5 w-3.5 text-orange-500" />
                <span>{profile.location}</span>
              </div>
            )}
            <div className="flex items-center gap-1 bg-white/60 px-3 py-1 rounded-full">
              <Calendar className="h-3.5 w-3.5 text-pink-500" />
              <span>Joined {formatDate(profile.created_at)}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-2 mt-6 w-full max-w-sm">
            <div className="flex-1 text-center bg-white/70 backdrop-blur-sm rounded-2xl py-4 px-3 shadow-sm">
              <p className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">{itineraries.length}</p>
              <p className="text-xs text-gray-500 mt-1">Itineraries</p>
            </div>
            <Link href={`/followers/${userId}`} className="flex-1">
              <div className="text-center bg-white/70 backdrop-blur-sm rounded-2xl py-4 px-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <p className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">{followCounts.followers}</p>
                <p className="text-xs text-gray-500 mt-1">Followers</p>
              </div>
            </Link>
            <Link href={`/following/${userId}`} className="flex-1">
              <div className="text-center bg-white/70 backdrop-blur-sm rounded-2xl py-4 px-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <p className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">{followCounts.following}</p>
                <p className="text-xs text-gray-500 mt-1">Following</p>
              </div>
            </Link>
          </div>

          {/* Action Buttons */}
          {!isOwnProfile && (
            <div className="flex items-center gap-3 mt-6 w-full max-w-sm">
              <FollowButton
                userId={userId}
                className="flex-1 rounded-full h-11"
                onFollowChange={(isFollowing) => {
                  setFollowCounts(prev => ({
                    ...prev,
                    followers: isFollowing ? prev.followers + 1 : prev.followers - 1
                  }))
                }}
              />
              <Button
                variant="outline"
                className="flex-1 rounded-full h-11 border-orange-200 hover:bg-orange-50 hover:border-orange-300"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Message
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleShare}
                aria-label="Share profile"
                className="rounded-full h-11 w-11 border-orange-200 hover:bg-orange-50 hover:border-orange-300"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          )}

          {isOwnProfile && (
            <div className="flex items-center gap-3 mt-6">
              <Button
                variant="outline"
                className="rounded-full px-6 h-11 border-orange-200 hover:bg-orange-50 hover:border-orange-300 gap-2"
                asChild
              >
                <Link href="/settings?section=profile">
                  <FileEdit className="h-4 w-4" />
                  Edit Profile
                </Link>
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleShare}
                aria-label="Share profile"
                className="rounded-full h-11 w-11 border-orange-200 hover:bg-orange-50 hover:border-orange-300"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="itineraries" className="w-full">
        <TabsList className="w-full justify-start rounded-none bg-transparent h-14 px-4 border-b border-orange-100">
          <TabsTrigger
            value="itineraries"
            className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:shadow-none rounded-none text-gray-500 font-medium"
          >
            <Grid3X3 className="h-4 w-4 mr-2" />
            Itineraries
          </TabsTrigger>
          {isOwnProfile && (
            <TabsTrigger
              value="drafts"
              className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:shadow-none rounded-none text-gray-500 font-medium"
            >
              <FileEdit className="h-4 w-4 mr-2" />
              Drafts
            </TabsTrigger>
          )}
          <TabsTrigger
            value="saved"
            className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:shadow-none rounded-none text-gray-500 font-medium"
          >
            <Bookmark className="h-4 w-4 mr-2" />
            Saved
          </TabsTrigger>
        </TabsList>

        <TabsContent value="itineraries" className="mt-0">
          {itineraries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center mb-4">
                <Grid3X3 className="h-7 w-7 text-orange-400" />
              </div>
              <p className="text-gray-500 mb-4">
                {isOwnProfile ? "You haven't created any itineraries yet" : "No public itineraries yet"}
              </p>
              {isOwnProfile && (
                <Button
                  className="bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600 text-white rounded-full px-6"
                  asChild
                >
                  <Link href="/create">Create Your First Itinerary</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1 p-1">
              {itineraries.map((itinerary) => (
                <Link
                  key={itinerary.id}
                  href={`/event/${itinerary.id}`}
                  className="relative aspect-square group overflow-hidden rounded-lg"
                >
                  <img
                    src={itinerary.cover_image || "/placeholder.svg"}
                    alt={itinerary.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                    <div className="text-white">
                      <p className="font-semibold text-sm line-clamp-1">{itinerary.title}</p>
                      {itinerary.start_date && (
                        <p className="text-xs opacity-80">{formatDate(itinerary.start_date)}</p>
                      )}
                    </div>
                  </div>
                  {isOwnProfile && !itinerary.is_public && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 text-xs bg-orange-500/90 text-white rounded-full">
                      Private
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {isOwnProfile && (
          <TabsContent value="drafts" className="mt-0 px-4 py-4">
            {draftsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              </div>
            ) : drafts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center mb-4">
                  <FileEdit className="h-7 w-7 text-orange-400" />
                </div>
                <p className="text-gray-500 mb-4">No drafts saved</p>
                <Button
                  className="bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600 text-white rounded-full px-6"
                  asChild
                >
                  <Link href="/create">Start Creating</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {drafts.map((draft) => (
                  <Card key={draft.id} className="overflow-hidden rounded-2xl border-orange-100 shadow-sm hover:shadow-md transition-shadow">
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
                      <p className="line-clamp-2 text-sm text-gray-500">
                        {draft.description || "No description"}
                      </p>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 rounded-full border-orange-200 hover:bg-orange-50"
                        onClick={() => router.push(`/create?draft=${draft.id}`)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
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
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center mb-4">
              <Bookmark className="h-7 w-7 text-orange-400" />
            </div>
            <p className="text-gray-500">
              {isOwnProfile ? "Your saved itineraries will appear here" : "Saved itineraries are private"}
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Draft Confirmation Dialog */}
      <Dialog open={!!draftToDelete} onOpenChange={(open) => !open && setDraftToDelete(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Delete Draft?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your draft.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDraftToDelete(null)} className="rounded-full">
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="rounded-full"
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
