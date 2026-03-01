"use client"

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

interface EnterpriseAnalyticsDashboardProps {
  tier: BusinessTierSlug
}

// ─── Demo Data ─────────────────────────────────────────────────────

const realtimeMetrics = {
  activeViewers: 247,
  viewsToday: 18_472,
  viewsChange: 12.5,
  clicksToday: 3_421,
  clicksChange: 8.3,
  savesToday: 891,
  savesChange: -2.1,
  bookingsToday: 156,
  bookingsChange: 23.4,
  revenueToday: 24_380,
  revenueChange: 18.7,
  ctrToday: 18.5,
  ctrChange: 1.2,
  conversionRate: 4.4,
  conversionChange: 0.8,
  avgTimeOnPage: "3m 12s",
  avgOrderValue: 156.28,
  aovChange: 5.2,
}

const revenueIntelligence = {
  mrr: 148_500,
  mrrChange: 14.2,
  arr: 1_782_000,
  arrChange: 14.2,
  ltv: 1_284,
  ltvChange: 8.6,
  cac: 42.30,
  cacChange: -12.1,
  ltvCacRatio: 30.4,
  roi: 342,
  roiChange: 18.3,
  grossMargin: 72.4,
  grossMarginChange: 2.1,
  revenuePerUser: 18.42,
  revenuePerUserChange: 6.8,
  paybackPeriodDays: 34,
}

const revenueTrend30d = [
  { date: "Feb 1", revenue: 4820, bookings: 32, forecast: null },
  { date: "Feb 3", revenue: 5140, bookings: 35, forecast: null },
  { date: "Feb 5", revenue: 4960, bookings: 31, forecast: null },
  { date: "Feb 7", revenue: 5680, bookings: 38, forecast: null },
  { date: "Feb 9", revenue: 5320, bookings: 36, forecast: null },
  { date: "Feb 11", revenue: 6100, bookings: 41, forecast: null },
  { date: "Feb 13", revenue: 5890, bookings: 39, forecast: null },
  { date: "Feb 15", revenue: 6450, bookings: 43, forecast: null },
  { date: "Feb 17", revenue: 6280, bookings: 42, forecast: null },
  { date: "Feb 19", revenue: 7120, bookings: 48, forecast: null },
  { date: "Feb 21", revenue: 6890, bookings: 46, forecast: null },
  { date: "Feb 23", revenue: 7340, bookings: 49, forecast: null },
  { date: "Feb 25", revenue: 7680, bookings: 51, forecast: null },
  { date: "Feb 27", revenue: 8120, bookings: 54, forecast: null },
  { date: "Mar 1", revenue: 8420, bookings: 56, forecast: 8420 },
  { date: "Mar 3", revenue: null, bookings: null, forecast: 8780 },
  { date: "Mar 5", revenue: null, bookings: null, forecast: 9150 },
  { date: "Mar 7", revenue: null, bookings: null, forecast: 9480 },
]

const dailyPerformance = [
  { date: "Feb 28", views: 18472, clicks: 3421, saves: 891, bookings: 156, revenue: "$24,380", roas: "4.2x" },
  { date: "Feb 27", views: 16230, clicks: 2981, saves: 912, bookings: 128, revenue: "$19,200", roas: "3.8x" },
  { date: "Feb 26", views: 17560, clicks: 3210, saves: 780, bookings: 142, revenue: "$21,800", roas: "4.0x" },
  { date: "Feb 25", views: 14890, clicks: 2670, saves: 720, bookings: 114, revenue: "$16,900", roas: "3.5x" },
  { date: "Feb 24", views: 15340, clicks: 2820, saves: 850, bookings: 131, revenue: "$20,100", roas: "3.9x" },
  { date: "Feb 23", views: 16780, clicks: 3150, saves: 940, bookings: 168, revenue: "$24,800", roas: "4.5x" },
  { date: "Feb 22", views: 14020, clicks: 2550, saves: 680, bookings: 102, revenue: "$15,400", roas: "3.2x" },
]

