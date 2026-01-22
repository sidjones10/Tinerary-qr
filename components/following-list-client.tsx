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

interface FollowingUser {
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
  following_count: number
}

interface FollowingListClientProps {
  profile: Profile
  following: FollowingUser[]
  isOwnProfile: boolean
  currentUserId: string | null
}

export function FollowingListClient({
  profile,
  following: initialFollowing,
  isOwnProfile,
  currentUserId,
}: FollowingListClientProps) {
  const [following, setFollowing] = useState(initialFollowing)
  const [searchQuery, setSearchQuery] = useState("")

  // Filter following based on search
  const filteredFollowing = following.filter((user) => {
    const name = user.name?.toLowerCase() || ""
    const username = user.username?.toLowerCase() || ""
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
                  {isOwnProfile ? "People You Follow" : `${profile.name || profile.username} Follows`}
                </h1>
                <p className="text-muted-foreground">
                  {profile.following_count} following
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search following..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Following List */}
          {filteredFollowing.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent className="pt-6">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  {searchQuery ? "No users found" : "Not following anyone yet"}
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "Try a different search term"
                    : isOwnProfile
                      ? "Discover and follow people to see their content"
                      : "This user isn't following anyone yet"}
                </p>
                {isOwnProfile && !searchQuery && (
                  <Link href="/discover">
                    <Button className="mt-4">Discover People</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredFollowing.map((user) => (
                <Card
                  key={user.id}
                  className="hover:shadow-md transition-shadow animate-in fade-in slide-in-from-bottom-2"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Link href={`/user/${user.username}`}>
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={user.avatar_url || undefined} alt={user.name || "User"} />
                          <AvatarFallback>{user.name?.[0] || user.username?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                      </Link>

                      <div className="flex-1 min-w-0">
                        <Link href={`/user/${user.username}`} className="block group">
                          <h3 className="font-semibold group-hover:text-primary transition-colors truncate">
                            {user.name || user.username}
                          </h3>
                          {user.username && (
                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                          )}
                        </Link>
                        {user.bio && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{user.bio}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Followed {formatDate(user.followed_at)}
                        </p>
                      </div>

                      {currentUserId && currentUserId !== user.id && (
                        <FollowButton userId={user.id} size="sm" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Load More (if needed for pagination) */}
          {filteredFollowing.length >= 50 && (
            <div className="text-center mt-6">
              <Button variant="outline">Load More</Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
