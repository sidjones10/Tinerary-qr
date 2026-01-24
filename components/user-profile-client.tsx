"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, MapPin, Link as LinkIcon, Calendar, Users, Lock, Heart, Bookmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { followUser, unfollowUser } from "@/lib/user-service"
import { FollowButton } from "@/components/follow-button"

interface Profile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  location: string | null
  website: string | null
  is_private: boolean
  followers_count?: number
  created_at: string
}

interface Itinerary {
  id: string
  title: string
  description: string | null
  destination: string | null
  start_date: string | null
  end_date: string | null
  is_public: boolean
  created_at: string
  user_id: string
}

interface UserProfileClientProps {
  profile: Profile
  isOwnProfile: boolean
  currentUserId: string | null
  isPrivate: boolean
  isFollowing: boolean
  itineraries: Itinerary[]
}

export function UserProfileClient({
  profile,
  isOwnProfile,
  currentUserId,
  isPrivate,
  isFollowing: initialIsFollowing,
  itineraries,
}: UserProfileClientProps) {
  const { toast } = useToast()
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isLoading, setIsLoading] = useState(false)
  const [followersCount, setFollowersCount] = useState(profile.followers_count || 0)

  const handleFollowToggle = async () => {
    if (!currentUserId) {
      toast({
        title: "Authentication required",
        description: "Please log in to follow users",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      if (isFollowing) {
        const result = await unfollowUser(currentUserId, profile.id)
        if (result.success) {
          setIsFollowing(false)
          setFollowersCount((prev) => Math.max(0, prev - 1))
          toast({
            title: "Unfollowed",
            description: `You unfollowed @${profile.username}`,
          })
        } else {
          throw new Error(result.error)
        }
      } else {
        const result = await followUser(currentUserId, profile.id)
        if (result.success) {
          setIsFollowing(true)
          setFollowersCount((prev) => prev + 1)
          toast({
            title: "Following",
            description: `You are now following @${profile.username}`,
          })
        } else {
          throw new Error(result.error)
        }
      }
    } catch (error: any) {
      console.error("Follow toggle error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update follow status",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  }

  const formatItineraryDate = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start.toDateString() === end.toDateString()) {
      return start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    }

    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
  }

  const getItineraryType = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    return start.toDateString() === end.toDateString() ? "Event" : "Trip"
  }

  // Show limited view for private profiles
  if (isPrivate && !isFollowing && !isOwnProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="container px-4 py-6 max-w-4xl mx-auto">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>

          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Avatar className="h-24 w-24 mx-auto mb-4">
              <AvatarImage src={profile.avatar_url} alt={profile.name} />
              <AvatarFallback className="text-2xl">{profile.name?.[0] || profile.username?.[0] || "U"}</AvatarFallback>
            </Avatar>

            <h1 className="text-2xl font-bold mb-1">{profile.name || profile.username}</h1>
            {profile.username && <p className="text-muted-foreground mb-4">@{profile.username}</p>}

            <div className="flex items-center justify-center gap-6 mb-6">
              <Link href={`/followers/${profile.id}`} className="text-center hover:underline">
                <div className="font-bold text-lg">{followersCount}</div>
                <div className="text-sm text-muted-foreground">Followers</div>
              </Link>
              <Link href={`/following/${profile.id}`} className="text-center hover:underline">
                <div className="font-bold text-lg">{profile.following_count || 0}</div>
                <div className="text-sm text-muted-foreground">Following</div>
              </Link>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
              <Lock className="h-12 w-12 mx-auto mb-3 text-amber-600" />
              <h3 className="font-semibold text-lg mb-2">This Account is Private</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Follow @{profile.username} to see their trips and events
              </p>
            </div>

            {currentUserId && (
              <FollowButton
                userId={profile.id}
                onFollowChange={(newStatus) => {
                  setIsFollowing(newStatus)
                  setFollowersCount((prev) => newStatus ? prev + 1 : Math.max(0, prev - 1))
                }}
                size="lg"
                className="px-8"
              />
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container px-4 py-6 max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>

        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.avatar_url} alt={profile.name} />
              <AvatarFallback className="text-2xl">{profile.name?.[0] || profile.username?.[0] || "U"}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h1 className="text-2xl font-bold">{profile.name || profile.username}</h1>
                  {profile.username && (
                    <p className="text-muted-foreground">
                      @{profile.username}
                      {isPrivate && <Lock className="inline h-4 w-4 ml-2" />}
                    </p>
                  )}
                </div>

                {!isOwnProfile && currentUserId && (
                  <FollowButton
                    userId={profile.id}
                    onFollowChange={(newStatus) => {
                      setIsFollowing(newStatus)
                      setFollowersCount((prev) => newStatus ? prev + 1 : Math.max(0, prev - 1))
                    }}
                  />
                )}

                {isOwnProfile && (
                  <Link href="/settings">
                    <Button variant="outline">Edit Profile</Button>
                  </Link>
                )}
              </div>

              {profile.bio && <p className="text-gray-700 mb-3">{profile.bio}</p>}

              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
                {profile.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-primary"
                  >
                    <LinkIcon className="h-4 w-4" />
                    <span>{profile.website.replace(/^https?:\/\//, "")}</span>
                  </a>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {formatDate(profile.created_at)}</span>
                </div>
              </div>

              <div className="flex gap-6">
                <Link href={`/followers/${profile.id}`} className="hover:underline">
                  <span className="font-bold">{followersCount}</span>{" "}
                  <span className="text-muted-foreground">Followers</span>
                </Link>
                <Link href={`/following/${profile.id}`} className="hover:underline">
                  <span className="font-bold">{profile.following_count || 0}</span>{" "}
                  <span className="text-muted-foreground">Following</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs for Itineraries */}
        <Tabs defaultValue="trips" className="w-full">
          <TabsList className="w-full max-w-md mx-auto grid grid-cols-2 mb-6">
            <TabsTrigger value="trips">Trips & Events</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="trips">
            {itineraries.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No trips yet</h3>
                <p className="text-muted-foreground">
                  {isOwnProfile
                    ? "Create your first trip to get started!"
                    : `@${profile.username} hasn't shared any trips yet.`}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {itineraries.map((itinerary) => (
                  <Link key={itinerary.id} href={`/event/${itinerary.id}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="relative h-48">
                        {itinerary.image_url ? (
                          <img
                            src={itinerary.image_url}
                            alt={itinerary.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-orange-400 via-pink-400 to-purple-500" />
                        )}
                        <Badge
                          className={`absolute top-3 left-3 ${
                            getItineraryType(itinerary.start_date, itinerary.end_date) === "Trip"
                              ? "bg-blue-500"
                              : "bg-purple-500"
                          }`}
                        >
                          {getItineraryType(itinerary.start_date, itinerary.end_date)}
                        </Badge>
                        {!itinerary.is_public && (
                          <Badge className="absolute top-3 right-3 bg-gray-900">
                            <Lock className="h-3 w-3 mr-1" />
                            Private
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2 line-clamp-1">{itinerary.title}</h3>
                        <div className="flex items-center text-sm text-muted-foreground mb-2">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{formatItineraryDate(itinerary.start_date, itinerary.end_date)}</span>
                        </div>
                        {itinerary.location && (
                          <div className="flex items-center text-sm text-muted-foreground mb-3">
                            <MapPin className="h-3 w-3 mr-1" />
                            <span className="line-clamp-1">{itinerary.location}</span>
                          </div>
                        )}
                        {itinerary.itinerary_metrics?.[0] && (
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              {itinerary.itinerary_metrics[0].like_count || 0}
                            </div>
                            <div className="flex items-center gap-1">
                              <Bookmark className="h-3 w-3" />
                              {itinerary.itinerary_metrics[0].save_count || 0}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="about">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">About</h3>
                {profile.bio ? (
                  <p className="text-gray-700 mb-4">{profile.bio}</p>
                ) : (
                  <p className="text-muted-foreground italic mb-4">No bio added yet.</p>
                )}

                <div className="space-y-3 text-sm">
                  {profile.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  {profile.website && (
                    <div className="flex items-center gap-2">
                      <LinkIcon className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {profile.website}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Joined {formatDate(profile.created_at)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
