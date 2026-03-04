"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  Users,
  MousePointerClick,
  DollarSign,
  Link2,
  Gift,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface ReferralData {
  referrals: any[]
  affiliateClicks: any[]
  stats: { totalReferrals: number; totalAffiliateEntries: number; totalRevenue: number; totalClickCount: number }
}

export default function AdminReferralsPage() {
  const [data, setData] = useState<ReferralData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [tab, setTab] = useState<"referrals" | "affiliates">("referrals")

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/admin/referrals")
      if (res.ok) setData(await res.json())
    } catch (e) { console.error(e) }
    setIsLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const formatTime = (d: string) => {
    const diff = Date.now() - new Date(d).getTime()
    const days = Math.floor(diff / 86400000)
    if (days < 1) return "Today"
    if (days < 7) return `${days}d ago`
    return new Date(d).toLocaleDateString()
  }

  return (
    <div className="p-4 lg:p-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild><Link href="/admin"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <div>
            <h1 className="text-2xl font-bold text-[#2c2420]">Referrals & Affiliates</h1>
            <p className="text-sm text-[#2c2420]/50">Track referral chains and affiliate performance</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Referrals", value: data?.stats.totalReferrals || 0, icon: Users, color: "text-blue-600 bg-blue-50" },
          { label: "Affiliate Links", value: data?.stats.totalAffiliateEntries || 0, icon: Link2, color: "text-purple-600 bg-purple-50" },
          { label: "Total Clicks", value: data?.stats.totalClickCount || 0, icon: MousePointerClick, color: "text-amber-600 bg-amber-50" },
          { label: "Revenue", value: `$${(data?.stats.totalRevenue || 0).toFixed(2)}`, icon: DollarSign, color: "text-green-600 bg-green-50" },
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
        <button onClick={() => setTab("referrals")} className={`px-4 py-2 text-sm font-medium rounded-lg ${tab === "referrals" ? "bg-[#2c2420] text-white" : "bg-white/60 text-[#2c2420]/60 hover:bg-white"}`}>
          <Gift className="h-4 w-4 inline mr-2" />Referrals
        </button>
        <button onClick={() => setTab("affiliates")} className={`px-4 py-2 text-sm font-medium rounded-lg ${tab === "affiliates" ? "bg-[#2c2420] text-white" : "bg-white/60 text-[#2c2420]/60 hover:bg-white"}`}>
          <Link2 className="h-4 w-4 inline mr-2" />Affiliates
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#ffb88c]" /></div>
      ) : (
        <div className="bg-white/70 dark:bg-card/70 backdrop-blur rounded-2xl border border-[#2c2420]/5">
          <div className="divide-y divide-[#2c2420]/5">
            {tab === "referrals" && (
              <>
                {data?.referrals.length === 0 && <p className="p-8 text-center text-[#2c2420]/40">No referrals yet</p>}
                {data?.referrals.map((r: any) => (
                  <div key={r.id} className="flex items-center gap-4 p-4">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={r.referrer?.avatar_url || undefined} />
                      <AvatarFallback className="bg-[#ffb88c]/20 text-[#d97a4a] text-xs">{r.referrer?.name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#2c2420]">
                        <span className="font-medium">{r.referrer?.name || "Unknown"}</span>
                        <span className="text-[#2c2420]/40 mx-2">invited</span>
                        <span className="font-medium">{r.referred?.name || "Unknown"}</span>
                      </p>
                      <p className="text-xs text-[#2c2420]/40">{formatTime(r.created_at)}</p>
                    </div>
                    <Badge className={r.status === "completed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>
                      {r.status || "pending"}
                    </Badge>
                  </div>
                ))}
              </>
            )}

            {tab === "affiliates" && (
              <>
                {data?.affiliateClicks.length === 0 && <p className="p-8 text-center text-[#2c2420]/40">No affiliate data yet</p>}
                {data?.affiliateClicks.map((a: any) => (
                  <div key={a.id} className="flex items-center gap-4 p-4">
                    <MousePointerClick className="h-5 w-5 text-purple-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#2c2420]">{a.creator?.name || "Unknown Creator"}</p>
                      <p className="text-xs text-[#2c2420]/40">{a.click_count || 0} clicks &middot; {formatTime(a.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">${(a.revenue || 0).toFixed(2)}</p>
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
