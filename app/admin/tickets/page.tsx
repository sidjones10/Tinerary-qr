"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  Ticket,
  CheckCircle,
  Clock,
  AlertCircle,
  MessageSquare,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"

interface TicketData {
  tickets: any[]
  counts: { open: number; in_progress: number; closed: number }
}

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
}

const statusColors: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  closed: "bg-green-100 text-green-700",
}

export default function AdminTicketsPage() {
  const [data, setData] = useState<TicketData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState("open")
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/tickets?filter=${filter}`)
      if (res.ok) setData(await res.json())
    } catch (e) { console.error(e) }
    setIsLoading(false)
  }, [filter])

  useEffect(() => { fetchData() }, [fetchData])

  const updateStatus = async (ticketId: string, status: string) => {
    try {
      const res = await fetch("/api/admin/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_status", ticketId, status }),
      })
      if (res.ok) {
        toast({ title: "Updated", description: `Ticket marked as ${status}` })
        fetchData()
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to update", variant: "destructive" })
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
            <h1 className="text-2xl font-bold text-[#2c2420]">Support Tickets</h1>
            <p className="text-sm text-[#2c2420]/50">Manage user support requests</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Open", count: data?.counts.open || 0, color: "text-blue-600 bg-blue-50", icon: AlertCircle },
          { label: "In Progress", count: data?.counts.in_progress || 0, color: "text-amber-600 bg-amber-50", icon: Clock },
          { label: "Closed", count: data?.counts.closed || 0, color: "text-green-600 bg-green-50", icon: CheckCircle },
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

      <div className="flex gap-2 mb-6">
        {["open", "in_progress", "closed", "all"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 text-sm font-medium rounded-lg ${filter === f ? "bg-[#2c2420] text-white" : "bg-white/60 text-[#2c2420]/60 hover:bg-white"}`}>
            {f === "in_progress" ? "In Progress" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#ffb88c]" /></div>
      ) : (
        <div className="space-y-3">
          {data?.tickets.length === 0 && (
            <div className="bg-white/70 dark:bg-card/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-10 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-[#2c2420]/40">No tickets in this category</p>
            </div>
          )}
          {data?.tickets.map((ticket: any) => (
            <div key={ticket.id} className="bg-white/70 dark:bg-card/70 backdrop-blur rounded-2xl border border-[#2c2420]/5">
              <div className="p-4 cursor-pointer" onClick={() => setExpandedTicket(expandedTicket === ticket.id ? null : ticket.id)}>
                <div className="flex items-start gap-4">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={ticket.profiles?.avatar_url || undefined} />
                    <AvatarFallback className="bg-[#ffb88c]/20 text-[#d97a4a] text-xs">{ticket.profiles?.name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-[#2c2420]">{ticket.subject || ticket.title || "Support Ticket"}</p>
                      <Badge className={statusColors[ticket.status] || "bg-gray-100 text-gray-700"}>{ticket.status}</Badge>
                      {ticket.priority && <Badge className={priorityColors[ticket.priority] || "bg-gray-100 text-gray-700"}>{ticket.priority}</Badge>}
                    </div>
                    <p className="text-xs text-[#2c2420]/40">{ticket.profiles?.name} &middot; {ticket.profiles?.email} &middot; {formatTime(ticket.created_at)}</p>
                  </div>
                  <div className="flex gap-1">
                    {ticket.status === "open" && (
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); updateStatus(ticket.id, "in_progress") }}>
                        <Clock className="h-4 w-4 mr-1" />Start
                      </Button>
                    )}
                    {ticket.status === "in_progress" && (
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); updateStatus(ticket.id, "closed") }}>
                        <CheckCircle className="h-4 w-4 mr-1" />Close
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {expandedTicket === ticket.id && (
                <div className="px-4 pb-4 border-t border-[#2c2420]/5 pt-4">
                  <p className="text-sm text-[#2c2420]/80 whitespace-pre-wrap">{ticket.description || ticket.message || "No details provided"}</p>
                  {ticket.category && <p className="text-xs text-[#2c2420]/40 mt-2">Category: {ticket.category}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
