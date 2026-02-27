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
  Download,
  RefreshCw,
  Activity,
  Zap,
  Globe,
  Users,
  Clock,
  Target,
} from "lucide-react"
import type { BusinessTierSlug } from "@/lib/tiers"

interface EnterpriseAnalyticsDashboardProps {
  tier: BusinessTierSlug
}

// Demo real-time metrics data
const realtimeMetrics = {
  activeViewers: 24,
  viewsToday: 1_847,
  viewsChange: 12.5,
  clicksToday: 342,
  clicksChange: 8.3,
  savesToday: 89,
  savesChange: -2.1,
  bookingsToday: 15,
  bookingsChange: 23.4,
  revenueToday: 2_340,
  revenueChange: 18.7,
  ctrToday: 18.5,
  ctrChange: 1.2,
  conversionRate: 4.4,
  conversionChange: 0.8,
  avgTimeOnPage: "2m 34s",
}

const dailyPerformance = [
  { date: "Feb 27", views: 1847, clicks: 342, saves: 89, bookings: 15, revenue: "$2,340" },
  { date: "Feb 26", views: 1623, clicks: 298, saves: 91, bookings: 12, revenue: "$1,920" },
  { date: "Feb 25", views: 1756, clicks: 321, saves: 78, bookings: 14, revenue: "$2,180" },
  { date: "Feb 24", views: 1489, clicks: 267, saves: 72, bookings: 11, revenue: "$1,690" },
  { date: "Feb 23", views: 1534, clicks: 282, saves: 85, bookings: 13, revenue: "$2,010" },
  { date: "Feb 22", views: 1678, clicks: 315, saves: 94, bookings: 16, revenue: "$2,480" },
  { date: "Feb 21", views: 1402, clicks: 255, saves: 68, bookings: 10, revenue: "$1,540" },
]

const competitorBenchmarks = [
  { metric: "Avg. Views/Day", yours: "1,618", benchmark: "890", status: "above" as const },
  { metric: "Click-Through Rate", yours: "18.5%", benchmark: "12.3%", status: "above" as const },
  { metric: "Booking Conversion", yours: "4.4%", benchmark: "3.1%", status: "above" as const },
  { metric: "Avg. Revenue/Booking", yours: "$156", benchmark: "$142", status: "above" as const },
  { metric: "Customer Return Rate", yours: "28%", benchmark: "35%", status: "below" as const },
  { metric: "Mention Frequency", yours: "3.2/week", benchmark: "2.1/week", status: "above" as const },
]

const audienceDemographics = [
  { segment: "Solo Travelers", percentage: 34, trend: "up" as const },
  { segment: "Couples", percentage: 28, trend: "up" as const },
  { segment: "Families", percentage: 22, trend: "stable" as const },
  { segment: "Group Tours", percentage: 16, trend: "down" as const },
]

const topPromotions = [
  { name: "Weekend Wine Tour", views: 523, clicks: 98, bookings: 8, revenue: "$960" },
  { name: "Sunset Dinner Cruise", views: 412, clicks: 76, bookings: 5, revenue: "$625" },
  { name: "Morning Yoga Retreat", views: 389, clicks: 71, bookings: 4, revenue: "$480" },
  { name: "City Walking Tour", views: 345, clicks: 63, bookings: 3, revenue: "$135" },
]

