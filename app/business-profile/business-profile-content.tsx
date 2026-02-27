"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Globe,
  Star,
  Clock,
  Eye,
  CalendarDays,
  CheckCircle2,
  ArrowUpRight,
  Trash2,
  Tag,
  BarChart3,
  Mail,
  FileText,
  Crown,
  MousePointerClick,
  Bookmark,
  TrendingUp,
  Download,
  AlertCircle,
  Sparkles,
  Headphones,
  FileBarChart,
  Ticket,
  Megaphone,
  Zap,
  Shield,
  Key,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { CreateDealDialog } from "@/components/create-deal-dialog"
import { deleteDeal, generatePerformanceReport } from "@/app/actions/promotion-actions"
import { PLAN_LIMITS, getPlanLimits } from "@/lib/business-plan"
import { BUSINESS_TIERS } from "@/lib/tiers"
import type { BusinessTierSlug } from "@/lib/tiers"
import {
  getBusinessSubscription,
  getEffectiveTier,
  getTierLimits,
  type BusinessSubscription,
} from "@/lib/business-tier-service"
import { EnterpriseProfileBadge, EnterpriseBadge, TopTierPlacementIndicator } from "@/components/enterprise-badge"
import { EnterpriseAccountManager } from "@/components/enterprise-account-manager"
import { EnterpriseAnalyticsDashboard } from "@/components/enterprise-analytics-dashboard"
import { EnterpriseBrandedProfile } from "@/components/enterprise-branded-profile"
import {
  getTierFeatures,
  isEnterprise,
  ENTERPRISE_ACCOUNT_MANAGERS,
  ENTERPRISE_UNLIMITED_FEATURES,
  type EnterpriseBrandingConfig,
} from "@/lib/enterprise"

interface BusinessData {
  id: string
  name: string
  description: string | null
  logo: string | null
  website: string | null
  category: string
  rating: number | null
  review_count: number | null
  created_at: string
  business_tier?: string
  branding_config?: EnterpriseBrandingConfig | null
  enterprise_badge_enabled?: boolean
  priority_placement?: boolean
  unlimited_mentions?: boolean
  api_key?: string | null
  api_enabled?: boolean
}

interface DealData {
  id: string
  title: string
  type: string
  category: string
  status: string
  location: string
  price: number | null
  discount: number | null
  start_date: string
  end_date: string
  promotion_metrics?: {
    views: number
    clicks: number
    saves: number
  } | null
}

