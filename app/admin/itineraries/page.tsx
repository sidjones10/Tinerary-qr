"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Search, Loader2, MoreVertical, Eye, Heart, Bookmark, Share2, Globe, Lock, Trash2, ExternalLink } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAdminItineraries } from "@/hooks/use-admin-stats"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"

export default function AdminItinerariesPage() {
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)
  const limit = 20
  const { itineraries, total, isLoading } = useAdminItineraries(page, limit, debouncedSearch)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const totalPages = Math.ceil(total / limit)

  const handleToggleVisibility = async (itineraryId: string, currentIsPublic: boolean) => {
    const supabase = createClient()
    const { error } = await supabase
      .from("itineraries")
      .update({ is_public: !currentIsPublic })
      .eq("id", itineraryId)

    if (error) {
      toast({ title: "Error", description: "Failed to update visibility", variant: "destructive" })
    } else {
      toast({ title: "Success", description: `Itinerary is now ${!currentIsPublic ? "public" : "private"}` })
    }
  }

  const handleDelete = async (itineraryId: string) => {
    if (!confirm("Are you sure you want to delete this itinerary? This action cannot be undone.")) {
      return
    }

    const supabase = createClient()
    const { error } = await supabase
      .from("itineraries")
      .delete()
      .eq("id", itineraryId)

    if (error) {
      toast({ title: "Error", description: "Failed to delete itinerary", variant: "destructive" })
    } else {
      toast({ title: "Success", description: "Itinerary deleted" })
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild aria-label="Go back">
          <Link href="/admin">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[#2c2420]">Itineraries</h1>
          <p className="text-sm text-[#2c2420]/50">{total} total itineraries</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#2c2420]/40" />
          <Input
            placeholder="Search by title or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/70 dark:bg-card/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#ffb88c]" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-[#2c2420]/[0.02] hover:bg-[#2c2420]/[0.02]">
                <TableHead className="text-[#2c2420]/60">Itinerary</TableHead>
                <TableHead className="text-[#2c2420]/60">Creator</TableHead>
                <TableHead className="text-[#2c2420]/60">Stats</TableHead>
                <TableHead className="text-[#2c2420]/60">Visibility</TableHead>
                <TableHead className="text-[#2c2420]/60">Created</TableHead>
                <TableHead className="text-[#2c2420]/60 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itineraries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-[#2c2420]/40">
                    No itineraries found
                  </TableCell>
                </TableRow>
              ) : (
                itineraries.map((itinerary: any) => {
                  const metrics = itinerary.itinerary_metrics?.[0] || {}
                  const creator = itinerary.profiles || {}
                  return (
                    <TableRow key={itinerary.id} className="hover:bg-[#ffb88c]/5">
                      <TableCell>
                        <div className="max-w-[250px]">
                          <p className="font-medium text-[#2c2420] truncate">{itinerary.title}</p>
                          <p className="text-xs text-[#2c2420]/40 truncate">{itinerary.location || "No location"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="bg-[#ffb88c]/20 text-[#d97a4a] text-xs">
                              {(creator.name || creator.username || "U")[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-[#2c2420]/70">
                            {creator.name || creator.username || "Unknown"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3 text-xs text-[#2c2420]/60">
                          <span className="flex items-center gap-1" title="Views">
                            <Eye className="h-3 w-3" />
                            {metrics.view_count || 0}
                          </span>
                          <span className="flex items-center gap-1" title="Likes">
                            <Heart className="h-3 w-3" />
                            {metrics.like_count || 0}
                          </span>
                          <span className="flex items-center gap-1" title="Saves">
                            <Bookmark className="h-3 w-3" />
                            {metrics.save_count || 0}
                          </span>
                          <span className="flex items-center gap-1" title="Shares">
                            <Share2 className="h-3 w-3" />
                            {metrics.share_count || 0}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {itinerary.is_public ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
                            <Globe className="h-3 w-3 mr-1" />
                            Public
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-100 dark:bg-card text-gray-600 dark:text-gray-400 hover:bg-gray-100">
                            <Lock className="h-3 w-3 mr-1" />
                            Private
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-[#2c2420]/60 text-sm">
                        {new Date(itinerary.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/event/${itinerary.id}`}>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View Itinerary
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleVisibility(itinerary.id, itinerary.is_public)}>
                              {itinerary.is_public ? (
                                <>
                                  <Lock className="h-4 w-4 mr-2" />
                                  Make Private
                                </>
                              ) : (
                                <>
                                  <Globe className="h-4 w-4 mr-2" />
                                  Make Public
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(itinerary.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#2c2420]/5">
            <p className="text-sm text-[#2c2420]/50">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