function MetricChange({ value }: { value: number }) {
  const isPositive = value >= 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${isPositive ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
      {isPositive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      {isPositive ? "+" : ""}{value}%
    </span>
  )
}

export function EnterpriseAnalyticsDashboard({ tier }: EnterpriseAnalyticsDashboardProps) {
  const isEnterprise = tier === "enterprise"
  const isPremium = tier === "premium"
  const showRealtimeMetrics = isEnterprise
  const showApiAccess = isEnterprise
  const showCompetitorBenchmarks = isEnterprise
  const showDailyReports = isEnterprise
  const showAudienceDemographics = isEnterprise || isPremium

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
      {/* Real-time indicator (Enterprise only) */}
      {showRealtimeMetrics && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-muted-foreground">Real-time</span>
            <Badge variant="secondary" className="text-[10px]">
              <Users className="size-2.5 mr-1" />
              {realtimeMetrics.activeViewers} active viewers
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

      {/* Metrics Grid */}
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
            <Bookmark className="size-4 text-muted-foreground" />
            <p className="mt-2 text-2xl font-bold text-foreground">{realtimeMetrics.savesToday}</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">Saves Today</p>
              <MetricChange value={realtimeMetrics.savesChange} />
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

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="pt-5">
            <Target className="size-4 text-muted-foreground" />
            <p className="mt-2 text-xl font-bold text-foreground">{realtimeMetrics.ctrToday}%</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">CTR</p>
              <MetricChange value={realtimeMetrics.ctrChange} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-5">
            <ArrowUpRight className="size-4 text-muted-foreground" />
            <p className="mt-2 text-xl font-bold text-foreground">{realtimeMetrics.conversionRate}%</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">Conversion Rate</p>
              <MetricChange value={realtimeMetrics.conversionChange} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-5">
            <Activity className="size-4 text-muted-foreground" />
            <p className="mt-2 text-xl font-bold text-foreground">{realtimeMetrics.bookingsToday}</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">Bookings Today</p>
              <MetricChange value={realtimeMetrics.bookingsChange} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-5">
            <Clock className="size-4 text-muted-foreground" />
            <p className="mt-2 text-xl font-bold text-foreground">{realtimeMetrics.avgTimeOnPage}</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">Avg. Time on Page</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Analytics */}
      <Tabs defaultValue="performance">
        <TabsList className="w-full sm:w-auto bg-secondary">
          {showDailyReports && (
            <TabsTrigger value="performance" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Daily Performance
            </TabsTrigger>
          )}
          <TabsTrigger value="promotions" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Top Promotions
          </TabsTrigger>
          {showAudienceDemographics && (
            <TabsTrigger value="audience" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Audience
            </TabsTrigger>
          )}
          {showCompetitorBenchmarks && (
            <TabsTrigger value="benchmarks" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Benchmarks
            </TabsTrigger>
          )}
        </TabsList>

        {/* Daily Performance */}
        {showDailyReports && (
          <TabsContent value="performance" className="mt-4">
            <Card className="border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Daily Performance Report</CardTitle>
                    <CardDescription>
                      Enterprise accounts receive daily reports with trend analysis and recommendations.
                    </CardDescription>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyPerformance.map((row) => (
                      <TableRow key={row.date}>
                        <TableCell className="font-medium text-foreground">{row.date}</TableCell>
                        <TableCell className="text-right text-foreground">{row.views.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-foreground">{row.clicks}</TableCell>
                        <TableCell className="text-right text-foreground">{row.saves}</TableCell>
                        <TableCell className="text-right text-foreground">{row.bookings}</TableCell>
                        <TableCell className="text-right font-semibold text-tinerary-salmon">{row.revenue}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Trend Analysis (Enterprise only) */}
                <div className="mt-4 p-4 rounded-xl bg-muted">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="size-4 text-tinerary-gold" />
                    <h4 className="text-sm font-semibold text-foreground">Trend Analysis & Recommendations</h4>
                  </div>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li>Views are trending up 12.5% week-over-week. Weekend performance is strongest.</li>
                    <li>Click-through rate improved after recent promotion image updates.</li>
                    <li>Consider adding a mid-week promotion to capture the dip on Wednesdays.</li>
                    <li>Revenue per booking is 10% above benchmark — maintain current pricing.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Top Promotions */}
        <TabsContent value="promotions" className="mt-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Top Performing Promotions</CardTitle>
              <CardDescription>Your best performing promotions this week.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-tinerary-dark hover:bg-tinerary-dark">
                    <TableHead className="text-primary-foreground">Promotion</TableHead>
                    <TableHead className="text-primary-foreground text-right">Views</TableHead>
                    <TableHead className="text-primary-foreground text-right">Clicks</TableHead>
                    <TableHead className="text-primary-foreground text-right">Bookings</TableHead>
                    <TableHead className="text-primary-foreground text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topPromotions.map((promo) => (
                    <TableRow key={promo.name}>
                      <TableCell className="font-medium text-foreground">{promo.name}</TableCell>
                      <TableCell className="text-right text-foreground">{promo.views}</TableCell>
                      <TableCell className="text-right text-foreground">{promo.clicks}</TableCell>
                      <TableCell className="text-right text-foreground">{promo.bookings}</TableCell>
                      <TableCell className="text-right font-semibold text-tinerary-salmon">{promo.revenue}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audience Demographics */}
        {showAudienceDemographics && (
          <TabsContent value="audience" className="mt-4">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base">Audience Demographics</CardTitle>
                <CardDescription>Understand who is engaging with your business.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {audienceDemographics.map((segment) => (
                    <div key={segment.segment} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-foreground">{segment.segment}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">{segment.percentage}%</span>
                            {segment.trend === "up" && <TrendingUp className="size-3 text-green-500" />}
                            {segment.trend === "down" && <TrendingDown className="size-3 text-red-500" />}
                            {segment.trend === "stable" && <span className="text-xs text-muted-foreground">—</span>}
                          </div>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-tinerary-salmon rounded-full transition-all"
                            style={{ width: `${segment.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {isEnterprise && (
                  <div className="mt-4 p-3 rounded-xl bg-muted">
                    <div className="flex items-center gap-2 mb-1">
                      <Globe className="size-3.5 text-muted-foreground" />
                      <p className="text-xs font-semibold text-foreground">Top Source Locations</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      San Francisco (32%), Los Angeles (18%), New York (15%), Seattle (11%), Other (24%)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Competitor Benchmarks (Enterprise only) */}
        {showCompetitorBenchmarks && (
          <TabsContent value="benchmarks" className="mt-4">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base">Competitor Benchmarking</CardTitle>
                <CardDescription>
                  See how your business compares to similar businesses in your category.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-tinerary-dark hover:bg-tinerary-dark">
                      <TableHead className="text-primary-foreground">Metric</TableHead>
                      <TableHead className="text-primary-foreground text-right">Your Business</TableHead>
                      <TableHead className="text-primary-foreground text-right">Category Avg.</TableHead>
                      <TableHead className="text-primary-foreground text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {competitorBenchmarks.map((row) => (
                      <TableRow key={row.metric}>
                        <TableCell className="font-medium text-foreground">{row.metric}</TableCell>
                        <TableCell className="text-right font-semibold text-foreground">{row.yours}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{row.benchmark}</TableCell>
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
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
