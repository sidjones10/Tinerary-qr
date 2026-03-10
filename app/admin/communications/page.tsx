"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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
  Eye,
  MousePointerClick,
  Ban,
  Inbox,
  Search,
  Users,
  X,
  ChevronDown,
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
  resend_id: string | null
  error_message: string | null
  delivered_at: string | null
  opened_at: string | null
  clicked_at: string | null
  bounced_at: string | null
  complained_at: string | null
  metadata: Record<string, unknown>
  created_at: string
}

interface UserProfile {
  id: string
  email: string
  name: string | null
  username: string | null
  avatar_url: string | null
}

interface EmailStats {
  total: number
  sent: number
  delivered: number
  opened: number
  bounced: number
  failed: number
  byType: Record<string, { sent: number; delivered: number; failed: number }>
  last24h: number
  last7d: number
}

const emailTypeLabels: Record<string, string> = {
  welcome: "Welcome",
  event_invite: "Event Invite",
  event_reminder: "Event Reminder",
  new_follower: "New Follower",
  new_like: "New Like",
  new_comment: "New Comment",
  password_reset: "Password Reset",
  countdown_reminder: "Countdown",
  event_started: "Event Started",
  whats_new: "What's New",
  signin_alert: "Sign-In Alert",
  account_deletion_warning: "Deletion Warning",
  summer_planning: "Summer Planning",
}

const emailTypeColors: Record<string, string> = {
  welcome: "bg-green-100 text-green-700",
  event_invite: "bg-blue-100 text-blue-700",
  event_reminder: "bg-amber-100 text-amber-700",
  new_follower: "bg-purple-100 text-purple-700",
  new_like: "bg-rose-100 text-rose-700",
  new_comment: "bg-teal-100 text-teal-700",
  password_reset: "bg-gray-100 text-gray-700",
  countdown_reminder: "bg-orange-100 text-orange-700",
  event_started: "bg-emerald-100 text-emerald-700",
  whats_new: "bg-pink-100 text-pink-700",
  signin_alert: "bg-slate-100 text-slate-700",
  account_deletion_warning: "bg-red-100 text-red-700",
  summer_planning: "bg-sky-100 text-sky-700",
}

const statusConfig: Record<string, { label: string; className: string; icon: typeof CheckCircle }> = {
  sent: { label: "Sent", className: "bg-blue-100 text-blue-700", icon: Send },
  delivered: { label: "Delivered", className: "bg-green-100 text-green-700", icon: Inbox },
  delayed: { label: "Delayed", className: "bg-amber-100 text-amber-700", icon: Clock },
  bounced: { label: "Bounced", className: "bg-red-100 text-red-700", icon: Ban },
  complained: { label: "Spam", className: "bg-red-100 text-red-700", icon: AlertCircle },
  failed: { label: "Failed", className: "bg-red-100 text-red-700", icon: XCircle },
}

const sendableEmailTypes: { value: string; label: string; description: string }[] = [
  { value: "welcome", label: "Welcome", description: "New user onboarding email with feature highlights" },
  { value: "whats_new", label: "What's New", description: "Feature announcements and travel tips" },
  { value: "event_invite", label: "Event Invite", description: "Sample event invitation with RSVP buttons" },
  { value: "event_reminder", label: "Event Reminder", description: "Reminder about an upcoming event" },
  { value: "countdown_reminder", label: "Countdown Reminder", description: "Countdown to event start" },
  { value: "event_started", label: "Event Started", description: "Notification that an event is happening now" },
  { value: "new_follower", label: "New Follower", description: "Someone started following notification" },
  { value: "new_like", label: "New Like", description: "Someone liked your itinerary notification" },
  { value: "new_comment", label: "New Comment", description: "New comment on itinerary notification" },
  { value: "signin_alert", label: "Sign-In Alert", description: "New device sign-in security alert" },
  { value: "account_deletion_warning", label: "Deletion Warning", description: "Account scheduled for deletion warning" },
  { value: "summer_planning", label: "Summer Planning", description: "Encourage users to plan their summer 2026 trips and events" },
]

