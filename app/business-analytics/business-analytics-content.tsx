"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
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
  Share2,
  ArrowUpRight,
  Lock,
  Crown,
  MapPin,
  Sparkles,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { createClient } from "@/lib/supabase/client"
import {
  getBusinessSubscription,
  getEffectiveTier,
  getAnalyticsLevel,
  type BusinessSubscription,
} from "@/lib/business-tier-service"
import type { BusinessTierSlug } from "@/lib/tiers"
import { EnterpriseAnalyticsDashboard } from "@/components/enterprise-analytics-dashboard"

interface PromoAnalytics {
  id: string
  title: string
  status: string
  category: string
  location: string
  views: number
  clicks: number
  saves: number
  shares: number
  ctr: number
  start_date: string
  end_date: string
}

// Demo data for advanced insights
const AUDIENCE_AGE_DATA = [
  { age: "18-24", percentage: 22 },
  { age: "25-34", percentage: 38 },
  { age: "35-44", percentage: 24 },
  { age: "45-54", percentage: 11 },
  { age: "55+", percentage: 5 },
]

const ENGAGEMENT_PATTERN_DATA = [
  { time: "Morning", percentage: 22 },
  { time: "Afternoon", percentage: 35 },
  { time: "Evening", percentage: 32 },
  { time: "Night", percentage: 11 },
]

const TOP_LOCATIONS = [
  { city: "San Francisco", views: 1240, percentage: 28 },
  { city: "Los Angeles", views: 890, percentage: 20 },
  { city: "New York", views: 650, percentage: 15 },
  { city: "Seattle", views: 430, percentage: 10 },
  { city: "Chicago", views: 340, percentage: 8 },
]

const WEEKLY_TREND = [
  { day: "Mon", views: 120, clicks: 18 },
  { day: "Tue", views: 145, clicks: 22 },
  { day: "Wed", views: 160, clicks: 28 },
  { day: "Thu", views: 138, clicks: 20 },
  { day: "Fri", views: 180, clicks: 35 },
  { day: "Sat", views: 210, clicks: 42 },
  { day: "Sun", views: 195, clicks: 38 },
]

const RANK_STYLES = [
  "bg-tinerary-gold text-white",
  "bg-gray-300 text-gray-700",
  "bg-amber-600 text-white",
]

const STAT_ACCENTS = [
  "stat-accent-blue",
  "stat-accent-salmon",
  "stat-accent-gold",
  "stat-accent-purple",
  "stat-accent-green",
]

const STAT_ICON_COLORS = [
  { color: "text-blue-500", bg: "bg-blue-500/10" },
  { color: "text-tinerary-salmon", bg: "bg-tinerary-salmon/10" },
  { color: "text-tinerary-gold", bg: "bg-tinerary-gold/10" },
  { color: "text-[#7C3AED]", bg: "bg-[#7C3AED]/10" },
  { color: "text-green-500", bg: "bg-green-500/10" },
]

