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
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Lock,
  Crown,
  CalendarDays,
  Globe,
  MapPin,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  getBusinessSubscription,
  getEffectiveTier,
  getAnalyticsLevel,
  type BusinessSubscription,
} from "@/lib/business-tier-service"
import type { BusinessTierSlug } from "@/lib/tiers"

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
const AUDIENCE_INSIGHTS = [
  { label: "18-24", percentage: 22, color: "bg-blue-400" },
  { label: "25-34", percentage: 38, color: "bg-primary" },
  { label: "35-44", percentage: 24, color: "bg-indigo-400" },
  { label: "45-54", percentage: 11, color: "bg-violet-400" },
  { label: "55+", percentage: 5, color: "bg-purple-400" },
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
      .select("id")
      .eq("user_id", session.user.id)
      .single()

    if (!biz) { setLoading(false); return }

    const sub = await getBusinessSubscription(biz.id)
    setSubscription(sub)
    setTier(getEffectiveTier(sub))

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

  // Gate: basic tier gets locked view
  if (analyticsLevel === "basic") {
    return (
      <div className="mt-6">
        <Card className="border-border">
          <CardContent className="py-16 text-center">
            <Lock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-bold mb-2">Advanced Analytics</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              Upgrade to Premium to unlock advanced analytics including audience insights, geographic breakdown, engagement trends, and per-promotion performance metrics.
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
          <span className="text-xs text-muted-foreground">Data updates in real-time</span>
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
        ].map((stat) => (
          <Card key={stat.label} className="border-border">
            <CardContent className="pt-6">
              <stat.icon className="size-5 text-muted-foreground" />
              <p className="mt-3 text-2xl font-bold text-foreground">{stat.value}</p>
              <div className="flex items-center gap-1 mt-1">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <span className={`text-xs font-medium flex items-center ${stat.up ? "text-green-600" : "text-red-500"}`}>
                  {stat.up ? <TrendingUp className="size-3 mr-0.5" /> : <TrendingDown className="size-3 mr-0.5" />}
                  {stat.change}
                </span>
              </div>
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
                <p className="text-sm text-muted-foreground text-center py-8">No promotions yet.</p>
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
                    {promos.map((promo) => (
                      <TableRow key={promo.id}>
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

        {/* Audience Insights */}
        <TabsContent value="audience" className="mt-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Audience Age Distribution</CardTitle>
                <CardDescription>Age breakdown of users who view your promotions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {AUDIENCE_INSIGHTS.map((segment) => (
                    <div key={segment.label} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-10">{segment.label}</span>
                      <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${segment.color} rounded-full transition-all`}
                          style={{ width: `${segment.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-foreground w-10 text-right">{segment.percentage}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle>Engagement Patterns</CardTitle>
                <CardDescription>When your audience is most active</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {[
                    { time: "Morning (6-12)", pct: 22 },
                    { time: "Afternoon (12-18)", pct: 35 },
                    { time: "Evening (18-24)", pct: 32 },
                    { time: "Night (0-6)", pct: 11 },
                  ].map((slot) => (
                    <div key={slot.time} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-28">{slot.time}</span>
                      <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-tinerary-salmon rounded-full"
                          style={{ width: `${slot.pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-foreground w-10 text-right">{slot.pct}%</span>
                    </div>
                  ))}
                </div>
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
                    <span className="text-sm font-bold text-muted-foreground w-6">{i + 1}.</span>
                    <MapPin className="size-4 text-primary shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">{loc.city}</span>
                        <span className="text-xs text-muted-foreground">{loc.views.toLocaleString()} views</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
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

        {/* Trends */}
        <TabsContent value="trends" className="mt-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Weekly Activity Trend</CardTitle>
              <CardDescription>Views and clicks over the past week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {WEEKLY_TREND.map((day) => {
                  const maxViews = Math.max(...WEEKLY_TREND.map((d) => d.views))
                  return (
                    <div key={day.day} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-8">{day.day}</span>
                      <div className="flex-1 flex gap-1">
                        <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${(day.views / maxViews) * 100}%` }}
                          />
                        </div>
                        <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-tinerary-salmon rounded-full"
                            style={{ width: `${(day.clicks / maxViews) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 text-right">
                        <span className="text-xs text-foreground w-12">{day.views} <span className="text-muted-foreground">v</span></span>
                        <span className="text-xs text-foreground w-10">{day.clicks} <span className="text-muted-foreground">c</span></span>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-primary" /> Views</span>
                <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-tinerary-salmon" /> Clicks</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
