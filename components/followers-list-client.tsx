"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Users, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { FollowButton } from "@/components/follow-button"
import { Navbar } from "@/components/navbar"

interface Follower {
  id: string
  name: string | null
  username: string | null
  avatar_url: string | null
  bio: string | null
  followed_at: string
  is_following: boolean
}

interface Profile {
  id: string
  name: string | null
  username: string | null
  avatar_url: string | null
  followers_count: number
}

interface FollowersListClientProps {
  profile: Profile
  followers: Follower[]
  isOwnProfile: boolean
  currentUserId: string | null
}

export function FollowersListClient({
  profile,
  followers: initialFollowers,
  isOwnProfile,
  currentUserId,
}: FollowersListClientProps) {
  const [followers, setFollowers] = useState(initialFollowers)
  const [searchQuery, setSearchQuery] = useState("")

  // Filter followers based on search
  const filteredFollowers = followers.filter((follower) => {
    const name = follower.name?.toLowerCase() || ""
    const username = follower.username?.toLowerCase() || ""
    const query = searchQuery.toLowerCase()
    return name.includes(query) || username.includes(query)
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-gradient-to-b from-gray-50 to-white">
        <div className="container px-4 py-6 max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link
              href={isOwnProfile ? "/profile" : `/user/${profile.username}`}
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to profile
            </Link>

            <div className="flex items-center gap-4 mb-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile.avatar_url || undefined} alt={profile.name || "User"} />
                <AvatarFallback className="text-xl">
                  {profile.name?.[0] || profile.username?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">
                  {isOwnProfile ? "Your Followers" : `${profile.name || profile.username}'s Followers`}
                </h1>
                <p className="text-muted-foreground">
                  {profile.followers_count} {profile.followers_count === 1 ? "follower" : "followers"}
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search followers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Followers List */}
          {filteredFollowers.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent className="pt-6">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  {searchQuery ? "No followers found" : "No followers yet"}
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "Try a different search term"
                    : isOwnProfile
                      ? "When people follow you, they'll appear here"
                      : "This user doesn't have any followers yet"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredFollowers.map((follower) => (
                <Card
                  key={follower.id}
                  className="hover:shadow-md transition-shadow animate-in fade-in slide-in-from-bottom-2"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Link href={`/user/${follower.username}`}>
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={follower.avatar_url || undefined} alt={follower.name || "User"} />
                          <AvatarFallback>{follower.name?.[0] || follower.username?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                      </Link>

                      <div className="flex-1 min-w-0">
                        <Link href={`/user/${follower.username}`} className="block group">
                          <h3 className="font-semibold group-hover:text-primary transition-colors truncate">
                            {follower.name || follower.username}
                          </h3>
                          {follower.username && (
                            <p className="text-sm text-muted-foreground">@{follower.username}</p>
                          )}
                        </Link>
                        {follower.bio && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{follower.bio}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Followed {formatDate(follower.followed_at)}
                        </p>
                      </div>

                      {currentUserId && currentUserId !== follower.id && (
                        <FollowButton userId={follower.id} size="sm" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Load More (if needed for pagination) */}
          {filteredFollowers.length >= 50 && (
            <div className="text-center mt-6">
              <Button variant="outline">Load More</Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