const conversionFunnel = [
  { stage: "Impressions", count: 184720, percentage: 100 },
  { stage: "Page Views", count: 68_248, percentage: 36.9 },
  { stage: "Engaged (>30s)", count: 34_124, percentage: 18.5 },
  { stage: "Click-Through", count: 12_652, percentage: 6.8 },
  { stage: "Add to Plan", count: 4_218, percentage: 2.3 },
  { stage: "Booking Started", count: 1_687, percentage: 0.91 },
  { stage: "Booking Completed", count: 1_124, percentage: 0.61 },
]

const competitorBenchmarks = [
  { metric: "Avg. Views/Day", yours: "18,472", benchmark: "8,900", delta: "+107%", status: "above" as const },
  { metric: "Click-Through Rate", yours: "18.5%", benchmark: "12.3%", delta: "+50%", status: "above" as const },
  { metric: "Booking Conversion", yours: "4.4%", benchmark: "3.1%", delta: "+42%", status: "above" as const },
  { metric: "Avg. Revenue/Booking", yours: "$156", benchmark: "$142", delta: "+10%", status: "above" as const },
  { metric: "Customer Return Rate", yours: "28%", benchmark: "35%", delta: "-20%", status: "below" as const },
  { metric: "Avg. Session Duration", yours: "3m 12s", benchmark: "2m 05s", delta: "+54%", status: "above" as const },
  { metric: "Revenue per Visitor", yours: "$1.32", benchmark: "$0.87", delta: "+52%", status: "above" as const },
  { metric: "Net Promoter Score", yours: "72", benchmark: "58", delta: "+24%", status: "above" as const },
]

const audienceDemographics = [
  { segment: "Solo Travelers", percentage: 34, trend: "up" as const, revenue: "$8,240" },
  { segment: "Couples", percentage: 28, trend: "up" as const, revenue: "$6,826" },
  { segment: "Families", percentage: 22, trend: "stable" as const, revenue: "$5,364" },
  { segment: "Group Tours", percentage: 16, trend: "down" as const, revenue: "$3,901" },
]

const topPromotions = [
  { name: "Weekend Wine Tour", views: 5230, clicks: 980, bookings: 82, revenue: "$12,792", ctr: "18.7%", roas: "5.1x" },
  { name: "Sunset Dinner Cruise", views: 4120, clicks: 760, bookings: 54, revenue: "$8,370", ctr: "18.4%", roas: "4.2x" },
  { name: "Morning Yoga Retreat", views: 3890, clicks: 710, bookings: 48, revenue: "$5,760", ctr: "18.3%", roas: "3.8x" },
  { name: "City Walking Tour", views: 3450, clicks: 630, bookings: 36, revenue: "$1,620", ctr: "18.3%", roas: "2.7x" },
  { name: "Vineyard Tasting Pass", views: 2980, clicks: 548, bookings: 31, revenue: "$4,650", ctr: "18.4%", roas: "3.9x" },
]

const revenueByChannel = [
  { name: "Organic Search", value: 38, revenue: 56_280, color: "#1a1a2e" },
  { name: "Direct", value: 24, revenue: 35_520, color: "#ff9a8b" },
  { name: "Social Media", value: 18, revenue: 26_640, color: "#f59e0b" },
  { name: "Email", value: 12, revenue: 17_760, color: "#7C3AED" },
  { name: "Referral", value: 8, revenue: 11_840, color: "#22c55e" },
]

