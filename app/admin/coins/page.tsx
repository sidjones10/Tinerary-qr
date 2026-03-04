"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Coins,
  Loader2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Gift,
  ShoppingCart,
  Users,
  Wallet,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface CoinTransaction {
  id: string
  user_id: string
  amount: number
  type: string
  action: string
  description: string
  created_at: string
  profiles?: { name: string; email: string; avatar_url: string | null }
}

interface CoinData {
  transactions: CoinTransaction[]
  topBalances: any[]
  recentRedemptions: any[]
  stats: { totalCirculating: number; totalEarned: number; totalSpent: number; totalHolders: number }
  page: number
  totalPages: number
  total: number
}

export default function AdminCoinsPage() {
  const [data, setData] = useState<CoinData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [tab, setTab] = useState<"transactions" | "balances" | "redemptions">("transactions")

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/coins?page=${page}`)
      if (res.ok) setData(await res.json())
    } catch (e) {
      console.error(e)
    }
    setIsLoading(false)
  }, [page])

  useEffect(() => { fetchData() }, [fetchData])

  const formatTime = (dateString: string) => {
    const d = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(diff / 3600000)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(diff / 86400000)
    if (days < 7) return `${days}d ago`
    return d.toLocaleDateString()
  }

  return (
    <div className="p-4 lg:p-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild><Link href="/admin"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <div>
            <h1 className="text-2xl font-bold text-[#2c2420]">Coins & Transactions</h1>
            <p className="text-sm text-[#2c2420]/50">Monitor the coin economy</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Circulating", value: data?.stats.totalCirculating || 0, icon: Wallet, color: "text-amber-600 bg-amber-50" },
          { label: "Total Earned", value: data?.stats.totalEarned || 0, icon: TrendingUp, color: "text-green-600 bg-green-50" },
          { label: "Total Spent", value: data?.stats.totalSpent || 0, icon: ShoppingCart, color: "text-red-600 bg-red-50" },
          { label: "Holders", value: data?.stats.totalHolders || 0, icon: Users, color: "text-blue-600 bg-blue-50" },
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

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(["transactions", "balances", "redemptions"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${tab === t ? "bg-[#2c2420] text-white" : "bg-white/60 text-[#2c2420]/60 hover:bg-white hover:text-[#2c2420]"}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#ffb88c]" /></div>
      ) : (
        <>
          {tab === "transactions" && (
            <div className="bg-white/70 dark:bg-card/70 backdrop-blur rounded-2xl border border-[#2c2420]/5">
              <div className="divide-y divide-[#2c2420]/5">
                {data?.transactions.length === 0 && <p className="p-8 text-center text-[#2c2420]/40">No transactions yet</p>}
                {data?.transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center gap-4 p-4">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={tx.profiles?.avatar_url || undefined} />
                      <AvatarFallback className="bg-[#ffb88c]/20 text-[#d97a4a] text-xs">
                        {tx.profiles?.name?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#2c2420] truncate">{tx.profiles?.name || "Unknown"}</p>
                      <p className="text-xs text-[#2c2420]/40">{tx.description || tx.action}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${tx.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                        {tx.amount > 0 ? "+" : ""}{tx.amount}
                      </p>
                      <p className="text-xs text-[#2c2420]/40">{formatTime(tx.created_at)}</p>
                    </div>
                    <Badge className={tx.type === "earn" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                      {tx.type}
                    </Badge>
                  </div>
                ))}
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

          {tab === "balances" && (
            <div className="bg-white/70 dark:bg-card/70 backdrop-blur rounded-2xl border border-[#2c2420]/5">
              <div className="p-4 border-b border-[#2c2420]/5">
                <h3 className="font-semibold text-[#2c2420]">Top Coin Holders</h3>
              </div>
              <div className="divide-y divide-[#2c2420]/5">
                {data?.topBalances.map((b, idx) => (
                  <div key={b.user_id} className="flex items-center gap-4 p-4">
                    <span className="text-lg font-bold text-[#d97a4a] w-8 text-center">#{idx + 1}</span>
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={b.profiles?.avatar_url || undefined} />
                      <AvatarFallback className="bg-[#ffb88c]/20 text-[#d97a4a] text-xs">
                        {b.profiles?.name?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#2c2420]">{b.profiles?.name || "Unknown"}</p>
                      <p className="text-xs text-[#2c2420]/40">{b.profiles?.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-amber-600">{b.balance?.toLocaleString()}</p>
                      <p className="text-xs text-[#2c2420]/40">earned: {b.lifetime_earned?.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "redemptions" && (
            <div className="bg-white/70 dark:bg-card/70 backdrop-blur rounded-2xl border border-[#2c2420]/5">
              <div className="p-4 border-b border-[#2c2420]/5">
                <h3 className="font-semibold text-[#2c2420]">Recent Redemptions</h3>
              </div>
              <div className="divide-y divide-[#2c2420]/5">
                {data?.recentRedemptions.length === 0 && <p className="p-8 text-center text-[#2c2420]/40">No redemptions yet</p>}
                {data?.recentRedemptions.map((r: any) => (
                  <div key={r.id} className="flex items-center gap-4 p-4">
                    <Gift className="h-5 w-5 text-[#d97a4a]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#2c2420]">{r.reward_name}</p>
                      <p className="text-xs text-[#2c2420]/40">{r.profiles?.name} &middot; {r.profiles?.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#2c2420]">{r.cost} coins</p>
                      <Badge className={r.status === "used" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>{r.status}</Badge>
                    </div>
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
