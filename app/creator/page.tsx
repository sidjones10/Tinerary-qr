"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Rocket,
  BarChart3,
  ShoppingBag,
  Mail,
  Sparkles,
  Check,
  Crown,
  Eye,
  Heart,
  Users,
  Coins,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Zap,
  Percent,
  Store,
  Bookmark,
  Share2,
  Trophy,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AppHeader } from "@/components/app-header"
import { PaywallGate } from "@/components/paywall-gate"
import { createClient } from "@/lib/supabase/client"
import { getCreatorAnalytics, type CreatorAnalytics } from "@/lib/creator-service"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

// ─── Trend Badge ────────────────────────────────────────────

function TrendBadge({ value, positive }: { value: string; positive?: boolean }) {
  const isPos = positive ?? !value.startsWith("-")
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
        isPos
          ? "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950/40"
          : "text-red-500 bg-red-50 dark:text-red-400 dark:bg-red-950/40"
      }`}
    >
      {isPos ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      {value}
    </span>
  )
}

// ─── Creator Tools ──────────────────────────────────────────

const creatorFeatures = [
  {
    title: "Boost Posts",
    description: "Amplify your itineraries with targeted impressions",
    icon: Rocket,
    href: "/creator/boost",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    title: "Analytics Dashboard",
    description: "Full audience insights and content performance",
    icon: BarChart3,
    href: "/creator/analytics",
    color: "text-tinerary-gold",
    bgColor: "bg-tinerary-gold/10",
  },
  {
    title: "Sell Templates",
    description: "Create and sell premium itinerary templates",
    icon: ShoppingBag,
    href: "/creator/templates",
    color: "text-tinerary-salmon",
    bgColor: "bg-tinerary-salmon/10",
  },
  {
    title: "Sponsorship Inbox",
    description: "Direct brand collaboration opportunities",
    icon: Mail,
    href: "/creator/sponsorships",
    color: "text-[#7C3AED]",
    bgColor: "bg-[#7C3AED]/10",
  },
]

// ─── Active Perks ───────────────────────────────────────────

const activePerks = [
  { label: "Verified Badge", desc: "Displayed on all your content", icon: Check },
  { label: "70/30 Affiliate Split", desc: "Enhanced commission rate", icon: Percent },
  { label: "Priority Discovery", desc: "Boosted in feeds & search", icon: TrendingUp },
  { label: "2x Coin Rate", desc: "Double coins on all actions", icon: Coins },
  { label: "Business-Lite Listings", desc: "Create deals & promotions", icon: Store },
  { label: "Sponsorship Inbox", desc: "Receive brand collaborations", icon: Mail },
]

// ─── Stat Card Styles ───────────────────────────────────────

const statCardStyles = [
  { color: "text-blue-500", bg: "bg-blue-500/10", accent: "stat-accent-blue" },
  { color: "text-tinerary-salmon", bg: "bg-tinerary-salmon/10", accent: "stat-accent-salmon" },
  { color: "text-tinerary-gold", bg: "bg-tinerary-gold/10", accent: "stat-accent-gold" },
  { color: "text-[#7C3AED]", bg: "bg-[#7C3AED]/10", accent: "stat-accent-purple" },
  { color: "text-green-500", bg: "bg-green-500/10", accent: "stat-accent-green" },
  { color: "text-primary", bg: "bg-primary/10", accent: "stat-accent-blue" },
]

// ─── Chart Colors ───────────────────────────────────────────

const CHART_COLORS = ["hsl(var(--primary))", "#ff9a8b", "#f59e0b", "#7C3AED"]

// ─── Rank Styles ────────────────────────────────────────────

const RANK_STYLES = [
  "bg-tinerary-gold text-white",
  "bg-gray-300 text-gray-700",
  "bg-amber-600 text-white",
]

// ─── Page Component ─────────────────────────────────────────

export default function CreatorHubPage() {
  const [analytics, setAnalytics] = useState<CreatorAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.push("/auth?redirectTo=/creator")
        return
      }
      setUserId(session.user.id)
      const data = await getCreatorAnalytics(session.user.id)
      setAnalytics(data)
      setLoading(false)
    }
    load()
  }, [router])

  // Build stat cards data
  const stats = [
    {
      label: "Total Views",
      value: analytics?.totalViews?.toLocaleString() || "0",
      icon: Eye,
      trend: "+18%",
      trendPositive: true,
    },
    {
      label: "Total Likes",
      value: analytics?.totalLikes?.toLocaleString() || "0",
      icon: Heart,
      trend: "+12%",
      trendPositive: true,
    },
    {
      label: "Followers",
      value: analytics?.totalFollowers?.toLocaleString() || "0",
      icon: Users,
      trend: "+15%",
      trendPositive: true,
    },
    {
      label: "Engagement",
      value: `${analytics?.engagementRate || 0}%`,
      icon: Zap,
      trend: "+2.1%",
      trendPositive: true,
    },
    {
      label: "Total Saves",
      value: analytics?.totalSaves?.toLocaleString() || "0",
      icon: Bookmark,
      trend: "+24%",
      trendPositive: true,
    },
    {
      label: "Total Shares",
      value: analytics?.totalShares?.toLocaleString() || "0",
      icon: Share2,
      trend: "+8%",
      trendPositive: true,
    },
  ]

  // Engagement chart data
  const engagementData = [
    { metric: "Views", value: analytics?.totalViews || 0 },
    { metric: "Likes", value: analytics?.totalLikes || 0 },
    { metric: "Saves", value: analytics?.totalSaves || 0 },
    { metric: "Shares", value: analytics?.totalShares || 0 },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1">
        <div className="container px-4 py-6 md:py-10">
          <PaywallGate gate="creator_hub">
            {/* Hero */}
            <div className="bg-gradient-to-r from-[#7C3AED]/10 to-tinerary-peach/15 rounded-2xl p-6 mb-8">
              <div className="flex items-center gap-3">
                <div className="size-14 rounded-xl bg-[#7C3AED] flex items-center justify-center shadow-lg shadow-[#7C3AED]/20">
                  <Crown className="size-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Creator Hub</h1>
                  <p className="text-sm text-muted-foreground">
                    Grow your audience, boost your content, and earn more
                  </p>
                </div>
              </div>
            </div>

            {/* Stat Cards — Row 1 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {stats.slice(0, 4).map((stat, i) => (
                <Card key={stat.label} className={`border-border ${statCardStyles[i].accent}`}>
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className={`size-10 rounded-xl ${statCardStyles[i].bg} flex items-center justify-center`}
                      >
                        <stat.icon className={`size-5 ${statCardStyles[i].color}`} />
                      </div>
                      {!loading && <TrendBadge value={stat.trend} positive={stat.trendPositive} />}
                    </div>
                    <p className="text-2xl font-bold text-foreground tracking-tight">
                      {loading ? "..." : stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Stat Cards — Row 2 */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {stats.slice(4).map((stat, i) => (
                <Card
                  key={stat.label}
                  className={`border-border ${statCardStyles[i + 4].accent}`}
                >
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className={`size-10 rounded-xl ${statCardStyles[i + 4].bg} flex items-center justify-center`}
                      >
                        <stat.icon className={`size-5 ${statCardStyles[i + 4].color}`} />
                      </div>
                      {!loading && <TrendBadge value={stat.trend} positive={stat.trendPositive} />}
                    </div>
                    <p className="text-2xl font-bold text-foreground tracking-tight">
                      {loading ? "..." : stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts + Top Content Section */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              {/* Engagement Breakdown Chart */}
              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="size-4 text-primary" />
                    Engagement Breakdown
                  </CardTitle>
                  <CardDescription>How your audience interacts with your content</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="h-[260px] bg-muted rounded-xl animate-pulse" />
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={engagementData} margin={{ left: -10, right: 10 }}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="hsl(var(--border))"
                        />
                        <XAxis
                          dataKey="metric"
                          tick={{ fontSize: 12 }}
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: 12,
                            border: "1px solid hsl(var(--border))",
                            background: "hsl(var(--card))",
                          }}
                          formatter={(value: number) => [value.toLocaleString(), "Count"]}
                        />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                          {engagementData.map((_, index) => (
                            <Cell key={index} fill={CHART_COLORS[index]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Top Performing Content */}
              <Card className="border-border">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="size-4 text-tinerary-gold" />
                        Top Performing Content
                      </CardTitle>
                      <CardDescription>Your itineraries ranked by views</CardDescription>
                    </div>
                    <Button asChild variant="ghost" size="sm" className="text-xs">
                      <Link href="/creator/analytics">View All</Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="h-[260px] bg-muted rounded-xl animate-pulse" />
                  ) : analytics?.topItineraries && analytics.topItineraries.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-tinerary-dark hover:bg-tinerary-dark">
                          <TableHead className="text-primary-foreground">#</TableHead>
                          <TableHead className="text-primary-foreground">Itinerary</TableHead>
                          <TableHead className="text-primary-foreground text-right">Views</TableHead>
                          <TableHead className="text-primary-foreground text-right">Likes</TableHead>
                          <TableHead className="text-primary-foreground text-right">Saves</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analytics.topItineraries.slice(0, 5).map((it, i) => (
                          <TableRow key={it.id}>
                            <TableCell>
                              <div
                                className={`size-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  i < 3
                                    ? RANK_STYLES[i]
                                    : "bg-muted-foreground/20 text-muted-foreground"
                                }`}
                              >
                                {i < 3 ? <Trophy className="size-3" /> : i + 1}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium text-foreground max-w-[160px] truncate">
                              {it.title}
                            </TableCell>
                            <TableCell className="text-right text-foreground">
                              {it.views.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right text-foreground">
                              {it.likes.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right text-foreground">
                              {it.saves.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-12">
                      <div
                        className="cute-empty-icon mx-auto mb-4"
                        style={{ width: 64, height: 64 }}
                      >
                        <BarChart3 className="size-7 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        No public itineraries yet. Create content to see analytics.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Creator Tools */}
            <h2 className="text-lg font-bold mb-4">Creator Tools</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {creatorFeatures.map((feature) => (
                <Link key={feature.title} href={feature.href} className="group">
                  <Card className="border-border hover-lift transition-all duration-300 cursor-pointer h-full">
                    <CardContent className="pt-6">
                      <div
                        className={`size-12 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4`}
                      >
                        <feature.icon className={`size-6 ${feature.color}`} />
                      </div>
                      <h3 className="text-sm font-bold text-foreground">{feature.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                      <div className="flex items-center gap-1 mt-3 text-xs font-medium text-primary">
                        Open{" "}
                        <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Active Perks */}
            <Card className="border-border mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="size-5 text-tinerary-gold" /> Active Creator Perks
                </CardTitle>
                <CardDescription>Your enabled creator-tier benefits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {activePerks.map((perk) => (
                    <div
                      key={perk.label}
                      className="flex items-start gap-3 p-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
                    >
                      <div className="size-8 rounded-lg bg-gradient-to-br from-[#7C3AED] to-primary flex items-center justify-center shrink-0 text-primary-foreground">
                        <perk.icon className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{perk.label}</p>
                        <p className="text-xs text-muted-foreground">{perk.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* CTA */}
            <Card className="bg-gradient-to-r from-[#7C3AED]/15 to-tinerary-peach/25 border-0">
              <CardContent className="py-8 text-center">
                <Crown className="size-10 text-[#7C3AED] mx-auto mb-3" />
                <h3 className="text-lg font-bold mb-2">You&apos;re on the Creator Tier</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  All premium creator features are active. Explore your tools above or visit
                  pricing to learn about Business upgrades.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button asChild variant="outline">
                    <Link href="/pricing">View Plans</Link>
                  </Button>
                  <Button asChild className="btn-sunset">
                    <Link href="/creator/analytics">View Analytics</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </PaywallGate>
        </div>
      </main>
    </div>
  )
}