export default function AdminCommunicationsPage() {
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [stats, setStats] = useState<EmailStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  // Send email panel state
  const [selectedEmailType, setSelectedEmailType] = useState<string>("welcome")
  const [sendToAll, setSendToAll] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<UserProfile[]>([])
  const [userSearch, setUserSearch] = useState("")
  const [userSearchResults, setUserSearchResults] = useState<UserProfile[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number } | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Search users as they type
  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setUserSearchResults([])
      setShowUserDropdown(false)
      return
    }
    setIsSearching(true)
    const supabase = createClient()
    const { data } = await supabase
      .from("profiles")
      .select("id, email, name, username, avatar_url")
      .not("email", "is", null)
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,username.ilike.%${query}%`)
      .limit(20)

    const selectedIds = new Set(selectedUsers.map(u => u.id))
    setUserSearchResults((data || []).filter(u => !selectedIds.has(u.id)))
    setShowUserDropdown(true)
    setIsSearching(false)
  }, [selectedUsers])

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    if (userSearch.trim()) {
      searchTimeoutRef.current = setTimeout(() => searchUsers(userSearch), 300)
    } else {
      setUserSearchResults([])
      setShowUserDropdown(false)
    }
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current) }
  }, [userSearch, searchUsers])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const addUser = (user: UserProfile) => {
    setSelectedUsers(prev => [...prev, user])
    setUserSearch("")
    setUserSearchResults([])
    setShowUserDropdown(false)
  }

  const removeUser = (userId: string) => {
    setSelectedUsers(prev => prev.filter(u => u.id !== userId))
  }

  const handleSendEmail = async () => {
    setIsSending(true)
    setSendResult(null)
    setSendError(null)
    try {
      const res = await fetch("/api/admin/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailType: selectedEmailType,
          sendToAll,
          recipientIds: sendToAll ? undefined : selectedUsers.map(u => u.id),
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSendResult({ sent: data.stats.sent, failed: data.stats.failed })
        fetchLogs()
      } else {
        setSendError(data.error || "Failed to send")
      }
    } catch (err) {
      console.error("Send failed:", err)
      setSendError("Network error")
    }
    setIsSending(false)
  }

  const fetchLogs = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()

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
      .select("status, email_type, created_at, opened_at")
      .order("created_at", { ascending: false })
      .limit(5000)

    if (allData) {
      const now = new Date()
      const h24 = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      const byType: Record<string, { sent: number; delivered: number; failed: number }> = {}
      let sent = 0
      let delivered = 0
      let opened = 0
      let bounced = 0
      let failed = 0
      let last24h = 0
      let last7d = 0

      for (const row of allData) {
        if (row.status === "delivered") delivered++
        else if (row.status === "sent" || row.status === "delayed") sent++
        else if (row.status === "bounced") bounced++
        else failed++

        if (row.opened_at) opened++

        const created = new Date(row.created_at)
        if (created >= h24) last24h++
        if (created >= d7) last7d++

        if (!byType[row.email_type]) byType[row.email_type] = { sent: 0, delivered: 0, failed: 0 }
        if (row.status === "delivered") byType[row.email_type].delivered++
        else if (row.status === "sent" || row.status === "delayed") byType[row.email_type].sent++
        else byType[row.email_type].failed++
      }

      setStats({ total: allData.length, sent, delivered, opened, bounced, failed, byType, last24h, last7d })
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

  const deliveryRate =
    stats && stats.total > 0
      ? (((stats.delivered + stats.sent) / stats.total) * 100).toFixed(1)
      : "0"

  const openRate =
    stats && (stats.delivered + stats.sent) > 0
      ? ((stats.opened / (stats.delivered + stats.sent)) * 100).toFixed(1)
      : "0"

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
            <p className="text-sm text-[#2c2420]/50">Track all outbound email activity and delivery</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Send Email Panel */}
      <div className="bg-white/70 dark:bg-card/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-5 mb-6">
        <h3 className="text-sm font-semibold text-[#2c2420] flex items-center gap-2 mb-4">
          <Mail className="h-4 w-4 text-[#D4792C]" />
          Send Email
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Email Type Selection */}
          <div>
            <label className="block text-xs font-medium text-[#2c2420]/60 mb-1.5">Email Template</label>
            <div className="relative">
              <select
                value={selectedEmailType}
                onChange={(e) => setSelectedEmailType(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-xl bg-white dark:bg-card border border-[#2c2420]/10 text-[#2c2420] appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-[#D4792C]/30 focus:border-[#D4792C]"
              >
                {sendableEmailTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <ChevronDown className="h-4 w-4 text-[#2c2420]/40 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <p className="text-xs text-[#2c2420]/40 mt-1">
              {sendableEmailTypes.find(t => t.value === selectedEmailType)?.description}
            </p>
          </div>

          {/* Recipient Selection */}
          <div>
            <label className="block text-xs font-medium text-[#2c2420]/60 mb-1.5">Recipients</label>

            {/* Send to All toggle */}
            <label className="flex items-center gap-2 mb-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sendToAll}
                onChange={(e) => setSendToAll(e.target.checked)}
                className="rounded border-[#2c2420]/20 text-[#D4792C] focus:ring-[#D4792C]/30"
              />
              <span className="text-sm text-[#2c2420]/70 flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                Send to all users
              </span>
            </label>

            {/* User search (hidden when send to all) */}
            {!sendToAll && (
              <div className="relative" ref={dropdownRef}>
                <div className="relative">
                  <Search className="h-4 w-4 text-[#2c2420]/30 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search users by name, email, or username..."
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-white dark:bg-card border border-[#2c2420]/10 text-[#2c2420] placeholder:text-[#2c2420]/30 focus:outline-none focus:ring-2 focus:ring-[#D4792C]/30 focus:border-[#D4792C]"
                  />
                  {isSearching && (
                    <Loader2 className="h-4 w-4 animate-spin text-[#D4792C] absolute right-3 top-1/2 -translate-y-1/2" />
                  )}
                </div>

                {/* Search results dropdown */}
                {showUserDropdown && userSearchResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-card border border-[#2c2420]/10 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {userSearchResults.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => addUser(user)}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[#D4792C]/5 transition-colors first:rounded-t-xl last:rounded-b-xl"
                      >
                        <div className="h-7 w-7 rounded-full bg-[#D4792C]/10 flex items-center justify-center text-xs font-semibold text-[#D4792C] flex-shrink-0">
                          {(user.name || user.username || user.email)?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[#2c2420] truncate">
                            {user.name || user.username || "Unknown"}
                          </p>
                          <p className="text-xs text-[#2c2420]/40 truncate">{user.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {showUserDropdown && userSearchResults.length === 0 && userSearch.trim() && !isSearching && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-card border border-[#2c2420]/10 rounded-xl shadow-lg p-3 text-center">
                    <p className="text-xs text-[#2c2420]/40">No users found</p>
                  </div>
                )}
              </div>
            )}

            {/* Selected users chips */}
            {!sendToAll && selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selectedUsers.map((user) => (
                  <span
                    key={user.id}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#D4792C]/10 text-[#D4792C] text-xs font-medium"
                  >
                    {user.name || user.username || user.email}
                    <button
                      onClick={() => removeUser(user.id)}
                      className="hover:text-[#2c2420] transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Send button and result */}
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <Button
            size="sm"
            onClick={handleSendEmail}
            disabled={isSending || (!sendToAll && selectedUsers.length === 0)}
            className="bg-[#D4792C] hover:bg-[#c06a20] text-white"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {isSending
              ? "Sending..."
              : sendToAll
              ? `Send ${sendableEmailTypes.find(t => t.value === selectedEmailType)?.label} to All Users`
              : `Send to ${selectedUsers.length} User${selectedUsers.length !== 1 ? "s" : ""}`}
          </Button>

          {sendResult && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-green-700 flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                <strong>{sendResult.sent} sent</strong>
              </span>
              {sendResult.failed > 0 && (
                <span className="text-sm text-red-600">({sendResult.failed} failed)</span>
              )}
              <button onClick={() => setSendResult(null)} className="text-xs text-[#2c2420]/40 hover:text-[#2c2420]">
                Dismiss
              </button>
            </div>
          )}

          {sendError && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-600 flex items-center gap-1">
                <XCircle className="h-4 w-4" />
                {sendError}
              </span>
              <button onClick={() => setSendError(null)} className="text-xs text-[#2c2420]/40 hover:text-[#2c2420]">
                Dismiss
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white/70 dark:bg-card/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-4">
            <div className="flex items-center gap-2 text-[#2c2420]/50 mb-1">
              <Send className="h-4 w-4" />
              <span className="text-xs font-medium">Total Emails</span>
            </div>
            <p className="text-2xl font-bold text-[#2c2420]">{stats.total.toLocaleString()}</p>
            <p className="text-xs text-[#2c2420]/40 mt-1">
              {stats.last24h} today &middot; {stats.last7d} this week
            </p>
          </div>
          <div className="bg-white/70 dark:bg-card/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-4">
            <div className="flex items-center gap-2 text-green-600/70 mb-1">
              <Inbox className="h-4 w-4" />
              <span className="text-xs font-medium">Delivered</span>
            </div>
            <p className="text-2xl font-bold text-[#2c2420]">{stats.delivered.toLocaleString()}</p>
            <p className="text-xs text-[#2c2420]/40 mt-1">{deliveryRate}% delivery rate</p>
          </div>
          <div className="bg-white/70 dark:bg-card/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-4">
            <div className="flex items-center gap-2 text-blue-600/70 mb-1">
              <Eye className="h-4 w-4" />
              <span className="text-xs font-medium">Opened</span>
            </div>
            <p className="text-2xl font-bold text-[#2c2420]">{stats.opened.toLocaleString()}</p>
            <p className="text-xs text-[#2c2420]/40 mt-1">{openRate}% open rate</p>
          </div>
          <div className="bg-white/70 dark:bg-card/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-4">
            <div className="flex items-center gap-2 text-red-500/70 mb-1">
              <Ban className="h-4 w-4" />
              <span className="text-xs font-medium">Bounced</span>
            </div>
            <p className="text-2xl font-bold text-[#2c2420]">{stats.bounced.toLocaleString()}</p>
            <p className="text-xs text-[#2c2420]/40 mt-1">{stats.failed} failed to send</p>
          </div>
          <div className="bg-white/70 dark:bg-card/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-4">
            <div className="flex items-center gap-2 text-[#2c2420]/50 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium">Success Rate</span>
            </div>
            <p className="text-2xl font-bold text-[#2c2420]">{deliveryRate}%</p>
            <p className="text-xs text-[#2c2420]/40 mt-1">delivered or in transit</p>
          </div>
        </div>
      )}

      {/* Breakdown by type */}
      {stats && Object.keys(stats.byType).length > 0 && (
        <div className="bg-white/70 dark:bg-card/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-4 mb-6">
          <h3 className="text-sm font-semibold text-[#2c2420] mb-3">Breakdown by Type</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(stats.byType)
              .sort(([, a], [, b]) => (b.sent + b.delivered + b.failed) - (a.sent + a.delivered + a.failed))
              .map(([type, counts]) => (
                <div key={type} className="flex items-center justify-between p-2 rounded-lg bg-white/50 dark:bg-card/50">
                  <Badge className={emailTypeColors[type] || "bg-gray-100 text-gray-700"} variant="secondary">
                    {emailTypeLabels[type] || type}
                  </Badge>
                  <div className="text-right text-xs">
                    {counts.delivered > 0 && (
                      <span className="text-green-600 font-semibold">{counts.delivered} delivered</span>
                    )}
                    {counts.sent > 0 && (
                      <span className="text-blue-600 font-semibold ml-1">{counts.sent} sent</span>
                    )}
                    {counts.failed > 0 && (
                      <span className="text-red-500 ml-1">({counts.failed} failed)</span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <div className="flex gap-2 flex-wrap">
          {(["all", "sent", "delivered", "bounced", "failed"] as const).map((f) => {
            const icons: Record<string, typeof CheckCircle> = {
              sent: Send,
              delivered: Inbox,
              bounced: Ban,
              failed: XCircle,
            }
            const Icon = icons[f]
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  filter === f
                    ? "bg-[#2c2420] text-white"
                    : "bg-white/60 dark:bg-card/60 text-[#2c2420]/60 hover:bg-white hover:text-[#2c2420]"
                }`}
              >
                {Icon && <Icon className="h-4 w-4 inline mr-2" />}
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            )
          })}
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg bg-white/60 dark:bg-card/60 border border-[#2c2420]/10 text-[#2c2420]/70"
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
        <div className="bg-white/70 dark:bg-card/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-10 text-center">
          <Mail className="h-12 w-12 text-[#ffb88c] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[#2c2420] mb-2">No emails found</h3>
          <p className="text-sm text-[#2c2420]/50">
            {filter === "failed"
              ? "No failed emails — that's great!"
              : filter === "bounced"
              ? "No bounced emails — that's great!"
              : "Email logs will appear here as emails are sent."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => {
            const cfg = statusConfig[log.status] || statusConfig.failed
            const StatusIcon = cfg.icon
            return (
              <div
                key={log.id}
                className={`bg-white/70 dark:bg-card/70 backdrop-blur rounded-2xl border transition-all p-4 ${
                  log.status === "bounced" || log.status === "failed" || log.status === "complained"
                    ? "border-red-200"
                    : log.status === "delivered"
                    ? "border-green-200"
                    : "border-[#2c2420]/5"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <Badge className={emailTypeColors[log.email_type] || "bg-gray-100 text-gray-700"} variant="secondary">
                        {emailTypeLabels[log.email_type] || log.email_type}
                      </Badge>
                      <Badge className={cfg.className} variant="secondary">
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {cfg.label}
                      </Badge>
                      {log.opened_at && (
                        <Badge className="bg-blue-50 text-blue-600" variant="secondary">
                          <Eye className="h-3 w-3 mr-1" />
                          Opened
                        </Badge>
                      )}
                      {log.clicked_at && (
                        <Badge className="bg-violet-50 text-violet-600" variant="secondary">
                          <MousePointerClick className="h-3 w-3 mr-1" />
                          Clicked
                        </Badge>
                      )}
                      <span className="text-xs text-[#2c2420]/40 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(log.created_at)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-[#2c2420] truncate">{log.subject}</p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <p className="text-xs text-[#2c2420]/50">
                        To: {log.recipient_email}
                      </p>
                      {log.delivered_at && (
                        <span className="text-xs text-green-600">
                          Delivered {formatTime(log.delivered_at)}
                        </span>
                      )}
                      {log.opened_at && (
                        <span className="text-xs text-blue-600">
                          Opened {formatTime(log.opened_at)}
                        </span>
                      )}
                    </div>
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
            )
          })}
        </div>
      )}

      {/* Webhook info */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex gap-3">
          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <strong>Resend Webhooks:</strong> Delivery, open, and bounce tracking is powered by Resend
            webhooks. Configure your webhook URL in the{" "}
            <span className="font-mono text-xs bg-blue-100 px-1 py-0.5 rounded">
              Resend Dashboard &rarr; Webhooks
            </span>{" "}
            pointing to{" "}
            <code className="bg-blue-100 px-1 py-0.5 rounded text-xs">
              /api/webhooks/resend
            </code>{" "}
            and set{" "}
            <code className="bg-blue-100 px-1 py-0.5 rounded text-xs">
              RESEND_WEBHOOK_SECRET
            </code>{" "}
            in your environment.
          </div>
        </div>
      </div>
    </div>
  )
}
