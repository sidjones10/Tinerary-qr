"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  Star,
  MessageSquare,
  Trash2,
  ThumbsUp,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"

interface ReviewData {
  reviews: any[]
  comments: any[]
  stats: { totalReviews: number; totalComments: number; averageRating: number }
}

export default function AdminReviewsPage() {
  const [data, setData] = useState<ReviewData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [tab, setTab] = useState<"reviews" | "comments">("reviews")

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/admin/reviews")
      if (res.ok) setData(await res.json())
    } catch (e) { console.error(e) }
    setIsLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleDelete = async (id: string, type: string) => {
    if (!confirm(`Delete this ${type}?`)) return
    try {
      const res = await fetch(`/api/admin/reviews?id=${id}&type=${type}`, { method: "DELETE" })
      if (res.ok) {
        toast({ title: "Deleted", description: `${type} removed` })
        fetchData()
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" })
    }
  }

  const formatTime = (d: string) => {
    const diff = Date.now() - new Date(d).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(diff / 3600000)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(diff / 86400000)}d ago`
  }

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`h-3 w-3 ${s <= rating ? "text-amber-400 fill-amber-400" : "text-gray-300"}`} />
      ))}
    </div>
  )

  return (
    <div className="p-4 lg:p-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild><Link href="/admin"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <div>
            <h1 className="text-2xl font-bold text-[#2c2420]">Reviews & Comments</h1>
            <p className="text-sm text-[#2c2420]/50">Moderate user reviews and comments</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Reviews", value: data?.stats.totalReviews || 0, icon: Star, color: "text-amber-600 bg-amber-50" },
          { label: "Comments", value: data?.stats.totalComments || 0, icon: MessageSquare, color: "text-blue-600 bg-blue-50" },
          { label: "Avg Rating", value: data?.stats.averageRating || 0, icon: ThumbsUp, color: "text-green-600 bg-green-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white/70 dark:bg-card/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${s.color}`}><s.icon className="h-4 w-4" /></div>
              <span className="text-xs text-[#2c2420]/50">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-[#2c2420]">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("reviews")} className={`px-4 py-2 text-sm font-medium rounded-lg ${tab === "reviews" ? "bg-[#2c2420] text-white" : "bg-white/60 text-[#2c2420]/60 hover:bg-white"}`}>
          <Star className="h-4 w-4 inline mr-2" />Reviews
        </button>
        <button onClick={() => setTab("comments")} className={`px-4 py-2 text-sm font-medium rounded-lg ${tab === "comments" ? "bg-[#2c2420] text-white" : "bg-white/60 text-[#2c2420]/60 hover:bg-white"}`}>
          <MessageSquare className="h-4 w-4 inline mr-2" />Comments
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#ffb88c]" /></div>
      ) : (
        <div className="bg-white/70 dark:bg-card/70 backdrop-blur rounded-2xl border border-[#2c2420]/5">
          <div className="divide-y divide-[#2c2420]/5">
            {tab === "reviews" && (
              <>
                {data?.reviews.length === 0 && <p className="p-8 text-center text-[#2c2420]/40">No reviews yet</p>}
                {data?.reviews.map((r: any) => (
                  <div key={r.id} className="flex items-start gap-4 p-4">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={r.profiles?.avatar_url || undefined} />
                      <AvatarFallback className="bg-[#ffb88c]/20 text-[#d97a4a] text-xs">{r.profiles?.name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-[#2c2420]">{r.profiles?.name || "Unknown"}</p>
                        {r.rating && renderStars(r.rating)}
                        <span className="text-xs text-[#2c2420]/40">{formatTime(r.created_at)}</span>
                      </div>
                      <p className="text-sm text-[#2c2420]/70">{r.content || r.text}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(r.id, "review")}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </>
            )}

            {tab === "comments" && (
              <>
                {data?.comments.length === 0 && <p className="p-8 text-center text-[#2c2420]/40">No comments yet</p>}
                {data?.comments.map((c: any) => (
                  <div key={c.id} className="flex items-start gap-4 p-4">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={c.profiles?.avatar_url || undefined} />
                      <AvatarFallback className="bg-[#ffb88c]/20 text-[#d97a4a] text-xs">{c.profiles?.name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-[#2c2420]">{c.profiles?.name || "Unknown"}</p>
                        <span className="text-xs text-[#2c2420]/40">{formatTime(c.created_at)}</span>
                      </div>
                      <p className="text-sm text-[#2c2420]/70">{c.content}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(c.id, "comment")}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
