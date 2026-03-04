"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Users, Briefcase, Clock, Search, Loader2, Sparkles } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AppHeader } from "@/components/app-header"
import { Input } from "@/components/ui/input"
import { getMutualConnections, type MutualConnection } from "@/lib/mutuals-service"
import { useAuth } from "@/providers/auth-provider"
import { format } from "date-fns"

// Generate a gradient color based on user ID or name
function getGradientForUser(id: string): string {
  const gradients = [
    "from-yellow-200 via-pink-200 to-pink-300",
    "from-cyan-200 via-blue-200 to-purple-300",
    "from-green-200 via-emerald-200 to-cyan-200",
    "from-purple-200 via-pink-200 to-red-200",
    "from-blue-200 via-cyan-200 to-teal-200",
    "from-pink-200 via-purple-200 to-indigo-300",
    "from-amber-200 via-orange-200 to-red-200",
    "from-lime-200 via-green-200 to-emerald-200",
  ]

  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return gradients[hash % gradients.length]
}

// Get initials from name
function getInitials(name: string | null): string {
  if (!name) return "?"

  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase()
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function MutualsPage() {
  const { user } = useAuth()
  const [mutuals, setMutuals] = useState<MutualConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    async function fetchMutuals() {
      if (!user?.id) {
        setLoading(false)
        return
      }

      setLoading(true)

      try {
        const result = await getMutualConnections(user.id, 100)

        if (result.success && result.mutuals) {
          setMutuals(result.mutuals)
        }
      } catch (error) {
        console.error("Error fetching mutuals:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMutuals()
  }, [user?.id])

  const filteredMutuals = searchQuery
    ? mutuals.filter((mutual) => {
        const query = searchQuery.toLowerCase()
        return (
          mutual.name?.toLowerCase().includes(query) ||
          mutual.username?.toLowerCase().includes(query)
        )
      })
    : mutuals

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex-1">
        <div className="container px-4 py-6 md:py-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/80 dark:bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-200">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-blue-400 sparkle" />
                </div>
                <div>
                  <h1 className="cute-section-header">Mutuals</h1>
                  <p className="text-sm text-muted-foreground">People you share events with</p>
                </div>
              </div>
            </div>
            {mutuals.length > 0 && (
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-600">{mutuals.length} mutuals</span>
              </div>
            )}
          </div>

          {/* Search */}
          {!loading && user && mutuals.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search mutuals..."
                  className="pl-10 border-2 focus:border-blue-300 transition-colors"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mb-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
              <p className="text-muted-foreground">Loading your mutuals...</p>
            </div>
          ) : !user ? (
            <div className="cute-empty-state">
              <div className="cute-empty-icon">
                <Users className="h-12 w-12 text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2 cute-section-header">Sign in to see your mutuals</h2>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Create an account to see people you share events with
              </p>
              <Link href="/auth" className="cute-cta-btn inline-flex items-center gap-2">
                <Users className="h-4 w-4" />
                Sign In
              </Link>
            </div>
          ) : filteredMutuals.length === 0 ? (
            <div className="cute-empty-state">
              <div className="cute-empty-icon relative">
                <Users className="h-12 w-12 text-blue-400" />
                <Sparkles className="absolute top-0 right-2 h-5 w-5 text-purple-400 sparkle sparkle-delay-1" />
                <Sparkles className="absolute bottom-2 left-0 h-4 w-4 text-blue-400 sparkle sparkle-delay-2" />
              </div>
              <h2 className="text-xl font-semibold mb-2">
                {searchQuery ? "No matches found" : "No mutuals yet"}
              </h2>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "Join events and trips to connect with others"}
              </p>
              {!searchQuery && (
                <Link href="/app" className="cute-cta-btn inline-flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Discover Events
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {filteredMutuals.map((mutual) => {
                const gradient = getGradientForUser(mutual.id)
                const initials = getInitials(mutual.name)

                return (
                  <Link
                    key={mutual.id}
                    href={`/user/${mutual.id}`}
                    className="cute-card p-6 flex flex-col items-center group cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    {/* Avatar */}
                    <div className="relative mb-4">
                      {mutual.avatar_url ? (
                        <Avatar className="w-20 h-20 border-4 border-blue-100 dark:border-blue-900/30 transition-transform group-hover:scale-110">
                          <AvatarImage src={mutual.avatar_url} alt={mutual.name || ""} />
                          <AvatarFallback className={`bg-gradient-to-br ${gradient} text-gray-800 text-lg font-bold`}>
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div
                          className={`w-20 h-20 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-gray-800 text-lg font-bold border-4 border-blue-100 dark:border-blue-900/30 transition-transform group-hover:scale-110`}
                        >
                          {initials}
                        </div>
                      )}
                    </div>

                    {/* Name */}
                    <h3 className="font-semibold text-sm mb-1 text-center line-clamp-1">
                      {mutual.name || "Unknown"}
                    </h3>

                    {/* Username */}
                    {mutual.username && (
                      <p className="text-xs text-muted-foreground mb-2">@{mutual.username}</p>
                    )}

                    {/* Shared events count */}
                    <div className="flex items-center text-muted-foreground text-xs mb-2">
                      <Briefcase className="w-3 h-3 mr-1" />
                      <span>{mutual.shared_events_count} shared event{mutual.shared_events_count !== 1 ? 's' : ''}</span>
                    </div>

                    {/* Next shared event */}
                    {mutual.next_shared_event && (
                      <div className="flex items-center text-muted-foreground text-xs text-center">
                        <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span className="line-clamp-1">
                          {mutual.next_shared_event.title} · {format(new Date(mutual.next_shared_event.start_date), 'M/d/yy')}
                        </span>
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
