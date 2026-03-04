"use client"

import { useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Eye,
  MousePointerClick,
  Bookmark,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  RefreshCw,
  Activity,
  Zap,
  Globe,
  Users,
  Clock,
  Target,
  PieChart as PieChartIcon,
  Sparkles,
  ShieldCheck,
  Heart,
  Repeat,
  CalendarDays,
  Layers,
  Brain,
  Award,
  MapPin,
  Webhook,
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
  Legend,
} from "recharts"
import type { BusinessTierSlug } from "@/lib/tiers"
import { WebhookManagement } from "@/components/webhook-management"
import { createClient } from "@/lib/supabase/client"

interface PromotionMetrics {
  views: number
  clicks: number
  saves: number
  shares: number
}

interface EnterpriseAnalyticsDashboardProps {
  tier: BusinessTierSlug
  promotionMetrics?: PromotionMetrics
  businessId?: string
}

// ─── Types for fetched data ─────────────────────────────────────────

interface FetchedPromotion {
  id: string
  title: string
  status: string
  category: string
  location: string
  price: number | null
  views: number
  clicks: number
  saves: number
  shares: number
}

interface FetchedBooking {
  id: string
  promotion_id: string
  quantity: number
  total_price: number
  status: string
  created_at: string
  user_id: string
}

interface AnalyticsState {
  promotions: FetchedPromotion[]
  bookings: FetchedBooking[]
  subscriptionRevenue: number
  totalBookingUsers: number
  repeatBookingUsers: number
  userLocations: { location: string; count: number }[]
  loaded: boolean
}

// ─── Helper: group bookings by date ────────────────────────────────

function groupBookingsByDate(bookings: FetchedBooking[]) {
  const map: Record<string, { count: number; revenue: number }> = {}
  for (const b of bookings) {
    const date = new Date(b.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    if (!map[date]) map[date] = { count: 0, revenue: 0 }
    map[date].count += b.quantity
    map[date].revenue += b.total_price
  }
  return Object.entries(map)
    .map(([date, data]) => ({ date, bookings: data.count, revenue: data.revenue }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-14)
}

function groupBookingsByWeekday(bookings: FetchedBooking[]) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const now = new Date()
  const oneWeekAgo = new Date(now.getTime() - 7 * 86400000)
  const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000)
  const thisWeek: Record<string, number> = {}
  const lastWeek: Record<string, number> = {}
  for (const d of days) { thisWeek[d] = 0; lastWeek[d] = 0 }
  for (const b of bookings) {
    const d = new Date(b.created_at)
    const day = days[d.getDay()]
    if (d >= oneWeekAgo) thisWeek[day] += b.quantity
    else if (d >= twoWeeksAgo) lastWeek[day] += b.quantity
  }
  return days.filter(d => d !== "Sun").concat("Sun").map(day => ({
    day, thisWeek: thisWeek[day], lastWeek: lastWeek[day],
  }))
}

function groupBookingsByHour(bookings: FetchedBooking[]) {
  const hours: Record<number, { bookings: number }> = {}
  for (let h = 0; h < 24; h++) hours[h] = { bookings: 0 }
  for (const b of bookings) {
    const h = new Date(b.created_at).getHours()
    hours[h].bookings += b.quantity
  }
  const labels = ["12am","1am","2am","3am","4am","5am","6am","7am","8am","9am","10am","11am","12pm","1pm","2pm","3pm","4pm","5pm","6pm","7pm","8pm","9pm","10pm","11pm"]
  return labels.map((hour, i) => ({ hour, bookings: hours[i].bookings }))
}

