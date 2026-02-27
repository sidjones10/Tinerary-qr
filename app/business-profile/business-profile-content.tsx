"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Globe,
  Star,
  Clock,
  Eye,
  CheckCircle2,
  ArrowRight,
  Tag,
  BarChart3,
  Mail,
  Crown,
  MousePointerClick,
  Bookmark,
  TrendingUp,
  Sparkles,
  Headphones,
  FileBarChart,
  Ticket,
  Megaphone,
  Zap,
  Shield,
  Key,
  DollarSign,
  Link2,
  Coins,
  Store,
  Palette,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { getPlanLimits } from "@/lib/business-plan"
import { BUSINESS_TIERS } from "@/lib/tiers"
import type { BusinessTierSlug } from "@/lib/tiers"
import {
  getBusinessSubscription,
  getEffectiveTier,
  getTierLimits,
  type BusinessSubscription,
} from "@/lib/business-tier-service"
import { EnterpriseProfileBadge, TopTierPlacementIndicator } from "@/components/enterprise-badge"
import { EnterpriseAccountManager } from "@/components/enterprise-account-manager"
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

// Hub spoke links — tier-gated, mirroring the creator hub pattern
function getHubLinks(tier: BusinessTierSlug, limits: ReturnType<typeof getPlanLimits>, premiumLimits: ReturnType<typeof getTierLimits>) {
  const isEnt = isEnterprise(tier)
  const allLinks = [
    {
      href: "/deals/manage",
      icon: Ticket,
      title: "Deals & Promotions",
      description: limits.maxActivePromotions === null
        ? "Unlimited promotions — create, manage & track"
        : `Up to ${limits.maxActivePromotions} active promotions`,
      color: "text-tinerary-gold",
      bgColor: "bg-tinerary-gold/10",
      tiers: ["basic", "premium", "enterprise"] as const,
    },
    {
      href: "/business-analytics",
      icon: BarChart3,
      title: premiumLimits.analyticsLevel === "realtime" ? "Real-time Analytics" : premiumLimits.analyticsLevel === "advanced" ? "Advanced Analytics" : "Analytics",
      description: tier === "basic"
        ? "Basic performance overview"
        : tier === "enterprise"
          ? "Real-time analytics with API access & competitor benchmarks"
          : "Advanced insights: audience, geography & trends",
      color: "text-primary",
      bgColor: "bg-primary/10",
      tiers: ["basic", "premium", "enterprise"] as const,
    },
    {
      href: "/mentions",
      icon: Megaphone,
      title: "Mention Highlights",
      description: premiumLimits.mentionHighlightsIncluded === Infinity
        ? "Unlimited highlights — auto-highlighted"
        : `${premiumLimits.mentionHighlightsIncluded} highlights/mo included`,
      color: "text-tinerary-salmon",
      bgColor: "bg-tinerary-salmon/10",
      tiers: ["premium", "enterprise"] as const,
    },
    {
      href: "/transactions",
      icon: DollarSign,
      title: "Transactions & Commission",
      description: "Bookings, revenue & commission tracking",
      color: "text-green-600",
      bgColor: "bg-green-600/10",
      tiers: ["premium", "enterprise"] as const,
    },
    {
      href: "/affiliate",
      icon: Link2,
      title: "Affiliate Marketing",
      description: "Referral links & packing list commerce",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      tiers: ["basic", "premium", "enterprise"] as const,
    },
    {
      href: "/coins",
      icon: Coins,
      title: "Tinerary Coins",
      description: "Earn & spend rewards across the platform",
      color: "text-tinerary-gold",
      bgColor: "bg-tinerary-gold/10",
      tiers: ["basic", "premium", "enterprise"] as const,
    },
  ]

  return allLinks.filter((link) => link.tiers.includes(tier))
}

