"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, TrendingUp, TrendingDown, Users, Map, Eye, MessageSquare, Heart, Bookmark } from "lucide-react"
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
} from "recharts"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

interface AnalyticsData {
  dailyActivity: { date: string; views: number; likes: number; comments: number }[]
  categoryBreakdown: { name: string; value: number; color: string }[]
  topLocations: { location: string; count: number }[]
  engagementStats: {
    totalLikes: number
    totalComments: number
    totalSaves: number
    avgViewsPerItinerary: number
  }
}

const COLORS = ["#ffb88c", "#ff9a8b", "#ffd2b8", "#a8d5ba", "#94b8b8", "#d4a5a5"]

export default function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d")
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchAnalytics() {
      setIsLoading(true)
      const supabase = createClient()

      const daysAgo = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90
      const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)

      // Fetch user interactions for daily activity
      const { data: interactions } = await supabase
        .from("user_interactions")
        .select("interaction_type, created_at")
        .gte("created_at", startDate.toISOString())

      // Process daily activity
      const dailyMap: { [key: string]: { views: number; likes: number; comments: number } } = {}
      for (let i = 0; i < daysAgo; i++) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        const key = date.toISOString().split("T")[0]
        dailyMap[key] = { views: 0, likes: 0, comments: 0 }
      }

      interactions?.forEach((i) => {
        const key = i.created_at.split("T")[0]
        if (dailyMap[key]) {
          if (i.interaction_type === "view") dailyMap[key].views++
          if (i.interaction_type === "like") dailyMap[key].likes++
          if (i.interaction_type === "comment") dailyMap[key].comments++
        }
      })

      const dailyActivity = Object.entries(dailyMap)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, stats]) => ({
          date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          ...stats,
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
        .slice(0, 6)
        .map(([name, value], idx) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
          color: COLORS[idx % COLORS.length],
        }))

      // Fetch top locations
      const { data: itineraries } = await supabase
        .from("itineraries")
        .select("location")
        .not("location", "is", null)

      const locationCount: { [key: string]: number } = {}
      itineraries?.forEach((i) => {
        if (i.location) {
          locationCount[i.location] = (locationCount[i.location] || 0) + 1
        }
      })

      const topLocations = Object.entries(locationCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
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

      setData({
        dailyActivity,
        categoryBreakdown,
        topLocations,
        engagementStats: {
          totalLikes,
          totalComments: totalComments || 0,
          totalSaves,
          avgViewsPerItinerary,
        },
      })
      setIsLoading(false)
    }

    fetchAnalytics()
  }, [timeRange])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#ffb88c]" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[#2c2420]">Analytics</h1>
            <p className="text-sm text-[#2c2420]/50">Platform engagement and trends</p>
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

      {/* Engagement Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center">
              <Heart className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#2c2420]">{data?.engagementStats.totalLikes.toLocaleString()}</p>
              <p className="text-xs text-[#2c2420]/50">Total Likes</p>
            </div>
          </div>
        </div>
        <div className="bg-white/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#2c2420]">{data?.engagementStats.totalComments.toLocaleString()}</p>
              <p className="text-xs text-[#2c2420]/50">Total Comments</p>
            </div>
          </div>
        </div>
        <div className="bg-white/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Bookmark className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#2c2420]">{data?.engagementStats.totalSaves.toLocaleString()}</p>
              <p className="text-xs text-[#2c2420]/50">Total Saves</p>
            </div>
          </div>
        </div>
        <div className="bg-white/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
              <Eye className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#2c2420]">{data?.engagementStats.avgViewsPerItinerary.toLocaleString()}</p>
              <p className="text-xs text-[#2c2420]/50">Avg Views/Itinerary</p>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Activity Chart */}
      <div className="bg-white/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-5 mb-8">
        <h3 className="font-semibold text-[#2c2420] mb-1">Daily Activity</h3>
        <p className="text-xs text-[#2c2420]/40 mb-4">User interactions over time</p>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.dailyActivity || []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
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
              <Area type="monotone" dataKey="likes" stroke="#ff9a8b" strokeWidth={2} fill="transparent" name="Likes" />
              <Area type="monotone" dataKey="comments" stroke="#a8d5ba" strokeWidth={2} fill="transparent" name="Comments" />
            </AreaChart>
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
        </div>
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
    </div>
  )
}
