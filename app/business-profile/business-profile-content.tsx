"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Store,
  BarChart3,
  Megaphone,
  DollarSign,
  Ticket,
  Link2,
  Crown,
  Eye,
  MousePointerClick,
  Bookmark,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Shield,
  Headphones,
  Mail,
  Coins,
  Zap,
  Rocket,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { BUSINESS_TIERS } from "@/lib/tiers"
import type { BusinessTierSlug } from "@/lib/tiers"
import {
  getBusinessSubscription,
  getEffectiveTier,
  getTierLimits,
} from "@/lib/business-tier-service"

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
}

// ─── Tier Theme ──────────────────────────────────────────────

const TIER_THEME: Record<BusinessTierSlug, { bg: string; badgeCls: string; gradientCls: string }> = {
  basic: {
    bg: "bg-primary",
    badgeCls: "bg-primary text-primary-foreground",
    gradientCls: "from-primary/10 to-tinerary-peach/20",
  },
  premium: {
    bg: "bg-primary",
    badgeCls: "bg-primary/10 text-primary",
    gradientCls: "from-primary/10 to-blue-500/20",
  },
  enterprise: {
    bg: "bg-tinerary-gold",
    badgeCls: "bg-tinerary-gold/20 text-tinerary-dark",
    gradientCls: "from-tinerary-gold/10 to-tinerary-peach/20",
  },
}

const TIER_ICON: Record<BusinessTierSlug, React.ComponentType<{ className?: string }>> = {
  basic: Store,
  premium: Crown,
  enterprise: Shield,
}

// ─── Tool Cards ──────────────────────────────────────────────

function getBusinessTools(tier: BusinessTierSlug, activeDeals: number) {
  const limits = getTierLimits(tier)
  return [
    {
      title: "Deals & Promotions",
      description: `${activeDeals} active`,
      icon: Ticket,
      href: "/deals/manage",
      color: "text-tinerary-gold",
      bgColor: "bg-tinerary-gold/10",
    },
    {
      title: "Analytics Dashboard",
      description:
        tier === "enterprise"
          ? "Real-time analytics"
          : tier === "premium"
          ? "Advanced insights"
          : "Basic overview",
      icon: BarChart3,
      href: "/business-analytics",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Mention Highlights",
      description:
        tier === "enterprise"
          ? "Unlimited, auto-highlighted"
          : tier === "premium"
          ? `${limits.mentionHighlightsIncluded}/mo included`
          : "Pay per highlight",
      icon: Megaphone,
      href: "/mentions",
      color: "text-tinerary-salmon",
      bgColor: "bg-tinerary-salmon/10",
    },
    {
      title: "Transactions",
      description: "Revenue & commission",
      icon: DollarSign,
      href: "/transactions",
      color: "text-green-600",
      bgColor: "bg-green-600/10",
    },
    {
      title: "Affiliate Marketing",
      description: "Referral links",
      icon: Link2,
      href: "/affiliate",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Tinerary Coins",
      description: "Earn & spend rewards",
      icon: Coins,
      href: "/coins",
      color: "text-tinerary-gold",
      bgColor: "bg-tinerary-gold/10",
    },
  ]
}

// ─── Tier Perks ──────────────────────────────────────────────

function getActivePerks(tier: BusinessTierSlug) {
  if (tier === "enterprise") {
    return [
      { label: "Business Listing", desc: "Top-tier placement", icon: Store },
      { label: "Unlimited Deals", desc: "Priority booking placement", icon: Ticket },
      { label: "Real-time Analytics", desc: "API access + benchmarks", icon: BarChart3 },
      { label: "Unlimited Mentions", desc: "Auto-highlighted", icon: Megaphone },
      { label: "Dedicated Manager", desc: "Direct contact anytime", icon: Headphones },
      { label: "API Access", desc: "Programmatic integration", icon: Zap },
    ]
  }
  if (tier === "premium") {
    return [
      { label: "Business Listing", desc: "Featured placement", icon: Store },
      { label: "Unlimited Deals", desc: "No promotion limits", icon: Ticket },
      { label: "Advanced Analytics", desc: "Audience & geography", icon: BarChart3 },
      { label: "Featured Placement", desc: "Priority in feeds", icon: Sparkles },
      { label: "5 Mentions/mo", desc: "Included highlights", icon: Megaphone },
      { label: "Priority Support", desc: "4-8 hour response", icon: Headphones },
    ]
  }
  return [
    { label: "Business Listing", desc: "Visible on platform", icon: Store },
    { label: "Up to 5 Deals", desc: "Active promotion limit", icon: Ticket },
    { label: "Basic Analytics", desc: "Views & clicks overview", icon: BarChart3 },
    { label: "Email Support", desc: "24-48 hour response", icon: Mail },
  ]
}

// ─── Empty State ─────────────────────────────────────────────

