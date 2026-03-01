"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Store,
  BarChart3,
  Megaphone,
  DollarSign,
  Ticket,
  Link2,
  Crown,
  Globe,
  MapPin,
  ExternalLink,
  Play,
  CheckCircle2,
  Star,
  Eye,
  MousePointerClick,
  Bookmark,
  ArrowRight,
  Sparkles,
  Shield,
  Headphones,
  Mail,
  Coins,
  Zap,
  Loader2,
  Check,
  CalendarCheck,
  CalendarRange,
  UserCheck,
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { createClient } from "@/lib/supabase/client"
import { BUSINESS_TIERS } from "@/lib/tiers"
import type { BusinessTierSlug } from "@/lib/tiers"
import {
  getBusinessSubscription,
  getEffectiveTier,
  getTierLimits,
} from "@/lib/business-tier-service"
import { createBusiness } from "@/app/actions/business-actions"
import type { EnterpriseBrandingConfig } from "@/lib/enterprise"
import { DEFAULT_BRANDING_CONFIG } from "@/lib/enterprise"

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
}

interface ProfileData {
  name: string | null
  username: string | null
  bio: string | null
  location: string | null
  website: string | null
  avatar_url: string | null
}

const CATEGORIES = [
  "Accommodation",
  "Activities & Tours",
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Wellness & Spa",
  "Travel Services",
  "Other",
]

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

// ─── Chart Colors ───────────────────────────────────────────

const CHART_COLORS = ["#3b82f6", "#ff9a8b", "#7C3AED", "#f59e0b"]

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

// ─── Tier feature summaries for setup ────────────────────────

const TIER_SUMMARIES: Record<BusinessTierSlug, string> = {
  basic: "5 deals, basic analytics, email support",
  premium: "Unlimited deals, advanced analytics, featured placement",
  enterprise: "API access, real-time analytics, dedicated manager",
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
      { label: "Custom Profile", desc: "Full branded profile", icon: UserCheck },
      { label: "Daily Reports", desc: "Email & in-app delivery", icon: CalendarCheck },
      { label: "Priority Booking", desc: "Top placement in feeds", icon: CalendarRange },
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
      { label: "Enhanced Profile", desc: "Upgraded business page", icon: UserCheck },
      { label: "Weekly Reports", desc: "Email & in-app delivery", icon: CalendarCheck },
      { label: "Booking Integration", desc: "Accept bookings directly", icon: CalendarRange },
    ]
  }
  return [
    { label: "Business Listing", desc: "Visible on platform", icon: Store },
    { label: "Up to 5 Deals", desc: "Active promotion limit", icon: Ticket },
    { label: "Basic Analytics", desc: "Views & clicks overview", icon: BarChart3 },
    { label: "Email Support", desc: "24-48 hour response", icon: Mail },
  ]
}

// ─── Setup Steps ─────────────────────────────────────────────

const SETUP_STEPS = [
  { label: "Business Info", icon: Store },
  { label: "Details", icon: Sparkles },
  { label: "Choose Plan", icon: Crown },
]

// ─── Inline Setup (replaces separate onboarding page) ────────