const hourlyTraffic = [
  { hour: "12am", views: 120, bookings: 2 },
  { hour: "2am", views: 80, bookings: 1 },
  { hour: "4am", views: 65, bookings: 0 },
  { hour: "6am", views: 180, bookings: 3 },
  { hour: "8am", views: 890, bookings: 12 },
  { hour: "9am", views: 1420, bookings: 18 },
  { hour: "10am", views: 1850, bookings: 24 },
  { hour: "11am", views: 2100, bookings: 28 },
  { hour: "12pm", views: 1980, bookings: 22 },
  { hour: "1pm", views: 1640, bookings: 19 },
  { hour: "2pm", views: 1520, bookings: 17 },
  { hour: "3pm", views: 1380, bookings: 15 },
  { hour: "4pm", views: 1260, bookings: 14 },
  { hour: "5pm", views: 1480, bookings: 16 },
  { hour: "6pm", views: 1720, bookings: 20 },
  { hour: "7pm", views: 1940, bookings: 25 },
  { hour: "8pm", views: 2240, bookings: 30 },
  { hour: "9pm", views: 1860, bookings: 22 },
  { hour: "10pm", views: 980, bookings: 10 },
  { hour: "11pm", views: 420, bookings: 4 },
]

const cohortRetention = [
  { cohort: "Week of Feb 24", users: 1840, w1: 100, w2: 68, w3: 52, w4: 41 },
  { cohort: "Week of Feb 17", users: 1620, w1: 100, w2: 64, w3: 48, w4: 38 },
  { cohort: "Week of Feb 10", users: 1490, w1: 100, w2: 61, w3: 45, w4: 35 },
  { cohort: "Week of Feb 3", users: 1380, w1: 100, w2: 58, w3: 42, w4: 32 },
  { cohort: "Week of Jan 27", users: 1260, w1: 100, w2: 55, w3: 39, w4: 29 },
]

const topGeographies = [
  { city: "San Francisco", views: 4_680, revenue: "$7,340", percentage: 25, flag: "US" },
  { city: "Los Angeles", views: 3_320, revenue: "$5,180", percentage: 18, flag: "US" },
  { city: "New York", views: 2_770, revenue: "$4,320", percentage: 15, flag: "US" },
  { city: "London", views: 2_030, revenue: "$3,280", percentage: 11, flag: "GB" },
  { city: "Seattle", views: 1_660, revenue: "$2,640", percentage: 9, flag: "US" },
  { city: "Tokyo", views: 1_290, revenue: "$2,120", percentage: 7, flag: "JP" },
  { city: "Sydney", views: 1_110, revenue: "$1,780", percentage: 6, flag: "AU" },
  { city: "Toronto", views: 920, revenue: "$1,420", percentage: 5, flag: "CA" },
]

const weekOverWeek = [
  { day: "Mon", thisWeek: 14020, lastWeek: 12180 },
  { day: "Tue", thisWeek: 15340, lastWeek: 13420 },
  { day: "Wed", thisWeek: 16780, lastWeek: 14890 },
  { day: "Thu", thisWeek: 14890, lastWeek: 13680 },
  { day: "Fri", thisWeek: 17560, lastWeek: 15240 },
  { day: "Sat", thisWeek: 18472, lastWeek: 16120 },
  { day: "Sun", thisWeek: 16230, lastWeek: 14560 },
]

const customerHealthMetrics = {
  nps: 72,
  npsChange: 4,
  csat: 4.6,
  csatChange: 0.2,
  healthScore: 87,
  healthLabel: "Excellent" as const,
  activeCustomers: 12_480,
  atRiskCustomers: 1_840,
  churnedLast30d: 320,
  churnRate: 2.5,
  churnChange: -0.8,
  repeatBookingRate: 34.2,
  repeatChange: 3.1,
}

