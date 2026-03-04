"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  Webhook,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Activity,
  Percent,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface WebhookData {
  webhookLogs: any[]
  emailWebhookEvents: any[]
  stats: { totalWebhooks: number; successCount: number; failureCount: number; successRate: number }
}

export default function AdminWebhooksPage() {
  const [data, setData] = useState<WebhookData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [tab, setTab] = useState<"webhooks" | "email-events">("webhooks")

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/admin/webhooks")
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
            <h1 className="text-2xl font-bold text-[#2c2420]">Webhook Health</h1>
            <p className="text-sm text-[#2c2420]/50">Monitor webhook delivery and email events</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total", value: data?.stats.totalWebhooks || 0, icon: Webhook, color: "text-blue-600 bg-blue-50" },
          { label: "Successful", value: data?.stats.successCount || 0, icon: CheckCircle, color: "text-green-600 bg-green-50" },
          { label: "Failed", value: data?.stats.failureCount || 0, icon: XCircle, color: "text-red-600 bg-red-50" },
          { label: "Success Rate", value: `${data?.stats.successRate || 100}%`, icon: Percent, color: "text-purple-600 bg-purple-50" },
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
        <button onClick={() => setTab("webhooks")} className={`px-4 py-2 text-sm font-medium rounded-lg ${tab === "webhooks" ? "bg-[#2c2420] text-white" : "bg-white/60 text-[#2c2420]/60 hover:bg-white"}`}>
          <Webhook className="h-4 w-4 inline mr-2" />Webhook Logs
        </button>
        <button onClick={() => setTab("email-events")} className={`px-4 py-2 text-sm font-medium rounded-lg ${tab === "email-events" ? "bg-[#2c2420] text-white" : "bg-white/60 text-[#2c2420]/60 hover:bg-white"}`}>
          <Mail className="h-4 w-4 inline mr-2" />Email Events
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#ffb88c]" /></div>
      ) : (
        <div className="bg-white/70 dark:bg-card/70 backdrop-blur rounded-2xl border border-[#2c2420]/5">
          <div className="divide-y divide-[#2c2420]/5">
            {tab === "webhooks" && (
              <>
                {data?.webhookLogs.length === 0 && (
                  <div className="p-8 text-center">
                    <Webhook className="h-12 w-12 text-[#2c2420]/20 mx-auto mb-3" />
                    <p className="text-[#2c2420]/40">No webhook logs yet. Logs will appear as webhooks are processed.</p>
                  </div>
                )}
                {data?.webhookLogs.map((log: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-4 p-4">
                    {log.status === "success" || log.status_code === 200 ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#2c2420]">{log.event_type || log.endpoint || "Webhook"}</p>
                      <p className="text-xs text-[#2c2420]/40 truncate">{log.url || log.payload_summary || ""}</p>
                    </div>
                    <Badge className={log.status_code === 200 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                      {log.status_code || log.status}
                    </Badge>
                    <span className="text-xs text-[#2c2420]/40">{formatTime(log.created_at)}</span>
                  </div>
                ))}
              </>
            )}

            {tab === "email-events" && (
              <>
                {data?.emailWebhookEvents.length === 0 && <p className="p-8 text-center text-[#2c2420]/40">No email events yet</p>}
                {data?.emailWebhookEvents.map((e: any) => (
                  <div key={e.id} className="flex items-center gap-4 p-4">
                    <Mail className="h-4 w-4 text-[#d97a4a]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#2c2420]">{e.subject || e.email_type || "Email"}</p>
                      <p className="text-xs text-[#2c2420]/40">{e.recipient_email || e.email}</p>
                    </div>
                    <Badge className={
                      e.status === "delivered" ? "bg-green-100 text-green-700" :
                      e.status === "bounced" || e.status === "failed" ? "bg-red-100 text-red-700" :
                      e.status === "opened" || e.status === "clicked" ? "bg-blue-100 text-blue-700" :
                      "bg-gray-100 text-gray-700"
                    }>{e.status}</Badge>
                    <span className="text-xs text-[#2c2420]/40">{formatTime(e.created_at)}</span>
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
