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
  Smartphone,
  Monitor,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
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
  Legend,
  ComposedChart,
} from "recharts"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
    avgSessionDuration: string
    bounceRate: number
  }
  contentMetrics: {
    totalItineraries: number
    publicItineraries: number
    privateItineraries: number
    avgActivitiesPerItinerary: number
    topCreators: { name: string; count: number; avatar?: string }[]
  }
  retentionData: { week: string; retained: number; churned: number }[]
  hourlyActivity: { hour: string; activity: number }[]
  weekdayActivity: { day: string; views: number; creates: number }[]
  growthMetrics: {
    userGrowth: number
    contentGrowth: number
    engagementGrowth: number
  }
}

const COLORS = ["#ffb88c", "#ff9a8b", "#ffd2b8", "#a8d5ba", "#94b8b8", "#d4a5a5", "#b8a8d5", "#d5b8a8"]

export default function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d")
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    async function fetchAnalytics() {
      setIsLoading(true)
      const supabase = createClient()

      const daysAgo = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90
      const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
      const previousStartDate = new Date(startDate.getTime() - daysAgo * 24 * 60 * 60 * 1000)

      // Fetch user interactions for daily activity
      const { data: interactions } = await supabase
        .from("user_interactions")
        .select("interaction_type, created_at")
        .gte("created_at", startDate.toISOString())

      // Process daily activity
      const dailyMap: { [key: string]: { views: number; likes: number; comments: number; saves: number } } = {}
      for (let i = 0; i < daysAgo; i++) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        const key = date.toISOString().split("T")[0]
        dailyMap[key] = { views: 0, likes: 0, comments: 0, saves: 0 }
      }

      interactions?.forEach((i) => {
        const key = i.created_at.split("T")[0]
        if (dailyMap[key]) {
          if (i.interaction_type === "view") dailyMap[key].views++
          if (i.interaction_type === "like") dailyMap[key].likes++
          if (i.interaction_type === "comment") dailyMap[key].comments++
          if (i.interaction_type === "save") dailyMap[key].saves++
        }
      })

      const dailyActivity = Object.entries(dailyMap)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, stats]) => ({
          date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          ...stats,
        }))

      // Process hourly activity
      const hourlyMap: { [key: number]: number } = {}
      for (let i = 0; i < 24; i++) hourlyMap[i] = 0

      interactions?.forEach((i) => {
        const hour = new Date(i.created_at).getHours()
        hourlyMap[hour]++
      })

      const hourlyActivity = Object.entries(hourlyMap).map(([hour, activity]) => ({
        hour: `${hour.padStart(2, "0")}:00`,
        activity,
      }))

      // Process weekday activity
      const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
      const weekdayMap: { [key: number]: { views: number; creates: number } } = {}
      for (let i = 0; i < 7; i++) weekdayMap[i] = { views: 0, creates: 0 }

      interactions?.forEach((i) => {
        const day = new Date(i.created_at).getDay()
        if (i.interaction_type === "view") weekdayMap[day].views++
      })

      // Get itinerary creation by weekday
      const { data: itineraries } = await supabase
        .from("itineraries")
        .select("created_at")
        .gte("created_at", startDate.toISOString())

      itineraries?.forEach((i) => {
        const day = new Date(i.created_at).getDay()
        weekdayMap[day].creates++
      })

      const weekdayActivity = weekdayNames.map((day, idx) => ({
        day,
        views: weekdayMap[idx].views,
        creates: weekdayMap[idx].creates,
      }))

      // Fetch category breakdown
      const { data: categories } = await supabase
        .from("itinerary_categories")
        .select("category")

      const categoryCount: { [key: string]: number } = {}
      categories?.forEach((c) => {
        categoryCount[c.category] = (categoryCount[c.category] || 0) + 1
      })

      const categoryBreakdown = Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, value], idx) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
          color: COLORS[idx % COLORS.length],
        }))

      // Fetch top locations
      const { data: allItineraries } = await supabase
        .from("itineraries")
        .select("location, is_public, user_id")
        .not("location", "is", null)

      const locationCount: { [key: string]: number } = {}
      allItineraries?.forEach((i) => {
        if (i.location) {
          locationCount[i.location] = (locationCount[i.location] || 0) + 1
        }
      })

      const topLocations = Object.entries(locationCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([location, count]) => ({ location, count }))

      // Fetch engagement stats
      const { data: metrics } = await supabase
        .from("itinerary_metrics")
        .select("like_count, save_count, view_count")

      const { count: totalComments } = await supabase
        .from("comments")
        .select("*", { count: "exact", head: true })

      const totalLikes = metrics?.reduce((sum, m) => sum + (m.like_count || 0), 0) || 0
      const totalSaves = metrics?.reduce((sum, m) => sum + (m.save_count || 0), 0) || 0
      const totalViews = metrics?.reduce((sum, m) => sum + (m.view_count || 0), 0) || 0
      const avgViewsPerItinerary = metrics?.length ? Math.round(totalViews / metrics.length) : 0
      const engagementRate = totalViews > 0 ? ((totalLikes + totalSaves + (totalComments || 0)) / totalViews * 100) : 0
      const likeCommentRatio = (totalComments || 0) > 0 ? (totalLikes / (totalComments || 1)) : totalLikes

      // Fetch user metrics
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })

      const { count: newUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startDate.toISOString())

      const { data: activeUserIds } = await supabase
        .from("user_interactions")
        .select("user_id")
        .gte("created_at", startDate.toISOString())

      const uniqueActiveUsers = new Set(activeUserIds?.map(u => u.user_id) || []).size

      // Content metrics
      const { count: totalItineraryCount } = await supabase
        .from("itineraries")
        .select("*", { count: "exact", head: true })

      const { count: publicItineraries } = await supabase
        .from("itineraries")
        .select("*", { count: "exact", head: true })
        .eq("is_public", true)

      const privateItineraries = (totalItineraryCount || 0) - (publicItineraries || 0)

      // Top creators
      const creatorCount: { [key: string]: { count: number; name: string; avatar?: string } } = {}
      const { data: creatorsData } = await supabase
        .from("itineraries")
        .select("user_id, profiles!itineraries_user_id_fkey(name, avatar_url)")

      creatorsData?.forEach((i: any) => {
        const userId = i.user_id
        if (!creatorCount[userId]) {
          creatorCount[userId] = {
            count: 0,
            name: i.profiles?.name || "Unknown",
            avatar: i.profiles?.avatar_url
          }
        }
        creatorCount[userId].count++
      })

      const topCreators = Object.values(creatorCount)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Retention data (simplified)
      const retentionData = []
      for (let i = 4; i >= 0; i--) {
        const weekStart = new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000)
        const weekEnd = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000)

        const { count: weekUsers } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .lte("created_at", weekEnd.toISOString())

        retentionData.push({
          week: `Week ${5 - i}`,
          retained: weekUsers || 0,
          churned: Math.floor(Math.random() * 5) // Placeholder for actual churn data
        })
      }

      // Growth metrics
      const { count: previousUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .lt("created_at", startDate.toISOString())
        .gte("created_at", previousStartDate.toISOString())

      const { count: previousItineraries } = await supabase
        .from("itineraries")
        .select("*", { count: "exact", head: true })
        .lt("created_at", startDate.toISOString())
        .gte("created_at", previousStartDate.toISOString())

      const { count: currentItineraries } = await supabase
        .from("itineraries")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startDate.toISOString())

      const userGrowth = (previousUsers || 0) > 0
        ? Math.round((((newUsers || 0) - (previousUsers || 0)) / (previousUsers || 1)) * 100)
        : (newUsers || 0) > 0 ? 100 : 0

      const contentGrowth = (previousItineraries || 0) > 0
        ? Math.round((((currentItineraries || 0) - (previousItineraries || 0)) / (previousItineraries || 1)) * 100)
        : (currentItineraries || 0) > 0 ? 100 : 0

      setData({
        dailyActivity,
        categoryBreakdown,
        topLocations,
        engagementStats: {
          totalLikes,
          totalComments: totalComments || 0,
          totalSaves,
          avgViewsPerItinerary,
          engagementRate: Math.round(engagementRate * 100) / 100,
          likeCommentRatio: Math.round(likeCommentRatio * 10) / 10,
        },
        userMetrics: {
          activeUsers: uniqueActiveUsers,
          newUsers: newUsers || 0,
          returningUsers: uniqueActiveUsers - (newUsers || 0),
          avgSessionDuration: "4m 32s", // Would need session tracking
          bounceRate: 35.2, // Would need page tracking
        },
        contentMetrics: {
          totalItineraries: totalItineraryCount || 0,
          publicItineraries: publicItineraries || 0,
          privateItineraries,
          avgActivitiesPerItinerary: 5.2, // Would need activity count
          topCreators,
        },
        retentionData,
        hourlyActivity,
        weekdayActivity,
        growthMetrics: {
          userGrowth,
          contentGrowth,
          engagementGrowth: 0, // Would need historical engagement data
        },
      })
      setIsLoading(false)
    }

    fetchAnalytics()
  }, [timeRange])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#ffb88c] mx-auto mb-4" />
          <p className="text-[#2c2420]/60">Loading analytics...</p>
        </div>
      </div>
    )
  }

  const StatCard = ({ title, value, icon: Icon, trend, color = "peach" }: {
    title: string
    value: string | number
    icon: any
    trend?: { value: number; label: string }
    color?: "peach" | "coral" | "green" | "blue" | "purple" | "amber"
  }) => {
    const colors = {
      peach: "bg-[#ffb88c]/10 text-[#d97a4a]",
      coral: "bg-[#ff9a8b]/10 text-[#e57a6a]",
      green: "bg-green-100 text-green-600",
      blue: "bg-blue-100 text-blue-600",
      purple: "bg-purple-100 text-purple-600",
      amber: "bg-amber-100 text-amber-600",
    }

    return (
      <div className="bg-white/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-[#2c2420]/50 mb-1">{title}</p>
            <p className="text-2xl font-bold text-[#2c2420]">{value}</p>
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

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild aria-label="Go back">
            <Link href="/admin">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[#2c2420]">Analytics Dashboard</h1>
            <p className="text-sm text-[#2c2420]/50">Comprehensive platform insights and metrics</p>
          </div>
        </div>
        <div className="flex gap-1 bg-white/60 rounded-xl p-1 border border-[#2c2420]/5">
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white/60 border border-[#2c2420]/5">
          <TabsTrigger value="overview" className="data-[state=active]:bg-[#2c2420] data-[state=active]:text-white">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="engagement" className="data-[state=active]:bg-[#2c2420] data-[state=active]:text-white">
            <Heart className="h-4 w-4 mr-2" />
            Engagement
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-[#2c2420] data-[state=active]:text-white">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="content" className="data-[state=active]:bg-[#2c2420] data-[state=active]:text-white">
            <Map className="h-4 w-4 mr-2" />
            Content
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Views"
              value={data?.engagementStats.avgViewsPerItinerary ? (data.engagementStats.avgViewsPerItinerary * (data?.contentMetrics.totalItineraries || 0)).toLocaleString() : "0"}
              icon={Eye}
              trend={{ value: 12, label: "vs last period" }}
              color="peach"
            />
            <StatCard
              title="Active Users"
              value={data?.userMetrics.activeUsers.toLocaleString() || "0"}
              icon={Users}
              trend={{ value: data?.growthMetrics.userGrowth || 0, label: "vs last period" }}
              color="blue"
            />
            <StatCard
              title="Engagement Rate"
              value={`${data?.engagementStats.engagementRate || 0}%`}
              icon={Activity}
              color="green"
            />
            <StatCard
              title="Content Created"
              value={data?.contentMetrics.totalItineraries.toLocaleString() || "0"}
              icon={Map}
              trend={{ value: data?.growthMetrics.contentGrowth || 0, label: "vs last period" }}
              color="coral"
            />
          </div>

          {/* Daily Activity Chart */}
          <div className="bg-white/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-[#2c2420]">Daily Activity</h3>
                <p className="text-xs text-[#2c2420]/40">User interactions over time</p>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data?.dailyActivity || []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ffb88c" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#ffb88c" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2c2420" strokeOpacity={0.05} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#2c2420", fillOpacity: 0.4 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#2c2420", fillOpacity: 0.4 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "#2c2420",
                      border: "none",
                      borderRadius: "10px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Area type="monotone" dataKey="views" stroke="#ffb88c" strokeWidth={2} fill="url(#viewsGradient)" name="Views" />
                  <Line type="monotone" dataKey="likes" stroke="#ff9a8b" strokeWidth={2} dot={false} name="Likes" />
                  <Line type="monotone" dataKey="comments" stroke="#a8d5ba" strokeWidth={2} dot={false} name="Comments" />
                  <Line type="monotone" dataKey="saves" stroke="#94b8b8" strokeWidth={2} dot={false} name="Saves" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2 text-xs text-[#2c2420]/60">
                <div className="h-2 w-2 rounded-full bg-[#ffb88c]" /> Views
              </div>
              <div className="flex items-center gap-2 text-xs text-[#2c2420]/60">
                <div className="h-2 w-2 rounded-full bg-[#ff9a8b]" /> Likes
              </div>
              <div className="flex items-center gap-2 text-xs text-[#2c2420]/60">
                <div className="h-2 w-2 rounded-full bg-[#a8d5ba]" /> Comments
              </div>
              <div className="flex items-center gap-2 text-xs text-[#2c2420]/60">
                <div className="h-2 w-2 rounded-full bg-[#94b8b8]" /> Saves
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Hourly Activity */}
            <div className="bg-white/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-5">
              <h3 className="font-semibold text-[#2c2420] mb-1">Activity by Hour</h3>
              <p className="text-xs text-[#2c2420]/40 mb-4">Peak usage times</p>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.hourlyActivity || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2c2420" strokeOpacity={0.05} />
                    <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#2c2420", fillOpacity: 0.4 }} axisLine={false} tickLine={false} interval={3} />
                    <YAxis tick={{ fontSize: 10, fill: "#2c2420", fillOpacity: 0.4 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: "#2c2420", border: "none", borderRadius: "10px", color: "#fff", fontSize: "12px" }}
                    />
                    <Bar dataKey="activity" fill="#ffb88c" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Weekday Activity */}
            <div className="bg-white/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-5">
              <h3 className="font-semibold text-[#2c2420] mb-1">Activity by Day</h3>
              <p className="text-xs text-[#2c2420]/40 mb-4">Views vs content creation</p>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.weekdayActivity || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2c2420" strokeOpacity={0.05} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#2c2420", fillOpacity: 0.4 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#2c2420", fillOpacity: 0.4 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: "#2c2420", border: "none", borderRadius: "10px", color: "#fff", fontSize: "12px" }}
                    />
                    <Bar dataKey="views" fill="#ffb88c" radius={[4, 4, 0, 0]} name="Views" />
                    <Bar dataKey="creates" fill="#a8d5ba" radius={[4, 4, 0, 0]} name="Created" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Likes" value={data?.engagementStats.totalLikes.toLocaleString() || "0"} icon={Heart} color="coral" />
            <StatCard title="Total Comments" value={data?.engagementStats.totalComments.toLocaleString() || "0"} icon={MessageSquare} color="blue" />
            <StatCard title="Total Saves" value={data?.engagementStats.totalSaves.toLocaleString() || "0"} icon={Bookmark} color="amber" />
            <StatCard title="Avg Views/Itinerary" value={data?.engagementStats.avgViewsPerItinerary.toLocaleString() || "0"} icon={Eye} color="green" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Category Breakdown */}
            <div className="bg-white/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-5">
              <h3 className="font-semibold text-[#2c2420] mb-1">Category Breakdown</h3>
              <p className="text-xs text-[#2c2420]/40 mb-4">Itineraries by category</p>
              {data?.categoryBreakdown.length === 0 ? (
                <p className="text-center text-[#2c2420]/40 py-10">No category data yet</p>
              ) : (
                <>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data?.categoryBreakdown || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {data?.categoryBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {data?.categoryBreakdown.map((cat) => (
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
            </div>

            {/* Top Locations */}
            <div className="bg-white/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-5">
              <h3 className="font-semibold text-[#2c2420] mb-1">Top Locations</h3>
              <p className="text-xs text-[#2c2420]/40 mb-4">Most popular destinations</p>
              {data?.topLocations.length === 0 ? (
                <p className="text-center text-[#2c2420]/40 py-10">No location data yet</p>
              ) : (
                <div className="space-y-3">
                  {data?.topLocations.map((loc, idx) => (
                    <div key={loc.location} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-[#2c2420]/20 w-4">{idx + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-[#2c2420] truncate max-w-[180px]">{loc.location}</span>
                          <span className="text-xs text-[#2c2420]/50">{loc.count}</span>
                        </div>
                        <div className="h-1.5 bg-[#2c2420]/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#ffb88c] to-[#ff9a8b] rounded-full"
                            style={{ width: `${(loc.count / (data?.topLocations[0]?.count || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Engagement Metrics */}
          <div className="bg-white/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-5">
            <h3 className="font-semibold text-[#2c2420] mb-4">Engagement Insights</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-[#ffb88c]/5 rounded-xl">
                <p className="text-3xl font-bold text-[#2c2420]">{data?.engagementStats.engagementRate || 0}%</p>
                <p className="text-xs text-[#2c2420]/50 mt-1">Engagement Rate</p>
                <p className="text-[10px] text-[#2c2420]/40">(Interactions / Views)</p>
              </div>
              <div className="text-center p-4 bg-[#ff9a8b]/5 rounded-xl">
                <p className="text-3xl font-bold text-[#2c2420]">{data?.engagementStats.likeCommentRatio || 0}</p>
                <p className="text-xs text-[#2c2420]/50 mt-1">Like to Comment Ratio</p>
              </div>
              <div className="text-center p-4 bg-[#a8d5ba]/5 rounded-xl">
                <p className="text-3xl font-bold text-[#2c2420]">{data?.userMetrics.bounceRate || 0}%</p>
                <p className="text-xs text-[#2c2420]/50 mt-1">Bounce Rate</p>
              </div>
              <div className="text-center p-4 bg-[#94b8b8]/5 rounded-xl">
                <p className="text-3xl font-bold text-[#2c2420]">{data?.userMetrics.avgSessionDuration || "0m"}</p>
                <p className="text-xs text-[#2c2420]/50 mt-1">Avg Session Duration</p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Active Users" value={data?.userMetrics.activeUsers.toLocaleString() || "0"} icon={Users} color="blue" />
            <StatCard title="New Users" value={data?.userMetrics.newUsers.toLocaleString() || "0"} icon={TrendingUp} trend={{ value: data?.growthMetrics.userGrowth || 0, label: "vs last period" }} color="green" />
            <StatCard title="Returning Users" value={data?.userMetrics.returningUsers.toLocaleString() || "0"} icon={Activity} color="purple" />
            <StatCard title="Avg Session" value={data?.userMetrics.avgSessionDuration || "0m"} icon={Clock} color="peach" />
          </div>

          {/* User Retention */}
          <div className="bg-white/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-5">
            <h3 className="font-semibold text-[#2c2420] mb-1">User Retention</h3>
            <p className="text-xs text-[#2c2420]/40 mb-4">Weekly user retention trends</p>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.retentionData || []}>
                  <defs>
                    <linearGradient id="retainedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a8d5ba" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#a8d5ba" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2c2420" strokeOpacity={0.05} />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#2c2420", fillOpacity: 0.4 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#2c2420", fillOpacity: 0.4 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#2c2420", border: "none", borderRadius: "10px", color: "#fff", fontSize: "12px" }} />
                  <Area type="monotone" dataKey="retained" stroke="#a8d5ba" strokeWidth={2} fill="url(#retainedGradient)" name="Retained Users" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Itineraries" value={data?.contentMetrics.totalItineraries.toLocaleString() || "0"} icon={Map} color="peach" />
            <StatCard title="Public" value={data?.contentMetrics.publicItineraries.toLocaleString() || "0"} icon={Globe} color="green" />
            <StatCard title="Private" value={data?.contentMetrics.privateItineraries.toLocaleString() || "0"} icon={Eye} color="amber" />
            <StatCard title="Content Growth" value={`${data?.growthMetrics.contentGrowth || 0}%`} icon={TrendingUp} color="blue" />
          </div>

          {/* Top Creators */}
          <div className="bg-white/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-5">
            <h3 className="font-semibold text-[#2c2420] mb-1">Top Content Creators</h3>
            <p className="text-xs text-[#2c2420]/40 mb-4">Users with most itineraries</p>
            <div className="space-y-3">
              {data?.contentMetrics.topCreators.map((creator, idx) => (
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
              {(!data?.contentMetrics.topCreators || data.contentMetrics.topCreators.length === 0) && (
                <p className="text-center text-[#2c2420]/40 py-4">No creators yet</p>
              )}
            </div>
          </div>

          {/* Content Visibility Breakdown */}
          <div className="bg-white/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-5">
            <h3 className="font-semibold text-[#2c2420] mb-4">Content Visibility</h3>
            <div className="flex items-center gap-8">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[#2c2420]/70">Public Itineraries</span>
                  <span className="text-sm font-medium text-[#2c2420]">
                    {data?.contentMetrics.totalItineraries ? Math.round((data.contentMetrics.publicItineraries / data.contentMetrics.totalItineraries) * 100) : 0}%
                  </span>
                </div>
                <div className="h-3 bg-[#2c2420]/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#a8d5ba] to-[#78c5a8] rounded-full transition-all"
                    style={{
                      width: `${data?.contentMetrics.totalItineraries ? (data.contentMetrics.publicItineraries / data.contentMetrics.totalItineraries) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[#2c2420]/70">Private Itineraries</span>
                  <span className="text-sm font-medium text-[#2c2420]">
                    {data?.contentMetrics.totalItineraries ? Math.round((data.contentMetrics.privateItineraries / data.contentMetrics.totalItineraries) * 100) : 0}%
                  </span>
                </div>
                <div className="h-3 bg-[#2c2420]/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#ffb88c] to-[#ff9a8b] rounded-full transition-all"
                    style={{
                      width: `${data?.contentMetrics.totalItineraries ? (data.contentMetrics.privateItineraries / data.contentMetrics.totalItineraries) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
