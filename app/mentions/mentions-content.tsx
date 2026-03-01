"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
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
  Crown,
  Lock,
  Shield,
  Zap,
  Infinity,
} from "lucide-react"
import { MENTION_HIGHLIGHTS } from "@/lib/tiers"
import { createClient } from "@/lib/supabase/client"
import {
  getBusinessSubscriptionByUserId,
  getEffectiveTier,
  getMentionHighlightsRemaining,
  canUseMentionHighlight,
  getTierLimits,
  type BusinessSubscription,
} from "@/lib/business-tier-service"
import type { BusinessTierSlug } from "@/lib/tiers"
import { HighlightPurchaseDialog } from "@/components/highlight-purchase-dialog"
import {
  getBusinessMentions,
  getMentionStats,
  dismissMention,
  purchaseHighlightPlan,
} from "@/app/actions/mention-actions"
import { useToast } from "@/components/ui/use-toast"

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
  const [tier, setTier] = useState<BusinessTierSlug>("basic")
  const [subscription, setSubscription] = useState<BusinessSubscription | null>(null)
  const [highlightsUsed, setHighlightsUsed] = useState(0)
  const [mentions, setMentions] = useState<MentionData[]>([])
  const [stats, setStats] = useState<StatsData[]>([])
  const [loading, setLoading] = useState(true)
  const [hasBusinessProfile, setHasBusinessProfile] = useState(false)
  const [remainingHighlights, setRemainingHighlights] = useState(0)
  const [hasUnlimited, setHasUnlimited] = useState(false)
  const [purchasingPlan, setPurchasingPlan] = useState<string | null>(null)
  const { toast } = useToast()

  const isEnt = tier === "enterprise"
  const limits = getTierLimits(tier)
  const highlightsIncluded = limits.mentionHighlightsIncluded
  const tierRemaining = getMentionHighlightsRemaining(tier, highlightsUsed)
  const canHighlight = canUseMentionHighlight(tier, highlightsUsed)

  const loadData = useCallback(async () => {
    try {
      // Load tier info
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { subscription: sub, businessTier } = await getBusinessSubscriptionByUserId(session.user.id)
        setSubscription(sub)
        const effectiveTier = getEffectiveTier(sub, businessTier)
        setTier(effectiveTier)
        setHighlightsUsed(sub?.mention_highlights_used || 0)
      }

      // Load real mentions data
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
          { label: "Total Mentions", value: s.totalMentions.toString(), change: "+12", icon: Tag },
          {
            label: "Highlighted",
            value: s.highlightedCount.toString(),
            change: s.hasUnlimited
              ? "Unlimited"
              : highlightsIncluded === Infinity
              ? "Unlimited"
              : tier === "basic" && s.remainingHighlights <= 0
              ? "Upgrade for included"
              : s.remainingHighlights > 0
              ? `${s.remainingHighlights} remaining`
              : `of ${highlightsIncluded} included`,
            icon: Sparkles,
          },
          { label: "Highlight Views", value: s.totalViews.toLocaleString(), change: "+24%", icon: Eye },
          { label: "Booking Clicks", value: s.totalClicks.toLocaleString(), change: "+31%", icon: Link2 },
        ])
      } else {
        // Fallback stats
        const highlightedCount = fallbackMentions.filter((m) => m.highlighted).length
        setStats([
          { label: "Total Mentions", value: "47", change: "+12", icon: Tag },
          {
            label: "Highlighted",
            value: `${highlightedCount}`,
            change: highlightsIncluded === Infinity
              ? "Unlimited"
              : tier === "basic"
                ? "Upgrade for included"
                : `of ${highlightsIncluded} included`,
            icon: Sparkles,
          },
          { label: "Highlight Views", value: "3,690", change: "+24%", icon: Eye },
          { label: "Booking Clicks", value: "82", change: "+31%", icon: Link2 },
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
          }
        })
        setMentions(mapped)
      } else {
        setMentions(fallbackMentions)
      }
    } catch (error) {
      console.error("Error loading mentions data:", error)
      setMentions(fallbackMentions)
    } finally {
      setLoading(false)
    }
  }, [tier, highlightsIncluded])

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
      <div className="mt-6 flex flex-col gap-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-border animate-pulse">
              <CardContent className="pt-6"><div className="h-16 bg-muted rounded" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mt-6 flex flex-col gap-6">
      {/* Premium highlight quota banner */}
      {tier !== "basic" && highlightsIncluded !== Infinity && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Crown className="size-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  Monthly Highlights: {highlightsUsed}/{highlightsIncluded} used
                </span>
              </div>
              <Badge className="bg-primary/10 text-primary border-0 text-xs">
                {tierRemaining} remaining
              </Badge>
            </div>
            <Progress
              value={(highlightsUsed / highlightsIncluded) * 100}
              className="h-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Your Premium plan includes {highlightsIncluded} mention highlights per month. Purchase additional highlights below.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Enterprise Unlimited Mentions Banner */}
      {isEnt && (
        <Card className="border-tinerary-gold/20 bg-gradient-to-r from-tinerary-gold/5 to-tinerary-peach/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-gradient-to-br from-tinerary-gold to-tinerary-peach flex items-center justify-center">
                  <Shield className="size-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-foreground">Unlimited Mention Highlights</h3>
                    <Badge className="bg-gradient-to-r from-tinerary-gold to-tinerary-peach text-tinerary-dark border-0 text-[10px]">
                      Enterprise
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    All organic mentions are automatically highlighted with your branding, logo, and booking link.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-tinerary-gold/10 border border-tinerary-gold/20">
                <Zap className="size-3 text-tinerary-gold" />
                <span className="text-[10px] font-bold text-tinerary-gold">AUTO-HIGHLIGHT ON</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {tier === "basic" && (
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Lock className="size-5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-bold text-foreground">Included Highlights Available on Premium</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Premium subscribers get 5 mention highlights per month included at no extra cost.
                  Enterprise subscribers get unlimited. You can still purchase individual highlights below.
                </p>
                <Button size="sm" className="btn-sunset mt-3" asChild>
                  <Link href="/business">Upgrade for Included Highlights</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                <p className={`text-xs font-medium mt-0.5 ${isEnt && stat.label === "Highlighted" ? "text-tinerary-gold" : "text-tinerary-salmon"}`}>
                  {stat.change}
                </p>
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
                {isEnt && (
                  <strong className="text-tinerary-gold"> Enterprise accounts get unlimited auto-highlighting — every mention is highlighted automatically.</strong>
                )}
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
              <span className="text-xs text-foreground">
                {isEnt ? "Auto-add badge + booking link" : "Add badge + booking link"}
              </span>
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

        {/* Recent Mentions — enterprise auto-highlights all */}
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
              mentions.map((mention) => {
                const isHighlighted = isEnt ? true : mention.highlighted
                return (
                  <Card key={mention.id} className="border-border">
                    <CardContent className="pt-6">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-semibold text-foreground">{mention.itinerary}</h4>
                            {isHighlighted ? (
                              <Badge className={`border-0 text-xs ${isEnt ? "bg-tinerary-gold/20 text-tinerary-gold" : "bg-tinerary-gold/20 text-tinerary-dark"}`}>
                                {isEnt ? "Auto-Highlighted" : "Highlighted"}
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
                        {!isHighlighted && (
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
                              hasActivePlan={hasUnlimited || remainingHighlights > 0 || (tier !== "basic" && canHighlight)}
                              remainingHighlights={hasUnlimited ? -1 : remainingHighlights}
                              onHighlighted={loadData}
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>

        {/* Highlight Pricing */}
        <TabsContent value="pricing" className="mt-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Highlight Pricing</CardTitle>
              <CardDescription>
                {isEnt
                  ? "Your Enterprise plan includes unlimited highlights — all mentions are auto-highlighted at no extra cost."
                  : "Premium subscribers get 5 highlights/month included. Enterprise subscribers get unlimited."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isEnt ? (
                <div className="p-6 rounded-2xl bg-gradient-to-r from-tinerary-gold/10 to-tinerary-peach/10 border border-tinerary-gold/20 text-center">
                  <Infinity className="size-8 mx-auto text-tinerary-gold mb-3" />
                  <h3 className="text-lg font-bold text-foreground">Unlimited Highlights Included</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                    Your Enterprise plan automatically highlights every organic mention of your business
                    with your branding, logo, and booking link — at no additional cost.
                  </p>
                </div>
              ) : (
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
              )}
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
