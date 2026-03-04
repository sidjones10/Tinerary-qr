"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  MessageSquare,
  AtSign,
  Users,
  Clock,
  Send,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface MessagingData {
  conversations: any[]
  recentMessages: any[]
  mentions: any[]
  stats: { totalConversations: number; totalMessages: number; messagesLast24h: number; totalMentions: number }
}

export default function AdminMessagingPage() {
  const [data, setData] = useState<MessagingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [tab, setTab] = useState<"messages" | "conversations" | "mentions">("messages")

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/admin/messaging")
      if (res.ok) setData(await res.json())
    } catch (e) { console.error(e) }
    setIsLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

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
            <h1 className="text-2xl font-bold text-[#2c2420]">Messaging Oversight</h1>
            <p className="text-sm text-[#2c2420]/50">Monitor messaging and mentions activity</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Conversations", value: data?.stats.totalConversations || 0, icon: Users, color: "text-blue-600 bg-blue-50" },
          { label: "Total Messages", value: data?.stats.totalMessages || 0, icon: MessageSquare, color: "text-purple-600 bg-purple-50" },
          { label: "Last 24h", value: data?.stats.messagesLast24h || 0, icon: Clock, color: "text-amber-600 bg-amber-50" },
          { label: "Mentions", value: data?.stats.totalMentions || 0, icon: AtSign, color: "text-green-600 bg-green-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white/70 dark:bg-card/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${s.color}`}><s.icon className="h-4 w-4" /></div>
              <span className="text-xs text-[#2c2420]/50">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-[#2c2420]">{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-6">
        {(["messages", "conversations", "mentions"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium rounded-lg ${tab === t ? "bg-[#2c2420] text-white" : "bg-white/60 text-[#2c2420]/60 hover:bg-white"}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#ffb88c]" /></div>
      ) : (
        <div className="bg-white/70 dark:bg-card/70 backdrop-blur rounded-2xl border border-[#2c2420]/5">
          <div className="divide-y divide-[#2c2420]/5">
            {tab === "messages" && (
              <>
                {data?.recentMessages.length === 0 && <p className="p-8 text-center text-[#2c2420]/40">No messages yet</p>}
                {data?.recentMessages.map((m: any) => (
                  <div key={m.id} className="flex items-center gap-4 p-4">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={m.profiles?.avatar_url || undefined} />
                      <AvatarFallback className="bg-[#ffb88c]/20 text-[#d97a4a] text-xs">{m.profiles?.name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#2c2420]">{m.profiles?.name || "Unknown"}</p>
                      <p className="text-xs text-[#2c2420]/60 truncate">{m.content}</p>
                    </div>
                    <span className="text-xs text-[#2c2420]/40">{formatTime(m.created_at)}</span>
                    {m.is_edited && <Badge className="bg-gray-100 text-gray-600">Edited</Badge>}
                  </div>
                ))}
              </>
            )}

            {tab === "conversations" && (
              <>
                {data?.conversations.length === 0 && <p className="p-8 text-center text-[#2c2420]/40">No conversations yet</p>}
                {data?.conversations.map((c: any) => (
                  <div key={c.id} className="flex items-center gap-4 p-4">
                    <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#2c2420]">Conversation #{c.id.slice(0, 8)}</p>
                      <p className="text-xs text-[#2c2420]/40">Created by {c.creator?.name || "Unknown"} &middot; {formatTime(c.updated_at || c.created_at)}</p>
                    </div>
                    {c.is_archived && <Badge className="bg-gray-100 text-gray-600">Archived</Badge>}
                  </div>
                ))}
              </>
            )}

            {tab === "mentions" && (
              <>
                {data?.mentions.length === 0 && <p className="p-8 text-center text-[#2c2420]/40">No mentions yet</p>}
                {data?.mentions.map((m: any) => (
                  <div key={m.id} className="flex items-center gap-4 p-4">
                    <AtSign className="h-5 w-5 text-green-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#2c2420]">
                        <span className="font-medium">{m.mentioner?.name || "Unknown"}</span>
                        <span className="text-[#2c2420]/40 mx-2">mentioned</span>
                        <span className="font-medium">{m.mentioned?.name || "Unknown"}</span>
                      </p>
                      <p className="text-xs text-[#2c2420]/40">{formatTime(m.created_at)}</p>
                    </div>
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
