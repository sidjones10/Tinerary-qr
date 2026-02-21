"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Users,
  Map,
  Eye,
  Heart,
  Share2,
  Activity,
  TrendingUp,
  ArrowUpRight,
  Clock,
  Menu,
  Loader2,
  AlertCircle,
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { StatCard } from "@/components/admin/stat-card"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { useAdminStats } from "@/hooks/use-admin-stats"

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M"
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K"
  }
  return num.toString()
}

export default function AdminDashboard() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d")
  const { stats, isLoading, error } = useAdminStats(timeRange)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#ffb88c] mx-auto mb-4" />
          <p className="text-[#2c2420]/60">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load dashboard data: {error}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 max-w-[1400px] mx-auto">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between mb-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-white/70 dark:bg-card/70" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[240px]">
            <AdminSidebar />
          </SheetContent>
        </Sheet>
        <span className="font-bold text-lg text-[#2c2420]">Dashboard</span>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-[#ffb88c]/30 text-[#d97a4a] text-xs">AD</AvatarFallback>
        </Avatar>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#2c2420] tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-[#2c2420]/50 text-sm mt-1">
            Real-time overview of Tinerary platform metrics
          </p>
        </div>
        <div className="flex gap-1 bg-white/60 dark:bg-card/60 rounded-xl p-1 border border-[#2c2420]/5">
          {(["7d", "30d", "90d"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                timeRange === range
                  ? "bg-[#2c2420] text-white shadow-sm"
                  : "text-[#2c2420]/50 hover:text-[#2c2420]/80"
              }`}
            >
              {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-4">
        <StatCard
          title="Total Users"
          value={formatNumber(stats?.totalUsers || 0)}
          icon={Users}
          trend={{ value: stats?.userTrend || 0, label: "vs last period" }}
          variant="peach"
        />
        <StatCard
          title="Itineraries"
          value={formatNumber(stats?.totalItineraries || 0)}
          icon={Map}
          trend={{ value: stats?.itineraryTrend || 0, label: "vs last period" }}
          variant="coral"
        />
        <StatCard
          title="Total Views"
          value={formatNumber(stats?.totalViews || 0)}
          icon={Eye}
          trend={{ value: stats?.viewsTrend || 0, label: "vs last period" }}
          variant="cream"
        />
        <StatCard
          title="Total Likes"
          value={formatNumber(stats?.totalLikes || 0)}
          icon={Heart}
          trend={{ value: 0, label: "all time" }}
          variant="sage"
        />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-8">
        <StatCard
          title="Total Shares"
          value={formatNumber(stats?.totalShares || 0)}
          icon={Share2}
          trend={{ value: 0, label: "all time" }}
          variant="peach"
        />
        <StatCard
          title="Interactions"
          value={formatNumber(stats?.totalSearches || 0)}
          icon={Activity}
          trend={{ value: 0, label: "this period" }}
          variant="coral"
        />
      </div>

      {/* User growth chart */}
      <div className="bg-white/70 dark:bg-card/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-5 mb-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-[#2c2420]">User Growth</h3>
            <p className="text-xs text-[#2c2420]/40 mt-0.5">Cumulative registered users</p>
          </div>
          {stats?.userTrend !== undefined && stats.userTrend > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              <TrendingUp className="h-3 w-3" />
              +{stats.userTrend}%
            </div>
          )}
        </div>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats?.userGrowth || []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffb88c" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#ffb88c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2c2420" strokeOpacity={0.05} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#2c2420", fillOpacity: 0.4 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#2c2420", fillOpacity: 0.4 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: "#2c2420",
                  border: "none",
                  borderRadius: "10px",
                  color: "#fff",
                  fontSize: "12px",
                  padding: "8px 12px",
                }}
                labelStyle={{ color: "#ffb88c", fontWeight: 600 }}
              />
              <Area
                type="monotone"
                dataKey="users"
                stroke="#ffb88c"
                strokeWidth={2.5}
                fill="url(#userGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row: recent users + top itineraries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent users */}
        <div className="bg-white/70 dark:bg-card/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-[#2c2420]">Recent Users</h3>
              <p className="text-xs text-[#2c2420]/40 mt-0.5">Newest members on the platform</p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-[#ffb88c] hover:text-[#d97a4a] hover:bg-[#ffb88c]/10 bg-transparent" asChild>
              <Link href="/admin/users">
                View all
                <ArrowUpRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
          <div className="space-y-3">
            {stats?.recentUsers?.length === 0 && (
              <p className="text-sm text-[#2c2420]/40 text-center py-4">No users yet</p>
            )}
            {stats?.recentUsers?.map((user) => (
              <div key={user.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#ffb88c]/5 transition-colors">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.avatar_url || undefined} alt={user.name} />
                  <AvatarFallback className="bg-[#ffb88c]/20 text-[#d97a4a] text-xs font-semibold">
                    {user.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#2c2420] truncate">{user.name}</p>
                  <p className="text-xs text-[#2c2420]/40 truncate">{user.email}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 text-xs text-[#2c2420]/40">
                    <Clock className="h-3 w-3" />
                    {user.joined}
                  </div>
                  <p className="text-xs text-[#2c2420]/50 mt-0.5">{user.itineraryCount} itineraries</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top itineraries */}
        <div className="bg-white/70 dark:bg-card/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-[#2c2420]">Top Itineraries</h3>
              <p className="text-xs text-[#2c2420]/40 mt-0.5">Most viewed travel plans</p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-[#ffb88c] hover:text-[#d97a4a] hover:bg-[#ffb88c]/10 bg-transparent" asChild>
              <Link href="/admin/itineraries">
                View all
                <ArrowUpRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
          <div className="space-y-3">
            {stats?.topItineraries?.length === 0 && (
              <p className="text-sm text-[#2c2420]/40 text-center py-4">No itineraries yet</p>
            )}
            {stats?.topItineraries?.map((item, idx) => (
              <Link
                key={item.id}
                href={`/event/${item.id}`}
                className="flex items-start gap-3 px-3 py-3 rounded-xl hover:bg-[#ffb88c]/5 transition-colors block"
              >
                <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-br from-[#ffb88c]/20 to-[#ff9a8b]/20 shrink-0">
                  <span className="text-sm font-bold text-[#d97a4a]">#{idx + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#2c2420] leading-snug truncate">{item.title}</p>
                  <p className="text-xs text-[#2c2420]/40 mt-0.5">by {item.creator}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-2 text-xs text-[#2c2420]/60">
                    <span className="flex items-center gap-0.5" title="Views">
                      <Eye className="h-3 w-3" />
                      {formatNumber(item.views)}
                    </span>
                    <span className="flex items-center gap-0.5" title="Likes">
                      <Heart className="h-3 w-3" />
                      {item.likes}
                    </span>
                    <span className="flex items-center gap-0.5" title="Shares">
                      <Share2 className="h-3 w-3" />
                      {item.shares}
                    </span>
                  </div>
                  <p className="text-xs text-[#2c2420]/40 mt-0.5">{item.saves} saves</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
