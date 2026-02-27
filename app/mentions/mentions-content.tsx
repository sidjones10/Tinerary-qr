"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Sparkles,
  Eye,
  Link2,
  Bell,
  Tag,
  BookOpen,
  Loader2,
  XCircle,
} from "lucide-react"
import { MENTION_HIGHLIGHTS } from "@/lib/tiers"
import { HighlightPurchaseDialog } from "@/components/highlight-purchase-dialog"
import {
  getBusinessMentions,
  getMentionStats,
  dismissMention,
  purchaseHighlightPlan,
} from "@/app/actions/mention-actions"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"

const quarterlyProjections = [
  { quarter: "Q1", itineraries: 200, mentions: 120, highlighted: 15, revenue: "$350" },
  { quarter: "Q2", itineraries: 800, mentions: 520, highlighted: 80, revenue: "$1,800" },
  { quarter: "Q3", itineraries: 2500, mentions: 1750, highlighted: 300, revenue: "$5,400" },
  { quarter: "Q4", itineraries: 5000, mentions: 3600, highlighted: 700, revenue: "$10,800" },
]

const PLAN_MAP: Record<string, string> = {
  "Single Mention": "single",
  "Bundle (5 mentions)": "bundle",
  "Monthly Unlimited": "monthly_unlimited",
  "Annual Unlimited": "annual_unlimited",
}

// Fallback static data when no business profile exists
const fallbackStats = [
  { label: "Total Mentions", value: "47", change: "+12", icon: Tag },
  { label: "Highlighted", value: "3", change: "of 5 included", icon: Sparkles },
  { label: "Highlight Views", value: "3,690", change: "+24%", icon: Eye },
  { label: "Booking Clicks", value: "82", change: "+31%", icon: Link2 },
]

const fallbackMentions = [
  {
    id: "demo-1",
    itinerary: "SF Food Tour: Mission to Marina",
    creator: "Sarah_Travels",
    date: "Feb 25, 2026",
    context: "\"Amazing dinner at The Coastal Kitchen - must try the seafood risotto!\"",
    highlighted: true,
    views: "1,240",
  },
  {
    id: "demo-2",
    itinerary: "Valentine's Day SF Guide",
    creator: "CityExplorer",
    date: "Feb 22, 2026",
    context: "\"Romantic dinner recommendation: The Coastal Kitchen on the waterfront\"",
    highlighted: true,
    views: "890",
  },
  {
    id: "demo-3",
    itinerary: "48 Hours in San Francisco",
    creator: "TravelWithMike",
    date: "Feb 20, 2026",
    context: "\"Grabbed brunch at Coastal Kitchen - the avocado toast is incredible\"",
    highlighted: false,
    views: "2,100",
  },
  {
    id: "demo-4",
    itinerary: "Best Restaurants Near Fisherman's Wharf",
    creator: "FoodieJen",
    date: "Feb 18, 2026",
    context: "\"Don't skip The Coastal Kitchen for their fresh catch of the day\"",
    highlighted: false,
    views: "670",
  },
  {
    id: "demo-5",
    itinerary: "Bay Area Weekend Escapes",
    creator: "NomadNina",
    date: "Feb 15, 2026",
    context: "\"Sunset dinner at Coastal Kitchen - the views and food are both stunning\"",
    highlighted: true,
    views: "1,560",
  },
]

interface MentionData {
  id: string
  itinerary: string
  creator: string
  date: string
  context: string
  highlighted: boolean
  views: string
  itineraryId?: string
}

interface StatsData {
  label: string
  value: string
  change: string
  icon: any
}

