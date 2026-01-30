"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, MapPin, Calendar, Grid3X3, Bookmark, Share2, MoreHorizontal, ExternalLink } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface UserProfile {
  id: string
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

export default function PublicProfilePage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [itineraries, setItineraries] = useState<Itinerary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

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

      // Fetch public itineraries for this user
      const { data: itinerariesData, error: itinerariesError } = await supabase
        .from("itineraries")
        .select("*")
        .eq("user_id", userId)
        .eq("is_public", true)
        .order("created_at", { ascending: false })

      if (!itinerariesError && itinerariesData) {
        setItineraries(itinerariesData)
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
          title: profile?.display_name || "User Profile",
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

  const isOwnProfile = currentUserId === userId

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
          <Button variant="outline" className="mt-4 bg-transparent" onClick={() => router.push("/discover")}>
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
          <span className="font-semibold">{profile.username || profile.display_name || "Profile"}</span>
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Profile Info */}
      <div className="px-4 py-6">
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
            <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name || "User"} />
            <AvatarFallback className="text-2xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white">
              {getInitials(profile.display_name)}
            </AvatarFallback>
          </Avatar>

          <h1 className="mt-4 text-xl font-bold">{profile.display_name || "Anonymous"}</h1>

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
                className={`flex-1 ${isFollowing ? "bg-muted text-foreground hover:bg-muted/80" : "bg-teal-600 hover:bg-teal-700 text-white"}`}
                onClick={() => setIsFollowing(!isFollowing)}
              >
                {isFollowing ? "Following" : "Follow"}
              </Button>
              <Button variant="outline" className="flex-1 bg-transparent">
                Message
              </Button>
              <Button variant="outline" size="icon" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          )}

          {isOwnProfile && (
            <Button variant="outline" className="mt-4 bg-transparent" asChild>
              <Link href="/profile">Edit Profile</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Itineraries Tabs */}
      <Tabs defaultValue="itineraries" className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-12 px-4">
          <TabsTrigger
            value="itineraries"
            className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-teal-600 data-[state=active]:shadow-none rounded-none"
          >
            <Grid3X3 className="h-4 w-4 mr-2" />
            Itineraries
          </TabsTrigger>
          <TabsTrigger
            value="saved"
            className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-teal-600 data-[state=active]:shadow-none rounded-none"
          >
            <Bookmark className="h-4 w-4 mr-2" />
            Saved
          </TabsTrigger>
        </TabsList>

        <TabsContent value="itineraries" className="mt-0">
          {itineraries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Grid3X3 className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No public itineraries yet</p>
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
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="saved" className="mt-0">
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Bookmark className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Saved items are private</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
