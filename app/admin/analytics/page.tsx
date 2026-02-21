"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Loader2,
  TrendingUp,
  TrendingDown,
  Users,
  Map,
  Eye,
  MessageSquare,
  Heart,
  Bookmark,
  Activity,
  Clock,
  Globe,
  BarChart3,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  MousePointerClick,
  Timer,
  Zap,
  Target,
  Brain,
  ChevronRight,
  AlertTriangle,
  UserCheck,
  UserX,
  UserMinus,
  Sparkles,
  Link2,
  Layers,
} from "lucide-react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePredictiveAnalytics } from "@/hooks/use-predictive-analytics"
import { formatDuration, formatCompactNumber } from "@/lib/analytics-utils"

// ─── Types ──────────────────────────────────────────────────────────

interface AnalyticsData {
  dailyActivity: { date: string; views: number; likes: number; comments: number; saves: number }[]
  categoryBreakdown: { name: string; value: number; color: string }[]
  topLocations: { location: string; count: number }[]
  engagementStats: {
    totalLikes: number
    totalComments: number
    totalSaves: number
    avgViewsPerItinerary: number
    engagementRate: number
    likeCommentRatio: number
  }
  userMetrics: {
    activeUsers: number
    newUsers: number
    returningUsers: number
  }
  contentMetrics: {
    totalItineraries: number
    publicItineraries: number
    privateItineraries: number
    topCreators: { name: string; count: number; avatar?: string }[]
  }
  retentionData: { week: string; retained: number }[]
  hourlyActivity: { hour: string; activity: number }[]
  weekdayActivity: { day: string; views: number; creates: number }[]
  growthMetrics: {
    userGrowth: number
    contentGrowth: number
    engagementGrowth: number
  }
}

const COLORS = ["#ffb88c", "#ff9a8b", "#ffd2b8", "#a8d5ba", "#94b8b8", "#d4a5a5", "#b8a8d5", "#d5b8a8"]
const TOOLTIP_STYLE = {
  background: "#2c2420",
  border: "none",
  borderRadius: "10px",
  color: "#fff",
  fontSize: "12px",
  padding: "8px 12px",
}

// ─── Stat Card ──────────────────────────────────────────────────────

function MiniStat({ title, value, icon: Icon, trend, color = "peach" }: {
  title: string
  value: string | number
  icon: any
  trend?: { value: number; label: string }
  color?: "peach" | "coral" | "green" | "blue" | "purple" | "amber"
}) {
  const colors: Record<string, string> = {
    peach: "bg-[#ffb88c]/10 text-[#d97a4a]",
    coral: "bg-[#ff9a8b]/10 text-[#e57a6a]",
    green: "bg-green-100 text-green-600",
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
    amber: "bg-amber-100 text-amber-600",
  }

  return (
    <div className="bg-white/70 dark:bg-card/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-[#2c2420]/50 dark:text-foreground/50 mb-1">{title}</p>
          <p className="text-2xl font-bold text-[#2c2420] dark:text-foreground">{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${trend.value >= 0 ? "text-green-600" : "text-red-500"}`}>
              {trend.value >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {trend.value >= 0 ? "+" : ""}{trend.value}% {trend.label}
            </div>
          )}
        </div>
        <div className={`h-10 w-10 rounded-xl ${colors[color]} flex items-center justify-center`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

// ─── Card wrapper ───────────────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white/70 dark:bg-card/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-5 ${className}`}>
      {children}
    </div>
  )
}

function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h3 className="font-semibold text-[#2c2420] dark:text-foreground">{title}</h3>
      {subtitle && <p className="text-xs text-[#2c2420]/40 dark:text-foreground/40 mt-0.5">{subtitle}</p>}
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────

