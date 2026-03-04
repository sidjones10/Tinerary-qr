"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  Shield,
  Clock,
  User,
  LogIn,
  Trash2,
  Settings,
  Edit,
  Eye,
  Ban,
  UserPlus,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface AuditData {
  logs: any[]
  loginEvents: any[]
  total: number
  page: number
  totalPages: number
}

const actionIcons: Record<string, any> = {
  delete_user: Trash2,
  update_settings: Settings,
  edit_content: Edit,
  view_data: Eye,
  suspend_user: Ban,
  create_user: UserPlus,
}

const actionColors: Record<string, string> = {
  delete_user: "bg-red-100 text-red-700",
  suspend_user: "bg-amber-100 text-amber-700",
  update_settings: "bg-blue-100 text-blue-700",
  edit_content: "bg-purple-100 text-purple-700",
  view_data: "bg-gray-100 text-gray-700",
  create_user: "bg-green-100 text-green-700",
}

export default function AdminAuditLogPage() {
  const [data, setData] = useState<AuditData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [tab, setTab] = useState<"audit" | "logins">("audit")

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/audit-log?page=${page}`)
      if (res.ok) setData(await res.json())
    } catch (e) { console.error(e) }
    setIsLoading(false)
  }, [page])

  useEffect(() => { fetchData() }, [fetchData])

  const formatTime = (d: string) => {
    const date = new Date(d)
    const diff = Date.now() - date.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(diff / 3600000)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(diff / 86400000)
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="p-4 lg:p-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild><Link href="/admin"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <div>
            <h1 className="text-2xl font-bold text-[#2c2420]">Audit Log</h1>
            <p className="text-sm text-[#2c2420]/50">Track all admin actions and login events</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("audit")} className={`px-4 py-2 text-sm font-medium rounded-lg ${tab === "audit" ? "bg-[#2c2420] text-white" : "bg-white/60 text-[#2c2420]/60 hover:bg-white"}`}>
          <Shield className="h-4 w-4 inline mr-2" />Admin Actions
        </button>
        <button onClick={() => setTab("logins")} className={`px-4 py-2 text-sm font-medium rounded-lg ${tab === "logins" ? "bg-[#2c2420] text-white" : "bg-white/60 text-[#2c2420]/60 hover:bg-white"}`}>
          <LogIn className="h-4 w-4 inline mr-2" />Login Events
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#ffb88c]" /></div>
      ) : (
        <>
          {tab === "audit" && (
            <div className="bg-white/70 dark:bg-card/70 backdrop-blur rounded-2xl border border-[#2c2420]/5">
              <div className="divide-y divide-[#2c2420]/5">
                {data?.logs.length === 0 && (
                  <div className="p-8 text-center">
                    <Shield className="h-12 w-12 text-[#2c2420]/20 mx-auto mb-3" />
                    <p className="text-[#2c2420]/40">No audit logs yet. Admin actions will be recorded here.</p>
                  </div>
                )}
                {data?.logs.map((log: any) => {
                  const ActionIcon = actionIcons[log.action] || Shield
                  const colorClass = actionColors[log.action] || "bg-gray-100 text-gray-700"
                  return (
                    <div key={log.id} className="flex items-center gap-4 p-4">
                      <div className={`p-2 rounded-lg ${colorClass}`}>
                        <ActionIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#2c2420]">{log.description || log.action}</p>
                        <p className="text-xs text-[#2c2420]/40">
                          by {log.admin?.name || log.admin?.email || "System"} &middot; {formatTime(log.created_at)}
                        </p>
                      </div>
                      <Badge className={colorClass}>{log.action}</Badge>
                      {log.target_id && <span className="text-xs text-[#2c2420]/30 font-mono">{log.target_id.slice(0, 8)}</span>}
                    </div>
                  )
                })}
              </div>

              {data && data.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 p-4 border-t border-[#2c2420]/5">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                  <span className="text-sm text-[#2c2420]/50">Page {page} of {data.totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                </div>
              )}
            </div>
          )}

          {tab === "logins" && (
            <div className="bg-white/70 dark:bg-card/70 backdrop-blur rounded-2xl border border-[#2c2420]/5">
              <div className="divide-y divide-[#2c2420]/5">
                {data?.loginEvents.length === 0 && <p className="p-8 text-center text-[#2c2420]/40">No login events recorded</p>}
                {data?.loginEvents.map((event: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-4 p-4">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <LogIn className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#2c2420]">{event.profiles?.name || event.profiles?.email || "Unknown User"}</p>
                      <p className="text-xs text-[#2c2420]/40">
                        {event.ip_address && `IP: ${event.ip_address} · `}
                        {event.method || "email"} login
                      </p>
                    </div>
                    <Badge className={event.success !== false ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                      {event.success !== false ? "Success" : "Failed"}
                    </Badge>
                    <span className="text-xs text-[#2c2420]/40">{formatTime(event.created_at)}</span>
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
