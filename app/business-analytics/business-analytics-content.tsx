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

// Helper to compute top locations from real promotion data
function computeTopLocations(promos: PromoAnalytics[]) {
  const locMap: Record<string, number> = {}
  for (const p of promos) {
    if (p.location) locMap[p.location] = (locMap[p.location] || 0) + p.views
  }
  const totalViews = Object.values(locMap).reduce((s, v) => s + v, 0) || 1
  return Object.entries(locMap)
    .map(([city, views]) => ({ city, views, percentage: Math.round((views / totalViews) * 100) }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5)
}

// Helper to compute category engagement from real promotion data
function computeCategoryEngagement(promos: PromoAnalytics[]) {
  const catMap: Record<string, { views: number; clicks: number }> = {}
  for (const p of promos) {
    if (p.category) {
      if (!catMap[p.category]) catMap[p.category] = { views: 0, clicks: 0 }
      catMap[p.category].views += p.views
      catMap[p.category].clicks += p.clicks
    }
  }
  const totalViews = Object.values(catMap).reduce((s, c) => s + c.views, 0) || 1
  return Object.entries(catMap)
    .map(([category, data]) => ({ category, percentage: Math.round((data.views / totalViews) * 100) }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 6)
}

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
  const [businessId, setBusinessId] = useState<string | undefined>()
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

    setBusinessId(biz.id)
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
          { label: "Total Views", value: totalViews.toLocaleString(), icon: Eye },
          { label: "Total Clicks", value: totalClicks.toLocaleString(), icon: MousePointerClick },
          { label: "Click-Through Rate", value: `${avgCtr}%`, icon: ArrowUpRight },
          { label: "Save Rate", value: totalViews > 0 ? `${((totalSaves / totalViews) * 100).toFixed(1)}%` : "0.0%", icon: Bookmark },
          { label: "Total Shares", value: totalShares.toLocaleString(), icon: Share2 },
        ].map((stat, i) => (
          <Card key={stat.label} className={`border-border ${STAT_ACCENTS[i]}`}>
            <CardContent className="pt-6">
              <div className={`size-8 rounded-lg ${STAT_ICON_COLORS[i].bg} flex items-center justify-center mb-2`}>
                <stat.icon className={`size-4 ${STAT_ICON_COLORS[i].color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
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
                <CardTitle>Category Engagement</CardTitle>
                <CardDescription>Views breakdown by promotion category</CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const catData = computeCategoryEngagement(promos)
                  return catData.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">No category data yet.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={catData} layout="vertical" margin={{ left: 10, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                        <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis type="category" dataKey="category" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" width={80} />
                        <Tooltip
                          formatter={(value: number) => [`${value}%`, "Percentage"]}
                          contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                        />
                        <Bar dataKey="percentage" fill="#ff9a8b" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )
                })()}
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle>Views vs Clicks by Category</CardTitle>
                <CardDescription>How each category performs in engagement</CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const catMap: Record<string, { views: number; clicks: number }> = {}
                  for (const p of promos) {
                    if (p.category) {
                      if (!catMap[p.category]) catMap[p.category] = { views: 0, clicks: 0 }
                      catMap[p.category].views += p.views
                      catMap[p.category].clicks += p.clicks
                    }
                  }
                  const catData = Object.entries(catMap)
                    .map(([category, data]) => ({ category, views: data.views, clicks: data.clicks }))
                    .sort((a, b) => b.views - a.views)
                    .slice(0, 6)
                  return catData.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">No engagement data yet.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={catData} margin={{ left: -10, right: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="category" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip
                          contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                        <Bar dataKey="views" name="Views" fill="#ff9a8b" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="clicks" name="Clicks" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )
                })()}
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
              {(() => {
                const locations = computeTopLocations(promos)
                return locations.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">No location data yet. Add locations to your promotions to see geographic breakdown.</div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {locations.map((loc, i) => (
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
                )
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends — Per-Promotion Performance */}
        <TabsContent value="trends" className="mt-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Promotion Performance Overview</CardTitle>
              <CardDescription>Views and clicks by promotion</CardDescription>
            </CardHeader>
            <CardContent>
              {promos.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">No promotion data yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart
                    data={promos.slice(0, 10).map(p => ({ name: p.title.length > 20 ? p.title.slice(0, 20) + "..." : p.title, views: p.views, clicks: p.clicks }))}
                    margin={{ left: -10, right: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" interval={0} angle={-20} textAnchor="end" height={60} />
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
              )}
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
          <EnterpriseAnalyticsDashboard tier={tier} businessId={businessId} promotionMetrics={{ views: totalViews, clicks: totalClicks, saves: totalSaves, shares: totalShares }} />
        </div>
      )}
    </div>
  )
}
