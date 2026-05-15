"use client"

import { useEffect, useState, useTransition } from "react"
import { Crown, Loader2, Search, UserPlus, X } from "lucide-react"

import {
  addCohost,
  listCohosts,
  removeCohost,
  searchUsersForCohost,
  type Cohost,
} from "@/app/actions/itinerary-actions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"

type Suggestion = {
  id: string
  username: string | null
  name: string | null
  avatar_url: string | null
}

type CohostManagerProps = {
  itineraryId: string
  /** Is the current viewer the original creator? Only owners can add/remove co-hosts. */
  isOwner: boolean
}

function initialsOf(name: string | null | undefined) {
  if (!name) return "?"
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0]!.toUpperCase())
    .slice(0, 2)
    .join("")
}

export function CohostManager({ itineraryId, isOwner }: CohostManagerProps) {
  const { toast } = useToast()
  const [cohosts, setCohosts] = useState<Cohost[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [searching, setSearching] = useState(false)
  const [pending, startTransition] = useTransition()

  async function refresh() {
    setLoading(true)
    const res = await listCohosts(itineraryId)
    if (res.success) setCohosts(res.data)
    setLoading(false)
  }

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itineraryId])

  useEffect(() => {
    if (!isOwner) return
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setSuggestions([])
      return
    }
    let cancelled = false
    setSearching(true)
    const t = setTimeout(async () => {
      const res = await searchUsersForCohost(trimmed, itineraryId)
      if (!cancelled) {
        setSuggestions(res.success ? (res.data as Suggestion[]) : [])
        setSearching(false)
      }
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(t)
      setSearching(false)
    }
  }, [query, itineraryId, isOwner])

  function handleAdd(user: Suggestion) {
    startTransition(async () => {
      const res = await addCohost(itineraryId, user.id)
      if (res.success) {
        toast({ title: "Co-host added", description: `${user.name || user.username} can now help manage this tinerary.` })
        setQuery("")
        setSuggestions([])
        await refresh()
      } else {
        toast({ title: "Couldn't add co-host", description: res.error, variant: "destructive" })
      }
    })
  }

  function handleRemove(cohost: Cohost) {
    if (cohost.role === "owner") return
    startTransition(async () => {
      const res = await removeCohost(itineraryId, cohost.user_id)
      if (res.success) {
        toast({ title: "Co-host removed" })
        await refresh()
      } else {
        toast({ title: "Couldn't remove co-host", description: res.error, variant: "destructive" })
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-base font-semibold">Co-hosts</h3>
        <p className="text-sm text-muted-foreground">
          Co-hosts can edit the tinerary, add activities, and invite others. Only you can delete the tinerary.
        </p>
      </div>

      {isOwner && (
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users by name or username..."
              className="pl-9"
              aria-label="Search users to add as co-host"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {suggestions.length > 0 && (
            <ul className="rounded-md border bg-popover divide-y">
              {suggestions.map((u) => (
                <li key={u.id} className="flex items-center justify-between p-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      {u.avatar_url ? <AvatarImage src={u.avatar_url} alt="" /> : null}
                      <AvatarFallback>{initialsOf(u.name || u.username)}</AvatarFallback>
                    </Avatar>
                    <div className="text-sm">
                      <p className="font-medium leading-tight">{u.name || u.username || "Unknown"}</p>
                      {u.username && <p className="text-xs text-muted-foreground">@{u.username}</p>}
                    </div>
                  </div>
                  <Button size="sm" onClick={() => handleAdd(u)} disabled={pending}>
                    <UserPlus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading co-hosts...
          </div>
        ) : cohosts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No co-hosts yet.</p>
        ) : (
          <ul className="space-y-1">
            {cohosts.map((c) => (
              <li
                key={c.user_id}
                className="flex items-center justify-between p-2 rounded-md border"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    {c.profile?.avatar_url ? <AvatarImage src={c.profile.avatar_url} alt="" /> : null}
                    <AvatarFallback>
                      {initialsOf(c.profile?.name || c.profile?.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <p className="font-medium leading-tight">
                      {c.profile?.name || c.profile?.username || "Unknown user"}
                    </p>
                    {c.profile?.username && (
                      <p className="text-xs text-muted-foreground">@{c.profile.username}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {c.role === "owner" ? (
                    <Badge variant="outline" className="gap-1">
                      <Crown className="h-3 w-3" /> Creator
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Co-host</Badge>
                  )}
                  {isOwner && c.role === "admin" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(c)}
                      disabled={pending}
                      aria-label="Remove co-host"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