export function BusinessAnalyticsContent() {
  const [tier, setTier] = useState<BusinessTierSlug>("basic")
  const [subscription, setSubscription] = useState<BusinessSubscription | null>(null)
  const [promos, setPromos] = useState<PromoAnalytics[]>([])
  const [loading, setLoading] = useState(true)

  const analyticsLevel = getAnalyticsLevel(tier)

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setLoading(false); return }

    const { data: biz } = await supabase
      .from("businesses")
      .select("id, business_tier")
      .eq("user_id", session.user.id)
      .single()

    if (!biz) { setLoading(false); return }

    const sub = await getBusinessSubscription(biz.id)
    setSubscription(sub)
    setTier(getEffectiveTier(sub, biz.business_tier as BusinessTierSlug))

    const { data: promotions } = await supabase
      .from("promotions")
      .select("id, title, status, category, location, start_date, end_date, promotion_metrics(*)")
      .eq("business_id", biz.id)
      .order("created_at", { ascending: false })

    if (promotions) {
      setPromos(
        promotions.map((p: any) => {
          const m = Array.isArray(p.promotion_metrics) ? p.promotion_metrics[0] : p.promotion_metrics
          return {
            id: p.id,
            title: p.title,
            status: p.status,
            category: p.category,
            location: p.location,
            start_date: p.start_date,
            end_date: p.end_date,
            views: m?.views || 0,
            clicks: m?.clicks || 0,
            saves: m?.saves || 0,
            shares: m?.shares || 0,
            ctr: m?.ctr || 0,
          }
        })
      )
    }

    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  if (loading) {
    return (
      <div className="mt-6 flex flex-col gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse border-border">
            <CardContent className="pt-6"><div className="h-20 bg-muted rounded" /></CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Gate: basic tier gets locked view with blurred preview
  if (analyticsLevel === "basic") {
    return (
      <div className="mt-6">
        <Card className="border-border relative overflow-hidden">
          {/* Blurred preview behind the lock */}
          <div className="absolute inset-0 opacity-20 blur-sm pointer-events-none p-6">
            <div className="grid grid-cols-5 gap-4 mb-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-muted" />
              ))}
            </div>
            <div className="h-48 rounded-xl bg-muted" />
          </div>
          <CardContent className="py-16 text-center relative z-10">
            <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="size-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold mb-2">Advanced Analytics</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Upgrade to Premium to unlock audience insights, geographic breakdown, engagement trends, and per-promotion performance metrics.
            </p>
            <Button className="btn-sunset" asChild>
              <Link href="/business">Upgrade to Premium</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalViews = promos.reduce((s, p) => s + p.views, 0)
  const totalClicks = promos.reduce((s, p) => s + p.clicks, 0)
  const totalSaves = promos.reduce((s, p) => s + p.saves, 0)
  const totalShares = promos.reduce((s, p) => s + p.shares, 0)
  const avgCtr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : "0.0"

  return (
    <div className="mt-6 flex flex-col gap-6">
      {/* Tier Indicator */}
      <div className="flex items-center gap-2">
        <Badge className={analyticsLevel === "realtime" ? "bg-tinerary-gold/20 text-tinerary-dark border-0" : "bg-primary/10 text-primary border-0"}>
          <Crown className="size-3 mr-1" />
          {analyticsLevel === "realtime" ? "Real-time Analytics" : "Advanced Analytics"}
        </Badge>
        {analyticsLevel === "realtime" && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <span className="size-2 rounded-full bg-green-500 animate-pulse" />
            Data updates in real-time
          </span>
        )}
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Views", value: totalViews.toLocaleString(), icon: Eye, change: "+18%", up: true },
          { label: "Total Clicks", value: totalClicks.toLocaleString(), icon: MousePointerClick, change: "+24%", up: true },
          { label: "Avg CTR", value: `${avgCtr}%`, icon: ArrowUpRight, change: "+2.1%", up: true },
          { label: "Total Saves", value: totalSaves.toLocaleString(), icon: Bookmark, change: "+12%", up: true },
          { label: "Total Shares", value: totalShares.toLocaleString(), icon: Share2, change: "-3%", up: false },
        ].map((stat, i) => (
          <Card key={stat.label} className={`border-border ${STAT_ACCENTS[i]}`}>
            <CardContent className="pt-6">
              <div className={`size-8 rounded-lg ${STAT_ICON_COLORS[i].bg} flex items-center justify-center mb-2`}>
                <stat.icon className={`size-4 ${STAT_ICON_COLORS[i].color}`} />
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <span className={`text-xs font-medium flex items-center ${stat.up ? "text-green-600" : "text-red-500"}`}>
                  {stat.up ? <TrendingUp className="size-3 mr-0.5" /> : <TrendingDown className="size-3 mr-0.5" />}
                  {stat.change}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="performance">
        <TabsList className="w-full sm:w-auto bg-secondary">
          <TabsTrigger value="performance" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Performance
          </TabsTrigger>
          <TabsTrigger value="audience" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Audience
          </TabsTrigger>
          <TabsTrigger value="geography" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Geography
          </TabsTrigger>
          <TabsTrigger value="trends" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Trends
          </TabsTrigger>
        </TabsList>

        {/* Per-Promotion Performance */}
        <TabsContent value="performance" className="mt-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Promotion Performance</CardTitle>
              <CardDescription>Detailed metrics for each active promotion</CardDescription>
            </CardHeader>
            <CardContent>
              {promos.length === 0 ? (
                <div className="text-center py-12">
                  <div className="cute-empty-icon mx-auto mb-4" style={{ width: 80, height: 80 }}>
                    <BarChart3 className="size-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No promotions yet. Create your first deal to see metrics here.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-tinerary-dark hover:bg-tinerary-dark">
                      <TableHead className="text-primary-foreground">Promotion</TableHead>
                      <TableHead className="text-primary-foreground text-right">Views</TableHead>
                      <TableHead className="text-primary-foreground text-right">Clicks</TableHead>
                      <TableHead className="text-primary-foreground text-right">CTR</TableHead>
                      <TableHead className="text-primary-foreground text-right">Saves</TableHead>
                      <TableHead className="text-primary-foreground text-right">Shares</TableHead>
                      <TableHead className="text-primary-foreground text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {promos.map((promo, i) => (
                      <TableRow key={promo.id} className={`hover:bg-muted/50 transition-colors ${i % 2 === 0 ? "bg-muted/30" : ""}`}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground text-sm">{promo.title}</p>
                            <p className="text-xs text-muted-foreground">{promo.category} &middot; {promo.location}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-foreground">{promo.views.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-foreground">{promo.clicks.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-foreground">
                          {promo.views > 0 ? ((promo.clicks / promo.views) * 100).toFixed(1) : "0.0"}%
                        </TableCell>
                        <TableCell className="text-right text-foreground">{promo.saves.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-foreground">{promo.shares.toLocaleString()}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className={
                            promo.status === "active"
                              ? "bg-tinerary-peach text-tinerary-dark border-0"
                              : "bg-secondary text-secondary-foreground border-0"
                          }>
                            {promo.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audience Insights — Recharts */}
        <TabsContent value="audience" className="mt-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Age Distribution</CardTitle>
                <CardDescription>Age breakdown of users who view your promotions</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={AUDIENCE_AGE_DATA} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" domain={[0, 50]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis type="category" dataKey="age" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" width={40} />
                    <Tooltip
                      formatter={(value: number) => [`${value}%`, "Percentage"]}
                      contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                    />
                    <Bar dataKey="percentage" fill="#ff9a8b" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle>Engagement Patterns</CardTitle>
                <CardDescription>When your audience is most active</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={ENGAGEMENT_PATTERN_DATA} margin={{ left: -10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis domain={[0, 50]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      formatter={(value: number) => [`${value}%`, "Activity"]}
                      contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                    />
                    <Bar dataKey="percentage" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Geographic Breakdown */}
        <TabsContent value="geography" className="mt-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Top Viewer Locations</CardTitle>
              <CardDescription>Where your audience is browsing from</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                {TOP_LOCATIONS.map((loc, i) => (
                  <div key={loc.city} className="flex items-center gap-4">
                    <div className={`size-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      i < 3 ? RANK_STYLES[i] : "bg-muted text-muted-foreground"
                    }`}>
                      {i + 1}
                    </div>
                    <MapPin className="size-4 text-primary shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">{loc.city}</span>
                        <span className="text-xs text-muted-foreground">{loc.views.toLocaleString()} views</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-tinerary-salmon rounded-full transition-all"
                          style={{ width: `${loc.percentage}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-medium text-foreground w-10 text-right">{loc.percentage}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends — Recharts */}
        <TabsContent value="trends" className="mt-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Weekly Activity Trend</CardTitle>
              <CardDescription>Views and clicks over the past week</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={WEEKLY_TREND} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                  />
                  <Bar dataKey="views" name="Views" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="clicks" name="Clicks" fill="#ff9a8b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Advanced / Real-time analytics section for premium+ tiers */}
      {(tier === "premium" || tier === "enterprise") && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="size-4 text-tinerary-gold" />
            <h2 className="text-lg font-bold text-foreground">
              {tier === "enterprise" ? "Real-time Analytics Dashboard" : "Advanced Analytics & Insights"}
            </h2>
            {tier === "enterprise" && (
              <Badge className="bg-tinerary-gold/20 text-tinerary-dark border-0 text-[10px]">
                Full API Access
              </Badge>
            )}
          </div>
          <EnterpriseAnalyticsDashboard tier={tier} />
        </div>
      )}
    </div>
  )
}