function InlineSetup({
  profileData,
  onCreated,
}: {
  profileData: ProfileData | null
  onCreated: () => void
}) {
  const searchParams = useSearchParams()
  const preselectedTier = searchParams.get("tier") as BusinessTierSlug | null

  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [website, setWebsite] = useState("")
  const [selectedTier, setSelectedTier] = useState<BusinessTierSlug>(
    preselectedTier && ["basic", "premium", "enterprise"].includes(preselectedTier)
      ? preselectedTier
      : "basic"
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pre-fill from profile data
  useEffect(() => {
    if (profileData) {
      if (profileData.name) setName(profileData.name)
      if (profileData.website) setWebsite(profileData.website)
      if (profileData.bio) setDescription(profileData.bio)
    }
  }, [profileData])

  // Determine which "step" is active based on form completion
  const currentStep = !name.trim() || !category ? 0 : !description && !website ? 1 : 2

  async function handleSubmit() {
    setError(null)
    setSubmitting(true)

    const formData = new FormData()
    formData.set("name", name)
    formData.set("category", category)
    formData.set("description", description)
    formData.set("website", website)
    formData.set("tier", selectedTier)

    const result = await createBusiness(formData)

    if (result && "success" in result) {
      if (result.success) {
        onCreated()
      } else {
        setError(result.error || "Something went wrong.")
        setSubmitting(false)
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Store className="size-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Set Up Your Business</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          {profileData?.name
            ? "We\u2019ve pulled in your profile info as a starting point. Pick a category and you\u2019re ready to go."
            : "Tell us about your business to get started."}
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 max-w-xl mx-auto w-full">
        {SETUP_STEPS.map((step, i) => (
          <div key={step.label} className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              i <= currentStep
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            }`}>
              <step.icon className="size-3" />
              <span className="hidden sm:inline">{step.label}</span>
            </div>
            {i < SETUP_STEPS.length - 1 && (
              <div className={`w-6 h-px transition-colors ${i < currentStep ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

      <Card className="border-border max-w-xl mx-auto w-full cute-card">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="biz-name">
                Business Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="biz-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sunset Beach Resort"
                maxLength={100}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="biz-category">
                Category <span className="text-destructive">*</span>
              </Label>
              <select
                id="biz-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="biz-desc">Description</Label>
              <Textarea
                id="biz-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What your business offers to travelers..."
                maxLength={500}
                rows={3}
              />
              <p className="text-xs text-muted-foreground text-right">
                {description.length}/500
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="biz-website">Website</Label>
              <Input
                id="biz-website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yourbusiness.com"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Plan</Label>
              <div className="grid grid-cols-3 gap-2">
                {BUSINESS_TIERS.map((tier) => (
                  <button
                    key={tier.slug}
                    type="button"
                    onClick={() => setSelectedTier(tier.slug)}
                    className={`relative p-3 rounded-xl border text-center transition-all ${
                      selectedTier === tier.slug
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <p className="text-sm font-bold text-foreground">{tier.name}</p>
                    <p className="text-xs text-muted-foreground">
                      ${tier.price}/{tier.priceSuffix}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1 leading-tight">
                      {TIER_SUMMARIES[tier.slug]}
                    </p>
                    {tier.highlighted && (
                      <Badge className="absolute -top-2 right-2 bg-tinerary-peach text-tinerary-dark border-0 text-[9px]">
                        Popular
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
              <Button
                variant="link"
                size="sm"
                className="self-end text-xs p-0 h-auto"
                asChild
              >
                <Link href="/business">Compare plans in detail</Link>
              </Button>
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button
              className="btn-sunset w-full"
              size="lg"
              disabled={!name.trim() || !category || submitting}
              onClick={handleSubmit}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Create Business
                  <ArrowRight className="ml-2 size-4" />
                </>
              )}
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
  const [tier, setTier] = useState<BusinessTierSlug>("basic")
  const [summaryStats, setSummaryStats] = useState({ views: 0, clicks: 0, saves: 0, activeDeals: 0 })
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [promoDetails, setPromoDetails] = useState<{ title: string; views: number; clicks: number; saves: number; status: string }[]>([])

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      setLoading(false)
      return
    }

    // Fetch profile data (for pre-filling setup + avatar fallback)
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, username, bio, location, website, avatar_url")
      .eq("id", session.user.id)
      .single()

    if (profile) setProfileData(profile)

    // Fetch business
    const { data: biz } = await supabase
      .from("businesses")
      .select("*")
      .eq("user_id", session.user.id)
      .single()

    if (biz) {
      setBusiness(biz)

      const sub = await getBusinessSubscription(biz.id)
      setTier(getEffectiveTier(sub, biz.business_tier as BusinessTierSlug))

      const { data: promos } = await supabase
        .from("promotions")
        .select("title, status, promotion_metrics(views, clicks, saves)")
        .eq("business_id", biz.id)
        .order("created_at", { ascending: false })

      if (promos) {
        const activeDeals = promos.filter((p: any) => p.status === "active").length
        const views = promos.reduce((s: number, p: any) => s + ((p.promotion_metrics as any)?.views || 0), 0)
        const clicks = promos.reduce((s: number, p: any) => s + ((p.promotion_metrics as any)?.clicks || 0), 0)
        const saves = promos.reduce((s: number, p: any) => s + ((p.promotion_metrics as any)?.saves || 0), 0)
        setSummaryStats({ views, clicks, saves, activeDeals })
        setPromoDetails(
          promos.map((p: any) => ({
            title: p.title || "Untitled",
            views: (p.promotion_metrics as any)?.views || 0,
            clicks: (p.promotion_metrics as any)?.clicks || 0,
            saves: (p.promotion_metrics as any)?.saves || 0,
            status: p.status || "draft",
          }))
        )
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
          <div className="size-14 rounded-xl bg-muted animate-pulse" />
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
    return <InlineSetup profileData={profileData} onCreated={loadData} />
  }

  const theme = TIER_THEME[tier]
  const TierIcon = TIER_ICON[tier]
  const tierConfig = BUSINESS_TIERS.find((t) => t.slug === tier)
  const tools = getBusinessTools(tier, summaryStats.activeDeals)
  const perks = getActivePerks(tier)

  // Derived metrics
  const ctr = summaryStats.views > 0 ? ((summaryStats.clicks / summaryStats.views) * 100).toFixed(1) : "0"
  const saveRate = summaryStats.views > 0 ? ((summaryStats.saves / summaryStats.views) * 100).toFixed(1) : "0"

  // Chart data — performance breakdown
  const performanceChartData = [
    { metric: "Views", value: summaryStats.views },
    { metric: "Clicks", value: summaryStats.clicks },
    { metric: "Saves", value: summaryStats.saves },
    { metric: "Deals", value: summaryStats.activeDeals },
  ]

  // Stat cards data
  const statCards = [
    {
      label: "Total Views",
      value: summaryStats.views.toLocaleString(),
      icon: Eye,
      trend: "+14%",
      trendPositive: true,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      accent: "stat-accent-blue",
    },
    {
      label: "Total Clicks",
      value: summaryStats.clicks.toLocaleString(),
      icon: MousePointerClick,
      trend: "+8.3%",
      trendPositive: true,
      color: "text-tinerary-salmon",
      bg: "bg-tinerary-salmon/10",
      accent: "stat-accent-salmon",
    },
    {
      label: "Total Saves",
      value: summaryStats.saves.toLocaleString(),
      icon: Bookmark,
      trend: "+21%",
      trendPositive: true,
      color: "text-[#7C3AED]",
      bg: "bg-[#7C3AED]/10",
      accent: "stat-accent-purple",
    },
    {
      label: "Active Deals",
      value: summaryStats.activeDeals.toString(),
      icon: Ticket,
      trend: summaryStats.activeDeals > 0 ? `${summaryStats.activeDeals} live` : "0 live",
      trendPositive: summaryStats.activeDeals > 0,
      color: "text-tinerary-gold",
      bg: "bg-tinerary-gold/10",
      accent: "stat-accent-gold",
    },
  ]

  const secondaryStats = [
    {
      label: "Click-Through Rate",
      value: `${ctr}%`,
      icon: Target,
      trend: "+1.2%",
      trendPositive: true,
      color: "text-green-500",
      bg: "bg-green-500/10",
      accent: "stat-accent-green",
    },
    {
      label: "Save Rate",
      value: `${saveRate}%`,
      icon: Clock,
      trend: "+0.8%",
      trendPositive: true,
      color: "text-primary",
      bg: "bg-primary/10",
      accent: "stat-accent-blue",
    },
  ]

  return (
    <>
      {/* Business Header — tier-aware */}
      {(() => {
        const brandingConfig: EnterpriseBrandingConfig =
          tier === "enterprise" && business.branding_config
            ? { ...DEFAULT_BRANDING_CONFIG, ...business.branding_config }
            : DEFAULT_BRANDING_CONFIG

        const displayWebsite = business.website || profileData?.website || ""
        const displayDescription = business.description || profileData?.bio || ""
        const logoSrc = business.logo || profileData?.avatar_url

        // ── Enterprise: Full custom branded header ──
        if (tier === "enterprise") {
          return (
            <div className="rounded-2xl overflow-hidden mb-8 border border-tinerary-gold/20 shadow-lg">
              {/* Cover: video banner or cover image or branded gradient */}
              <div className="relative h-40 sm:h-48">
                {brandingConfig.videoBannerUrl ? (
                  <div className="absolute inset-0">
                    <video
                      src={brandingConfig.videoBannerUrl}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30" />
                    <div className="absolute bottom-3 right-3">
                      <span className="inline-flex items-center gap-1 text-[10px] text-white/80 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
                        <Play className="size-2.5" /> Video Banner
                      </span>
                    </div>
                  </div>
                ) : brandingConfig.coverImageUrl ? (
                  <div className="absolute inset-0">
                    <img
                      src={brandingConfig.coverImageUrl}
                      alt="Cover"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                ) : (
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(135deg, ${brandingConfig.primaryColor}, ${brandingConfig.secondaryColor})`,
                    }}
                  />
                )}

                {/* Enterprise badge overlay */}
                <div className="absolute top-4 right-4">
                  <Badge className="bg-gradient-to-r from-tinerary-gold to-tinerary-peach text-tinerary-dark border-0 text-xs shadow-md">
                    <Shield className="size-3 mr-1" /> Enterprise
                  </Badge>
                </div>
              </div>

              {/* Profile info below cover */}
              <div className="bg-card p-6 pt-0 relative">
                {/* Logo — overlaps the cover */}
                <div className={`-mt-10 mb-4 flex items-end gap-4 ${
                  brandingConfig.logoPosition === "center" ? "justify-center" : ""
                }`}>
                  {logoSrc ? (
                    <img
                      src={brandingConfig.logoUrl || logoSrc}
                      alt={business.name}
                      className="size-20 rounded-2xl object-cover shadow-lg border-4 border-card"
                    />
                  ) : (
                    <div
                      className="size-20 rounded-2xl flex items-center justify-center shadow-lg border-4 border-card"
                      style={{ backgroundColor: brandingConfig.accentColor }}
                    >
                      <Shield className="size-9 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-2xl font-bold">{business.name}</h1>
                      <CheckCircle2 className="size-5 text-tinerary-gold shrink-0" />
                    </div>

                    {business.category && (
                      <p className="text-sm font-medium mt-0.5" style={{ color: brandingConfig.accentColor }}>
                        {business.category}
                      </p>
                    )}

                    {displayDescription && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2 max-w-xl">
                        {displayDescription}
                      </p>
                    )}

                    {/* Meta chips */}
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      {displayWebsite && (
                        <a
                          href={displayWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium hover:underline bg-muted px-2.5 py-1 rounded-full"
                          style={{ color: brandingConfig.accentColor }}
                        >
                          <Globe className="size-3" />
                          {displayWebsite.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                          <ExternalLink className="size-2.5 opacity-60" />
                        </a>
                      )}

                      {profileData?.location && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                          <MapPin className="size-3" />
                          {profileData.location}
                        </span>
                      )}

                      {business.rating != null && business.rating > 0 && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-tinerary-gold bg-tinerary-gold/10 px-2.5 py-1 rounded-full font-medium">
                          <Star className="size-3 fill-tinerary-gold" />
                          {business.rating.toFixed(1)}
                          {business.review_count ? ` (${business.review_count})` : ""}
                        </span>
                      )}

                      {profileData?.name && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                          <Store className="size-3" />
                          {profileData.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* CTA Button */}
                  {brandingConfig.ctaButtonUrl && (
                    <a
                      href={brandingConfig.ctaButtonUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0"
                    >
                      <Button
                        size="sm"
                        className={`text-xs shadow-md ${
                          brandingConfig.ctaButtonStyle === "outline"
                            ? "bg-transparent border-2"
                            : brandingConfig.ctaButtonStyle === "gradient"
                            ? ""
                            : ""
                        }`}
                        style={
                          brandingConfig.ctaButtonStyle === "outline"
                            ? { borderColor: brandingConfig.accentColor, color: brandingConfig.accentColor }
                            : brandingConfig.ctaButtonStyle === "gradient"
                            ? { background: `linear-gradient(135deg, ${brandingConfig.primaryColor}, ${brandingConfig.accentColor})`, color: "white" }
                            : { backgroundColor: brandingConfig.accentColor, color: "white" }
                        }
                      >
                        <ExternalLink className="size-3 mr-1.5" />
                        {brandingConfig.ctaButtonText || "Book Now"}
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )
        }

        // ── Premium: Enhanced business profile ──
        if (tier === "premium") {
          return (
            <div className="rounded-2xl overflow-hidden mb-8 border border-primary/20 shadow-md">
              {/* Gradient cover banner */}
              <div className="relative h-28 sm:h-32 bg-gradient-to-br from-primary/80 via-blue-500/60 to-tinerary-peach/50">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_70%)]" />
                <div className="absolute top-4 right-4">
                  <Badge className="bg-primary/90 text-primary-foreground border-0 text-xs shadow-sm backdrop-blur-sm">
                    <Crown className="size-3 mr-1" /> Premium
                  </Badge>
                </div>
              </div>

              {/* Profile info below cover */}
              <div className="bg-card p-6 pt-0">
                {/* Logo overlapping the banner */}
                <div className="-mt-10 mb-4 flex items-end gap-4">
                  {logoSrc ? (
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary to-blue-500 rounded-2xl -m-0.5" />
                      <img
                        src={logoSrc}
                        alt={business.name}
                        className="size-20 rounded-2xl object-cover shadow-md border-4 border-card relative"
                      />
                    </div>
                  ) : (
                    <div className="size-20 rounded-2xl bg-primary flex items-center justify-center shadow-lg border-4 border-card">
                      <Crown className="size-9 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold">{business.name}</h1>
                    <CheckCircle2 className="size-5 text-primary shrink-0" />
                  </div>

                  {business.category && (
                    <p className="text-sm font-medium text-primary mt-0.5">
                      {business.category}
                    </p>
                  )}

                  {displayDescription && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2 max-w-xl">
                      {displayDescription}
                    </p>
                  )}

                  {/* Meta chips */}
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    {displayWebsite && (
                      <a
                        href={displayWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline bg-primary/5 px-2.5 py-1 rounded-full"
                      >
                        <Globe className="size-3" />
                        {displayWebsite.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                        <ExternalLink className="size-2.5 opacity-60" />
                      </a>
                    )}

                    {profileData?.location && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                        <MapPin className="size-3" />
                        {profileData.location}
                      </span>
                    )}

                    {business.rating != null && business.rating > 0 && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-tinerary-gold bg-tinerary-gold/10 px-2.5 py-1 rounded-full font-medium">
                        <Star className="size-3 fill-tinerary-gold" />
                        {business.rating.toFixed(1)}
                        {business.review_count ? ` (${business.review_count})` : ""}
                      </span>
                    )}

                    {profileData?.name && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                        <Store className="size-3" />
                        {profileData.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        }

        // ── Basic: Standard business header ──
        return (
          <div className={`bg-gradient-to-r ${theme.gradientCls} rounded-2xl p-6 mb-8`}>
            <div className="flex flex-col sm:flex-row gap-5">
              {logoSrc ? (
                <img
                  src={logoSrc}
                  alt={business.name}
                  className="size-20 rounded-2xl object-cover shadow-md shrink-0"
                />
              ) : (
                <div className={`size-20 rounded-2xl ${theme.bg} flex items-center justify-center shadow-lg shrink-0`}>
                  <TierIcon className="size-9 text-white" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold">{business.name}</h1>
                  <Badge className={`${theme.badgeCls} border-0 text-xs`}>
                    {tierConfig?.name || "Basic"}
                  </Badge>
                </div>

                {business.category && (
                  <p className="text-sm font-medium text-primary mt-0.5">
                    {business.category}
                  </p>
                )}

                {displayDescription && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2 max-w-xl">
                    {displayDescription}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 mt-3">
                  {displayWebsite && (
                    <a
                      href={displayWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline bg-background/60 px-2.5 py-1 rounded-full"
                    >
                      <Globe className="size-3" />
                      {displayWebsite.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                      <ExternalLink className="size-2.5 opacity-60" />
                    </a>
                  )}

                  {profileData?.location && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-background/60 px-2.5 py-1 rounded-full">
                      <MapPin className="size-3" />
                      {profileData.location}
                    </span>
                  )}

                  {profileData?.name && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-background/60 px-2.5 py-1 rounded-full">
                      <Store className="size-3" />
                      {profileData.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Primary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className={`border-border ${stat.accent}`}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`size-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`size-5 ${stat.color}`} />
                </div>
                <TrendBadge value={stat.trend} positive={stat.trendPositive} />
              </div>
              <p className="text-2xl font-bold text-foreground tracking-tight">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary Stat Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {secondaryStats.map((stat) => (
          <Card key={stat.label} className={`border-border ${stat.accent}`}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`size-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`size-5 ${stat.color}`} />
                </div>
                <TrendBadge value={stat.trend} positive={stat.trendPositive} />
              </div>
              <p className="text-2xl font-bold text-foreground tracking-tight">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts + Promotions Section */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Performance Overview Chart */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="size-4 text-primary" />
                  Performance Overview
                </CardTitle>
                <CardDescription>Aggregate metrics across all promotions</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-xs">
                <Link href="/business-analytics">Full Analytics</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={performanceChartData} margin={{ left: -10, right: 10 }}>
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
                  {performanceChartData.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Promotions Table */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="size-4 text-tinerary-gold" />
                  Top Promotions
                </CardTitle>
                <CardDescription>Your promotions ranked by views</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-xs">
                <Link href="/deals/manage">Manage</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {promoDetails.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-tinerary-dark hover:bg-tinerary-dark">
                    <TableHead className="text-primary-foreground">Promotion</TableHead>
                    <TableHead className="text-primary-foreground text-right">Views</TableHead>
                    <TableHead className="text-primary-foreground text-right">Clicks</TableHead>
                    <TableHead className="text-primary-foreground text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promoDetails
                    .sort((a, b) => b.views - a.views)
                    .slice(0, 5)
                    .map((promo) => (
                      <TableRow key={promo.title}>
                        <TableCell className="font-medium text-foreground max-w-[160px] truncate">
                          {promo.title}
                        </TableCell>
                        <TableCell className="text-right text-foreground">
                          {promo.views.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-foreground">
                          {promo.clicks.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="secondary"
                            className={
                              promo.status === "active"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0 text-[10px]"
                                : "bg-muted text-muted-foreground border-0 text-[10px]"
                            }
                          >
                            {promo.status === "active" ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <div className="cute-empty-icon mx-auto mb-4" style={{ width: 64, height: 64 }}>
                  <Ticket className="size-7 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  No promotions yet. Create your first deal to see performance data.
                </p>
                <Button asChild size="sm" className="btn-sunset mt-3">
                  <Link href="/deals/manage">Create Deal</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Business Tools */}
      <h2 className="text-lg font-bold mb-4">Business Tools</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {tools.map((tool) => (
          <Link key={tool.title} href={tool.href} className="group">
            <Card className="border-border hover-lift transition-all duration-300 cursor-pointer h-full">
              <CardContent className="pt-6">
                <div
                  className={`size-12 rounded-xl ${tool.bgColor} flex items-center justify-center mb-4`}
                >
                  <tool.icon className={`size-6 ${tool.color}`} />
                </div>
                <h3 className="text-sm font-bold text-foreground">{tool.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{tool.description}</p>
                <div className="flex items-center gap-1 mt-3 text-xs font-medium text-primary">
                  Open <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
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
                className="flex items-start gap-3 p-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
              >
                <div className={`size-8 rounded-lg ${theme.bg} flex items-center justify-center shrink-0 text-primary-foreground shadow-sm`}>
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
      <Card className={`bg-gradient-to-r ${theme.gradientCls} border-0 relative overflow-hidden`}>
        <div className="absolute top-3 right-8 size-2 rounded-full bg-tinerary-gold/40 sparkle" />
        <div className="absolute bottom-6 right-16 size-1.5 rounded-full bg-tinerary-salmon/40 sparkle sparkle-delay-1" />
        <div className="absolute top-8 left-12 size-1 rounded-full bg-primary/30 sparkle sparkle-delay-2" />
        <CardContent className="py-8 text-center relative">
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
