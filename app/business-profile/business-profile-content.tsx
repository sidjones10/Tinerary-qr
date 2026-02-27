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
  Lock,
  Rocket,
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

// ─── Empty State ─────────────────────────────────────────────
// Rich tier-preview landing when no business row exists yet.
function EmptyState() {
  const tierIcons = { basic: Store, premium: Crown, enterprise: Shield }
  const tierColors = {
    basic: { bg: "bg-primary", gradient: "from-tinerary-peach to-secondary" },
    premium: { bg: "bg-primary", gradient: "from-primary via-blue-500 to-indigo-500" },
    enterprise: { bg: "bg-tinerary-gold", gradient: "from-tinerary-gold via-amber-400 to-orange-400" },
  }

  return (
    <div className="mt-6 flex flex-col gap-8">
      {/* Hero */}
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

      {/* 3-Tier Preview Cards */}
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
                    <p className="text-xs text-muted-foreground">${tier.price}/{tier.priceSuffix}</p>
                  </div>
                  {tier.highlighted && (
                    <Badge className="ml-auto bg-tinerary-peach text-tinerary-dark border-0 text-[10px]">Popular</Badge>
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

      {/* CTA */}
      <div className="text-center">
        <Button className="btn-sunset" size="lg" asChild>
          <Link href="/business">
            <Rocket className="mr-2 size-4" />
            Get Started — View Plans
            <ArrowRight className="ml-2 size-3" />
          </Link>
        </Button>
        <p className="text-xs text-muted-foreground mt-3">
          Already have a plan? Your dashboard will appear here once your business profile is created.
        </p>
      </div>
    </div>
  )
}

// ─── Basic Tier Dashboard ────────────────────────────────────
// Compact, growth-focused: stats + 3 core tools + upgrade nudge
function BasicDashboard({
  business,
  summaryStats,
  limits,
  tierConfig,
}: {
  business: BusinessData
  summaryStats: { views: number; clicks: number; saves: number; activeDeals: number }
  limits: ReturnType<typeof getPlanLimits>
  tierConfig: (typeof BUSINESS_TIERS)[number] | undefined
}) {
  return (
    <div className="mt-6 flex flex-col gap-6">
      {/* Profile Card — compact */}
      <Card className="border-border overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-tinerary-peach to-secondary" />
        <CardContent className="relative -mt-8">
          <div className="flex items-end gap-4">
            <div className="size-16 rounded-xl bg-card border-4 border-card flex items-center justify-center shadow-md">
              {business.logo ? (
                <img src={business.logo} alt={business.name} className="size-full rounded-xl object-cover" />
              ) : (
                <span className="text-xl font-bold text-tinerary-salmon">
                  {business.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground truncate">{business.name}</h2>
                <Badge className="bg-primary text-primary-foreground text-[10px] border-0">Basic</Badge>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground flex items-center gap-1"><Tag className="size-3" />{business.category}</span>
                {business.website && <span className="text-xs text-muted-foreground flex items-center gap-1"><Globe className="size-3" />{business.website}</span>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Views", value: summaryStats.views, icon: Eye },
          { label: "Clicks", value: summaryStats.clicks, icon: MousePointerClick },
          { label: "Saves", value: summaryStats.saves, icon: Bookmark },
          { label: "Deals", value: summaryStats.activeDeals, icon: Ticket },
        ].map((s) => (
          <Card key={s.label} className="border-border">
            <CardContent className="pt-4 pb-3 px-3">
              <s.icon className="size-4 text-muted-foreground" />
              <p className="text-xl font-bold text-foreground mt-1">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Promotion limit */}
      {limits.maxActivePromotions !== null && (
        <Card className="border-border">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-foreground">Active Promotions</span>
              <span className="text-xs text-muted-foreground">{summaryStats.activeDeals} / {limits.maxActivePromotions}</span>
            </div>
            <Progress value={limits.maxActivePromotions > 0 ? (summaryStats.activeDeals / limits.maxActivePromotions) * 100 : 0} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Quick Actions — 3 core tools */}
      <div className="grid sm:grid-cols-3 gap-3">
        {[
          { href: "/deals/manage", icon: Ticket, title: "Manage Deals", desc: `${summaryStats.activeDeals} active`, color: "text-tinerary-gold", bg: "bg-tinerary-gold/10" },
          { href: "/business-analytics", icon: BarChart3, title: "Analytics", desc: "Basic overview", color: "text-primary", bg: "bg-primary/10" },
          { href: "/affiliate", icon: Link2, title: "Affiliate", desc: "Referral links", color: "text-blue-500", bg: "bg-blue-500/10" },
        ].map((l) => (
          <Link key={l.href} href={l.href}>
            <Card className="border-border hover:border-primary/30 hover:bg-muted/50 transition-all h-full cursor-pointer">
              <CardContent className="pt-5 pb-4 flex items-center gap-3">
                <div className={`size-10 rounded-xl ${l.bg} flex items-center justify-center shrink-0`}>
                  <l.icon className={`size-5 ${l.color}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{l.title}</p>
                  <p className="text-xs text-muted-foreground">{l.desc}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Locked features preview */}
      <Card className="border-dashed border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="size-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Unlock More with Premium</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Megaphone, label: "Mention Highlights", desc: "5/mo included" },
              { icon: DollarSign, label: "Transaction Tracking", desc: "Revenue & commission" },
              { icon: Sparkles, label: "Featured Placement", desc: "Priority in feeds" },
              { icon: FileBarChart, label: "Weekly Reports", desc: "Advanced insights" },
              { icon: Ticket, label: "Unlimited Promotions", desc: "No limits" },
              { icon: Headphones, label: "Priority Support", desc: "4-8 hour response" },
            ].map((f) => (
              <div key={f.label} className="flex items-start gap-2 p-2 rounded-lg bg-card/50">
                <f.icon className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-foreground">{f.label}</p>
                  <p className="text-[10px] text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <Button className="btn-sunset w-full mt-4" asChild>
            <Link href="/business">
              Upgrade to Premium — $149/mo
              <ArrowRight className="ml-2 size-3" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Support */}
      <Card className="border-border">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="size-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Email Support</p>
                <p className="text-xs text-muted-foreground">24-48 hour response at business-support@tinerary.com</p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="mailto:business-support@tinerary.com">Contact</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Premium Tier Dashboard ──────────────────────────────────
// Full dashboard feel: tier banner + rich stats + all 6 tools
function PremiumDashboard({
  business,
  summaryStats,
  limits,
  premiumLimits,
  tierConfig,
}: {
  business: BusinessData
  summaryStats: { views: number; clicks: number; saves: number; activeDeals: number }
  limits: ReturnType<typeof getPlanLimits>
  premiumLimits: ReturnType<typeof getTierLimits>
  tierConfig: (typeof BUSINESS_TIERS)[number] | undefined
}) {
  const ctr = summaryStats.views > 0 ? ((summaryStats.clicks / summaryStats.views) * 100).toFixed(1) : "0"

  return (
    <div className="mt-6 flex flex-col gap-6">
      {/* Profile Card — blue gradient, larger */}
      <Card className="border-border overflow-hidden ring-2 ring-primary/20">
        <div className="h-28 bg-gradient-to-r from-primary via-blue-500 to-indigo-500" />
        <CardContent className="relative -mt-10">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="size-20 rounded-2xl bg-card border-4 border-card flex items-center justify-center shadow-md ring-2 ring-primary/30">
              {business.logo ? (
                <img src={business.logo} alt={business.name} className="size-full rounded-2xl object-cover" />
              ) : (
                <span className="text-2xl font-bold text-tinerary-salmon">
                  {business.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-foreground">{business.name}</h2>
                <CheckCircle2 className="size-5 text-primary" />
                <Badge className="bg-primary/10 text-primary text-xs border-0">Premium</Badge>
              </div>
              {business.description && <p className="text-sm text-muted-foreground mt-0.5">{business.description}</p>}
              <div className="flex flex-wrap items-center gap-3 mt-1.5">
                <span className="text-xs text-muted-foreground flex items-center gap-1"><Tag className="size-3" />{business.category}</span>
                {business.website && <span className="text-xs text-muted-foreground flex items-center gap-1"><Globe className="size-3" />{business.website}</span>}
                <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="size-3" />Joined {new Date(business.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                {business.rating && <span className="text-xs text-muted-foreground flex items-center gap-1"><Star className="size-3" />{business.rating}</span>}
                <span className="text-xs text-primary font-medium flex items-center gap-1"><Sparkles className="size-3" />Featured listing</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tier banner */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-blue-500/5">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-9 rounded-lg bg-primary flex items-center justify-center">
              <Crown className="size-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">Premium Plan</h3>
                <Badge className="bg-primary/10 text-primary border-0 text-[10px]">Active</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Featured placement, unlimited promotions, advanced analytics</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { icon: Sparkles, label: "Featured Placement" },
              { icon: BarChart3, label: "Advanced Analytics" },
              { icon: Headphones, label: "Priority Support" },
              { icon: Ticket, label: "Booking Integration" },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-1.5 p-2 rounded-lg bg-card">
                <f.icon className="size-3.5 text-primary shrink-0" />
                <span className="text-[11px] text-foreground truncate">{f.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats — 5 columns with CTR */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Views", value: summaryStats.views.toLocaleString(), icon: Eye, color: "text-blue-500" },
          { label: "Clicks", value: summaryStats.clicks.toLocaleString(), icon: MousePointerClick, color: "text-green-500" },
          { label: "Saves", value: summaryStats.saves.toLocaleString(), icon: Bookmark, color: "text-orange-500" },
          { label: "Deals", value: summaryStats.activeDeals.toString(), icon: Ticket, color: "text-purple-500" },
          { label: "CTR", value: `${ctr}%`, icon: TrendingUp, color: "text-tinerary-salmon" },
        ].map((s) => (
          <Card key={s.label} className="border-border">
            <CardContent className="pt-4 pb-3 px-3">
              <s.icon className={`size-4 ${s.color}`} />
              <p className="text-xl font-bold text-foreground mt-1">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* All 6 Tools */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Your Premium Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { href: "/deals/manage", icon: Ticket, title: "Deals & Promotions", desc: "Unlimited promotions", color: "text-tinerary-gold", bg: "bg-tinerary-gold/10" },
              { href: "/business-analytics", icon: BarChart3, title: "Advanced Analytics", desc: "Audience, geography & trends", color: "text-primary", bg: "bg-primary/10" },
              { href: "/mentions", icon: Megaphone, title: "Mention Highlights", desc: `${premiumLimits.mentionHighlightsIncluded}/mo included`, color: "text-tinerary-salmon", bg: "bg-tinerary-salmon/10" },
              { href: "/transactions", icon: DollarSign, title: "Transactions", desc: "Revenue & commission", color: "text-green-600", bg: "bg-green-600/10" },
              { href: "/affiliate", icon: Link2, title: "Affiliate Marketing", desc: "Referral links", color: "text-blue-500", bg: "bg-blue-500/10" },
              { href: "/coins", icon: Coins, title: "Tinerary Coins", desc: "Earn & spend rewards", color: "text-tinerary-gold", bg: "bg-tinerary-gold/10" },
            ].map((l) => (
              <Link key={l.href} href={l.href}>
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/50 transition-all cursor-pointer h-full">
                  <div className={`size-9 rounded-lg ${l.bg} flex items-center justify-center shrink-0`}>
                    <l.icon className={`size-4 ${l.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{l.title}</p>
                    <p className="text-[11px] text-muted-foreground">{l.desc}</p>
                  </div>
                  <ArrowRight className="size-3 text-muted-foreground shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Enterprise upsell */}
      <Card className="border-tinerary-gold/20 bg-gradient-to-r from-tinerary-gold/5 to-transparent">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-xl bg-tinerary-gold flex items-center justify-center shrink-0">
              <Shield className="size-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-foreground">Want more? Go Enterprise</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Real-time analytics, dedicated account manager, unlimited mentions, custom branding, and API access.
              </p>
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <Link href="/business">View Enterprise — $399/mo <ArrowRight className="ml-1 size-3" /></Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support */}
      <Card className="border-border">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-primary flex items-center justify-center">
                <Headphones className="size-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Priority Support</p>
                <p className="text-xs text-muted-foreground">4-8 hour response times</p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="mailto:business-support@tinerary.com"><Mail className="mr-1 size-3" />Contact</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Enterprise Tier Dashboard ───────────────────────────────
// Executive dashboard: branded header, manager, API, unlimited, full tools
function EnterpriseDashboard({
  business,
  summaryStats,
  limits,
  premiumLimits,
  tierConfig,
}: {
  business: BusinessData
  summaryStats: { views: number; clicks: number; saves: number; activeDeals: number }
  limits: ReturnType<typeof getPlanLimits>
  premiumLimits: ReturnType<typeof getTierLimits>
  tierConfig: (typeof BUSINESS_TIERS)[number] | undefined
}) {
  const brandingConfig = business.branding_config
  const coverStyle = brandingConfig
    ? { background: `linear-gradient(135deg, ${brandingConfig.primaryColor || "#1a1a2e"}, ${brandingConfig.secondaryColor || "#16213e"})` }
    : undefined
  const ctr = summaryStats.views > 0 ? ((summaryStats.clicks / summaryStats.views) * 100).toFixed(1) : "0"

  return (
    <div className="mt-6 flex flex-col gap-6">
      {/* Branded Profile Card */}
      <Card className="border-tinerary-gold/30 overflow-hidden ring-2 ring-tinerary-gold/20">
        <div
          className={`h-36 ${!coverStyle ? "bg-gradient-to-r from-tinerary-gold via-amber-400 to-orange-400" : ""}`}
          style={coverStyle}
        >
          {brandingConfig?.coverImageUrl && (
            <img src={brandingConfig.coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
          )}
        </div>
        <CardContent className="relative -mt-12">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="size-24 rounded-2xl bg-card border-4 border-card flex items-center justify-center shadow-lg ring-2 ring-tinerary-gold/30">
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
                <EnterpriseProfileBadge tier="enterprise" businessName={business.name} />
                <Badge className="bg-tinerary-gold/20 text-tinerary-dark text-xs border-0">Enterprise</Badge>
                <TopTierPlacementIndicator tier="enterprise" />
              </div>
              {business.description && <p className="text-sm text-muted-foreground mt-0.5">{business.description}</p>}
              <div className="flex flex-wrap items-center gap-3 mt-1.5">
                <span className="text-xs text-muted-foreground flex items-center gap-1"><Tag className="size-3" />{business.category}</span>
                {business.website && <span className="text-xs text-muted-foreground flex items-center gap-1"><Globe className="size-3" />{business.website}</span>}
                <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="size-3" />Joined {new Date(business.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                {business.rating && <span className="text-xs text-muted-foreground flex items-center gap-1"><Star className="size-3" />{business.rating} ({business.review_count || 0})</span>}
                <span className="text-xs text-tinerary-gold font-medium flex items-center gap-1"><Shield className="size-3" />Top-tier listing</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enterprise banner + unlimited features */}
      <Card className="border-tinerary-gold/20 bg-gradient-to-r from-tinerary-gold/5 to-tinerary-peach/5">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-9 rounded-lg bg-tinerary-gold flex items-center justify-center">
              <Shield className="size-4 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">Enterprise Plan</h3>
              <Badge className="bg-tinerary-gold/20 text-tinerary-dark border-0 text-[10px]">Active</Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            {[
              { icon: Sparkles, label: "Top-tier Placement" },
              { icon: BarChart3, label: "Real-time Analytics" },
              { icon: Headphones, label: "Dedicated Manager" },
              { icon: Ticket, label: "Priority Booking" },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-1.5 p-2 rounded-lg bg-card">
                <f.icon className="size-3.5 text-tinerary-gold shrink-0" />
                <span className="text-[11px] text-foreground truncate">{f.label}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="size-3.5 text-tinerary-gold" />
            <span className="text-xs font-semibold text-foreground">Unlimited</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {Object.entries(ENTERPRISE_UNLIMITED_FEATURES).slice(0, 5).map(([key, desc]) => (
              <div key={key} className="flex items-start gap-1.5 p-1.5 rounded-md bg-card/50">
                <CheckCircle2 className="size-2.5 text-tinerary-gold shrink-0 mt-0.5" />
                <span className="text-[10px] text-muted-foreground leading-tight">{desc.split(" ").slice(0, 4).join(" ")}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Account Manager + API side-by-side */}
      <div className="grid sm:grid-cols-2 gap-4">
        <EnterpriseAccountManager manager={ENTERPRISE_ACCOUNT_MANAGERS[0]} />
        {business.api_key && (
          <Card className="border-border">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <Key className="size-4 text-tinerary-gold" />
                <h3 className="text-sm font-bold text-foreground">API Access</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Access analytics, reports, and webhooks programmatically.</p>
              <Badge variant="secondary" className="text-[10px] font-mono">
                {business.api_key.slice(0, 8)}...{business.api_key.slice(-4)}
              </Badge>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Stats — 5 columns */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Views", value: summaryStats.views.toLocaleString(), icon: Eye, color: "text-blue-500" },
          { label: "Clicks", value: summaryStats.clicks.toLocaleString(), icon: MousePointerClick, color: "text-green-500" },
          { label: "Saves", value: summaryStats.saves.toLocaleString(), icon: Bookmark, color: "text-orange-500" },
          { label: "Deals", value: summaryStats.activeDeals.toString(), icon: Ticket, color: "text-purple-500" },
          { label: "CTR", value: `${ctr}%`, icon: TrendingUp, color: "text-tinerary-salmon" },
        ].map((s) => (
          <Card key={s.label} className="border-border">
            <CardContent className="pt-4 pb-3 px-3">
              <s.icon className={`size-4 ${s.color}`} />
              <p className="text-xl font-bold text-foreground mt-1">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* All 6 Tools */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Enterprise Tools</CardTitle>
          <CardDescription className="text-xs">All dashboards and integrations are unlocked.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { href: "/deals/manage", icon: Ticket, title: "Deals & Promotions", desc: "Unlimited, priority booking", color: "text-tinerary-gold", bg: "bg-tinerary-gold/10" },
              { href: "/business-analytics", icon: BarChart3, title: "Real-time Analytics", desc: "API access + competitor benchmarks", color: "text-primary", bg: "bg-primary/10" },
              { href: "/mentions", icon: Megaphone, title: "Mention Highlights", desc: "Unlimited, auto-highlighted", color: "text-tinerary-salmon", bg: "bg-tinerary-salmon/10" },
              { href: "/transactions", icon: DollarSign, title: "Transactions", desc: "Revenue, commission & reports", color: "text-green-600", bg: "bg-green-600/10" },
              { href: "/affiliate", icon: Link2, title: "Affiliate Marketing", desc: "Referral links & packing list", color: "text-blue-500", bg: "bg-blue-500/10" },
              { href: "/coins", icon: Coins, title: "Tinerary Coins", desc: "Earn & spend rewards", color: "text-tinerary-gold", bg: "bg-tinerary-gold/10" },
            ].map((l) => (
              <Link key={l.href} href={l.href}>
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-tinerary-gold/30 hover:bg-muted/50 transition-all cursor-pointer h-full">
                  <div className={`size-9 rounded-lg ${l.bg} flex items-center justify-center shrink-0`}>
                    <l.icon className={`size-4 ${l.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{l.title}</p>
                    <p className="text-[11px] text-muted-foreground">{l.desc}</p>
                  </div>
                  <ArrowRight className="size-3 text-muted-foreground shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Support — dedicated manager */}
      <Card className="border-border">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-tinerary-gold flex items-center justify-center">
                <Headphones className="size-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Dedicated Account Manager</p>
                <p className="text-xs text-muted-foreground">Direct contact available anytime</p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="mailto:business-support@tinerary.com"><Mail className="mr-1 size-3" />Contact</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────
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
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-border animate-pulse">
              <CardContent className="pt-4 pb-3"><div className="h-10 bg-muted rounded" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // No business — rich empty state with 3-tier preview
  if (!business) {
    return <EmptyState />
  }

  // Route to tier-specific dashboard — each is a completely different layout
  const tier = (business.business_tier || "basic") as BusinessTierSlug
  const limits = getPlanLimits(tier)
  const premiumLimits = getTierLimits(tier)
  const tierConfig = BUSINESS_TIERS.find((t) => t.slug === tier)

  if (tier === "enterprise") {
    return (
      <EnterpriseDashboard
        business={business}
        summaryStats={summaryStats}
        limits={limits}
        premiumLimits={premiumLimits}
        tierConfig={tierConfig}
      />
    )
  }

  if (tier === "premium") {
    return (
      <PremiumDashboard
        business={business}
        summaryStats={summaryStats}
        limits={limits}
        premiumLimits={premiumLimits}
        tierConfig={tierConfig}
      />
    )
  }

  return (
    <BasicDashboard
      business={business}
      summaryStats={summaryStats}
      limits={limits}
      tierConfig={tierConfig}
    />
  )
}
