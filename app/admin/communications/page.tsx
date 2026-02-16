"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  TrendingUp,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"

interface EmailLog {
  id: string
  recipient_email: string
  email_type: string
  subject: string
  status: string
  error_message: string | null
  metadata: Record<string, unknown>
  created_at: string
}

interface EmailStats {
  total: number
  sent: number
  failed: number
  byType: Record<string, { sent: number; failed: number }>
  last24h: number
  last7d: number
}

const emailTypeLabels: Record<string, string> = {
  welcome: "Welcome",
  event_invite: "Event Invite",
  event_reminder: "Event Reminder",
  new_follower: "New Follower",
  new_comment: "New Comment",
  password_reset: "Password Reset",
  countdown_reminder: "Countdown",
  event_started: "Event Started",
  whats_new: "What's New",
  signin_alert: "Sign-In Alert",
  account_deletion_warning: "Deletion Warning",
}

const emailTypeColors: Record<string, string> = {
  welcome: "bg-green-100 text-green-700",
  event_invite: "bg-blue-100 text-blue-700",
  event_reminder: "bg-amber-100 text-amber-700",
  new_follower: "bg-purple-100 text-purple-700",
  new_comment: "bg-teal-100 text-teal-700",
  password_reset: "bg-gray-100 text-gray-700",
  countdown_reminder: "bg-orange-100 text-orange-700",
  event_started: "bg-emerald-100 text-emerald-700",
  whats_new: "bg-pink-100 text-pink-700",
  signin_alert: "bg-slate-100 text-slate-700",
  account_deletion_warning: "bg-red-100 text-red-700",
}