const aiInsights = [
  {
    type: "opportunity" as const,
    title: "Weekend bookings surge detected",
    description: "Saturday bookings are 42% higher than weekday average. Consider launching weekend-exclusive promotions to capitalize on this trend.",
    impact: "Est. +$4,200/week",
  },
  {
    type: "warning" as const,
    title: "Solo traveler segment declining",
    description: "Solo traveler engagement dropped 8% this week. Their average session duration decreased from 3m 45s to 2m 58s. Consider refreshing solo-focused content.",
    impact: "At risk: $2,100/week",
  },
  {
    type: "insight" as const,
    title: "High-value cohort identified",
    description: "Users acquired through email campaigns have 2.4x higher LTV ($3,082) than average. Email-sourced users also have 52% higher repeat booking rates.",
    impact: "LTV opportunity",
  },
  {
    type: "opportunity" as const,
    title: "Price optimization signal",
    description: "Your conversion rate remains stable at prices 10% above benchmark. A/B testing suggests room for a 5-8% price increase without conversion loss.",
    impact: "Est. +$12,400/mo",
  },
  {
    type: "insight" as const,
    title: "Peak booking window identified",
    description: "72% of completed bookings occur between 10am-12pm and 7pm-9pm. Scheduling push notifications for 9:45am and 6:45pm could increase conversion by 15-20%.",
    impact: "Conversion boost",
  },
]

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