function EmptyState() {
  const tierIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    basic: Store,
    premium: Crown,
    enterprise: Shield,
  }
  const tierColors: Record<string, { bg: string; gradient: string }> = {
    basic: { bg: "bg-primary", gradient: "from-tinerary-peach to-secondary" },
    premium: { bg: "bg-primary", gradient: "from-primary via-blue-500 to-indigo-500" },
    enterprise: { bg: "bg-tinerary-gold", gradient: "from-tinerary-gold via-amber-400 to-orange-400" },
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Store className="size-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Launch Your Business on Tinerary</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-lg mx-auto">
          Reach travelers at the moment they&apos;re planning. Choose a plan to unlock your
          business dashboard with promotions, analytics, and booking tools.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {BUSINESS_TIERS.map((tier) => {
          const Icon = tierIcons[tier.slug]
          const colors = tierColors[tier.slug]
          return (
            <Card
              key={tier.slug}
              className={`border-border overflow-hidden relative ${
                tier.highlighted ? "ring-2 ring-primary/40 shadow-md" : ""
              }`}
            >
              {tier.highlighted && (
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-blue-500" />
              )}
              <div className={`h-20 bg-gradient-to-r ${colors.gradient}`} />
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`size-8 rounded-lg ${colors.bg} flex items-center justify-center`}>
                    <Icon className="size-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{tier.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      ${tier.price}/{tier.priceSuffix}
                    </p>
                  </div>
                  {tier.highlighted && (
                    <Badge className="ml-auto bg-tinerary-peach text-tinerary-dark border-0 text-[10px]">
                      Popular
                    </Badge>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 mt-3">
                  {tier.features.slice(0, 5).map((f) => (
                    <div key={f} className="flex items-start gap-1.5">
                      <CheckCircle2 className="size-3 text-primary shrink-0 mt-0.5" />
                      <span className="text-[11px] text-muted-foreground leading-tight">{f}</span>
                    </div>
                  ))}
                  {tier.features.length > 5 && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      +{tier.features.length - 5} more features
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="text-center">
        <Button className="btn-sunset" size="lg" asChild>
          <Link href="/business-onboarding">
            <Rocket className="mr-2 size-4" />
            Get Started — Create Your Business
            <ArrowRight className="ml-2 size-3" />
          </Link>
        </Button>
        <p className="text-xs text-muted-foreground mt-3">
          Choose a plan and set up your business profile in just a few steps.
        </p>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────

export function BusinessProfileContent() {
  const [business, setBusiness] = useState<BusinessData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tier, setTier] = useState<BusinessTierSlug>("basic")
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
      setTier(getEffectiveTier(sub))

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
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-40 bg-muted rounded animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-border animate-pulse">
              <CardContent className="pt-6">
                <div className="h-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!business) {
    return <EmptyState />
  }

  const theme = TIER_THEME[tier]
  const TierIcon = TIER_ICON[tier]
  const tierConfig = BUSINESS_TIERS.find((t) => t.slug === tier)
  const tools = getBusinessTools(tier, summaryStats.activeDeals)
  const perks = getActivePerks(tier)

  return (
    <>
      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className={`size-10 rounded-xl ${theme.bg} flex items-center justify-center`}>
            <TierIcon className="size-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Business Hub</h1>
              <Badge className={`${theme.badgeCls} border-0 text-xs`}>
                {tierConfig?.name || "Basic"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {business.name} — manage your promotions, analytics, and tools
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Views", value: summaryStats.views.toLocaleString(), icon: Eye },
          { label: "Clicks", value: summaryStats.clicks.toLocaleString(), icon: MousePointerClick },
          { label: "Saves", value: summaryStats.saves.toLocaleString(), icon: Bookmark },
          { label: "Active Deals", value: summaryStats.activeDeals.toString(), icon: Ticket },
        ].map((stat) => (
          <Card key={stat.label} className="border-border">
            <CardContent className="pt-6">
              <stat.icon className="size-5 text-muted-foreground" />
              <p className="mt-3 text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Business Tools */}
      <h2 className="text-lg font-bold mb-4">Business Tools</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {tools.map((tool) => (
          <Link key={tool.title} href={tool.href}>
            <Card className="border-border hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="pt-6">
                <div
                  className={`size-10 rounded-xl ${tool.bgColor} flex items-center justify-center mb-4`}
                >
                  <tool.icon className={`size-5 ${tool.color}`} />
                </div>
                <h3 className="text-sm font-bold text-foreground">{tool.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{tool.description}</p>
                <div className="flex items-center gap-1 mt-3 text-xs font-medium text-primary">
                  Open <ArrowRight className="size-3" />
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
            <Sparkles className="size-5 text-tinerary-gold" /> Active Business Perks
          </CardTitle>
          <CardDescription>Your {tierConfig?.name || "Basic"} plan benefits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {perks.map((perk) => (
              <div
                key={perk.label}
                className="flex items-start gap-3 p-3 rounded-xl bg-muted"
              >
                <div className={`size-8 rounded-lg ${theme.bg} flex items-center justify-center shrink-0 text-primary-foreground`}>
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

      {/* Tier CTA */}
      <Card className={`bg-gradient-to-r ${theme.gradientCls} border-0`}>
        <CardContent className="py-8 text-center">
          <TierIcon
            className={`size-10 ${tier === "enterprise" ? "text-tinerary-gold" : "text-primary"} mx-auto mb-3`}
          />
          <h3 className="text-lg font-bold mb-2">
            You&apos;re on the {tierConfig?.name || "Basic"} Plan
          </h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            {tier === "enterprise"
              ? "All business features are fully unlocked. Explore your tools above."
              : tier === "premium"
              ? "All premium features are active. Upgrade to Enterprise for API access, unlimited mentions, and a dedicated account manager."
              : "Explore your tools above or upgrade to unlock advanced analytics, unlimited deals, and more."}
          </p>
          <div className="flex items-center justify-center gap-3">
            {tier !== "enterprise" && (
              <Button asChild className="btn-sunset">
                <Link href="/business">
                  {tier === "basic" ? "Upgrade to Premium" : "View Enterprise"}
                </Link>
              </Button>
            )}
            <Button asChild variant="outline">
              <Link href="/business-analytics">View Analytics</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