export default function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d")
  const [baseData, setBaseData] = useState<AnalyticsData | null>(null)
  const [isBaseLoading, setIsBaseLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  const { data: predictive, isLoading: isPredLoading } = usePredictiveAnalytics(timeRange)

  // Fetch base analytics (existing overview/engagement/content data)
  useEffect(() => {
    async function fetchAnalytics() {
      setIsBaseLoading(true)
      const supabase = createClient()
      const daysAgo = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90
      const startDate = new Date(Date.now() - daysAgo * 86400000)
      const previousStartDate = new Date(startDate.getTime() - daysAgo * 86400000)

      const { data: savedItems } = await supabase
        .from("saved_itineraries").select("type, created_at").gte("created_at", startDate.toISOString())
      const { data: commentItems } = await supabase
        .from("comments").select("created_at").gte("created_at", startDate.toISOString())
      const { data: viewInteractions } = await supabase
        .from("user_interactions").select("interaction_type, created_at").eq("interaction_type", "view").gte("created_at", startDate.toISOString())

      type ActivityItem = { type: string; created_at: string }
      const allActivity: ActivityItem[] = [
        ...(savedItems || []).map((i) => ({ type: i.type, created_at: i.created_at })),
        ...(commentItems || []).map((i) => ({ type: "comment", created_at: i.created_at })),
        ...(viewInteractions || []).map((i) => ({ type: "view", created_at: i.created_at })),
      ]

      // Daily activity
      const dailyMap: Record<string, { views: number; likes: number; comments: number; saves: number }> = {}
      for (let i = 0; i < daysAgo; i++) {
        const key = new Date(Date.now() - i * 86400000).toISOString().split("T")[0]
        dailyMap[key] = { views: 0, likes: 0, comments: 0, saves: 0 }
      }
      allActivity.forEach((i) => {
        const key = i.created_at.split("T")[0]
        if (dailyMap[key]) {
          if (i.type === "view") dailyMap[key].views++
          if (i.type === "like") dailyMap[key].likes++
          if (i.type === "comment") dailyMap[key].comments++
          if (i.type === "save") dailyMap[key].saves++
        }
      })
      const dailyActivity = Object.entries(dailyMap)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, stats]) => ({
          date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          ...stats,
        }))

      // Hourly
      const hourlyMap: Record<number, number> = {}
      for (let i = 0; i < 24; i++) hourlyMap[i] = 0
      allActivity.forEach((i) => { hourlyMap[new Date(i.created_at).getHours()]++ })
      const hourlyActivity = Object.entries(hourlyMap).map(([hour, activity]) => ({
        hour: `${String(hour).padStart(2, "0")}:00`, activity,
      }))

      // Weekday
      const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
      const weekdayMap: Record<number, { views: number; creates: number }> = {}
      for (let i = 0; i < 7; i++) weekdayMap[i] = { views: 0, creates: 0 }
      allActivity.forEach((i) => { if (i.type === "view") weekdayMap[new Date(i.created_at).getDay()].views++ })

      const { data: itineraries } = await supabase.from("itineraries").select("created_at").gte("created_at", startDate.toISOString())
      itineraries?.forEach((i) => { weekdayMap[new Date(i.created_at).getDay()].creates++ })
      const weekdayActivity = weekdayNames.map((day, idx) => ({ day, views: weekdayMap[idx].views, creates: weekdayMap[idx].creates }))

      // Categories
      const { data: categories } = await supabase.from("itinerary_categories").select("category")
      const categoryCount: Record<string, number> = {}
      categories?.forEach((c) => { categoryCount[c.category] = (categoryCount[c.category] || 0) + 1 })
      const categoryBreakdown = Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1]).slice(0, 8)
        .map(([name, value], idx) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value, color: COLORS[idx % COLORS.length] }))

      // Top locations
      const { data: allItineraries } = await supabase.from("itineraries").select("location, is_public, user_id").not("location", "is", null)
      const locationCount: Record<string, number> = {}
      allItineraries?.forEach((i) => { if (i.location) locationCount[i.location] = (locationCount[i.location] || 0) + 1 })
      const topLocations = Object.entries(locationCount).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([location, count]) => ({ location, count }))

      // Engagement stats
      const { data: metrics } = await supabase.from("itinerary_metrics").select("like_count, save_count, view_count")
      const { count: totalComments } = await supabase.from("comments").select("*", { count: "exact", head: true })
      const totalLikes = metrics?.reduce((s, m) => s + (m.like_count || 0), 0) || 0
      const totalSaves = metrics?.reduce((s, m) => s + (m.save_count || 0), 0) || 0
      const totalViews = metrics?.reduce((s, m) => s + (m.view_count || 0), 0) || 0
      const avgViewsPerItinerary = metrics?.length ? Math.round(totalViews / metrics.length) : 0
      const engagementRate = totalViews > 0 ? ((totalLikes + totalSaves + (totalComments || 0)) / totalViews * 100) : 0
      const likeCommentRatio = (totalComments || 0) > 0 ? (totalLikes / (totalComments || 1)) : totalLikes

      // User metrics
      const { count: totalUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true })
      const { count: newUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", startDate.toISOString())
      const { data: activeUserIds } = await supabase.from("user_interactions").select("user_id").gte("created_at", startDate.toISOString())
      const uniqueActiveUsers = new Set(activeUserIds?.map((u) => u.user_id) || []).size

      // Content
      const { count: totalItineraryCount } = await supabase.from("itineraries").select("*", { count: "exact", head: true })
      const { count: publicItineraries } = await supabase.from("itineraries").select("*", { count: "exact", head: true }).eq("is_public", true)

      const { data: creatorsData } = await supabase.from("itineraries").select("user_id, profiles!itineraries_user_id_fkey(name, avatar_url)")
      const creatorCount: Record<string, { count: number; name: string; avatar?: string }> = {}
      creatorsData?.forEach((i: any) => {
        if (!creatorCount[i.user_id]) creatorCount[i.user_id] = { count: 0, name: i.profiles?.name || "Unknown", avatar: i.profiles?.avatar_url }
        creatorCount[i.user_id].count++
      })
      const topCreators = Object.values(creatorCount).sort((a, b) => b.count - a.count).slice(0, 5)

      // Retention
      const retentionData = []
      for (let i = 4; i >= 0; i--) {
        const weekEnd = new Date(Date.now() - i * 7 * 86400000)
        const { count: weekUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true }).lte("created_at", weekEnd.toISOString())
        retentionData.push({ week: `Week ${5 - i}`, retained: weekUsers || 0 })
      }

      // Growth
      const { count: previousUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true }).lt("created_at", startDate.toISOString()).gte("created_at", previousStartDate.toISOString())
      const { count: previousItineraries } = await supabase.from("itineraries").select("*", { count: "exact", head: true }).lt("created_at", startDate.toISOString()).gte("created_at", previousStartDate.toISOString())
      const { count: currentItineraries } = await supabase.from("itineraries").select("*", { count: "exact", head: true }).gte("created_at", startDate.toISOString())

      const userGrowth = (previousUsers || 0) > 0 ? Math.round((((newUsers || 0) - (previousUsers || 0)) / (previousUsers || 1)) * 100) : (newUsers || 0) > 0 ? 100 : 0
      const contentGrowth = (previousItineraries || 0) > 0 ? Math.round((((currentItineraries || 0) - (previousItineraries || 0)) / (previousItineraries || 1)) * 100) : (currentItineraries || 0) > 0 ? 100 : 0

      setBaseData({
        dailyActivity, categoryBreakdown, topLocations,
        engagementStats: { totalLikes, totalComments: totalComments || 0, totalSaves, avgViewsPerItinerary, engagementRate: Math.round(engagementRate * 100) / 100, likeCommentRatio: Math.round(likeCommentRatio * 10) / 10 },
        userMetrics: { activeUsers: uniqueActiveUsers, newUsers: newUsers || 0, returningUsers: uniqueActiveUsers - (newUsers || 0) },
        contentMetrics: { totalItineraries: totalItineraryCount || 0, publicItineraries: publicItineraries || 0, privateItineraries: (totalItineraryCount || 0) - (publicItineraries || 0), topCreators },
        retentionData, hourlyActivity, weekdayActivity,
        growthMetrics: { userGrowth, contentGrowth, engagementGrowth: 0 },
      })
      setIsBaseLoading(false)
    }
    fetchAnalytics()
  }, [timeRange])

  const isLoading = isBaseLoading || isPredLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#ffb88c] mx-auto mb-4" />
          <p className="text-[#2c2420]/60 dark:text-foreground/60">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild aria-label="Go back">
            <Link href="/admin"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[#2c2420] dark:text-foreground">Analytics Dashboard</h1>
            <p className="text-sm text-[#2c2420]/50 dark:text-foreground/50">Comprehensive platform insights, predictive analytics & business intelligence</p>
          </div>
        </div>
        <div className="flex gap-1 bg-white/60 dark:bg-card/60 rounded-xl p-1 border border-[#2c2420]/5">
          {(["7d", "30d", "90d"] as const).map((range) => (
            <button key={range} onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${timeRange === range ? "bg-[#2c2420] text-white shadow-sm" : "text-[#2c2420]/50 hover:text-[#2c2420]/80"}`}>
              {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto -mx-4 px-4 pb-1">
          <TabsList className="bg-white/60 dark:bg-card/60 border border-[#2c2420]/5 inline-flex w-auto min-w-full lg:min-w-0">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#2c2420] data-[state=active]:text-white text-xs sm:text-sm">
              <BarChart3 className="h-4 w-4 mr-1.5" />Overview
            </TabsTrigger>
            <TabsTrigger value="engagement" className="data-[state=active]:bg-[#2c2420] data-[state=active]:text-white text-xs sm:text-sm">
              <Heart className="h-4 w-4 mr-1.5" />Engagement
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-[#2c2420] data-[state=active]:text-white text-xs sm:text-sm">
              <Users className="h-4 w-4 mr-1.5" />Users
            </TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:bg-[#2c2420] data-[state=active]:text-white text-xs sm:text-sm">
              <Map className="h-4 w-4 mr-1.5" />Content
            </TabsTrigger>
            <TabsTrigger value="predictive" className="data-[state=active]:bg-[#2c2420] data-[state=active]:text-white text-xs sm:text-sm">
              <Brain className="h-4 w-4 mr-1.5" />Predictive
            </TabsTrigger>
            <TabsTrigger value="business" className="data-[state=active]:bg-[#2c2420] data-[state=active]:text-white text-xs sm:text-sm">
              <Target className="h-4 w-4 mr-1.5" />Business Intel
            </TabsTrigger>
            <TabsTrigger value="retention" className="data-[state=active]:bg-[#2c2420] data-[state=active]:text-white text-xs sm:text-sm">
              <UserCheck className="h-4 w-4 mr-1.5" />Retention
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ═══════════════ OVERVIEW TAB ═══════════════ */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MiniStat title="Total Views" value={baseData?.engagementStats.avgViewsPerItinerary ? (baseData.engagementStats.avgViewsPerItinerary * (baseData?.contentMetrics.totalItineraries || 0)).toLocaleString() : "0"} icon={Eye} trend={{ value: 12, label: "vs last period" }} color="peach" />
            <MiniStat title="Active Users" value={baseData?.userMetrics.activeUsers.toLocaleString() || "0"} icon={Users} trend={{ value: baseData?.growthMetrics.userGrowth || 0, label: "vs last period" }} color="blue" />
            <MiniStat title="Engagement Rate" value={`${baseData?.engagementStats.engagementRate || 0}%`} icon={Activity} color="green" />
            <MiniStat title="Content Created" value={baseData?.contentMetrics.totalItineraries.toLocaleString() || "0"} icon={Map} trend={{ value: baseData?.growthMetrics.contentGrowth || 0, label: "vs last period" }} color="coral" />
          </div>

          <Card>
            <CardHeader title="Daily Activity" subtitle="User interactions over time" />
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={baseData?.dailyActivity || []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ffb88c" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#ffb88c" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2c2420" strokeOpacity={0.05} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#2c2420", fillOpacity: 0.4 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#2c2420", fillOpacity: 0.4 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="views" stroke="#ffb88c" strokeWidth={2} fill="url(#viewsGradient)" name="Views" />
                  <Line type="monotone" dataKey="likes" stroke="#ff9a8b" strokeWidth={2} dot={false} name="Likes" />
                  <Line type="monotone" dataKey="comments" stroke="#a8d5ba" strokeWidth={2} dot={false} name="Comments" />
                  <Line type="monotone" dataKey="saves" stroke="#94b8b8" strokeWidth={2} dot={false} name="Saves" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {[{ label: "Views", color: "#ffb88c" }, { label: "Likes", color: "#ff9a8b" }, { label: "Comments", color: "#a8d5ba" }, { label: "Saves", color: "#94b8b8" }].map((l) => (
                <div key={l.label} className="flex items-center gap-2 text-xs text-[#2c2420]/60">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} /> {l.label}
                </div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader title="Activity by Hour" subtitle="Peak usage times" />
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={baseData?.hourlyActivity || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2c2420" strokeOpacity={0.05} />
                    <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#2c2420", fillOpacity: 0.4 }} axisLine={false} tickLine={false} interval={3} />
                    <YAxis tick={{ fontSize: 10, fill: "#2c2420", fillOpacity: 0.4 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar dataKey="activity" fill="#ffb88c" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card>
              <CardHeader title="Activity by Day" subtitle="Views vs content creation" />
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={baseData?.weekdayActivity || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2c2420" strokeOpacity={0.05} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#2c2420", fillOpacity: 0.4 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#2c2420", fillOpacity: 0.4 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar dataKey="views" fill="#ffb88c" radius={[4, 4, 0, 0]} name="Views" />
                    <Bar dataKey="creates" fill="#a8d5ba" radius={[4, 4, 0, 0]} name="Created" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* ═══════════════ ENGAGEMENT TAB ═══════════════ */}
        <TabsContent value="engagement" className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MiniStat title="Total Likes" value={baseData?.engagementStats.totalLikes.toLocaleString() || "0"} icon={Heart} color="coral" />
            <MiniStat title="Total Comments" value={baseData?.engagementStats.totalComments.toLocaleString() || "0"} icon={MessageSquare} color="blue" />
            <MiniStat title="Total Saves" value={baseData?.engagementStats.totalSaves.toLocaleString() || "0"} icon={Bookmark} color="amber" />
            <MiniStat title="Avg Views/Itinerary" value={baseData?.engagementStats.avgViewsPerItinerary.toLocaleString() || "0"} icon={Eye} color="green" />
          </div>

          {/* Engagement depth stats from predictive */}
          {predictive && (
            <Card>
              <CardHeader title="Engagement Depth" subtitle="Average actions per active user this period" />
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { label: "Views / User", value: predictive.avgViewsPerUser, icon: Eye, color: "bg-[#ffb88c]/10" },
                  { label: "Likes / User", value: predictive.avgLikesPerUser, icon: Heart, color: "bg-[#ff9a8b]/10" },
                  { label: "Saves / User", value: predictive.avgSavesPerUser, icon: Bookmark, color: "bg-amber-50" },
                  { label: "Comments / User", value: predictive.avgCommentsPerUser, icon: MessageSquare, color: "bg-blue-50" },
                  { label: "Power Users", value: predictive.powerUsers, icon: Zap, color: "bg-purple-50" },
                ].map((item) => (
                  <div key={item.label} className={`${item.color} rounded-xl p-4 text-center`}>
                    <item.icon className="h-5 w-5 mx-auto mb-2 text-[#2c2420]/40" />
                    <p className="text-2xl font-bold text-[#2c2420] dark:text-foreground">{item.value}</p>
                    <p className="text-xs text-[#2c2420]/50 mt-1">{item.label}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader title="Category Breakdown" subtitle="Itineraries by category" />
              {baseData?.categoryBreakdown.length === 0 ? (
                <p className="text-center text-[#2c2420]/40 py-10">No category data yet</p>
              ) : (
                <>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={baseData?.categoryBreakdown || []} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" strokeWidth={0}>
                          {baseData?.categoryBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {baseData?.categoryBreakdown.map((cat) => (
                      <div key={cat.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                          <span className="text-[#2c2420]/70 truncate">{cat.name}</span>
                        </div>
                        <span className="font-medium text-[#2c2420]">{cat.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>

            <Card>
              <CardHeader title="Top Locations" subtitle="Most popular destinations" />
              {baseData?.topLocations.length === 0 ? (
                <p className="text-center text-[#2c2420]/40 py-10">No location data yet</p>
              ) : (
                <div className="space-y-3">
                  {baseData?.topLocations.map((loc, idx) => (
                    <div key={loc.location} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-[#2c2420]/20 w-4">{idx + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-[#2c2420] truncate max-w-[180px]">{loc.location}</span>
                          <span className="text-xs text-[#2c2420]/50">{loc.count}</span>
                        </div>
                        <div className="h-1.5 bg-[#2c2420]/5 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#ffb88c] to-[#ff9a8b] rounded-full" style={{ width: `${(loc.count / (baseData?.topLocations[0]?.count || 1)) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <Card>
            <CardHeader title="Engagement Insights" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-[#ffb88c]/5 rounded-xl">
                <p className="text-3xl font-bold text-[#2c2420]">{baseData?.engagementStats.engagementRate || 0}%</p>
                <p className="text-xs text-[#2c2420]/50 mt-1">Engagement Rate</p>
              </div>
              <div className="text-center p-4 bg-[#ff9a8b]/5 rounded-xl">
                <p className="text-3xl font-bold text-[#2c2420]">{baseData?.engagementStats.likeCommentRatio || 0}</p>
                <p className="text-xs text-[#2c2420]/50 mt-1">Like:Comment Ratio</p>
              </div>
              <div className="text-center p-4 bg-[#a8d5ba]/5 rounded-xl">
                <p className="text-3xl font-bold text-[#2c2420]">{predictive ? `${predictive.linkCTR}%` : "—"}</p>
                <p className="text-xs text-[#2c2420]/50 mt-1">Click-Through Rate</p>
              </div>
              <div className="text-center p-4 bg-[#94b8b8]/5 rounded-xl">
                <p className="text-3xl font-bold text-[#2c2420]">{predictive ? formatDuration(predictive.avgSessionDuration) : "—"}</p>
                <p className="text-xs text-[#2c2420]/50 mt-1">Avg Session Duration</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* ═══════════════ USERS TAB ═══════════════ */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MiniStat title="Active Users" value={baseData?.userMetrics.activeUsers.toLocaleString() || "0"} icon={Users} color="blue" />
            <MiniStat title="New Users" value={baseData?.userMetrics.newUsers.toLocaleString() || "0"} icon={TrendingUp} trend={{ value: baseData?.growthMetrics.userGrowth || 0, label: "vs last period" }} color="green" />
            <MiniStat title="Returning Users" value={baseData?.userMetrics.returningUsers.toLocaleString() || "0"} icon={Activity} color="purple" />
            <MiniStat title="Avg Pages/Session" value={predictive?.avgPagesPerSession.toFixed(1) || "—"} icon={Layers} color="peach" />
          </div>

          <Card>
            <CardHeader title="User Retention" subtitle="Weekly user retention trends" />
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={baseData?.retentionData || []}>
                  <defs>
                    <linearGradient id="retainedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a8d5ba" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#a8d5ba" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2c2420" strokeOpacity={0.05} />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#2c2420", fillOpacity: 0.4 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#2c2420", fillOpacity: 0.4 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="retained" stroke="#a8d5ba" strokeWidth={2} fill="url(#retainedGradient)" name="Retained Users" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        {/* ═══════════════ CONTENT TAB ═══════════════ */}
        <TabsContent value="content" className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MiniStat title="Total Itineraries" value={baseData?.contentMetrics.totalItineraries.toLocaleString() || "0"} icon={Map} color="peach" />
            <MiniStat title="Public" value={baseData?.contentMetrics.publicItineraries.toLocaleString() || "0"} icon={Globe} color="green" />
            <MiniStat title="Private" value={baseData?.contentMetrics.privateItineraries.toLocaleString() || "0"} icon={Eye} color="amber" />
            <MiniStat title="Content Growth" value={`${baseData?.growthMetrics.contentGrowth || 0}%`} icon={TrendingUp} color="blue" />
          </div>

          <Card>
            <CardHeader title="Top Content Creators" subtitle="Users with most itineraries" />
            <div className="space-y-3">
              {baseData?.contentMetrics.topCreators.map((creator, idx) => (
                <div key={creator.name} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#ffb88c]/5 transition-colors">
                  <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-gradient-to-br from-[#ffb88c]/20 to-[#ff9a8b]/20 shrink-0">
                    <span className="text-sm font-bold text-[#d97a4a]">#{idx + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#2c2420] truncate">{creator.name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-[#2c2420]">{creator.count}</p>
                    <p className="text-xs text-[#2c2420]/40">itineraries</p>
                  </div>
                </div>
              ))}
              {(!baseData?.contentMetrics.topCreators || baseData.contentMetrics.topCreators.length === 0) && (
                <p className="text-center text-[#2c2420]/40 py-4">No creators yet</p>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Content Visibility" />
            <div className="flex flex-col sm:flex-row items-stretch gap-8">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[#2c2420]/70">Public</span>
                  <span className="text-sm font-medium text-[#2c2420]">{baseData?.contentMetrics.totalItineraries ? Math.round((baseData.contentMetrics.publicItineraries / baseData.contentMetrics.totalItineraries) * 100) : 0}%</span>
                </div>
                <div className="h-3 bg-[#2c2420]/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#a8d5ba] to-[#78c5a8] rounded-full transition-all" style={{ width: `${baseData?.contentMetrics.totalItineraries ? (baseData.contentMetrics.publicItineraries / baseData.contentMetrics.totalItineraries) * 100 : 0}%` }} />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[#2c2420]/70">Private</span>
                  <span className="text-sm font-medium text-[#2c2420]">{baseData?.contentMetrics.totalItineraries ? Math.round((baseData.contentMetrics.privateItineraries / baseData.contentMetrics.totalItineraries) * 100) : 0}%</span>
                </div>
                <div className="h-3 bg-[#2c2420]/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#ffb88c] to-[#ff9a8b] rounded-full transition-all" style={{ width: `${baseData?.contentMetrics.totalItineraries ? (baseData.contentMetrics.privateItineraries / baseData.contentMetrics.totalItineraries) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* ═══════════════ PREDICTIVE TAB ═══════════════ */}
        <TabsContent value="predictive" className="space-y-6">
          {predictive && (
            <>
              {/* Projected stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MiniStat title="Projected Users (next month)" value={formatCompactNumber(predictive.projectedUsersNext30d)} icon={Users} color="blue" />
                <MiniStat title="Projected Content (next month)" value={formatCompactNumber(predictive.projectedContentNext30d)} icon={Map} color="peach" />
                <MiniStat title="User Forecast Confidence" value={`${predictive.userGrowthConfidence}%`} icon={Brain} color="purple" />
                <MiniStat title="Content Forecast Confidence" value={`${predictive.contentGrowthConfidence}%`} icon={Target} color="green" />
              </div>

              {/* User Growth Forecast */}
              <Card>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-4 w-4 text-[#ffb88c]" />
                  <CardHeader title="User Growth Forecast" subtitle="Historical data with projected trend (dashed)" />
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={predictive.userGrowthForecast} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2c2420" strokeOpacity={0.05} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#2c2420", fillOpacity: 0.4 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#2c2420", fillOpacity: 0.4 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Area type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2.5} fill="url(#actualGrad)" name="Actual" connectNulls={false} />
                      <Area type="monotone" dataKey="forecast" stroke="#a78bfa" strokeWidth={2} strokeDasharray="6 3" fill="url(#forecastGrad)" name="Forecast" connectNulls={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-3">
                  <div className="flex items-center gap-2 text-xs text-[#2c2420]/60"><div className="h-0.5 w-5 bg-blue-500 rounded" /> Actual</div>
                  <div className="flex items-center gap-2 text-xs text-[#2c2420]/60"><div className="h-0.5 w-5 bg-purple-400 rounded border-dashed" style={{ borderTop: "2px dashed #a78bfa", height: 0 }} /> Forecast</div>
                </div>
              </Card>

              {/* Content & Engagement Forecasts side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-4 w-4 text-[#ffb88c]" />
                    <CardHeader title="Content Creation Forecast" subtitle="Monthly itinerary creation projections" />
                  </div>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={predictive.contentForecast} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2c2420" strokeOpacity={0.05} />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#2c2420", fillOpacity: 0.4 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: "#2c2420", fillOpacity: 0.4 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Bar dataKey="actual" fill="#ffb88c" radius={[4, 4, 0, 0]} name="Actual" />
                        <Bar dataKey="forecast" fill="#ffd2b8" radius={[4, 4, 0, 0]} name="Forecast" opacity={0.7} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-4 w-4 text-[#ffb88c]" />
                    <CardHeader title="Engagement Forecast" subtitle="Daily interaction projections" />
                  </div>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={predictive.engagementForecast} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="engActGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.2} />
                            <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2c2420" strokeOpacity={0.05} />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#2c2420", fillOpacity: 0.4 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: "#2c2420", fillOpacity: 0.4 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Area type="monotone" dataKey="actual" stroke="#22c55e" strokeWidth={2} fill="url(#engActGrad)" name="Actual" connectNulls={false} />
                        <Line type="monotone" dataKey="forecast" stroke="#86efac" strokeWidth={2} strokeDasharray="6 3" dot={false} name="Forecast" connectNulls={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* ═══════════════ BUSINESS INTELLIGENCE TAB ═══════════════ */}
        <TabsContent value="business" className="space-y-6">
          {predictive && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MiniStat title="Link Click-Through Rate" value={`${predictive.linkCTR}%`} icon={MousePointerClick} color="peach" />
                <MiniStat title="Avg Session Duration" value={formatDuration(predictive.avgSessionDuration)} icon={Timer} color="blue" />
                <MiniStat title="Pages per Session" value={predictive.avgPagesPerSession.toFixed(1)} icon={Layers} color="green" />
                <MiniStat title="Power Users" value={predictive.powerUsers.toString()} icon={Zap} color="purple" />
              </div>

              {/* Conversion Funnel */}
              <Card>
                <CardHeader title="Conversion Funnel" subtitle="User journey from visit to content creation" />
                <div className="space-y-3">
                  {predictive.funnel.map((step, idx) => (
                    <div key={step.name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center h-6 w-6 rounded-full bg-[#2c2420] text-white text-xs font-bold">{idx + 1}</div>
                          <span className="text-sm font-medium text-[#2c2420] dark:text-foreground">{step.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-[#2c2420] dark:text-foreground">{step.count.toLocaleString()}</span>
                          <span className="text-xs text-[#2c2420]/40 w-10 text-right">{step.percentage}%</span>
                        </div>
                      </div>
                      <div className="h-8 bg-[#2c2420]/5 rounded-lg overflow-hidden relative ml-8">
                        <div
                          className="h-full rounded-lg transition-all duration-700"
                          style={{
                            width: `${step.percentage}%`,
                            background: `linear-gradient(90deg, ${COLORS[idx % COLORS.length]}, ${COLORS[(idx + 1) % COLORS.length]})`,
                          }}
                        />
                        {step.dropoff > 0 && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-red-500/80">
                            <ArrowDownRight className="h-3 w-3" />
                            {step.dropoff}% drop
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Trending Searches */}
                <Card>
                  <CardHeader title="Trending Searches" subtitle="What users are searching for" />
                  {predictive.searchTrends.length === 0 ? (
                    <p className="text-center text-[#2c2420]/40 py-8">No search data yet</p>
                  ) : (
                    <div className="space-y-2.5">
                      {predictive.searchTrends.slice(0, 10).map((trend, idx) => (
                        <div key={trend.term} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-[#ffb88c]/5 transition-colors">
                          <span className="text-xs font-bold text-[#2c2420]/20 w-4">{idx + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Search className="h-3.5 w-3.5 text-[#2c2420]/30" />
                              <span className="text-sm font-medium text-[#2c2420] dark:text-foreground truncate">{trend.term}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-[#2c2420]/50">{trend.count}x</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                              trend.trend === "rising" ? "bg-green-50 text-green-600" :
                              trend.trend === "declining" ? "bg-red-50 text-red-500" :
                              "bg-gray-50 text-gray-500"
                            }`}>
                              {trend.trend === "rising" ? "+" : trend.trend === "declining" ? "" : "="}{trend.change}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Traffic Sources */}
                <Card>
                  <CardHeader title="Traffic Sources" subtitle="Where users come from" />
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {predictive.topReferrers.map((ref) => (
                      <div key={ref.source} className="p-3 bg-[#2c2420]/[0.02] rounded-xl text-center">
                        <p className="text-2xl font-bold text-[#2c2420] dark:text-foreground">{ref.percentage}%</p>
                        <p className="text-xs text-[#2c2420]/50 mt-1">{ref.source}</p>
                        <p className="text-xs text-[#2c2420]/30">{ref.count.toLocaleString()} visitors</p>
                      </div>
                    ))}
                  </div>
                  <div className="h-2 bg-[#2c2420]/5 rounded-full overflow-hidden flex">
                    {predictive.topReferrers.map((ref, i) => (
                      <div key={ref.source} className="h-full" style={{ width: `${ref.percentage}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-3">
                    {predictive.topReferrers.map((ref, i) => (
                      <div key={ref.source} className="flex items-center gap-1.5 text-xs text-[#2c2420]/50">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        {ref.source}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* ═══════════════ RETENTION & COHORTS TAB ═══════════════ */}
        <TabsContent value="retention" className="space-y-6">
          {predictive && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MiniStat title="DAU" value={predictive.dau.toLocaleString()} icon={UserCheck} color="green" />
                <MiniStat title="WAU" value={predictive.wau.toLocaleString()} icon={Users} color="blue" />
                <MiniStat title="MAU" value={predictive.mau.toLocaleString()} icon={Activity} color="purple" />
                <MiniStat title="Stickiness (DAU/MAU)" value={`${predictive.stickiness}%`} icon={Target} color="peach" />
              </div>

              {/* Churn Risk Distribution */}
              <Card>
                <CardHeader title="Churn Risk Distribution" subtitle="Users segmented by days since last active" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {[
                    { label: "Low Risk", sublabel: "Active within 7 days", count: predictive.churnRisk.low, color: "#22c55e", bgColor: "bg-green-50", textColor: "text-green-600", icon: UserCheck },
                    { label: "Medium Risk", sublabel: "Active 7–30 days ago", count: predictive.churnRisk.medium, color: "#f59e0b", bgColor: "bg-amber-50", textColor: "text-amber-600", icon: AlertTriangle },
                    { label: "High Risk", sublabel: "Inactive 30+ days", count: predictive.churnRisk.high, color: "#ef4444", bgColor: "bg-red-50", textColor: "text-red-600", icon: UserX },
                  ].map((risk) => {
                    const pct = predictive.churnRisk.total > 0 ? Math.round((risk.count / predictive.churnRisk.total) * 100) : 0
                    return (
                      <div key={risk.label} className={`${risk.bgColor} rounded-xl p-5`}>
                        <div className="flex items-center gap-2 mb-3">
                          <risk.icon className={`h-5 w-5 ${risk.textColor}`} />
                          <div>
                            <p className={`text-sm font-semibold ${risk.textColor}`}>{risk.label}</p>
                            <p className="text-xs text-[#2c2420]/40">{risk.sublabel}</p>
                          </div>
                        </div>
                        <p className="text-3xl font-bold text-[#2c2420]">{risk.count.toLocaleString()}</p>
                        <div className="mt-2 h-2 bg-white/50 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: risk.color }} />
                        </div>
                        <p className="text-xs text-[#2c2420]/40 mt-1">{pct}% of all users</p>
                      </div>
                    )
                  })}
                </div>
              </Card>

              {/* User Lifecycle */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader title="User Lifecycle Stages" subtitle="Current distribution of user segments" />
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={predictive.userLifecycle}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={3}
                          dataKey="count"
                          nameKey="stage"
                          strokeWidth={0}
                        >
                          {predictive.userLifecycle.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {predictive.userLifecycle.map((item) => (
                      <div key={item.stage} className="flex items-center gap-2 text-sm">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-[#2c2420]/60 dark:text-foreground/60 truncate">{item.stage}</span>
                        <span className="ml-auto font-medium text-[#2c2420] dark:text-foreground">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card>
                  <CardHeader title="Retention Health" subtitle="Key retention metrics at a glance" />
                  <div className="space-y-6 mt-2">
                    {/* Retention Rate gauge */}
                    <div className="text-center">
                      <div className="relative inline-flex items-center justify-center w-32 h-32">
                        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                          <circle cx="60" cy="60" r="50" fill="none" stroke="#2c2420" strokeOpacity={0.05} strokeWidth="10" />
                          <circle cx="60" cy="60" r="50" fill="none" stroke={predictive.retentionRate >= 50 ? "#22c55e" : predictive.retentionRate >= 25 ? "#f59e0b" : "#ef4444"}
                            strokeWidth="10" strokeLinecap="round"
                            strokeDasharray={`${(predictive.retentionRate / 100) * 314} 314`} />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-bold text-[#2c2420] dark:text-foreground">{predictive.retentionRate}%</span>
                          <span className="text-xs text-[#2c2420]/40">Retention</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-blue-50 rounded-xl text-center">
                        <p className="text-xl font-bold text-[#2c2420]">{predictive.stickiness}%</p>
                        <p className="text-xs text-[#2c2420]/50 mt-0.5">Stickiness</p>
                        <p className="text-[10px] text-[#2c2420]/30">DAU / MAU</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-xl text-center">
                        <p className="text-xl font-bold text-[#2c2420]">{predictive.dau > 0 && predictive.wau > 0 ? Math.round((predictive.dau / predictive.wau) * 100) : 0}%</p>
                        <p className="text-xs text-[#2c2420]/50 mt-0.5">Daily Engagement</p>
                        <p className="text-[10px] text-[#2c2420]/30">DAU / WAU</p>
                      </div>
                      <div className="p-3 bg-amber-50 rounded-xl text-center">
                        <p className="text-xl font-bold text-[#2c2420]">{predictive.churnRisk.low + predictive.churnRisk.medium}</p>
                        <p className="text-xs text-[#2c2420]/50 mt-0.5">Healthy Users</p>
                        <p className="text-[10px] text-[#2c2420]/30">Low + Med Risk</p>
                      </div>
                      <div className="p-3 bg-red-50 rounded-xl text-center">
                        <p className="text-xl font-bold text-[#2c2420]">{predictive.churnRisk.high}</p>
                        <p className="text-xs text-[#2c2420]/50 mt-0.5">At Risk</p>
                        <p className="text-[10px] text-[#2c2420]/30">Need re-engagement</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
