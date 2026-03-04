"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  Bell,
  BellRing,
  Mail,
  Smartphone,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface NotifHealthData {
  recentNotifications: any[]
  emailLogs: any[]
  stats: {
    totalNotifications: number
    unreadNotifications: number
    pushSubscribers: number
    notificationsLast24h: number
    notificationsLastWeek: number
    typeBreakdown: Record<string, number>
    emailStats: { total: number; delivered: number; failed: number; pending: number }
  }
}

export default function AdminNotificationsHealthPage() {
  const [data, setData] = useState<NotifHealthData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [tab, setTab] = useState<"overview" | "notifications" | "emails">("overview")

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/admin/notifications-health")
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

  const stats = data?.stats

  return (
    <div className="p-4 lg:p-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild><Link href="/admin"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <div>
            <h1 className="text-2xl font-bold text-[#2c2420]">Notifications & Push Health</h1>
            <p className="text-sm text-[#2c2420]/50">Monitor notification delivery and push subscriptions</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Sent", value: stats?.totalNotifications || 0, icon: Bell, color: "text-blue-600 bg-blue-50" },
          { label: "Unread", value: stats?.unreadNotifications || 0, icon: BellRing, color: "text-amber-600 bg-amber-50" },
          { label: "Push Subscribers", value: stats?.pushSubscribers || 0, icon: Smartphone, color: "text-green-600 bg-green-50" },
          { label: "Last 24h", value: stats?.notificationsLast24h || 0, icon: TrendingUp, color: "text-purple-600 bg-purple-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white/70 dark:bg-card/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${s.color}`}><s.icon className="h-4 w-4" /></div>
              <span className="text-xs text-[#2c2420]/50">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-[#2c2420]">{typeof s.value === "number" ? s.value.toLocaleString() : s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-6">
        {(["overview", "notifications", "emails"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium rounded-lg ${tab === t ? "bg-[#2c2420] text-white" : "bg-white/60 text-[#2c2420]/60 hover:bg-white"}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#ffb88c]" /></div>
      ) : (
        <>
          {tab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Type breakdown */}
              <div className="bg-white/70 dark:bg-card/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-5">
                <h3 className="font-semibold text-[#2c2420] mb-4">Notification Types (Recent)</h3>
                <div className="space-y-3">
                  {Object.entries(stats?.typeBreakdown || {}).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm text-[#2c2420]">{type}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-[#2c2420]/5 rounded-full overflow-hidden">
                          <div className="h-full bg-[#ffb88c] rounded-full" style={{ width: `${Math.min(100, (count / Math.max(...Object.values(stats?.typeBreakdown || {}))) * 100)}%` }} />
                        </div>
                        <span className="text-sm font-medium text-[#2c2420] w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                  {Object.keys(stats?.typeBreakdown || {}).length === 0 && <p className="text-sm text-[#2c2420]/40">No data</p>}
                </div>
              </div>

              {/* Email delivery */}
              <div className="bg-white/70 dark:bg-card/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-5">
                <h3 className="font-semibold text-[#2c2420] mb-4">Email Delivery (Recent)</h3>
                <div className="space-y-3">
                  {[
                    { label: "Delivered", value: stats?.emailStats.delivered || 0, color: "text-green-600", icon: CheckCircle },
                    { label: "Failed", value: stats?.emailStats.failed || 0, color: "text-red-600", icon: XCircle },
                    { label: "Pending", value: stats?.emailStats.pending || 0, color: "text-amber-600", icon: Clock },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <s.icon className={`h-4 w-4 ${s.color}`} />
                        <span className="text-sm text-[#2c2420]">{s.label}</span>
                      </div>
                      <span className={`text-lg font-bold ${s.color}`}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "notifications" && (
            <div className="bg-white/70 dark:bg-card/70 backdrop-blur rounded-2xl border border-[#2c2420]/5">
              <div className="divide-y divide-[#2c2420]/5">
                {data?.recentNotifications.length === 0 && <p className="p-8 text-center text-[#2c2420]/40">No notifications yet</p>}
                {data?.recentNotifications.map((n: any) => (
                  <div key={n.id} className="flex items-center gap-4 p-4">
                    <div className={`p-1.5 rounded-lg ${n.is_read ? "bg-gray-100" : "bg-blue-100"}`}>
                      <Bell className={`h-4 w-4 ${n.is_read ? "text-gray-500" : "text-blue-600"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#2c2420]">{n.title}</p>
                      <p className="text-xs text-[#2c2420]/40 truncate">{n.message} &middot; {n.profiles?.name}</p>
                    </div>
                    <Badge className={n.is_read ? "bg-gray-100 text-gray-600" : "bg-blue-100 text-blue-700"}>{n.is_read ? "Read" : "Unread"}</Badge>
                    <span className="text-xs text-[#2c2420]/40">{formatTime(n.created_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "emails" && (
            <div className="bg-white/70 dark:bg-card/70 backdrop-blur rounded-2xl border border-[#2c2420]/5">
              <div className="divide-y divide-[#2c2420]/5">
                {data?.emailLogs.length === 0 && <p className="p-8 text-center text-[#2c2420]/40">No email logs yet</p>}
                {data?.emailLogs.map((e: any) => (
                  <div key={e.id} className="flex items-center gap-4 p-4">
                    <Mail className="h-5 w-5 text-[#d97a4a]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#2c2420]">{e.subject || e.email_type}</p>
                      <p className="text-xs text-[#2c2420]/40">{e.recipient_email || e.email}</p>
                    </div>
                    <Badge className={
                      e.status === "delivered" ? "bg-green-100 text-green-700" :
                      e.status === "failed" || e.status === "bounced" ? "bg-red-100 text-red-700" :
                      "bg-amber-100 text-amber-700"
                    }>{e.status}</Badge>
                    <span className="text-xs text-[#2c2420]/40">{formatTime(e.created_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
