"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, Briefcase } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { getMutualConnections, getEventMutuals, type MutualConnection } from "@/lib/mutuals-service"
import { useAuth } from "@/providers/auth-provider"
import { format } from "date-fns"
import Link from "next/link"

interface MutualsSectionProps {
  /** If provided, shows mutuals for a specific event. Otherwise shows all mutuals. */
  eventId?: string
  /** Maximum number of mutuals to display */
  limit?: number
  /** Whether to show the "See all" button */
  showSeeAll?: boolean
  /** Class name for styling */
  className?: string
}

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

  // Use ID hash to pick a consistent gradient
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

export function MutualsSection({ eventId, limit = 8, showSeeAll = true, className = "" }: MutualsSectionProps) {
  const [mutuals, setMutuals] = useState<MutualConnection[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    const fetchMutuals = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      setLoading(true)

      try {
        let result
        if (eventId) {
          result = await getEventMutuals(user.id, eventId, limit)
        } else {
          result = await getMutualConnections(user.id, limit)
        }

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
  }, [user?.id, eventId, limit])

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Mutuals</h2>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="w-20 h-20 rounded-full bg-gray-700/50 mx-auto mb-2" />
              <div className="h-4 bg-gray-700/50 rounded w-3/4 mx-auto mb-1" />
              <div className="h-3 bg-gray-700/50 rounded w-full mx-auto" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (mutuals.length === 0) {
    return null // Don't show section if no mutuals
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Mutuals</h2>
        {showSeeAll && mutuals.length > 0 && (
          <Button
            variant="ghost"
            className="text-white/70 hover:text-white hover:bg-white/10"
            asChild
          >
            <Link href="/mutuals">See all</Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        {mutuals.map((mutual) => {
          const gradient = getGradientForUser(mutual.id)
          const initials = getInitials(mutual.name)

          return (
            <Link
              key={mutual.id}
              href={`/user/${mutual.id}`}
              className="flex flex-col items-center group cursor-pointer"
            >
              {/* Avatar with gradient or photo */}
              <div className="relative mb-3">
                {mutual.avatar_url ? (
                  <Avatar className="w-20 h-20 border-4 border-white/20 transition-transform group-hover:scale-110">
                    <AvatarImage src={mutual.avatar_url} alt={mutual.name || ""} />
                    <AvatarFallback className={`bg-gradient-to-br ${gradient} text-gray-800 text-lg font-bold`}>
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div
                    className={`w-20 h-20 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-gray-800 text-lg font-bold border-4 border-white/20 transition-transform group-hover:scale-110`}
                  >
                    {initials}
                  </div>
                )}
              </div>

              {/* Name */}
              <h3 className="text-white font-semibold text-sm mb-1 text-center line-clamp-1">
                {mutual.name || "Unknown"}
              </h3>

              {/* Shared events count */}
              <div className="flex items-center text-white/60 text-xs mb-2">
                <Briefcase className="w-3 h-3 mr-1" />
                <span>{mutual.shared_events_count} shared event{mutual.shared_events_count !== 1 ? 's' : ''}</span>
              </div>

              {/* Next shared event */}
              {mutual.next_shared_event && (
                <div className="flex items-center text-white/50 text-xs text-center">
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
    </div>
  )
}