function buildCohortRetention(bookings: FetchedBooking[]) {
  const now = new Date()
  const weeks: { label: string; start: Date; end: Date }[] = []
  for (let i = 4; i >= 0; i--) {
    const start = new Date(now.getTime() - (i + 1) * 7 * 86400000)
    const end = new Date(start.getTime() + 7 * 86400000)
    weeks.push({
      label: `Week of ${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      start, end,
    })
  }
  return weeks.map((week) => {
    const cohortUsers = new Set(bookings.filter(b => {
      const d = new Date(b.created_at)
      return d >= week.start && d < week.end
    }).map(b => b.user_id))
    const size = cohortUsers.size || 1
    const weekRetention = [100]
    for (let w = 1; w <= 3; w++) {
      const periodStart = new Date(week.end.getTime() + (w - 1) * 7 * 86400000)
      const periodEnd = new Date(periodStart.getTime() + 7 * 86400000)
      if (periodStart > now) { weekRetention.push(0); continue }
      const active = bookings.filter(b => {
        const d = new Date(b.created_at)
        return d >= periodStart && d < periodEnd && cohortUsers.has(b.user_id)
      })
      const uniqueActive = new Set(active.map(b => b.user_id)).size
      weekRetention.push(Math.round((uniqueActive / size) * 100))
    }
    return { cohort: week.label, users: cohortUsers.size, w1: weekRetention[0], w2: weekRetention[1], w3: weekRetention[2], w4: weekRetention[3] }
  })
}

function generateInsights(promos: FetchedPromotion[], bookings: FetchedBooking[], totalViews: number, totalClicks: number) {
  const insights: { type: "opportunity" | "warning" | "insight"; title: string; description: string; impact: string }[] = []
  // Top performing category
  const categoryRevenue: Record<string, number> = {}
  for (const b of bookings) {
    const promo = promos.find(p => p.id === b.promotion_id)
    if (promo) {
      categoryRevenue[promo.category] = (categoryRevenue[promo.category] || 0) + b.total_price
    }
  }
  const topCategory = Object.entries(categoryRevenue).sort((a, b) => b[1] - a[1])[0]
  if (topCategory) {
    insights.push({
      type: "insight",
      title: `Top category: ${topCategory[0]}`,
      description: `"${topCategory[0]}" generates $${topCategory[1].toLocaleString()} in bookings — your highest-performing category. Consider adding more promotions in this category.`,
      impact: `$${topCategory[1].toLocaleString()} revenue`,
    })
  }
  // CTR analysis
  const ctr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0
  if (ctr > 15) {
    insights.push({ type: "opportunity", title: "High click-through rate detected", description: `Your CTR of ${ctr.toFixed(1)}% is above average. Consider testing a small price increase on top-performing promotions — your high engagement suggests room for optimization.`, impact: "Pricing opportunity" })
  } else if (ctr < 5 && totalViews > 100) {
    insights.push({ type: "warning", title: "Low click-through rate", description: `Your CTR of ${ctr.toFixed(1)}% is below average. Consider improving promotion titles, images, and descriptions to drive more engagement.`, impact: "Engagement at risk" })
  }
  // Weekend vs weekday
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  let weekdayBookings = 0, weekdayDays = 0, weekendBookings = 0, weekendDays = 0
  for (const b of bookings) {
    const d = new Date(b.created_at).getDay()
    if (d === 0 || d === 6) { weekendBookings += b.quantity; weekendDays++ }
    else { weekdayBookings += b.quantity; weekdayDays++ }
  }
  const weekdayAvg = weekdayDays > 0 ? weekdayBookings / weekdayDays : 0
  const weekendAvg = weekendDays > 0 ? weekendBookings / weekendDays : 0
  if (weekendAvg > weekdayAvg * 1.3 && weekendBookings > 0) {
    insights.push({ type: "opportunity", title: "Weekend bookings outperform weekdays", description: `Weekend booking average (${weekendAvg.toFixed(0)}/day) is ${((weekendAvg / Math.max(weekdayAvg, 1) - 1) * 100).toFixed(0)}% higher than weekdays. Consider launching weekend-exclusive promotions.`, impact: "Weekend opportunity" })
  }
  // Low-performing promos
  const lowPerformers = promos.filter(p => p.status === "active" && p.views > 50 && p.clicks === 0)
  if (lowPerformers.length > 0) {
    insights.push({ type: "warning", title: `${lowPerformers.length} promotion${lowPerformers.length > 1 ? "s" : ""} with zero clicks`, description: `${lowPerformers.map(p => `"${p.title}"`).slice(0, 3).join(", ")} ${lowPerformers.length > 3 ? `and ${lowPerformers.length - 3} more` : ""} have views but no clicks. Review their content and imagery.`, impact: "Action needed" })
  }
  // Top location insight
  const locationRevenue: Record<string, number> = {}
  for (const b of bookings) {
    const promo = promos.find(p => p.id === b.promotion_id)
    if (promo) locationRevenue[promo.location] = (locationRevenue[promo.location] || 0) + b.total_price
  }
  const topLoc = Object.entries(locationRevenue).sort((a, b) => b[1] - a[1])[0]
  if (topLoc) {
    insights.push({ type: "insight", title: `Top market: ${topLoc[0]}`, description: `${topLoc[0]} generates the most booking revenue at $${topLoc[1].toLocaleString()}. Consider increasing promotion density in this market.`, impact: "Market insight" })
  }
  return insights.slice(0, 5)
}

// ─── Helpers ────────────────────────────────────────────────────────

function MetricChange({ value }: { value: number }) {
  const isPositive = value >= 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${isPositive ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
      {isPositive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      {isPositive ? "+" : ""}{value}%
    </span>
  )
}

function RetentionCell({ value }: { value: number }) {
  const intensity = value / 100
  const bg = `rgba(34, 197, 94, ${intensity * 0.6 + 0.05})`
  const text = value >= 50 ? "text-white" : "text-foreground"
  return (
    <TableCell className="text-center">
      <div
        className={`rounded-md px-2 py-1 text-xs font-semibold ${text}`}
        style={{ backgroundColor: bg }}
      >
        {value}%
      </div>
    </TableCell>
  )
}

function FunnelBar({ stage, count, percentage, isLast }: { stage: string; count: number; percentage: number; isLast: boolean }) {
  const width = Math.max(percentage, 8)
  return (
    <div className="flex items-center gap-3">
      <div className="w-32 sm:w-40 text-xs font-medium text-foreground text-right shrink-0">{stage}</div>
      <div className="flex-1 relative">
        <div
          className="h-8 rounded-md bg-gradient-to-r from-primary/80 to-tinerary-salmon/80 flex items-center px-3 transition-all"
          style={{ width: `${width}%` }}
        >
          <span className="text-[11px] font-semibold text-white whitespace-nowrap">
            {count.toLocaleString()}
          </span>
        </div>
      </div>
      <div className="w-14 text-xs text-muted-foreground text-right shrink-0">{percentage}%</div>
    </div>
  )
}

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--card))",
  fontSize: 12,
}

// ─── Component ──────────────────────────────────────────────────────

export function EnterpriseAnalyticsDashboard({ tier, promotionMetrics, businessId }: EnterpriseAnalyticsDashboardProps) {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const isEnterprise = tier === "enterprise"
  const isPremium = tier === "premium"

  const [analytics, setAnalytics] = useState<AnalyticsState>({
    promotions: [], bookings: [], subscriptionRevenue: 0,
    totalBookingUsers: 0, repeatBookingUsers: 0, userLocations: [], loaded: false,
  })

  const loadAnalytics = useCallback(async () => {
    if (!businessId) return
    const supabase = createClient()

    // Fetch promotions with metrics
    const { data: promos } = await supabase
      .from("promotions")
      .select("id, title, status, category, location, price, promotion_metrics(*)")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })

    const fetchedPromos: FetchedPromotion[] = (promos || []).map((p: any) => {
      const m = Array.isArray(p.promotion_metrics) ? p.promotion_metrics[0] : p.promotion_metrics
      return {
        id: p.id, title: p.title, status: p.status, category: p.category,
        location: p.location, price: p.price,
        views: m?.views || 0, clicks: m?.clicks || 0, saves: m?.saves || 0, shares: m?.shares || 0,
      }
    })

    const promoIds = fetchedPromos.map(p => p.id)

    // Fetch bookings for this business's promotions
    let fetchedBookings: FetchedBooking[] = []
    if (promoIds.length > 0) {
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("id, promotion_id, quantity, total_price, status, created_at, user_id")
        .in("promotion_id", promoIds)
        .order("created_at", { ascending: false })
      fetchedBookings = (bookingsData || []) as FetchedBooking[]
    }

    // Fetch subscription revenue
    const { data: subData } = await supabase
      .from("business_subscriptions")
      .select("paid_amount")
      .eq("business_id", businessId)
      .eq("status", "active")
      .single()
    const subRevenue = subData?.paid_amount || 0

    // Compute repeat booking users
    const userBookingCounts: Record<string, number> = {}
    for (const b of fetchedBookings) {
      userBookingCounts[b.user_id] = (userBookingCounts[b.user_id] || 0) + 1
    }
    const uniqueUsers = Object.keys(userBookingCounts).length
    const repeatUsers = Object.values(userBookingCounts).filter(c => c > 1).length

    // Fetch user locations for geography (from booking users' profiles)
    const bookingUserIds = [...new Set(fetchedBookings.map(b => b.user_id))].slice(0, 100)
    let userLocs: { location: string; count: number }[] = []
    if (bookingUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("location")
        .in("id", bookingUserIds)
        .not("location", "is", null)
      if (profiles) {
        const locMap: Record<string, number> = {}
        for (const p of profiles) {
          if (p.location) {
            locMap[p.location] = (locMap[p.location] || 0) + 1
          }
        }
        userLocs = Object.entries(locMap)
          .map(([location, count]) => ({ location, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8)
      }
    }

    setAnalytics({
      promotions: fetchedPromos, bookings: fetchedBookings,
      subscriptionRevenue: subRevenue, totalBookingUsers: uniqueUsers,
      repeatBookingUsers: repeatUsers, userLocations: userLocs, loaded: true,
    })
  }, [businessId])

  useEffect(() => { loadAnalytics() }, [loadAnalytics])

  // Use real data when available, fall back to promotion metrics prop
  const realViews = promotionMetrics?.views ?? analytics.promotions.reduce((s, p) => s + p.views, 0)
  const realClicks = promotionMetrics?.clicks ?? analytics.promotions.reduce((s, p) => s + p.clicks, 0)
  const realSaves = promotionMetrics?.saves ?? analytics.promotions.reduce((s, p) => s + p.saves, 0)
  const realShares = promotionMetrics?.shares ?? analytics.promotions.reduce((s, p) => s + p.shares, 0)
  const realCtr = realViews > 0 ? Math.round((realClicks / realViews) * 10000) / 100 : 0
  const realSaveRate = realViews > 0 ? Math.round((realSaves / realViews) * 10000) / 100 : 0

  // Computed analytics from real data
  const totalBookings = analytics.bookings.length
  const totalRevenue = analytics.bookings.reduce((s, b) => s + b.total_price, 0)
  const avgOrderValue = totalBookings > 0 ? totalRevenue / totalBookings : 0
  const conversionRate = realViews > 0 ? Math.round((totalBookings / realViews) * 10000) / 100 : 0
  const repeatRate = analytics.totalBookingUsers > 0 ? Math.round((analytics.repeatBookingUsers / analytics.totalBookingUsers) * 100 * 10) / 10 : 0

  // Revenue intelligence from real data
  const mrr = analytics.subscriptionRevenue
  const arr = mrr * 12
  const totalBookingRevenue = totalRevenue
  const revenuePerUser = analytics.totalBookingUsers > 0 ? totalBookingRevenue / analytics.totalBookingUsers : 0

  // Top promotions from real data
  const computedTopPromotions = analytics.promotions
    .map(p => {
      const promoBookings = analytics.bookings.filter(b => b.promotion_id === p.id)
      const promoRevenue = promoBookings.reduce((s, b) => s + b.total_price, 0)
      return {
        name: p.title, views: p.views, clicks: p.clicks,
        bookings: promoBookings.length, revenue: promoRevenue,
        ctr: p.views > 0 ? `${((p.clicks / p.views) * 100).toFixed(1)}%` : "0.0%",
      }
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  // Conversion funnel from real data
  const computedFunnel = [
    { stage: "Total Views", count: realViews, percentage: 100 },
    { stage: "Clicks", count: realClicks, percentage: realViews > 0 ? Math.round((realClicks / realViews) * 1000) / 10 : 0 },
    { stage: "Saves", count: realSaves, percentage: realViews > 0 ? Math.round((realSaves / realViews) * 1000) / 10 : 0 },
    { stage: "Bookings", count: totalBookings, percentage: realViews > 0 ? Math.round((totalBookings / realViews) * 10000) / 100 : 0 },
  ]

  // Daily performance from real bookings
  const computedDailyPerformance = groupBookingsByDate(analytics.bookings)

  // Revenue trend from real bookings
  const computedRevenueTrend = computedDailyPerformance.map(d => ({
    date: d.date, revenue: d.revenue, bookings: d.bookings, forecast: null as number | null,
  }))

  // Week-over-week from real bookings
  const computedWeekOverWeek = groupBookingsByWeekday(analytics.bookings)

  // Hourly traffic from real bookings
  const computedHourlyTraffic = groupBookingsByHour(analytics.bookings)

  // Cohort retention from real bookings
  const computedCohortRetention = buildCohortRetention(analytics.bookings)

  // Geography from real data (promotion locations + booking revenue)
  const computedGeography = (() => {
    const locRevenue: Record<string, { views: number; revenue: number }> = {}
    for (const p of analytics.promotions) {
      if (!locRevenue[p.location]) locRevenue[p.location] = { views: 0, revenue: 0 }
      locRevenue[p.location].views += p.views
    }
    for (const b of analytics.bookings) {
      const promo = analytics.promotions.find(p => p.id === b.promotion_id)
      if (promo) {
        if (!locRevenue[promo.location]) locRevenue[promo.location] = { views: 0, revenue: 0 }
        locRevenue[promo.location].revenue += b.total_price
      }
    }
    const totalLocViews = Object.values(locRevenue).reduce((s, l) => s + l.views, 0) || 1
    return Object.entries(locRevenue)
      .map(([city, data]) => ({
        city, views: data.views, revenue: `$${data.revenue.toLocaleString()}`,
        percentage: Math.round((data.views / totalLocViews) * 100),
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 8)
  })()

  // Audience segments from promotion categories
  const computedAudienceSegments = (() => {
    const catRevenue: Record<string, number> = {}
    for (const b of analytics.bookings) {
      const promo = analytics.promotions.find(p => p.id === b.promotion_id)
      if (promo) catRevenue[promo.category] = (catRevenue[promo.category] || 0) + b.total_price
    }
    const totalCatRevenue = Object.values(catRevenue).reduce((s, r) => s + r, 0) || 1
    return Object.entries(catRevenue)
      .map(([segment, revenue]) => ({
        segment, revenue: `$${revenue.toLocaleString()}`,
        percentage: Math.round((revenue / totalCatRevenue) * 100),
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 6)
  })()

  // Revenue by category for pie chart
  const PIE_COLORS = ["#22c55e", "#7C3AED", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899"]
  const computedRevenueByChannel = (() => {
    const catRevenue: Record<string, number> = {}
    for (const b of analytics.bookings) {
      const promo = analytics.promotions.find(p => p.id === b.promotion_id)
      if (promo) catRevenue[promo.category] = (catRevenue[promo.category] || 0) + b.total_price
    }
    const totalCatRev = Object.values(catRevenue).reduce((s, r) => s + r, 0) || 1
    return Object.entries(catRevenue)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, revenue], i) => ({
        name, revenue, value: Math.round((revenue / totalCatRev) * 100), color: PIE_COLORS[i % PIE_COLORS.length],
      }))
  })()

  // Customer health metrics from real booking data
  const computedCustomerHealth = (() => {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000)

    // Track per-user last booking dates
    const userLastBooking: Record<string, Date> = {}
    for (const b of analytics.bookings) {
      const d = new Date(b.created_at)
      if (!userLastBooking[b.user_id] || d > userLastBooking[b.user_id]) {
        userLastBooking[b.user_id] = d
      }
    }
    const allUsers = Object.entries(userLastBooking)
    const activeCustomers = allUsers.filter(([, d]) => d >= thirtyDaysAgo).length
    const atRiskCustomers = allUsers.filter(([, d]) => d < thirtyDaysAgo && d >= sixtyDaysAgo).length
    const churnedLast30d = allUsers.filter(([, d]) => d < sixtyDaysAgo).length
    const totalCustomers = allUsers.length || 1
    const churnRate = Math.round((churnedLast30d / totalCustomers) * 1000) / 10

    // Health score based on activity and repeat rate
    const healthScore = Math.min(100, Math.round(
      (activeCustomers / totalCustomers) * 50 +
      repeatRate * 0.3 +
      (1 - churnRate / 100) * 20
    ))
    const healthLabel = healthScore >= 70 ? "Healthy" : healthScore >= 40 ? "At Risk" : "Critical"

    return {
      activeCustomers,
      atRiskCustomers,
      churnedLast30d,
      churnRate,
      healthScore,
      healthLabel,
      repeatRate,
    }
  })()

  // Competitor benchmarks computed from actual data vs industry averages
  const computedBenchmarks = (() => {
    const benchmarkData = [
      { metric: "Click-Through Rate", yours: `${realCtr}%`, benchmark: "12.0%", yoursVal: realCtr, benchVal: 12.0 },
      { metric: "Save Rate", yours: `${realSaveRate}%`, benchmark: "8.5%", yoursVal: realSaveRate, benchVal: 8.5 },
      { metric: "Conversion Rate", yours: `${conversionRate}%`, benchmark: "2.5%", yoursVal: conversionRate, benchVal: 2.5 },
      { metric: "Avg Order Value", yours: `$${avgOrderValue.toFixed(2)}`, benchmark: "$45.00", yoursVal: avgOrderValue, benchVal: 45.0 },
      { metric: "Repeat Rate", yours: `${repeatRate}%`, benchmark: "25.0%", yoursVal: repeatRate, benchVal: 25.0 },
      { metric: "Revenue per User", yours: `$${revenuePerUser.toFixed(2)}`, benchmark: "$85.00", yoursVal: revenuePerUser, benchVal: 85.0 },
    ]
    return benchmarkData.map(b => {
      const diff = b.yoursVal - b.benchVal
      const pctDiff = b.benchVal > 0 ? Math.round((diff / b.benchVal) * 100) : 0
      return {
        metric: b.metric,
        yours: b.yours,
        benchmark: b.benchmark,
        delta: `${pctDiff >= 0 ? "+" : ""}${pctDiff}%`,
        status: pctDiff >= 0 ? "above" : "below" as "above" | "below",
      }
    })
  })()

  // Data-driven insights
  const computedInsights = analytics.loaded ? generateInsights(analytics.promotions, analytics.bookings, realViews, realClicks) : []

  // Trend analysis recommendations
  const trendRecommendations = (() => {
    const recs: string[] = []
    if (totalRevenue > 0 && computedDailyPerformance.length >= 2) {
      const recent = computedDailyPerformance.slice(-3)
      const earlier = computedDailyPerformance.slice(0, 3)
      const recentAvg = recent.reduce((s, d) => s + d.revenue, 0) / (recent.length || 1)
      const earlierAvg = earlier.reduce((s, d) => s + d.revenue, 0) / (earlier.length || 1)
      if (recentAvg > earlierAvg) recs.push(`Revenue is trending up — recent days average $${recentAvg.toFixed(0)} vs $${earlierAvg.toFixed(0)} earlier.`)
      else if (recentAvg < earlierAvg * 0.9) recs.push(`Revenue has dipped recently — $${recentAvg.toFixed(0)} avg vs $${earlierAvg.toFixed(0)} earlier. Review promotion performance.`)
    }
    if (realCtr > 15) recs.push(`Your CTR of ${realCtr}% is strong. Test small price increases on top performers.`)
    if (realCtr < 5 && realViews > 100) recs.push(`CTR is ${realCtr}% — consider refreshing promotion images and descriptions.`)
    if (repeatRate > 20) recs.push(`Repeat booking rate of ${repeatRate}% shows good customer loyalty.`)
    if (repeatRate < 10 && totalBookings > 10) recs.push(`Repeat rate is ${repeatRate}%. Consider a loyalty program or follow-up email sequence.`)
    if (computedTopPromotions.length > 0 && computedTopPromotions[0].revenue > 0) {
      recs.push(`Top performer "${computedTopPromotions[0].name}" drives $${computedTopPromotions[0].revenue.toLocaleString()} — consider similar promotions.`)
    }
    return recs.slice(0, 4)
  })()

  // ── Premium: "Advanced analytics + insights" ──────────────
  // KPIs, secondary metrics, revenue trend (no forecast), funnel,
  // audience segments, channel breakdown, geography, promotions table, weekly trends
  const showKpiCards = isEnterprise || isPremium
  const showSecondaryMetrics = isEnterprise || isPremium
  const showRevenueTrend = isEnterprise || isPremium
  const showFunnel = isEnterprise || isPremium
  const showAudienceDemographics = isEnterprise || isPremium
  const showGeography = isEnterprise || isPremium

  // ── Enterprise: "Real-time analytics dashboard + full API access" ──
  // Everything above, PLUS real-time live data, API badge, revenue
  // intelligence (MRR/ARR/LTV/CAC), forecast overlay, data insights,
  // competitor benchmarks, cohort retention, customer health/NPS,
  // daily performance reports, hourly traffic, week-over-week comparison
  const showRealtimeMetrics = isEnterprise
  const showApiAccess = isEnterprise
  const showRevenueIntelligence = isEnterprise
  const showForecast = isEnterprise
  const showInsights = isEnterprise
  const showCompetitorBenchmarks = isEnterprise
  const showCohortRetention = isEnterprise
  const showCustomerHealth = isEnterprise
  const showDailyReports = isEnterprise
  const showWebhooks = isEnterprise

  if (tier === "basic") {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">Basic Analytics</CardTitle>
          <CardDescription>Upgrade to Premium or Enterprise to unlock advanced analytics.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-muted text-center">
              <Eye className="size-5 mx-auto text-muted-foreground mb-2" />
              <p className="text-2xl font-bold text-foreground">{realViews.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Views</p>
            </div>
            <div className="p-4 rounded-xl bg-muted text-center">
              <MousePointerClick className="size-5 mx-auto text-muted-foreground mb-2" />
              <p className="text-2xl font-bold text-foreground">{realClicks.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Clicks</p>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/10 text-center">
            <p className="text-xs text-muted-foreground">
              Unlock real-time analytics, API access, competitor benchmarks, and daily reports with{" "}
              <a href="/business" className="text-primary font-medium hover:underline">Enterprise</a>.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Real-time Indicator ──────────────────────────────────── */}
      {showRealtimeMetrics && (
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-muted-foreground">Real-time</span>
            <Badge variant="secondary" className="text-[10px]">
              <Users className="size-2.5 mr-1" />
              {analytics.totalBookingUsers} booking customers
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              <Activity className="size-2.5 mr-1" />
              {totalBookings} total bookings
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {showApiAccess && (
              <Badge variant="outline" className="text-[10px] gap-1">
                <Zap className="size-2.5" />
                API Active
              </Badge>
            )}
            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1">
              <RefreshCw className="size-3" />
              Refresh
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
              <Download className="size-3" />
              Export
            </Button>
          </div>
        </div>
      )}

      {/* ── Primary KPI Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <Eye className="size-4 text-muted-foreground" />
              {showRealtimeMetrics && <Badge variant="secondary" className="text-[10px]">Live</Badge>}
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{realViews.toLocaleString()}</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">Total Views</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-5">
            <MousePointerClick className="size-4 text-muted-foreground" />
            <p className="mt-2 text-2xl font-bold text-foreground">{realClicks.toLocaleString()}</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">Total Clicks</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-5">
            <Target className="size-4 text-muted-foreground" />
            <p className="mt-2 text-2xl font-bold text-foreground">{realCtr}%</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">Click-Through Rate</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-5">
            <Bookmark className="size-4 text-muted-foreground" />
            <p className="mt-2 text-2xl font-bold text-foreground">{realSaveRate}%</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">Save Rate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Secondary Metrics ────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="border-border">
          <CardContent className="pt-4 pb-4">
            <Eye className="size-3.5 text-muted-foreground" />
            <p className="mt-1.5 text-lg font-bold text-foreground">{realViews.toLocaleString()}</p>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-[11px] text-muted-foreground">Views</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-4 pb-4">
            <MousePointerClick className="size-3.5 text-muted-foreground" />
            <p className="mt-1.5 text-lg font-bold text-foreground">{realClicks.toLocaleString()}</p>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-[11px] text-muted-foreground">Clicks</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-4 pb-4">
            <Target className="size-3.5 text-muted-foreground" />
            <p className="mt-1.5 text-lg font-bold text-foreground">{realCtr}%</p>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-[11px] text-muted-foreground">CTR</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-4 pb-4">
            <Bookmark className="size-3.5 text-muted-foreground" />
            <p className="mt-1.5 text-lg font-bold text-foreground">{realSaves.toLocaleString()}</p>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-[11px] text-muted-foreground">Saves</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-4 pb-4">
            <ArrowUpRight className="size-3.5 text-muted-foreground" />
            <p className="mt-1.5 text-lg font-bold text-foreground">{realSaveRate}%</p>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-[11px] text-muted-foreground">Save Rate</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-4 pb-4">
            <Repeat className="size-3.5 text-muted-foreground" />
            <p className="mt-1.5 text-lg font-bold text-foreground">{repeatRate}%</p>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-[11px] text-muted-foreground">Repeat Rate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Revenue Intelligence (Enterprise) ────────────────────── */}
      {showRevenueIntelligence && (
        <Card className="border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <DollarSign className="size-4 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-base">Revenue Intelligence</CardTitle>
                <CardDescription>Key financial metrics and unit economics</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 rounded-xl bg-muted">
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Subscription MRR</p>
                <p className="text-xl font-bold text-foreground mt-1">${mrr > 1000 ? `${(mrr / 1000).toFixed(1)}K` : mrr.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-muted">
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Est. ARR</p>
                <p className="text-xl font-bold text-foreground mt-1">${arr > 1000000 ? `${(arr / 1000000).toFixed(2)}M` : arr > 1000 ? `${(arr / 1000).toFixed(1)}K` : arr.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-muted">
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Total Booking Revenue</p>
                <p className="text-xl font-bold text-foreground mt-1">${totalBookingRevenue > 1000 ? `${(totalBookingRevenue / 1000).toFixed(1)}K` : totalBookingRevenue.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-muted">
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Revenue per User</p>
                <p className="text-xl font-bold text-foreground mt-1">${revenuePerUser.toFixed(2)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              <div className="p-3 rounded-xl bg-muted">
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Total Bookings</p>
                <p className="text-xl font-bold text-foreground mt-1">{totalBookings.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-muted">
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Avg Order Value</p>
                <p className="text-xl font-bold text-foreground mt-1">${avgOrderValue.toFixed(2)}</p>
              </div>
              <div className="p-3 rounded-xl bg-muted">
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Unique Customers</p>
                <p className="text-xl font-bold text-foreground mt-1">{analytics.totalBookingUsers.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-muted">
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Conversion Rate</p>
                <p className="text-xl font-bold text-foreground mt-1">{conversionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Revenue Trend + Forecast Chart ───────────────────────── */}
      {showRevenueTrend && (
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  {showForecast ? "Revenue Trend & Forecast" : "Revenue Trend"}
                </CardTitle>
                <CardDescription>
                  {showForecast ? "30-day revenue with 7-day projected forecast" : "30-day revenue performance"}
                </CardDescription>
              </div>
              {showForecast && (
                <Badge variant="secondary" className="text-[10px] gap-1">
                  <TrendingUp className="size-2.5" />
                  Forecast
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={computedRevenueTrend} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number | null) => value ? [`$${value.toLocaleString()}`, ""] : ["-", ""]} />
                <Area type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} fill="url(#revenueGradient)" name="Revenue" connectNulls={false} />
                {showForecast && (
                  <Area type="monotone" dataKey="forecast" stroke="#7C3AED" strokeWidth={2} strokeDasharray="6 3" fill="url(#forecastGradient)" name="Forecast" connectNulls />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ── Data-Driven Insights (Enterprise) ─────────────────────── */}
      {showInsights && (
        <Card className="border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Sparkles className="size-4 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-base">Data-Driven Insights</CardTitle>
                <CardDescription>Actionable recommendations based on your data patterns</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {computedInsights.map((insight, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl border ${
                    insight.type === "opportunity"
                      ? "border-green-200 bg-green-50/50 dark:border-green-900/30 dark:bg-green-900/10"
                      : insight.type === "warning"
                      ? "border-amber-200 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-900/10"
                      : "border-blue-200 bg-blue-50/50 dark:border-blue-900/30 dark:bg-blue-900/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] border-0 ${
                            insight.type === "opportunity"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                              : insight.type === "warning"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                          }`}
                        >
                          {insight.type === "opportunity" ? "Opportunity" : insight.type === "warning" ? "Attention" : "Insight"}
                        </Badge>
                        <span className="text-xs font-semibold text-foreground">{insight.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0 whitespace-nowrap">
                      {insight.impact}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Tabbed Deep-Dive Analytics ───────────────────────────── */}
      <Tabs defaultValue={tabParam || "performance"}>
        <TabsList className="w-full sm:w-auto bg-secondary flex-wrap h-auto gap-1 p-1">
          {showDailyReports && (
            <TabsTrigger value="performance" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs">
              Performance
            </TabsTrigger>
          )}
          <TabsTrigger value="promotions" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs">
            Promotions
          </TabsTrigger>
          {showFunnel && (
            <TabsTrigger value="funnel" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs">
              Funnel
            </TabsTrigger>
          )}
          {showAudienceDemographics && (
            <TabsTrigger value="audience" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs">
              Audience
            </TabsTrigger>
          )}
          {showGeography && (
            <TabsTrigger value="geography" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs">
              Geography
            </TabsTrigger>
          )}
          {showCompetitorBenchmarks && (
            <TabsTrigger value="benchmarks" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs">
              Benchmarks
            </TabsTrigger>
          )}
          {showCohortRetention && (
            <TabsTrigger value="retention" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs">
              Retention
            </TabsTrigger>
          )}
          {showWebhooks && (
            <TabsTrigger value="webhooks" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs">
              Webhooks
            </TabsTrigger>
          )}
        </TabsList>

        {/* ── Daily Performance ────────────────────────────────── */}
        {showDailyReports && (
          <TabsContent value="performance" className="mt-4 space-y-6">
            <Card className="border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Daily Performance Report</CardTitle>
                    <CardDescription>Full daily breakdown with ROAS tracking</CardDescription>
                  </div>
                  <Button size="sm" variant="outline" className="text-xs gap-1">
                    <Download className="size-3" />
                    Export PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {computedDailyPerformance.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">No booking data yet. Performance data will appear as bookings come in.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-tinerary-dark hover:bg-tinerary-dark">
                        <TableHead className="text-primary-foreground">Date</TableHead>
                        <TableHead className="text-primary-foreground text-right">Bookings</TableHead>
                        <TableHead className="text-primary-foreground text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {computedDailyPerformance.slice().reverse().map((row) => (
                        <TableRow key={row.date}>
                          <TableCell className="font-medium text-foreground">{row.date}</TableCell>
                          <TableCell className="text-right text-foreground">{row.bookings}</TableCell>
                          <TableCell className="text-right font-semibold text-tinerary-salmon">${row.revenue.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {trendRecommendations.length > 0 && (
                  <div className="mt-4 p-4 rounded-xl bg-muted">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="size-4 text-tinerary-gold" />
                      <h4 className="text-sm font-semibold text-foreground">Trend Analysis & Recommendations</h4>
                    </div>
                    <ul className="space-y-1.5 text-xs text-muted-foreground">
                      {trendRecommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Week-over-Week Comparison Chart */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base">Week-over-Week Comparison</CardTitle>
                <CardDescription>This week vs last week traffic patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={computedWeekOverWeek} margin={{ left: -10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [value.toLocaleString(), ""]} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                    <Bar dataKey="thisWeek" name="This Week" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="lastWeek" name="Last Week" fill="hsl(var(--primary))" opacity={0.3} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Hourly Traffic Pattern */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base">Hourly Traffic & Booking Patterns</CardTitle>
                <CardDescription>Identify peak hours for targeted campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={computedHourlyTraffic} margin={{ left: -10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" interval={2} />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="bookings" name="Bookings" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                {(() => {
                  const peakHour = computedHourlyTraffic.reduce((max, h) => h.bookings > max.bookings ? h : max, computedHourlyTraffic[0])
                  return peakHour && peakHour.bookings > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-[10px]">Peak bookings: {peakHour.hour} ({peakHour.bookings})</Badge>
                    </div>
                  ) : null
                })()}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* ── Top Promotions ──────────────────────────────────── */}
        <TabsContent value="promotions" className="mt-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Top Performing Promotions</CardTitle>
              <CardDescription>Ranked by revenue with CTR and ROAS metrics</CardDescription>
            </CardHeader>
            <CardContent>
              {computedTopPromotions.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">No promotions with data yet.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-tinerary-dark hover:bg-tinerary-dark">
                      <TableHead className="text-primary-foreground">#</TableHead>
                      <TableHead className="text-primary-foreground">Promotion</TableHead>
                      <TableHead className="text-primary-foreground text-right">Views</TableHead>
                      <TableHead className="text-primary-foreground text-right">Clicks</TableHead>
                      <TableHead className="text-primary-foreground text-right">CTR</TableHead>
                      <TableHead className="text-primary-foreground text-right">Bookings</TableHead>
                      <TableHead className="text-primary-foreground text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {computedTopPromotions.map((promo, i) => (
                      <TableRow key={promo.name}>
                        <TableCell>
                          <div className={`size-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            i === 0 ? "bg-yellow-400 text-yellow-900" : i === 1 ? "bg-gray-300 text-gray-700" : i === 2 ? "bg-amber-600 text-white" : "bg-muted text-muted-foreground"
                          }`}>
                            {i + 1}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-foreground">{promo.name}</TableCell>
                        <TableCell className="text-right text-foreground">{promo.views.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-foreground">{promo.clicks.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-foreground">{promo.ctr}</TableCell>
                        <TableCell className="text-right text-foreground">{promo.bookings}</TableCell>
                        <TableCell className="text-right font-semibold text-tinerary-salmon">${promo.revenue.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Conversion Funnel ───────────────────────────────── */}
        {showFunnel && (
          <TabsContent value="funnel" className="mt-4 space-y-6">
            <Card className="border-border">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-tinerary-salmon/10 flex items-center justify-center">
                    <Layers className="size-4 text-tinerary-salmon" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Conversion Funnel</CardTitle>
                    <CardDescription>Full journey from impression to completed booking</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {computedFunnel.map((step, i) => (
                    <div key={step.stage}>
                      <FunnelBar
                        stage={step.stage}
                        count={step.count}
                        percentage={step.percentage}
                        isLast={i === computedFunnel.length - 1}
                      />
                      {i < computedFunnel.length - 1 && computedFunnel[i].count > 0 && (
                        <div className="flex items-center gap-3 my-1">
                          <div className="w-32 sm:w-40" />
                          <div className="flex-1 flex items-center gap-1.5 pl-2">
                            <ArrowDownRight className="size-3 text-red-400" />
                            <span className="text-[10px] text-red-400 font-medium">
                              {((1 - computedFunnel[i + 1].count / computedFunnel[i].count) * 100).toFixed(1)}% drop-off
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-muted text-center">
                    <p className="text-[11px] text-muted-foreground">Overall Conversion (Views → Bookings)</p>
                    <p className="text-lg font-bold text-foreground mt-1">{conversionRate}%</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted text-center">
                    <p className="text-[11px] text-muted-foreground">Click-Through Rate</p>
                    <p className="text-lg font-bold text-foreground mt-1">{realCtr}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* ── Audience Demographics ───────────────────────────── */}
        {showAudienceDemographics && (
          <TabsContent value="audience" className="mt-4 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-base">Audience Segments</CardTitle>
                  <CardDescription>Who is engaging with your business</CardDescription>
                </CardHeader>
                <CardContent>
                  {computedAudienceSegments.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">No audience data yet. Data will appear as bookings come in.</div>
                  ) : (
                    <div className="space-y-4">
                      {computedAudienceSegments.map((segment) => (
                        <div key={segment.segment}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-medium text-foreground">{segment.segment}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground">{segment.revenue}</span>
                              <span className="text-sm font-semibold text-foreground">{segment.percentage}%</span>
                            </div>
                          </div>
                          <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-tinerary-salmon rounded-full transition-all"
                              style={{ width: `${segment.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-base">Revenue by Category</CardTitle>
                  <CardDescription>Booking revenue breakdown by promotion category</CardDescription>
                </CardHeader>
                <CardContent>
                  {computedRevenueByChannel.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">No booking data yet.</div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={computedRevenueByChannel}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {computedRevenueByChannel.map((entry) => (
                              <Cell key={entry.name} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value}%`, "Share"]} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-2 mt-2">
                        {computedRevenueByChannel.map((channel) => (
                          <div key={channel.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="size-2.5 rounded-full" style={{ backgroundColor: channel.color }} />
                              <span className="text-xs text-foreground">{channel.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground">${channel.revenue >= 1000 ? `${(channel.revenue / 1000).toFixed(1)}K` : channel.revenue.toLocaleString()}</span>
                              <span className="text-xs font-semibold text-foreground">{channel.value}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Customer Health Metrics */}
            {showCustomerHealth && (
              <Card className="border-border">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <ShieldCheck className="size-4 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Customer Health & Satisfaction</CardTitle>
                      <CardDescription>Key customer retention and satisfaction metrics</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-3 rounded-xl bg-muted text-center">
                      <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Health Score</p>
                      <p className="text-2xl font-bold text-foreground mt-1">{computedCustomerHealth.healthScore}/100</p>
                      <Badge variant="secondary" className={`text-[10px] mt-1 border-0 ${
                        computedCustomerHealth.healthLabel === "Healthy"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : computedCustomerHealth.healthLabel === "At Risk"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}>
                        {computedCustomerHealth.healthLabel}
                      </Badge>
                    </div>
                    <div className="p-3 rounded-xl bg-muted text-center">
                      <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Repeat Rate</p>
                      <p className="text-2xl font-bold text-foreground mt-1">{computedCustomerHealth.repeatRate}%</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted text-center">
                      <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Churn Rate</p>
                      <p className="text-2xl font-bold text-foreground mt-1">{computedCustomerHealth.churnRate}%</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted text-center">
                      <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Total Customers</p>
                      <p className="text-2xl font-bold text-foreground mt-1">{analytics.totalBookingUsers.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div className="p-3 rounded-xl border border-green-200 bg-green-50/50 dark:border-green-900/30 dark:bg-green-900/10 text-center">
                      <p className="text-xs text-green-700 dark:text-green-400 font-medium">Active (30d)</p>
                      <p className="text-lg font-bold text-foreground">{computedCustomerHealth.activeCustomers.toLocaleString()}</p>
                    </div>
                    <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-900/10 text-center">
                      <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">At Risk</p>
                      <p className="text-lg font-bold text-foreground">{computedCustomerHealth.atRiskCustomers.toLocaleString()}</p>
                    </div>
                    <div className="p-3 rounded-xl border border-red-200 bg-red-50/50 dark:border-red-900/30 dark:bg-red-900/10 text-center">
                      <p className="text-xs text-red-700 dark:text-red-400 font-medium">Churned (60d+)</p>
                      <p className="text-lg font-bold text-foreground">{computedCustomerHealth.churnedLast30d}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        {/* ── Geography ───────────────────────────────────────── */}
        {showGeography && (
          <TabsContent value="geography" className="mt-4">
            <Card className="border-border">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-tinerary-gold/10 flex items-center justify-center">
                    <Globe className="size-4 text-tinerary-gold" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Geographic Performance</CardTitle>
                    <CardDescription>Revenue and engagement by location</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {computedGeography.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">No geographic data yet. Data will appear as promotions get views.</div>
                ) : (
                  <div className="space-y-3">
                    {computedGeography.map((geo, i) => (
                      <div key={geo.city} className="flex items-center gap-3">
                        <div className={`size-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          i === 0 ? "bg-yellow-400 text-yellow-900" : i === 1 ? "bg-gray-300 text-gray-700" : i === 2 ? "bg-amber-600 text-white" : "bg-muted text-muted-foreground"
                        }`}>
                          {i + 1}
                        </div>
                        <MapPin className="size-3.5 text-primary shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-foreground">{geo.city}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground">{geo.views.toLocaleString()} views</span>
                              <span className="text-xs font-semibold text-tinerary-salmon">{geo.revenue}</span>
                            </div>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-tinerary-salmon rounded-full transition-all"
                              style={{ width: `${geo.percentage}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-xs font-medium text-foreground w-8 text-right">{geo.percentage}%</span>
                      </div>
                    ))}
                  </div>
                )}
                {isEnterprise && computedGeography.length >= 2 && (
                  <div className="mt-4 p-3 rounded-xl bg-muted">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Sparkles className="size-3.5 text-purple-500" />
                      <p className="text-xs font-semibold text-foreground">Geographic Insight</p>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {computedGeography[0].city} leads with {computedGeography[0].percentage}% of views and {computedGeography[0].revenue} in revenue.
                      {computedGeography.length >= 3 && ` Your top 3 markets (${computedGeography.slice(0, 3).map(g => g.city).join(", ")}) account for ${computedGeography.slice(0, 3).reduce((s, g) => s + g.percentage, 0)}% of total views.`}
                      {" "}Consider increasing promotion density in your strongest markets.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* ── Competitor Benchmarks (Enterprise) ──────────────── */}
        {showCompetitorBenchmarks && (
          <TabsContent value="benchmarks" className="mt-4">
            <Card className="border-border">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Award className="size-4 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Competitor Benchmarking & Recommendations</CardTitle>
                    <CardDescription>How your business compares to category averages with actionable recommendations</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-tinerary-dark hover:bg-tinerary-dark">
                      <TableHead className="text-primary-foreground">Metric</TableHead>
                      <TableHead className="text-primary-foreground text-right">Your Business</TableHead>
                      <TableHead className="text-primary-foreground text-right">Category Avg.</TableHead>
                      <TableHead className="text-primary-foreground text-right">Delta</TableHead>
                      <TableHead className="text-primary-foreground text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {computedBenchmarks.map((row) => (
                      <TableRow key={row.metric}>
                        <TableCell className="font-medium text-foreground">{row.metric}</TableCell>
                        <TableCell className="text-right font-semibold text-foreground">{row.yours}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{row.benchmark}</TableCell>
                        <TableCell className="text-right">
                          <span className={`text-xs font-medium ${row.status === "above" ? "text-green-600" : "text-red-500"}`}>
                            {row.delta}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="secondary"
                            className={row.status === "above"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0 text-[10px]"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0 text-[10px]"
                            }
                          >
                            {row.status === "above" ? "Above Avg" : "Below Avg"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {(() => {
                  const aboveCount = computedBenchmarks.filter(b => b.status === "above").length
                  const totalCount = computedBenchmarks.length
                  const topMetric = computedBenchmarks.reduce((best, b) => {
                    const val = parseInt(b.delta)
                    return val > parseInt(best.delta) ? b : best
                  }, computedBenchmarks[0])
                  return (
                    <div className={`mt-4 p-3 rounded-xl border ${
                      aboveCount > totalCount / 2
                        ? "bg-green-50/50 border-green-200 dark:border-green-900/30 dark:bg-green-900/10"
                        : "bg-amber-50/50 border-amber-200 dark:border-amber-900/30 dark:bg-amber-900/10"
                    }`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Award className={`size-3.5 ${aboveCount > totalCount / 2 ? "text-green-600" : "text-amber-600"}`} />
                        <p className={`text-xs font-semibold ${aboveCount > totalCount / 2 ? "text-green-700 dark:text-green-400" : "text-amber-700 dark:text-amber-400"}`}>Performance Summary</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        You {aboveCount > totalCount / 2 ? "outperform" : "match or trail"} category averages in {aboveCount} of {totalCount} key metrics.
                        {topMetric && parseInt(topMetric.delta) > 0 && ` Your strongest differentiator is ${topMetric.metric} (${topMetric.delta}).`}
                      </p>
                    </div>
                  )
                })()}

                <div className="mt-3 p-3 rounded-xl bg-muted">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="size-3.5 text-purple-500" />
                    <p className="text-xs font-semibold text-foreground">Recommendations</p>
                  </div>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    {computedBenchmarks.filter(b => b.status === "below").slice(0, 2).map((b, i) => (
                      <li key={b.metric} className="flex gap-2">
                        <span className="text-primary font-bold shrink-0">{i + 1}.</span>
                        <span><strong className="text-foreground">Improve {b.metric}.</strong> You&apos;re {b.delta.replace("-", "")} below the category average of {b.benchmark}. Focus on improving this metric to close the gap.</span>
                      </li>
                    ))}
                    {computedBenchmarks.filter(b => b.status === "above").slice(0, 1).map((b, i) => (
                      <li key={b.metric} className="flex gap-2">
                        <span className="text-primary font-bold shrink-0">{computedBenchmarks.filter(r => r.status === "below").slice(0, 2).length + 1}.</span>
                        <span><strong className="text-foreground">Capitalize on strong {b.metric}.</strong> Your {b.yours} is {b.delta} above the category average — leverage this strength to drive more revenue.</span>
                      </li>
                    ))}
                    {repeatRate < 25 && (
                      <li className="flex gap-2">
                        <span className="text-primary font-bold shrink-0">{Math.min(computedBenchmarks.filter(r => r.status === "below").length, 2) + 2}.</span>
                        <span><strong className="text-foreground">Launch a loyalty program.</strong> Your repeat rate of {repeatRate}% suggests room for improvement. A points-based loyalty system could lift return rate by 15-25%.</span>
                      </li>
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* ── Cohort Retention (Enterprise) ───────────────────── */}
        {showCohortRetention && (
          <TabsContent value="retention" className="mt-4">
            <Card className="border-border">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <CalendarDays className="size-4 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Cohort Retention Analysis</CardTitle>
                    <CardDescription>Weekly cohort retention rates — track how well you keep customers engaged over time</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {computedCohortRetention.every(c => c.users === 0) ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">No booking cohort data yet. Data will appear as customers make bookings over multiple weeks.</div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-tinerary-dark hover:bg-tinerary-dark">
                            <TableHead className="text-primary-foreground">Cohort</TableHead>
                            <TableHead className="text-primary-foreground text-center">Users</TableHead>
                            <TableHead className="text-primary-foreground text-center">Week 1</TableHead>
                            <TableHead className="text-primary-foreground text-center">Week 2</TableHead>
                            <TableHead className="text-primary-foreground text-center">Week 3</TableHead>
                            <TableHead className="text-primary-foreground text-center">Week 4</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {computedCohortRetention.map((row) => (
                            <TableRow key={row.cohort}>
                              <TableCell className="font-medium text-foreground text-xs">{row.cohort}</TableCell>
                              <TableCell className="text-center text-foreground text-xs">{row.users.toLocaleString()}</TableCell>
                              <RetentionCell value={row.w1} />
                              <RetentionCell value={row.w2} />
                              <RetentionCell value={row.w3} />
                              <RetentionCell value={row.w4} />
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {(() => {
                      const cohortsWithData = computedCohortRetention.filter(c => c.users > 0)
                      const avgW2 = cohortsWithData.length > 0
                        ? Math.round(cohortsWithData.reduce((s, c) => s + c.w2, 0) / cohortsWithData.length * 10) / 10
                        : 0
                      const avgW4 = cohortsWithData.length > 0
                        ? Math.round(cohortsWithData.reduce((s, c) => s + c.w4, 0) / cohortsWithData.length * 10) / 10
                        : 0
                      const recentCohorts = cohortsWithData.slice(-2)
                      const olderCohorts = cohortsWithData.slice(0, -2)
                      const recentAvgW2 = recentCohorts.length > 0 ? recentCohorts.reduce((s, c) => s + c.w2, 0) / recentCohorts.length : 0
                      const olderAvgW2 = olderCohorts.length > 0 ? olderCohorts.reduce((s, c) => s + c.w2, 0) / olderCohorts.length : 0
                      const trendDiff = Math.round((recentAvgW2 - olderAvgW2) * 10) / 10
                      const trendLabel = trendDiff > 2 ? "Improving" : trendDiff < -2 ? "Declining" : "Stable"
                      return (
                        <>
                          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="p-3 rounded-xl bg-muted text-center">
                              <p className="text-[11px] text-muted-foreground">Avg. Week 2 Retention</p>
                              <p className="text-lg font-bold text-foreground">{avgW2}%</p>
                            </div>
                            <div className="p-3 rounded-xl bg-muted text-center">
                              <p className="text-[11px] text-muted-foreground">Avg. Week 4 Retention</p>
                              <p className="text-lg font-bold text-foreground">{avgW4}%</p>
                            </div>
                            <div className="p-3 rounded-xl bg-muted text-center">
                              <p className="text-[11px] text-muted-foreground">Retention Trend</p>
                              <p className="text-lg font-bold text-foreground">{trendLabel}</p>
                              {trendDiff !== 0 && (
                                <span className={`text-[11px] font-medium ${trendDiff > 0 ? "text-green-600" : "text-red-500"}`}>
                                  {trendDiff > 0 ? "+" : ""}{trendDiff}% avg change
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="mt-4 p-3 rounded-xl bg-muted">
                            <div className="flex items-center gap-2 mb-1.5">
                              <Brain className="size-3.5 text-purple-500" />
                              <p className="text-xs font-semibold text-foreground">Retention Insight</p>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {avgW2 > 50
                                ? `Your average Week 2 retention of ${avgW2}% is strong. `
                                : avgW2 > 0
                                ? `Your average Week 2 retention of ${avgW2}% has room for improvement. `
                                : "Not enough data for retention insights yet. "}
                              {avgW4 > 0 && avgW4 < avgW2 * 0.6
                                ? "The biggest retention drop-off happens between Week 2 and Week 4 — consider adding a re-engagement touchpoint at Day 14-21."
                                : avgW4 > 0
                                ? "Retention between Week 2 and Week 4 is holding relatively well."
                                : ""}
                            </p>
                          </div>
                        </>
                      )
                    })()}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* ── Webhooks (Enterprise) ──────────────────────────── */}
        {showWebhooks && (
          <TabsContent value="webhooks" className="mt-4">
            <WebhookManagement />
          </TabsContent>
        )}
      </Tabs>

      {/* ── Premium → Enterprise Upgrade Banner ──────────────────── */}
      {isPremium && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-tinerary-salmon/5">
          <CardContent className="py-5">
            <div className="flex items-start gap-4">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Zap className="size-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-foreground">Upgrade to Enterprise for the full real-time analytics dashboard</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Get real-time live metrics, full API access, data-driven insights with revenue impact estimates,
                  revenue intelligence (MRR, ARR, LTV, CAC), competitor benchmarking &amp; recommendations, cohort retention analysis,
                  customer health scoring (NPS &amp; CSAT), daily performance reports with ROAS, hourly traffic patterns,
                  and webhook integrations (up to 10).
                </p>
              </div>
              <Button size="sm" className="btn-sunset shrink-0 text-xs" asChild>
                <a href="/business">Upgrade</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