export function EnterpriseAnalyticsDashboard({ tier }: EnterpriseAnalyticsDashboardProps) {
  const isEnterprise = tier === "enterprise"
  const isPremium = tier === "premium"

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
  // intelligence (MRR/ARR/LTV/CAC), AI forecast overlay, AI insights,
  // competitor benchmarks, cohort retention, customer health/NPS,
  // daily performance reports, hourly traffic, week-over-week comparison
  const showRealtimeMetrics = isEnterprise
  const showApiAccess = isEnterprise
  const showRevenueIntelligence = isEnterprise
  const showAiForecast = isEnterprise
  const showAiInsights = isEnterprise
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
              <p className="text-2xl font-bold text-foreground">1,234</p>
              <p className="text-xs text-muted-foreground">Total Views</p>
            </div>
            <div className="p-4 rounded-xl bg-muted text-center">
              <MousePointerClick className="size-5 mx-auto text-muted-foreground mb-2" />
              <p className="text-2xl font-bold text-foreground">187</p>
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
              {realtimeMetrics.activeViewers} active viewers
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              <Activity className="size-2.5 mr-1" />
              {realtimeMetrics.bookingsToday} bookings today
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
            <p className="mt-2 text-2xl font-bold text-foreground">{realtimeMetrics.viewsToday.toLocaleString()}</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">Views Today</p>
              <MetricChange value={realtimeMetrics.viewsChange} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-5">
            <MousePointerClick className="size-4 text-muted-foreground" />
            <p className="mt-2 text-2xl font-bold text-foreground">{realtimeMetrics.clicksToday.toLocaleString()}</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">Clicks Today</p>
              <MetricChange value={realtimeMetrics.clicksChange} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-5">
            <Activity className="size-4 text-muted-foreground" />
            <p className="mt-2 text-2xl font-bold text-foreground">{realtimeMetrics.bookingsToday}</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">Bookings Today</p>
              <MetricChange value={realtimeMetrics.bookingsChange} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-5">
            <DollarSign className="size-4 text-muted-foreground" />
            <p className="mt-2 text-2xl font-bold text-foreground">${realtimeMetrics.revenueToday.toLocaleString()}</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">Revenue Today</p>
              <MetricChange value={realtimeMetrics.revenueChange} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Secondary Metrics ────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="border-border">
          <CardContent className="pt-4 pb-4">
            <Target className="size-3.5 text-muted-foreground" />
            <p className="mt-1.5 text-lg font-bold text-foreground">{realtimeMetrics.ctrToday}%</p>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-[11px] text-muted-foreground">CTR</p>
              <MetricChange value={realtimeMetrics.ctrChange} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-4 pb-4">
            <ArrowUpRight className="size-3.5 text-muted-foreground" />
            <p className="mt-1.5 text-lg font-bold text-foreground">{realtimeMetrics.conversionRate}%</p>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-[11px] text-muted-foreground">Conversion</p>
              <MetricChange value={realtimeMetrics.conversionChange} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-4 pb-4">
            <DollarSign className="size-3.5 text-muted-foreground" />
            <p className="mt-1.5 text-lg font-bold text-foreground">${realtimeMetrics.avgOrderValue.toFixed(0)}</p>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-[11px] text-muted-foreground">Avg Order</p>
              <MetricChange value={realtimeMetrics.aovChange} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-4 pb-4">
            <Clock className="size-3.5 text-muted-foreground" />
            <p className="mt-1.5 text-lg font-bold text-foreground">{realtimeMetrics.avgTimeOnPage}</p>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-[11px] text-muted-foreground">Avg Time</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-4 pb-4">
            <Bookmark className="size-3.5 text-muted-foreground" />
            <p className="mt-1.5 text-lg font-bold text-foreground">{realtimeMetrics.savesToday}</p>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-[11px] text-muted-foreground">Saves</p>
              <MetricChange value={realtimeMetrics.savesChange} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-4 pb-4">
            <Repeat className="size-3.5 text-muted-foreground" />
            <p className="mt-1.5 text-lg font-bold text-foreground">{customerHealthMetrics.repeatBookingRate}%</p>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-[11px] text-muted-foreground">Repeat Rate</p>
              <MetricChange value={customerHealthMetrics.repeatChange} />
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
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">MRR</p>
                <p className="text-xl font-bold text-foreground mt-1">${(revenueIntelligence.mrr / 1000).toFixed(1)}K</p>
                <MetricChange value={revenueIntelligence.mrrChange} />
              </div>
              <div className="p-3 rounded-xl bg-muted">
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">ARR</p>
                <p className="text-xl font-bold text-foreground mt-1">${(revenueIntelligence.arr / 1000000).toFixed(2)}M</p>
                <MetricChange value={revenueIntelligence.arrChange} />
              </div>
              <div className="p-3 rounded-xl bg-muted">
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Customer LTV</p>
                <p className="text-xl font-bold text-foreground mt-1">${revenueIntelligence.ltv.toLocaleString()}</p>
                <MetricChange value={revenueIntelligence.ltvChange} />
              </div>
              <div className="p-3 rounded-xl bg-muted">
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">CAC</p>
                <p className="text-xl font-bold text-foreground mt-1">${revenueIntelligence.cac.toFixed(2)}</p>
                <MetricChange value={revenueIntelligence.cacChange} />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              <div className="p-3 rounded-xl bg-muted">
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">LTV:CAC Ratio</p>
                <p className="text-xl font-bold text-foreground mt-1">{revenueIntelligence.ltvCacRatio}x</p>
                <span className="text-[11px] text-green-600 font-medium">Excellent</span>
              </div>
              <div className="p-3 rounded-xl bg-muted">
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">ROI</p>
                <p className="text-xl font-bold text-foreground mt-1">{revenueIntelligence.roi}%</p>
                <MetricChange value={revenueIntelligence.roiChange} />
              </div>
              <div className="p-3 rounded-xl bg-muted">
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Gross Margin</p>
                <p className="text-xl font-bold text-foreground mt-1">{revenueIntelligence.grossMargin}%</p>
                <MetricChange value={revenueIntelligence.grossMarginChange} />
              </div>
              <div className="p-3 rounded-xl bg-muted">
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Payback Period</p>
                <p className="text-xl font-bold text-foreground mt-1">{revenueIntelligence.paybackPeriodDays}d</p>
                <span className="text-[11px] text-green-600 font-medium">Below 60d target</span>
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
                  {showAiForecast ? "Revenue Trend & Forecast" : "Revenue Trend"}
                </CardTitle>
                <CardDescription>
                  {showAiForecast ? "30-day revenue with 7-day AI-powered forecast" : "30-day revenue performance"}
                </CardDescription>
              </div>
              {showAiForecast && (
                <Badge variant="secondary" className="text-[10px] gap-1">
                  <Brain className="size-2.5" />
                  AI Forecast
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={revenueTrend30d} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
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
                {showAiForecast && (
                  <Area type="monotone" dataKey="forecast" stroke="#7C3AED" strokeWidth={2} strokeDasharray="6 3" fill="url(#forecastGradient)" name="Forecast" connectNulls />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ── AI-Powered Insights (Enterprise) ─────────────────────── */}
      {showAiInsights && (
        <Card className="border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Sparkles className="size-4 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-base">AI-Powered Insights</CardTitle>
                <CardDescription>Actionable recommendations based on your data patterns</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aiInsights.map((insight, i) => (
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
      <Tabs defaultValue="performance">
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
                <Table>
                  <TableHeader>
                    <TableRow className="bg-tinerary-dark hover:bg-tinerary-dark">
                      <TableHead className="text-primary-foreground">Date</TableHead>
                      <TableHead className="text-primary-foreground text-right">Views</TableHead>
                      <TableHead className="text-primary-foreground text-right">Clicks</TableHead>
                      <TableHead className="text-primary-foreground text-right">Saves</TableHead>
                      <TableHead className="text-primary-foreground text-right">Bookings</TableHead>
                      <TableHead className="text-primary-foreground text-right">Revenue</TableHead>
                      <TableHead className="text-primary-foreground text-right">ROAS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyPerformance.map((row) => (
                      <TableRow key={row.date}>
                        <TableCell className="font-medium text-foreground">{row.date}</TableCell>
                        <TableCell className="text-right text-foreground">{row.views.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-foreground">{row.clicks.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-foreground">{row.saves}</TableCell>
                        <TableCell className="text-right text-foreground">{row.bookings}</TableCell>
                        <TableCell className="text-right font-semibold text-tinerary-salmon">{row.revenue}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
                            {row.roas}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="mt-4 p-4 rounded-xl bg-muted">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="size-4 text-tinerary-gold" />
                    <h4 className="text-sm font-semibold text-foreground">Trend Analysis & Recommendations</h4>
                  </div>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li>Revenue is trending up 18.7% week-over-week, driven by increased weekend bookings.</li>
                    <li>ROAS averaged 3.9x this week — Saturday peaked at 4.5x, suggesting weekend campaigns are most efficient.</li>
                    <li>Booking conversion improved after A/B testing updated promotion images (+0.8% lift).</li>
                    <li>Consider increasing mid-week ad spend — Tuesday and Wednesday show untapped capacity with lower competition.</li>
                  </ul>
                </div>
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
                  <BarChart data={weekOverWeek} margin={{ left: -10, right: 10 }}>
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
                  <ComposedChart data={hourlyTraffic} margin={{ left: -10, right: 10 }}>
                    <defs>
                      <linearGradient id="hourlyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff9a8b" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ff9a8b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" interval={1} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(1)}K`} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area yAxisId="left" type="monotone" dataKey="views" stroke="#ff9a8b" strokeWidth={2} fill="url(#hourlyGradient)" name="Views" />
                    <Line yAxisId="right" type="monotone" dataKey="bookings" stroke="#7C3AED" strokeWidth={2} dot={{ r: 3, fill: "#7C3AED" }} name="Bookings" />
                  </ComposedChart>
                </ResponsiveContainer>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-[10px]">Peak views: 8pm (2,240)</Badge>
                  <Badge variant="outline" className="text-[10px]">Peak bookings: 8pm (30)</Badge>
                  <Badge variant="outline" className="text-[10px]">Quiet hours: 2am-6am</Badge>
                </div>
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
                    <TableHead className="text-primary-foreground text-right">ROAS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topPromotions.map((promo, i) => (
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
                      <TableCell className="text-right font-semibold text-tinerary-salmon">{promo.revenue}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
                          {promo.roas}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                  {conversionFunnel.map((step, i) => (
                    <div key={step.stage}>
                      <FunnelBar
                        stage={step.stage}
                        count={step.count}
                        percentage={step.percentage}
                        isLast={i === conversionFunnel.length - 1}
                      />
                      {i < conversionFunnel.length - 1 && (
                        <div className="flex items-center gap-3 my-1">
                          <div className="w-32 sm:w-40" />
                          <div className="flex-1 flex items-center gap-1.5 pl-2">
                            <ArrowDownRight className="size-3 text-red-400" />
                            <span className="text-[10px] text-red-400 font-medium">
                              {((1 - conversionFunnel[i + 1].count / step.count) * 100).toFixed(1)}% drop-off
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-muted text-center">
                    <p className="text-[11px] text-muted-foreground">Overall Conversion</p>
                    <p className="text-lg font-bold text-foreground mt-1">0.61%</p>
                    <MetricChange value={12.4} />
                  </div>
                  <div className="p-3 rounded-xl bg-muted text-center">
                    <p className="text-[11px] text-muted-foreground">Biggest Drop-off</p>
                    <p className="text-lg font-bold text-foreground mt-1">Impressions → Views</p>
                    <span className="text-[11px] text-red-500 font-medium">63.1% lost</span>
                  </div>
                  <div className="p-3 rounded-xl bg-muted text-center">
                    <p className="text-[11px] text-muted-foreground">Best Stage</p>
                    <p className="text-lg font-bold text-foreground mt-1">Started → Completed</p>
                    <span className="text-[11px] text-green-600 font-medium">66.6% completion</span>
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
                  <div className="space-y-4">
                    {audienceDemographics.map((segment) => (
                      <div key={segment.segment}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-foreground">{segment.segment}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground">{segment.revenue}</span>
                            <span className="text-sm font-semibold text-foreground">{segment.percentage}%</span>
                            {segment.trend === "up" && <TrendingUp className="size-3 text-green-500" />}
                            {segment.trend === "down" && <TrendingDown className="size-3 text-red-500" />}
                            {segment.trend === "stable" && <span className="text-xs text-muted-foreground">—</span>}
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
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-base">Revenue by Channel</CardTitle>
                  <CardDescription>Where your revenue originates</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={revenueByChannel}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {revenueByChannel.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value}%`, "Share"]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-2">
                    {revenueByChannel.map((channel) => (
                      <div key={channel.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="size-2.5 rounded-full" style={{ backgroundColor: channel.color }} />
                          <span className="text-xs text-foreground">{channel.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">${(channel.revenue / 1000).toFixed(1)}K</span>
                          <span className="text-xs font-semibold text-foreground">{channel.value}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
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
                      <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">NPS Score</p>
                      <p className="text-2xl font-bold text-foreground mt-1">{customerHealthMetrics.nps}</p>
                      <MetricChange value={customerHealthMetrics.npsChange} />
                      <Badge variant="secondary" className="text-[10px] mt-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
                        Excellent
                      </Badge>
                    </div>
                    <div className="p-3 rounded-xl bg-muted text-center">
                      <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">CSAT</p>
                      <p className="text-2xl font-bold text-foreground mt-1">{customerHealthMetrics.csat}/5.0</p>
                      <MetricChange value={customerHealthMetrics.csatChange > 0 ? (customerHealthMetrics.csatChange / 4.4 * 100) : 0} />
                    </div>
                    <div className="p-3 rounded-xl bg-muted text-center">
                      <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Health Score</p>
                      <p className="text-2xl font-bold text-foreground mt-1">{customerHealthMetrics.healthScore}/100</p>
                      <Badge variant="secondary" className="text-[10px] mt-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
                        {customerHealthMetrics.healthLabel}
                      </Badge>
                    </div>
                    <div className="p-3 rounded-xl bg-muted text-center">
                      <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Churn Rate</p>
                      <p className="text-2xl font-bold text-foreground mt-1">{customerHealthMetrics.churnRate}%</p>
                      <MetricChange value={customerHealthMetrics.churnChange} />
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div className="p-3 rounded-xl border border-green-200 bg-green-50/50 dark:border-green-900/30 dark:bg-green-900/10 text-center">
                      <p className="text-xs text-green-700 dark:text-green-400 font-medium">Active Customers</p>
                      <p className="text-lg font-bold text-foreground">{customerHealthMetrics.activeCustomers.toLocaleString()}</p>
                    </div>
                    <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-900/10 text-center">
                      <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">At Risk</p>
                      <p className="text-lg font-bold text-foreground">{customerHealthMetrics.atRiskCustomers.toLocaleString()}</p>
                    </div>
                    <div className="p-3 rounded-xl border border-red-200 bg-red-50/50 dark:border-red-900/30 dark:bg-red-900/10 text-center">
                      <p className="text-xs text-red-700 dark:text-red-400 font-medium">Churned (30d)</p>
                      <p className="text-lg font-bold text-foreground">{customerHealthMetrics.churnedLast30d}</p>
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
                <div className="space-y-3">
                  {topGeographies.map((geo, i) => (
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
                {isEnterprise && (
                  <div className="mt-4 p-3 rounded-xl bg-muted">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Sparkles className="size-3.5 text-purple-500" />
                      <p className="text-xs font-semibold text-foreground">Geographic Insight</p>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      International traffic (London, Tokyo, Sydney, Toronto) represents 29% of views but generates 35% of revenue — international visitors have a 22% higher average order value. Consider localizing content for UK and Japanese markets.
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
                    {competitorBenchmarks.map((row) => (
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
                <div className="mt-4 p-3 rounded-xl bg-green-50/50 border border-green-200 dark:border-green-900/30 dark:bg-green-900/10">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Award className="size-3.5 text-green-600" />
                    <p className="text-xs font-semibold text-green-700 dark:text-green-400">Performance Summary</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You outperform category averages in 7 of 8 key metrics. Your strongest differentiators are views (+107%) and session duration (+54%).
                  </p>
                </div>

                <div className="mt-3 p-3 rounded-xl bg-muted">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="size-3.5 text-purple-500" />
                    <p className="text-xs font-semibold text-foreground">Recommendations</p>
                  </div>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="text-primary font-bold shrink-0">1.</span>
                      <span><strong className="text-foreground">Improve Customer Return Rate.</strong> You&apos;re 20% below benchmark. Implement a post-booking re-engagement email sequence at Day 7, 14, and 30 with personalized recommendations.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary font-bold shrink-0">2.</span>
                      <span><strong className="text-foreground">Capitalize on high CTR.</strong> Your 18.5% CTR is 50% above average — test increasing pricing by 5-8% on your top-performing promotions without conversion loss.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary font-bold shrink-0">3.</span>
                      <span><strong className="text-foreground">Launch a loyalty program.</strong> Your NPS (72) and session duration suggest high brand affinity. A points-based loyalty system could lift return rate by 15-25%.</span>
                    </li>
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
                      {cohortRetention.map((row) => (
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
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-muted text-center">
                    <p className="text-[11px] text-muted-foreground">Avg. Week 2 Retention</p>
                    <p className="text-lg font-bold text-foreground">61.2%</p>
                    <MetricChange value={4.8} />
                  </div>
                  <div className="p-3 rounded-xl bg-muted text-center">
                    <p className="text-[11px] text-muted-foreground">Avg. Week 4 Retention</p>
                    <p className="text-lg font-bold text-foreground">35.0%</p>
                    <MetricChange value={6.2} />
                  </div>
                  <div className="p-3 rounded-xl bg-muted text-center">
                    <p className="text-[11px] text-muted-foreground">Retention Trend</p>
                    <p className="text-lg font-bold text-foreground">Improving</p>
                    <span className="text-[11px] text-green-600 font-medium">+3.2% avg over 5 weeks</span>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-xl bg-muted">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Brain className="size-3.5 text-purple-500" />
                    <p className="text-xs font-semibold text-foreground">Retention Insight</p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    The Feb 24 cohort shows a 9% improvement in Week 2 retention compared to the Jan 27 cohort. This improvement correlates with the launch of post-booking follow-up emails. The biggest retention drop-off happens between Week 1 and Week 2 — consider adding a re-engagement touchpoint at Day 8-10.
                  </p>
                </div>
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
                  Get real-time live metrics, full API access, AI-powered insights with revenue impact estimates,
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
