"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  Shield,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  Flag,
  AlertTriangle,
  Trash2,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"

interface ModerationData {
  reports: any[]
  recentContent: any[]
  recentComments: any[]
  counts: { pending: number; reviewed: number; resolved: number }
}

export default function AdminModerationPage() {
  const [data, setData] = useState<ModerationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [tab, setTab] = useState<"reports" | "content" | "comments">("reports")

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/admin/moderation")
      if (res.ok) setData(await res.json())
    } catch (e) { console.error(e) }
    setIsLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAction = async (action: string, contentId: string, contentType: string) => {
    try {
      const res = await fetch("/api/admin/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, contentId, contentType }),
      })
      if (res.ok) {
        toast({ title: "Success", description: `Action completed` })
        fetchData()
      }
    } catch (e) {
      toast({ title: "Error", description: "Action failed", variant: "destructive" })
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

  return (
    <div className="p-4 lg:p-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild><Link href="/admin"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <div>
            <h1 className="text-2xl font-bold text-[#2c2420]">Content Moderation</h1>
            <p className="text-sm text-[#2c2420]/50">Review and moderate user content</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
      </div>

      {/* Counts */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Pending", count: data?.counts.pending || 0, color: "text-amber-600 bg-amber-50", icon: Clock },
          { label: "Reviewed", count: data?.counts.reviewed || 0, color: "text-blue-600 bg-blue-50", icon: Eye },
          { label: "Resolved", count: data?.counts.resolved || 0, color: "text-green-600 bg-green-50", icon: CheckCircle },
        ].map((s) => (
          <div key={s.label} className="bg-white/70 dark:bg-card/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${s.color}`}><s.icon className="h-4 w-4" /></div>
              <span className="text-xs text-[#2c2420]/50">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-[#2c2420]">{s.count}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(["reports", "content", "comments"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${tab === t ? "bg-[#2c2420] text-white" : "bg-white/60 text-[#2c2420]/60 hover:bg-white"}`}>
            {t === "reports" && <Flag className="h-4 w-4 inline mr-2" />}
            {t === "content" && <Eye className="h-4 w-4 inline mr-2" />}
            {t === "comments" && <MessageSquare className="h-4 w-4 inline mr-2" />}
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#ffb88c]" /></div>
      ) : (
        <div className="bg-white/70 dark:bg-card/70 backdrop-blur rounded-2xl border border-[#2c2420]/5">
          <div className="divide-y divide-[#2c2420]/5">
            {tab === "reports" && (
              <>
                {data?.reports.length === 0 && <p className="p-8 text-center text-[#2c2420]/40">No reports found</p>}
                {data?.reports.map((r: any) => (
                  <div key={r.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className="bg-red-100 text-red-700">{r.reason || "Reported"}</Badge>
                          <Badge className={r.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}>{r.status}</Badge>
                          <span className="text-xs text-[#2c2420]/40">{formatTime(r.created_at)}</span>
                        </div>
                        <p className="text-sm text-[#2c2420] mb-1">{r.description || "No description"}</p>
                        <p className="text-xs text-[#2c2420]/40">
                          Reported by: {r.reporter?.name || r.reporter?.email || "Unknown"} | Target: {r.reported_user?.name || "Unknown"}
                        </p>
                      </div>
                      {r.status === "pending" && (
                        <Button variant="outline" size="sm" onClick={() => handleAction("resolve_report", r.id, "report")}>
                          <CheckCircle className="h-4 w-4 mr-2" />Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}

            {tab === "content" && (
              <>
                {data?.recentContent.length === 0 && <p className="p-8 text-center text-[#2c2420]/40">No recent content</p>}
                {data?.recentContent.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-4 p-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#2c2420] truncate">{item.title}</p>
                      <p className="text-xs text-[#2c2420]/40">{item.profiles?.name} &middot; {formatTime(item.created_at)}</p>
                    </div>
                    <Badge className={item.is_public ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                      {item.is_public ? "Public" : "Private"}
                    </Badge>
                    {item.is_public && (
                      <Button variant="outline" size="sm" onClick={() => handleAction("hide", item.id, "itinerary")}>
                        <EyeOff className="h-4 w-4 mr-2" />Hide
                      </Button>
                    )}
                  </div>
                ))}
              </>
            )}

            {tab === "comments" && (
              <>
                {data?.recentComments.length === 0 && <p className="p-8 text-center text-[#2c2420]/40">No recent comments</p>}
                {data?.recentComments.map((c: any) => (
                  <div key={c.id} className="flex items-center gap-4 p-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#2c2420]">{c.content}</p>
                      <p className="text-xs text-[#2c2420]/40">{c.profiles?.name} &middot; {formatTime(c.created_at)}</p>
                    </div>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleAction("hide", c.id, "comment")}>
                      <Trash2 className="h-4 w-4 mr-2" />Remove
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
