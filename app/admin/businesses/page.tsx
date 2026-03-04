"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  Store,
  CheckCircle,
  XCircle,
  Users,
  Sparkles,
  Shield,
  Ban,
  BadgeCheck,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"

interface BusinessData {
  businesses: any[]
  creators: any[]
  stats: { totalBusinesses: number; verifiedBusinesses: number; totalCreators: number }
}

export default function AdminBusinessesPage() {
  const [data, setData] = useState<BusinessData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [tab, setTab] = useState<"businesses" | "creators">("businesses")
  const [filter, setFilter] = useState("all")

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/businesses?filter=${filter}`)
      if (res.ok) setData(await res.json())
    } catch (e) { console.error(e) }
    setIsLoading(false)
  }, [filter])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAction = async (action: string, businessId?: string, userId?: string) => {
    try {
      const res = await fetch("/api/admin/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, businessId, userId }),
      })
      if (res.ok) {
        toast({ title: "Success", description: `Business ${action}d` })
        fetchData()
      }
    } catch (e) {
      toast({ title: "Error", description: "Action failed", variant: "destructive" })
    }
  }

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
            <h1 className="text-2xl font-bold text-[#2c2420]">Businesses & Creators</h1>
            <p className="text-sm text-[#2c2420]/50">Manage business accounts and creators</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Businesses", value: data?.stats.totalBusinesses || 0, icon: Store, color: "text-purple-600 bg-purple-50" },
          { label: "Verified", value: data?.stats.verifiedBusinesses || 0, icon: BadgeCheck, color: "text-green-600 bg-green-50" },
          { label: "Creators", value: data?.stats.totalCreators || 0, icon: Sparkles, color: "text-amber-600 bg-amber-50" },
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

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("businesses")} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${tab === "businesses" ? "bg-[#2c2420] text-white" : "bg-white/60 text-[#2c2420]/60 hover:bg-white"}`}>
          <Store className="h-4 w-4 inline mr-2" />Businesses
        </button>
        <button onClick={() => setTab("creators")} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${tab === "creators" ? "bg-[#2c2420] text-white" : "bg-white/60 text-[#2c2420]/60 hover:bg-white"}`}>
          <Sparkles className="h-4 w-4 inline mr-2" />Creators
        </button>
      </div>

      {tab === "businesses" && (
        <div className="flex gap-2 mb-4">
          {["all", "verified", "unverified"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-xs font-medium rounded-lg ${filter === f ? "bg-[#2c2420] text-white" : "bg-white/60 text-[#2c2420]/60"}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#ffb88c]" /></div>
      ) : (
        <div className="bg-white/70 dark:bg-card/70 backdrop-blur rounded-2xl border border-[#2c2420]/5">
          <div className="divide-y divide-[#2c2420]/5">
            {tab === "businesses" && (
              <>
                {data?.businesses.length === 0 && <p className="p-8 text-center text-[#2c2420]/40">No businesses found</p>}
                {data?.businesses.map((b: any) => (
                  <div key={b.id} className="flex items-center gap-4 p-4">
                    <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
                      <Store className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-[#2c2420] truncate">{b.name}</p>
                        {b.is_verified && <BadgeCheck className="h-4 w-4 text-blue-500" />}
                      </div>
                      <p className="text-xs text-[#2c2420]/40">{b.category} &middot; {b.profiles?.name} &middot; {formatTime(b.created_at)}</p>
                    </div>
                    <Badge className={b.subscription_tier === "premium" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-700"}>
                      {b.subscription_tier || "free"}
                    </Badge>
                    <div className="flex gap-1">
                      {!b.is_verified ? (
                        <Button variant="outline" size="sm" onClick={() => handleAction("verify", b.id)}>
                          <CheckCircle className="h-4 w-4 mr-1" />Verify
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => handleAction("unverify", b.id)}>
                          <XCircle className="h-4 w-4 mr-1" />Unverify
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}

            {tab === "creators" && (
              <>
                {data?.creators.length === 0 && <p className="p-8 text-center text-[#2c2420]/40">No creators found</p>}
                {data?.creators.map((c: any) => (
                  <div key={c.id} className="flex items-center gap-4 p-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={c.avatar_url || undefined} />
                      <AvatarFallback className="bg-[#ffb88c]/20 text-[#d97a4a] text-xs">{c.name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#2c2420]">{c.name}</p>
                      <p className="text-xs text-[#2c2420]/40">{c.email} &middot; Joined {formatTime(c.created_at)}</p>
                    </div>
                    <Badge className="bg-amber-100 text-amber-700">{c.account_tier}</Badge>
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