export function BusinessProfileContent() {
  const [business, setBusiness] = useState<BusinessData | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<BusinessSubscription | null>(null)
  const [summaryStats, setSummaryStats] = useState({ views: 0, clicks: 0, saves: 0, activeDeals: 0 })

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      setLoading(false)
      return
    }

    const { data: biz } = await supabase
      .from("businesses")
      .select("*")
      .eq("user_id", session.user.id)
      .single()

    if (biz) {
      setBusiness(biz)

      const sub = await getBusinessSubscription(biz.id)
      setSubscription(sub)

      // Fetch summary stats only (no deal list needed on hub)
      const { data: promos } = await supabase
        .from("promotions")
        .select("status, promotion_metrics(views, clicks, saves)")
        .eq("business_id", biz.id)

      if (promos) {
        const activeDeals = promos.filter((p: any) => p.status === "active").length
        const views = promos.reduce((s: number, p: any) => s + ((p.promotion_metrics as any)?.views || 0), 0)
        const clicks = promos.reduce((s: number, p: any) => s + ((p.promotion_metrics as any)?.clicks || 0), 0)
        const saves = promos.reduce((s: number, p: any) => s + ((p.promotion_metrics as any)?.saves || 0), 0)
        setSummaryStats({ views, clicks, saves, activeDeals })
      }
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

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
  const isEnt = isEnterprise(tier)
  const hubLinks = getHubLinks(tier, limits, premiumLimits)

  const brandingConfig = business.branding_config
  const coverStyle = isEnt && brandingConfig
    ? {
        background: `linear-gradient(135deg, ${brandingConfig.primaryColor || "#1a1a2e"}, ${brandingConfig.secondaryColor || "#16213e"})`,
      }
    : undefined

  return (
    <div className="mt-6 flex flex-col gap-6">
      {/* ── Profile Card ── */}
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
                {isEnt && <TopTierPlacementIndicator tier={tier} />}
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

      {/* ── Tier Banner (Premium / Enterprise) ── */}
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

      {/* ── Enterprise Unlimited Banner ── */}
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

      {/* ── API Key (Enterprise only) ── */}
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

      {/* ── Dedicated Account Manager (Enterprise only) ── */}
      {isEnt && (
        <EnterpriseAccountManager manager={ENTERPRISE_ACCOUNT_MANAGERS[0]} />
      )}

      {/* ── Quick Stats (read-only summary) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Views", value: summaryStats.views.toLocaleString(), icon: Eye, color: "text-blue-500" },
          { label: "Total Clicks", value: summaryStats.clicks.toLocaleString(), icon: MousePointerClick, color: "text-green-500" },
          { label: "Total Saves", value: summaryStats.saves.toLocaleString(), icon: Bookmark, color: "text-orange-500" },
          { label: "Active Deals", value: summaryStats.activeDeals.toString(), icon: Ticket, color: "text-purple-500" },
        ].map((stat) => (
          <Card key={stat.label} className="border-border">
            <CardContent className="pt-6">
              <stat.icon className={`size-5 ${stat.color}`} />
              <p className="mt-3 text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Business Tools (hub spoke links) ── */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">Business Tools</CardTitle>
          <CardDescription>
            {isEnt
              ? "All enterprise tools and dashboards are unlocked."
              : tier === "premium"
                ? "Your premium tools and dashboards."
                : "Manage your business and explore available tools."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {hubLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <div className="flex items-start gap-3 p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/50 transition-all cursor-pointer h-full">
                  <div className={`size-10 rounded-xl ${link.bgColor} flex items-center justify-center shrink-0`}>
                    <link.icon className={`size-5 ${link.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-foreground">{link.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{link.description}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs font-medium text-primary">
                      Open <ArrowRight className="size-3" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Tier-locked features teaser for Basic */}
          {tier === "basic" && (
            <div className="mt-4 p-4 rounded-xl bg-muted/50 border border-dashed border-border">
              <p className="text-xs font-semibold text-foreground mb-2">Unlock with Premium or Enterprise:</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: Megaphone, label: "Mention Highlights" },
                  { icon: DollarSign, label: "Transaction Tracking" },
                  { icon: Palette, label: "Custom Branding" },
                  { icon: FileBarChart, label: "Advanced Reports" },
                ].map((feat) => (
                  <div key={feat.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <feat.icon className="size-3 shrink-0" />
                    {feat.label}
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
                <Link href="/business">
                  View Premium Plans
                  <ArrowRight className="ml-2 size-3" />
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Current Plan Overview ── */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="size-5 text-tinerary-gold" />
              <div>
                <CardTitle className="text-base">
                  {tierConfig?.name || "Basic"} Plan — ${tierConfig?.price || 49}/{tierConfig?.priceSuffix || "per month"}
                </CardTitle>
                <CardDescription>
                  {tier === "basic" && "Standard listing placement with essential business tools"}
                  {tier === "premium" && "Featured placement with advanced analytics and unlimited promotions"}
                  {tier === "enterprise" && "Full enterprise suite with dedicated support and unlimited everything"}
                </CardDescription>
              </div>
            </div>
            {tier !== "enterprise" && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/business">
                  Upgrade
                  <ArrowRight className="ml-1 size-3" />
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(tierConfig?.features || []).map((feature) => (
              <div key={feature} className="flex items-start gap-2">
                <CheckCircle2 className="size-3.5 text-primary shrink-0 mt-0.5" />
                <span className="text-xs text-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Support Info ── */}
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`size-10 rounded-xl flex items-center justify-center ${
                isEnt ? "bg-tinerary-gold" : tier === "premium" ? "bg-primary" : "bg-muted"
              }`}>
                {isEnt ? <Headphones className="size-5 text-white" /> : <Mail className={`size-5 ${tier === "premium" ? "text-white" : "text-muted-foreground"}`} />}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {limits.supportLevel === "email" ? "Email Support" : limits.supportLevel === "priority" ? "Priority Support" : "Dedicated Account Manager"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {limits.supportLevel === "email"
                    ? "We respond within 24-48 hours at business-support@tinerary.com"
                    : limits.supportLevel === "priority"
                    ? "Priority queue with 4-8 hour response times"
                    : "Your dedicated manager is available directly"}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="mailto:business-support@tinerary.com">
                <Mail className="mr-2 size-4" />
                Contact
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Upgrade CTA (Basic tier) ── */}
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
                  Get featured placement, unlimited promotions, advanced analytics, priority support, mention highlights, and booking integration.
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