export function MentionsContent() {
  const [mentions, setMentions] = useState<MentionData[]>([])
  const [stats, setStats] = useState<StatsData[]>(fallbackStats)
  const [loading, setLoading] = useState(true)
  const [hasBusinessProfile, setHasBusinessProfile] = useState(false)
  const [remainingHighlights, setRemainingHighlights] = useState(0)
  const [hasUnlimited, setHasUnlimited] = useState(false)
  const [purchasingPlan, setPurchasingPlan] = useState<string | null>(null)
  const { toast } = useToast()

  const loadData = useCallback(async () => {
    try {
      const [mentionsResult, statsResult] = await Promise.all([
        getBusinessMentions(),
        getMentionStats(),
      ])

      if (statsResult.success && statsResult.data) {
        setHasBusinessProfile(true)
        const s = statsResult.data
        setRemainingHighlights(s.remainingHighlights)
        setHasUnlimited(s.hasUnlimited)

        setStats([
          { label: "Total Mentions", value: s.totalMentions.toString(), change: "", icon: Tag },
          {
            label: "Highlighted",
            value: s.highlightedCount.toString(),
            change: s.hasUnlimited
              ? "Unlimited plan"
              : s.remainingHighlights > 0
              ? `${s.remainingHighlights} remaining`
              : "Purchase a plan",
            icon: Sparkles,
          },
          { label: "Highlight Views", value: s.totalViews.toLocaleString(), change: "", icon: Eye },
          { label: "Booking Clicks", value: s.totalClicks.toLocaleString(), change: "", icon: Link2 },
        ])
      }

      if (mentionsResult.success && mentionsResult.data && mentionsResult.data.length > 0) {
        const mapped = mentionsResult.data.map((m: any) => {
          const itinerary = Array.isArray(m.itineraries) ? m.itineraries[0] : m.itineraries
          const owner = itinerary?.owner
          const ownerUsername = Array.isArray(owner) ? owner[0]?.username : owner?.username
          const metrics = itinerary?.metrics
          const viewCount = Array.isArray(metrics) ? metrics[0]?.view_count : metrics?.view_count

          return {
            id: m.id,
            itinerary: itinerary?.title || "Unknown Itinerary",
            itineraryId: itinerary?.id,
            creator: m.creator_username || ownerUsername || "unknown",
            date: new Date(m.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            context: m.context_snippet
              ? `"${m.context_snippet}"`
              : `Mentioned "${m.matched_text}" in ${m.match_field}`,
            highlighted: m.status === "highlighted",
            views: (viewCount || 0).toLocaleString(),
            highlightData: m.mention_highlights?.[0] || null,
          }
        })
        setMentions(mapped)
      } else {
        // Use fallback data for demo
        setMentions(fallbackMentions)
      }
    } catch (error) {
      console.error("Error loading mentions data:", error)
      setMentions(fallbackMentions)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleDismiss = async (mentionId: string) => {
    const result = await dismissMention(mentionId)
    if (result.success) {
      setMentions((prev) => prev.filter((m) => m.id !== mentionId))
      toast({ title: "Mention dismissed" })
    }
  }

  const handlePurchasePlan = async (planType: string) => {
    setPurchasingPlan(planType)
    try {
      const result = await purchaseHighlightPlan(planType)
      if (result.success) {
        toast({ title: "Plan purchased!", description: "You can now highlight mentions." })
        loadData()
      } else {
        toast({ title: "Error", description: result.error || "Failed to purchase plan", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" })
    } finally {
      setPurchasingPlan(null)
    }
  }

  if (loading) {
    return (
      <div className="mt-6 flex justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="mt-6 flex flex-col gap-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border">
            <CardContent className="pt-6">
              <stat.icon className="size-5 text-muted-foreground" />
              <p className="mt-3 text-2xl font-bold text-foreground">{stat.value}</p>
              <div className="flex items-center gap-1 mt-1">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
              {stat.change && (
                <p className="text-xs font-medium text-tinerary-salmon mt-0.5">{stat.change}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* How It Works */}
      <Card className="border-border bg-muted">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="size-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <Sparkles className="size-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">How Mention Highlights Work</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                When a free user creates a public itinerary and mentions your business, you are notified and can pay
                to &ldquo;highlight&rdquo; the mention — adding a visual badge, your logo, a booking link, and a special offer.
                The original itinerary is never altered; highlights appear as value-adding overlays.
              </p>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-card">
              <Bell className="size-4 text-tinerary-salmon" />
              <span className="text-xs text-foreground">Get notified of mentions</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-card">
              <Tag className="size-4 text-tinerary-gold" />
              <span className="text-xs text-foreground">Add badge + booking link</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-card">
              <BookOpen className="size-4 text-primary" />
              <span className="text-xs text-foreground">Overlay without editing</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="mentions">
        <TabsList className="w-full sm:w-auto bg-secondary">
          <TabsTrigger value="mentions" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Recent Mentions
          </TabsTrigger>
          <TabsTrigger value="pricing" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Highlight Pricing
          </TabsTrigger>
          <TabsTrigger value="projections" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Projections
          </TabsTrigger>
        </TabsList>

        {/* Recent Mentions */}
        <TabsContent value="mentions" className="mt-4">
          <div className="flex flex-col gap-4">
            {mentions.length === 0 ? (
              <Card className="border-border">
                <CardContent className="py-12 text-center">
                  <Tag className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No mentions yet. When users mention your business in their itineraries, they&apos;ll appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              mentions.map((mention) => (
                <Card key={mention.id} className="border-border">
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-semibold text-foreground">{mention.itinerary}</h4>
                          {mention.highlighted ? (
                            <Badge className="bg-tinerary-gold/20 text-tinerary-dark border-0 text-xs">
                              Highlighted
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Not Highlighted
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          By @{mention.creator} &middot; {mention.date}
                        </p>
                        <p className="text-sm text-foreground mt-2 italic leading-relaxed">{mention.context}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Eye className="size-3" /> {mention.views} views
                          </span>
                        </div>
                      </div>
                      {!mention.highlighted && (
                        <div className="flex items-center gap-2 shrink-0">
                          {hasBusinessProfile && !mention.id.startsWith("demo-") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() => handleDismiss(mention.id)}
                            >
                              <XCircle className="size-3.5" />
                            </Button>
                          )}
                          <HighlightPurchaseDialog
                            mentionId={mention.id}
                            itineraryTitle={mention.itinerary}
                            hasActivePlan={hasUnlimited || remainingHighlights > 0}
                            remainingHighlights={hasUnlimited ? -1 : remainingHighlights}
                            onHighlighted={loadData}
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Highlight Pricing */}
        <TabsContent value="pricing" className="mt-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Highlight Pricing</CardTitle>
              <CardDescription>
                Premium subscribers get 5 highlights/month included. Enterprise subscribers get unlimited.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {MENTION_HIGHLIGHTS.map((plan) => {
                  const planKey = PLAN_MAP[plan.name]
                  return (
                    <div
                      key={plan.name}
                      className="flex flex-col items-center p-5 rounded-2xl bg-muted text-center border border-border"
                    >
                      <p className="text-2xl font-bold text-primary">${plan.price}</p>
                      <p className="text-sm font-semibold text-foreground mt-1">{plan.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{plan.duration}</p>
                      <div className="w-full h-px bg-border my-3" />
                      <p className="text-xs text-muted-foreground leading-relaxed">{plan.includes}</p>
                      <button
                        className="mt-4 w-full px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                        disabled={purchasingPlan === planKey}
                        onClick={() => planKey && handlePurchasePlan(planKey)}
                      >
                        {purchasingPlan === planKey ? "Processing..." : "Purchase"}
                      </button>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projections */}
        <TabsContent value="projections" className="mt-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Mention Highlight Projections</CardTitle>
              <CardDescription>
                Annual projection: ~$18,350. Scales directly with user content creation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-tinerary-dark hover:bg-tinerary-dark">
                    <TableHead className="text-primary-foreground">Quarter</TableHead>
                    <TableHead className="text-primary-foreground text-right">Public Itineraries</TableHead>
                    <TableHead className="text-primary-foreground text-right">Biz Mentions</TableHead>
                    <TableHead className="text-primary-foreground text-right">Highlights Bought</TableHead>
                    <TableHead className="text-primary-foreground text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quarterlyProjections.map((row) => (
                    <TableRow key={row.quarter}>
                      <TableCell className="font-medium text-foreground">{row.quarter}</TableCell>
                      <TableCell className="text-right text-foreground">{row.itineraries.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-foreground">{row.mentions.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-foreground">{row.highlighted}</TableCell>
                      <TableCell className="text-right font-semibold text-tinerary-salmon">{row.revenue}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