export function BusinessProfileContent() {
  const [business, setBusiness] = useState<BusinessData | null>(null)
  const [deals, setDeals] = useState<DealData[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [subscription, setSubscription] = useState<BusinessSubscription | null>(null)
  const { toast } = useToast()

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      setLoading(false)
      return
    }

    // Fetch business profile
    const { data: biz } = await supabase
      .from("businesses")
      .select("*")
      .eq("user_id", session.user.id)
      .single()

    if (biz) {
      setBusiness(biz)

      // Fetch subscription
      const sub = await getBusinessSubscription(biz.id)
      setSubscription(sub)

      // Fetch deals for this business
      const { data: promos } = await supabase
        .from("promotions")
        .select("*, promotion_metrics(*)")
        .eq("business_id", biz.id)
        .order("created_at", { ascending: false })

      setDeals(promos || [])
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleDeleteDeal(id: string) {
    setDeletingId(id)
    try {
      const result = await deleteDeal(id)
      if (result && "success" in result && result.success) {
        setDeals((prev: DealData[]) => prev.filter((d: DealData) => d.id !== id))
        toast({ title: "Deal deleted" })
      } else {
        toast({ title: "Error", description: "Failed to delete deal.", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete deal.", variant: "destructive" })
    } finally {
      setDeletingId(null)
    }
  }

  async function handleGenerateReport() {
    setGeneratingReport(true)
    try {
      const result = await generatePerformanceReport()
      if (result.success && result.data) {
        const report = result.data
        const reportText = [
          `Performance Report — ${report.businessName}`,
          `Plan: ${report.tier.charAt(0).toUpperCase() + report.tier.slice(1)}`,
          `Period: ${report.period}`,
          `Generated: ${new Date(report.generatedAt).toLocaleDateString()}`,
          ``,
          `--- Metrics ---`,
          `Total Promotions: ${report.metrics.totalPromotions}`,
          `Active Promotions: ${report.metrics.activePromotions}`,
          `Total Views: ${report.metrics.totalViews}`,
          `Total Clicks: ${report.metrics.totalClicks}`,
          `Total Saves: ${report.metrics.totalSaves}`,
          `Click-Through Rate: ${report.metrics.clickThroughRate}%`,
          `Top Promotion: ${report.metrics.topPromotion}`,
        ].join("\n")

        const blob = new Blob([reportText], { type: "text/plain" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `tinerary-report-${new Date().toISOString().split("T")[0]}.txt`
        a.click()
        URL.revokeObjectURL(url)

        toast({ title: "Report downloaded", description: "Your performance report has been generated." })
      } else {
        toast({ title: "Error", description: "Failed to generate report.", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Failed to generate report.", variant: "destructive" })
    } finally {
      setGeneratingReport(false)
    }
  }

  if (loading) {
    return (
      <div className="mt-6 flex flex-col gap-6">
        <Card className="overflow-hidden border-border animate-pulse">
          <div className="h-32 bg-muted" />
          <CardContent className="pt-6"><div className="h-6 w-48 bg-muted rounded" /></CardContent>
        </Card>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="mt-6">
        <Card className="border-border">
          <CardContent className="py-12 text-center">
            <Tag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Business Profile Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create a business profile to start listing deals and reaching travelers on Tinerary.
            </p>
            <p className="text-xs text-muted-foreground">
              To get started, upgrade to a business account on the{" "}
              <a href="/business" className="text-primary hover:underline">Business Plans</a> page.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const tier = (business.business_tier || "basic") as BusinessTierSlug
  const limits = getPlanLimits(tier)
  const premiumLimits = getTierLimits(tier)
  const tierConfig = BUSINESS_TIERS.find((t) => t.slug === tier)
  const enterpriseFeatures = getTierFeatures(tier)
  const isEnt = isEnterprise(tier)

  const activeDeals = deals.filter((d: DealData) => d.status === "active")
  const totalViews = deals.reduce((sum: number, d: DealData) => sum + ((d.promotion_metrics as any)?.views || 0), 0)
  const totalClicks = deals.reduce((sum: number, d: DealData) => sum + ((d.promotion_metrics as any)?.clicks || 0), 0)
  const totalSaves = deals.reduce((sum: number, d: DealData) => sum + ((d.promotion_metrics as any)?.saves || 0), 0)
  const clickThroughRate = totalViews > 0 ? Math.round((totalClicks / totalViews) * 10000) / 100 : 0

  const promotionLimitReached =
    limits.maxActivePromotions !== null && activeDeals.length >= limits.maxActivePromotions

  // Enterprise branding config
  const brandingConfig = business.branding_config
  const coverStyle = isEnt && brandingConfig
    ? {
        background: `linear-gradient(135deg, ${brandingConfig.primaryColor || "#1a1a2e"}, ${brandingConfig.secondaryColor || "#16213e"})`,
      }
    : undefined

  return (
    <div className="mt-6 flex flex-col gap-6">
      {/* Subscription Tier Banner (premium/enterprise) */}
      {tier !== "basic" && (
        <Card className={`border-border overflow-hidden ${tier === "premium" ? "ring-2 ring-primary/30" : "ring-2 ring-tinerary-gold/40"}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`size-10 rounded-xl flex items-center justify-center ${
                  tier === "enterprise" ? "bg-tinerary-gold" : "bg-primary"
                }`}>
                  {isEnt ? <Shield className="size-5 text-white" /> : <Crown className="size-5 text-white" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-foreground">{tierConfig?.name || "Premium"} Plan</h3>
                    <Badge className={tier === "enterprise" ? "bg-tinerary-gold/20 text-tinerary-dark border-0" : "bg-primary/10 text-primary border-0"}>
                      Active
                    </Badge>
                    {isEnt && <TopTierPlacementIndicator tier={tier} />}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {tier === "premium" && "Featured placement, unlimited promotions, advanced analytics, and priority support."}
                    {tier === "enterprise" && "Top-tier placement, real-time analytics, dedicated manager, and unlimited everything."}
                  </p>
                </div>
              </div>
            </div>

            {/* Feature indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
              {[
                { icon: Sparkles, label: isEnt ? "Top-tier Placement" : "Featured Placement", active: premiumLimits.featuredPlacement },
                { icon: BarChart3, label: premiumLimits.analyticsLevel === "realtime" ? "Real-time Analytics" : "Advanced Analytics", active: true },
                { icon: Headphones, label: premiumLimits.supportLevel === "dedicated" ? "Dedicated Manager" : "Priority Support", active: true },
                { icon: Ticket, label: isEnt ? "Priority Booking" : "Booking Integration", active: premiumLimits.bookingIntegration },
              ].map((feat) => (
                <div key={feat.label} className="flex items-center gap-1.5 p-2 rounded-lg bg-muted/50">
                  <feat.icon className="size-3.5 text-primary shrink-0" />
                  <span className="text-xs text-foreground truncate">{feat.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enterprise Unlimited Features Banner */}
      {isEnt && (
        <Card className="border-tinerary-gold/20 bg-gradient-to-r from-tinerary-gold/5 to-tinerary-peach/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="size-4 text-tinerary-gold" />
              <h3 className="text-sm font-bold text-foreground">Enterprise Unlimited</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {Object.entries(ENTERPRISE_UNLIMITED_FEATURES).slice(0, 5).map(([key, description]) => (
                <div key={key} className="flex items-start gap-1.5 p-2 rounded-lg bg-card/50">
                  <CheckCircle2 className="size-3 text-tinerary-gold shrink-0 mt-0.5" />
                  <span className="text-[10px] text-muted-foreground leading-tight">{description.split(" ").slice(0, 4).join(" ")}...</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Card with Plan Badge */}
      <Card className={`overflow-hidden ${isEnt ? "border-tinerary-gold/20" : "border-border"}`}>
        <div
          className={`h-32 ${
            !coverStyle
              ? tier === "enterprise"
                ? "bg-gradient-to-r from-tinerary-gold via-amber-400 to-orange-400"
                : tier === "premium"
                  ? "bg-gradient-to-r from-primary via-blue-500 to-indigo-500"
                  : "bg-gradient-to-r from-tinerary-peach to-secondary"
              : ""
          }`}
          style={coverStyle}
        >
          {isEnt && brandingConfig?.coverImageUrl && (
            <img src={brandingConfig.coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
          )}
        </div>
        <CardContent className="relative -mt-12">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className={`size-24 rounded-2xl bg-card border-4 border-card flex items-center justify-center shadow-md ${
              tier !== "basic" ? "ring-2 ring-primary/30" : ""
            }`}>
              {business.logo ? (
                <img src={business.logo} alt={business.name} className="size-full rounded-2xl object-cover" />
              ) : (
                <span className="text-3xl font-bold text-tinerary-salmon">
                  {business.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                {isEnt ? (
                  <EnterpriseProfileBadge tier={tier} businessName={business.name} />
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-foreground">{business.name}</h2>
                    <CheckCircle2 className={`size-5 ${tier === "premium" ? "text-primary" : "text-muted-foreground"}`} />
                  </>
                )}
                <Badge className={`text-xs border-0 ${
                  tier === "enterprise"
                    ? "bg-tinerary-gold/20 text-tinerary-dark"
                    : tier === "premium"
                      ? "bg-primary/10 text-primary"
                      : "bg-primary text-primary-foreground"
                }`}>
                  {tierConfig?.name || "Basic"} Plan
                </Badge>
              </div>
              {business.description && (
                <p className="text-sm text-muted-foreground mt-0.5">{business.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Tag className="size-3" /> {business.category}
                </span>
                {business.website && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Globe className="size-3" /> {business.website}
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" /> Joined {new Date(business.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </span>
                {business.rating && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="size-3" /> {business.rating} ({business.review_count || 0} reviews)
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="size-3" /> {limits.listingPlacement === "standard" ? "Standard" : limits.listingPlacement === "featured" ? "Featured" : "Top-tier"} listing
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Key Info (Enterprise only) */}
      {isEnt && business.api_key && (
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">API Access</p>
                  <p className="text-xs text-muted-foreground">Use your API key to access analytics and reports programmatically.</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-[10px] font-mono">
                {business.api_key.slice(0, 8)}...{business.api_key.slice(-4)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dedicated Account Manager (Enterprise only) */}
      {isEnt && (
        <EnterpriseAccountManager manager={ENTERPRISE_ACCOUNT_MANAGERS[0]} />
      )}

      {/* Plan Overview (basic tier) */}
      {tier === "basic" && (
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="size-5 text-tinerary-gold" />
                <div>
                  <CardTitle className="text-base">
                    {tierConfig?.name || "Basic"} Plan — ${tierConfig?.price || 49}/{tierConfig?.priceSuffix || "per month"}
                  </CardTitle>
                  <CardDescription>Standard listing placement with essential business tools</CardDescription>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/business">
                  Upgrade
                  <ArrowUpRight className="ml-1 size-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(tierConfig?.features || [
                "Standard listing placement",
                "Business profile page",
                "Up to 5 active promotions",
                "Basic analytics dashboard",
                "Email support",
                "Monthly performance report",
              ]).map((feature) => (
                <div key={feature} className="flex items-start gap-2">
                  <CheckCircle2 className="size-3.5 text-primary shrink-0 mt-0.5" />
                  <span className="text-xs text-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Dashboard — Enterprise gets the full real-time dashboard */}
      {isEnt ? (
        <EnterpriseAnalyticsDashboard tier={tier} />
      ) : (
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="size-5 text-tinerary-gold" />
              <div>
                <CardTitle className="text-base">Analytics Dashboard</CardTitle>
                <CardDescription>
                  {limits.analyticsLevel === "basic"
                    ? "Basic performance overview for your promotions"
                    : limits.analyticsLevel === "advanced"
                    ? "Advanced analytics with deeper insights"
                    : "Real-time analytics with API access"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Total Views", value: totalViews.toLocaleString(), icon: Eye, color: "text-blue-500" },
                { label: "Total Clicks", value: totalClicks.toLocaleString(), icon: MousePointerClick, color: "text-green-500" },
                { label: "Total Saves", value: totalSaves.toLocaleString(), icon: Bookmark, color: "text-orange-500" },
                { label: "Click Rate", value: `${clickThroughRate}%`, icon: TrendingUp, color: "text-purple-500" },
              ].map((stat) => (
                <div key={stat.label} className="p-4 rounded-xl bg-muted">
                  <stat.icon className={`size-5 ${stat.color}`} />
                  <p className="mt-2 text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Promotion Limits */}
            {limits.maxActivePromotions !== null && (
              <div className="mb-6 p-4 rounded-xl bg-muted">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Active Promotions</span>
                  <span className="text-sm text-muted-foreground">{activeDeals.length} / {limits.maxActivePromotions}</span>
                </div>
                <Progress value={(activeDeals.length / limits.maxActivePromotions) * 100} className="h-2" />
                {promotionLimitReached && (
                  <p className="text-xs text-orange-500 mt-2 flex items-center gap-1">
                    <AlertCircle className="size-3" />
                    Limit reached. Upgrade to Premium for unlimited promotions.
                  </p>
                )}
              </div>
            )}

            {/* Per-Promotion Performance */}
            {deals.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Promotion Performance</h4>
                <div className="space-y-2">
                  {deals.map((deal: DealData) => {
                    const views = (deal.promotion_metrics as any)?.views || 0
                    const clicks = (deal.promotion_metrics as any)?.clicks || 0
                    const saves = (deal.promotion_metrics as any)?.saves || 0
                    const ctr = views > 0 ? Math.round((clicks / views) * 10000) / 100 : 0
                    return (
                      <div key={deal.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{deal.title}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-muted-foreground">{views} views</span>
                            <span className="text-xs text-muted-foreground">{clicks} clicks</span>
                            <span className="text-xs text-muted-foreground">{saves} saves</span>
                            <span className="text-xs text-muted-foreground">{ctr}% CTR</span>
                          </div>
                        </div>
                        <Badge variant="secondary" className={deal.status === "active" ? "bg-tinerary-peach text-tinerary-dark border-0" : "bg-secondary text-secondary-foreground border-0"}>
                          {deal.status}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Custom Branded Profile (Enterprise only, shows locked state for others) */}
      <EnterpriseBrandedProfile tier={tier} brandingConfig={brandingConfig} />

      {/* Premium Quick Links */}
      {tier !== "basic" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/mentions">
            <Card className="border-border hover:shadow-md transition-all hover:-translate-y-0.5 h-full cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-1">
                  <Megaphone className="size-5 text-tinerary-salmon" />
                  <h3 className="text-sm font-semibold text-foreground">Mention Highlights</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  {premiumLimits.mentionHighlightsIncluded === Infinity
                    ? "Unlimited highlights included"
                    : `${premiumLimits.mentionHighlightsIncluded} highlights/mo included`}
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/business-analytics">
            <Card className="border-border hover:shadow-md transition-all hover:-translate-y-0.5 h-full cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-1">
                  <FileBarChart className="size-5 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">
                    {premiumLimits.reportFrequency === "daily" ? "Daily" : premiumLimits.reportFrequency === "weekly" ? "Weekly" : "Monthly"} Reports
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground">Performance reports delivered to your inbox</p>
              </CardContent>
            </Card>
          </Link>
          {premiumLimits.bookingIntegration && (
            <Link href="/deals">
              <Card className="border-border hover:shadow-md transition-all hover:-translate-y-0.5 h-full cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-1">
                    <Ticket className="size-5 text-tinerary-gold" />
                    <h3 className="text-sm font-semibold text-foreground">Booking Integration</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isEnt ? "Priority placement in all booking feeds" : "Direct bookings from your listings"}
                  </p>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>
      )}

      {/* Deals Management */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Deals</CardTitle>
              <CardDescription>
                Create and manage deals that travelers will see on Tinerary
                {isEnt
                  ? " — Enterprise accounts get priority booking placement"
                  : limits.maxActivePromotions !== null
                    ? ` (${activeDeals.length}/${limits.maxActivePromotions} active)`
                    : ""}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isEnt && <Badge variant="secondary" className="text-[10px]">Unlimited</Badge>}
              <CreateDealDialog
                onDealCreated={loadData}
                disabled={promotionLimitReached}
                activeCount={activeDeals.length}
                maxCount={limits.maxActivePromotions}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {deals.length === 0 ? (
            <div className="text-center py-8">
              <Tag className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No deals yet. Create your first deal to start reaching travelers.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {deals.map((deal: DealData) => (
                <div key={deal.id} className="flex items-center justify-between p-3 rounded-xl bg-muted">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">{deal.title}</p>
                      {isEnt && enterpriseFeatures.hasPriorityBookingPlacement && (
                        <Badge variant="outline" className="text-[10px] border-tinerary-gold/30 text-tinerary-gold">
                          <Crown className="size-2.5 mr-0.5" /> Priority
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {deal.type} &middot; {deal.category} &middot; {deal.location}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(deal.start_date).toLocaleDateString()} – {new Date(deal.end_date).toLocaleDateString()}
                      {deal.price != null && ` · $${deal.price}`}
                      {deal.discount != null && ` · ${deal.discount}% off`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <div className="text-right mr-2 hidden sm:block">
                      <p className="text-xs text-muted-foreground">{(deal.promotion_metrics as any)?.views || 0} views</p>
                    </div>
                    <Badge variant="secondary" className={deal.status === "active" ? "bg-tinerary-peach text-tinerary-dark border-0" : "bg-secondary text-secondary-foreground border-0"}>
                      {deal.status}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteDeal(deal.id)} disabled={deletingId === deal.id}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Report */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="size-5 text-tinerary-salmon" />
            <div>
              <CardTitle className="text-base">Performance Reports</CardTitle>
              <CardDescription>
                {limits.reportFrequency === "monthly"
                  ? "Download your monthly performance summary"
                  : limits.reportFrequency === "weekly"
                  ? "Download your weekly performance summary"
                  : "Download your daily performance summary"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-muted">
            <div>
              <p className="text-sm font-medium text-foreground">
                {limits.reportFrequency.charAt(0).toUpperCase() + limits.reportFrequency.slice(1)} Report
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Includes views, clicks, saves, CTR, and top-performing promotions
                {isEnt && " plus trend analysis, competitor benchmarks, and recommendations"}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleGenerateReport} disabled={generatingReport}>
              <Download className="mr-2 size-4" />
              {generatingReport ? "Generating..." : "Download Report"}
            </Button>
          </div>
          {tier === "basic" && (
            <p className="text-xs text-muted-foreground mt-3">
              Upgrade to Premium for weekly reports, or Enterprise for daily reports.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Support */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="size-5 text-blue-500" />
            <div>
              <CardTitle className="text-base">Support</CardTitle>
              <CardDescription>
                {limits.supportLevel === "email"
                  ? "Get help via email support"
                  : limits.supportLevel === "priority"
                  ? "Priority support with faster response times"
                  : "Dedicated account manager"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-muted">
            <div>
              <p className="text-sm font-medium text-foreground">
                {limits.supportLevel === "email" ? "Email Support" : limits.supportLevel === "priority" ? "Priority Support" : "Dedicated Account Manager"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {limits.supportLevel === "email"
                  ? "Reach our team at business-support@tinerary.com. We respond within 24-48 hours."
                  : limits.supportLevel === "priority"
                  ? "Priority queue with 4-8 hour response times."
                  : "Your dedicated manager is available directly."}
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="mailto:business-support@tinerary.com">
                <Mail className="mr-2 size-4" />
                Contact Support
              </a>
            </Button>
          </div>
          {tier === "basic" && (
            <p className="text-xs text-muted-foreground mt-3">
              Upgrade to Premium for priority support or Enterprise for a dedicated account manager.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Upgrade CTA for basic tier */}
      {tier === "basic" && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="size-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
                <Zap className="size-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-foreground">Upgrade to Premium</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-3">
                  Get featured placement in feeds, unlimited promotions, advanced analytics, priority support, weekly reports, booking integration, and 5 mention highlights per month.
                </p>
                <Button className="btn-sunset" asChild>
                  <Link href="/business">View Premium Plans</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