export default function AdminCommunicationsPage() {
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [stats, setStats] = useState<EmailStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "sent" | "failed">("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const fetchLogs = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()

    // Fetch logs
    let query = supabase
      .from("email_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)

    if (filter !== "all") {
      query = query.eq("status", filter)
    }
    if (typeFilter !== "all") {
      query = query.eq("email_type", typeFilter)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching email logs:", error)
      setLogs([])
      setStats(null)
      setIsLoading(false)
      return
    }

    setLogs(data || [])

    // Compute stats from all data (unfiltered)
    const { data: allData } = await supabase
      .from("email_logs")
      .select("status, email_type, created_at")
      .order("created_at", { ascending: false })
      .limit(5000)

    if (allData) {
      const now = new Date()
      const h24 = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      const byType: Record<string, { sent: number; failed: number }> = {}
      let sent = 0
      let failed = 0
      let last24h = 0
      let last7d = 0

      for (const row of allData) {
        if (row.status === "sent") sent++
        else failed++

        const created = new Date(row.created_at)
        if (created >= h24) last24h++
        if (created >= d7) last7d++

        if (!byType[row.email_type]) byType[row.email_type] = { sent: 0, failed: 0 }
        if (row.status === "sent") byType[row.email_type].sent++
        else byType[row.email_type].failed++
      }

      setStats({ total: allData.length, sent, failed, byType, last24h, last7d })
    }

    setIsLoading(false)
  }, [filter, typeFilter])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const successRate = stats && stats.total > 0 ? ((stats.sent / stats.total) * 100).toFixed(1) : "0"

  return (
    <div className="p-4 lg:p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild aria-label="Go back">
            <Link href="/admin">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[#2c2420]">Communications</h1>
            <p className="text-sm text-[#2c2420]/50">Track all outbound email activity</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-4">
            <div className="flex items-center gap-2 text-[#2c2420]/50 mb-1">
              <Send className="h-4 w-4" />
              <span className="text-xs font-medium">Total Sent</span>
            </div>
            <p className="text-2xl font-bold text-[#2c2420]">{stats.sent.toLocaleString()}</p>
            <p className="text-xs text-[#2c2420]/40 mt-1">{stats.total.toLocaleString()} total</p>
          </div>
          <div className="bg-white/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-4">
            <div className="flex items-center gap-2 text-[#2c2420]/50 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium">Success Rate</span>
            </div>
            <p className="text-2xl font-bold text-[#2c2420]">{successRate}%</p>
            <p className="text-xs text-[#2c2420]/40 mt-1">{stats.failed} failed</p>
          </div>
          <div className="bg-white/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-4">
            <div className="flex items-center gap-2 text-[#2c2420]/50 mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium">Last 24 hours</span>
            </div>
            <p className="text-2xl font-bold text-[#2c2420]">{stats.last24h.toLocaleString()}</p>
            <p className="text-xs text-[#2c2420]/40 mt-1">emails sent</p>
          </div>
          <div className="bg-white/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-4">
            <div className="flex items-center gap-2 text-[#2c2420]/50 mb-1">
              <Mail className="h-4 w-4" />
              <span className="text-xs font-medium">Last 7 days</span>
            </div>
            <p className="text-2xl font-bold text-[#2c2420]">{stats.last7d.toLocaleString()}</p>
            <p className="text-xs text-[#2c2420]/40 mt-1">emails sent</p>
          </div>
        </div>
      )}

      {/* Breakdown by type */}
      {stats && Object.keys(stats.byType).length > 0 && (
        <div className="bg-white/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-4 mb-6">
          <h3 className="text-sm font-semibold text-[#2c2420] mb-3">Breakdown by Type</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(stats.byType)
              .sort(([, a], [, b]) => (b.sent + b.failed) - (a.sent + a.failed))
              .map(([type, counts]) => (
                <div key={type} className="flex items-center justify-between p-2 rounded-lg bg-white/50">
                  <div className="flex items-center gap-2">
                    <Badge className={emailTypeColors[type] || "bg-gray-100 text-gray-700"} variant="secondary">
                      {emailTypeLabels[type] || type}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-[#2c2420]">{counts.sent}</span>
                    {counts.failed > 0 && (
                      <span className="text-xs text-red-500 ml-1">({counts.failed} failed)</span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <div className="flex gap-2">
          {(["all", "sent", "failed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                filter === f
                  ? "bg-[#2c2420] text-white"
                  : "bg-white/60 text-[#2c2420]/60 hover:bg-white hover:text-[#2c2420]"
              }`}
            >
              {f === "sent" && <CheckCircle className="h-4 w-4 inline mr-2" />}
              {f === "failed" && <XCircle className="h-4 w-4 inline mr-2" />}
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg bg-white/60 border border-[#2c2420]/10 text-[#2c2420]/70"
        >
          <option value="all">All types</option>
          {Object.entries(emailTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#ffb88c]" />
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-10 text-center">
          <Mail className="h-12 w-12 text-[#ffb88c] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[#2c2420] mb-2">No emails found</h3>
          <p className="text-sm text-[#2c2420]/50">
            {filter === "failed"
              ? "No failed emails — that's great!"
              : "Email logs will appear here as emails are sent."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className={`bg-white/70 backdrop-blur rounded-2xl border transition-all p-4 ${
                log.status === "failed" ? "border-red-200" : "border-[#2c2420]/5"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <Badge className={emailTypeColors[log.email_type] || "bg-gray-100 text-gray-700"} variant="secondary">
                      {emailTypeLabels[log.email_type] || log.email_type}
                    </Badge>
                    {log.status === "sent" ? (
                      <Badge className="bg-green-100 text-green-700" variant="secondary">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Sent
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-700" variant="secondary">
                        <XCircle className="h-3 w-3 mr-1" />
                        Failed
                      </Badge>
                    )}
                    <span className="text-xs text-[#2c2420]/40 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(log.created_at)}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-[#2c2420] truncate">{log.subject}</p>
                  <p className="text-xs text-[#2c2420]/50 mt-0.5">
                    To: {log.recipient_email}
                  </p>
                  {log.error_message && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 flex-shrink-0" />
                      {log.error_message}
                    </p>
                  )}
                </div>
                <span className="text-xs text-[#2c2420]/30 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
