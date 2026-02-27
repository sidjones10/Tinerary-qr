"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  MapPin,
  Globe,
  Star,
  Clock,
  Users,
  Eye,
  CalendarDays,
  CheckCircle2,
  ArrowUpRight,
  Trash2,
  Tag,
  Crown,
  BarChart3,
  Sparkles,
  Headphones,
  FileBarChart,
  Ticket,
  Megaphone,
  Zap,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { CreateDealDialog } from "@/components/create-deal-dialog"
import { deleteDeal } from "@/app/actions/promotion-actions"
import {
  getBusinessSubscription,
  getEffectiveTier,
  getTierLimits,
  canCreatePromotion,
  type BusinessSubscription,
} from "@/lib/business-tier-service"
import type { BusinessTierSlug } from "@/lib/tiers"
import { BUSINESS_TIERS } from "@/lib/tiers"

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
  const [subscription, setSubscription] = useState<BusinessSubscription | null>(null)
  const { toast } = useToast()

  const tier = getEffectiveTier(subscription)
  const limits = getTierLimits(tier)

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

  const activeDeals = deals.filter((d) => d.status === "active")
  const totalViews = deals.reduce((sum, d) => sum + ((d.promotion_metrics as any)?.views || 0), 0)
  const totalClicks = deals.reduce((sum, d) => sum + ((d.promotion_metrics as any)?.clicks || 0), 0)
  const totalSaves = deals.reduce((sum, d) => sum + ((d.promotion_metrics as any)?.saves || 0), 0)
  const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : "0.0"
  const canAddDeal = canCreatePromotion(tier, activeDeals.length)

  const tierInfo = BUSINESS_TIERS.find((t) => t.slug === tier)

  return (
    <div className="mt-6 flex flex-col gap-6">
      {/* Subscription Tier Banner */}
      <Card className={`border-border overflow-hidden ${tier === "premium" ? "ring-2 ring-primary/30" : tier === "enterprise" ? "ring-2 ring-tinerary-gold/40" : ""}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`size-10 rounded-xl flex items-center justify-center ${
                tier === "enterprise" ? "bg-tinerary-gold" : tier === "premium" ? "bg-primary" : "bg-muted"
              }`}>
                <Crown className={`size-5 ${tier === "basic" ? "text-muted-foreground" : "text-white"}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground">{tierInfo?.name || "Basic"} Plan</h3>
                  {tier !== "basic" && (
                    <Badge className={tier === "enterprise" ? "bg-tinerary-gold/20 text-tinerary-dark border-0" : "bg-primary/10 text-primary border-0"}>
                      Active
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {tier === "basic" && "Upgrade to Premium for featured placement, unlimited promotions, and more."}
                  {tier === "premium" && "Featured placement, unlimited promotions, advanced analytics, and priority support."}
                  {tier === "enterprise" && "Top-tier placement, real-time analytics, dedicated manager, and unlimited everything."}
                </p>
              </div>
            </div>
            {tier === "basic" && (
              <Button size="sm" className="btn-sunset" asChild>
                <Link href="/business">Upgrade</Link>
              </Button>
            )}
          </div>

          {/* Premium feature indicators */}
          {tier !== "basic" && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
              {[
                { icon: Sparkles, label: "Featured Placement", active: limits.featuredPlacement },
                { icon: BarChart3, label: limits.analyticsLevel === "realtime" ? "Real-time Analytics" : "Advanced Analytics", active: true },
                { icon: Headphones, label: limits.supportLevel === "dedicated" ? "Dedicated Manager" : "Priority Support", active: true },
                { icon: Ticket, label: "Booking Integration", active: limits.bookingIntegration },
              ].map((feat) => (
                <div key={feat.label} className="flex items-center gap-1.5 p-2 rounded-lg bg-muted/50">
                  <feat.icon className="size-3.5 text-primary shrink-0" />
                  <span className="text-xs text-foreground truncate">{feat.label}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Card — enhanced for premium/enterprise */}
      <Card className="overflow-hidden border-border">
        <div className={`h-32 ${
          tier === "enterprise"
            ? "bg-gradient-to-r from-tinerary-gold via-amber-400 to-orange-400"
            : tier === "premium"
              ? "bg-gradient-to-r from-primary via-blue-500 to-indigo-500"
              : "bg-gradient-to-r from-tinerary-peach to-secondary"
        }`} />
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
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">{business.name}</h2>
                <CheckCircle2 className={`size-5 ${tier === "enterprise" ? "text-tinerary-gold" : "text-primary"}`} />
                {tier !== "basic" && (
                  <Badge className={`text-xs border-0 ${
                    tier === "enterprise"
                      ? "bg-tinerary-gold/20 text-tinerary-dark"
                      : "bg-primary/10 text-primary"
                  }`}>
                    {tier === "enterprise" ? "Enterprise" : "Premium"}
                  </Badge>
                )}
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
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid — expanded for premium */}
      <div className={`grid gap-4 ${tier !== "basic" ? "grid-cols-2 lg:grid-cols-5" : "grid-cols-2 lg:grid-cols-4"}`}>
        {[
          { label: "Total Views", value: totalViews.toLocaleString(), icon: Eye },
          { label: "Total Clicks", value: totalClicks.toLocaleString(), icon: ArrowUpRight },
          { label: "Total Saves", value: totalSaves.toLocaleString(), icon: CalendarDays },
          { label: "Active Deals", value: activeDeals.length.toString(), icon: Tag },
          ...(tier !== "basic" ? [{ label: "Click-Through Rate", value: `${ctr}%`, icon: BarChart3 }] : []),
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
                  {limits.mentionHighlightsIncluded === Infinity
                    ? "Unlimited highlights included"
                    : `${limits.mentionHighlightsIncluded} highlights/mo included`}
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/transactions">
            <Card className="border-border hover:shadow-md transition-all hover:-translate-y-0.5 h-full cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-1">
                  <FileBarChart className="size-5 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">
                    {limits.reportFrequency === "daily" ? "Daily" : limits.reportFrequency === "weekly" ? "Weekly" : "Monthly"} Reports
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground">Performance reports delivered to your inbox</p>
              </CardContent>
            </Card>
          </Link>
          {limits.bookingIntegration && (
            <Link href="/deals">
              <Card className="border-border hover:shadow-md transition-all hover:-translate-y-0.5 h-full cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-1">
                    <Ticket className="size-5 text-tinerary-gold" />
                    <h3 className="text-sm font-semibold text-foreground">Booking Integration</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">Direct bookings from your listings</p>
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
                {limits.maxPromotions === Infinity
                  ? "Create unlimited deals that travelers will see on Tinerary"
                  : `${activeDeals.length}/${limits.maxPromotions} active deals — upgrade for unlimited`}
              </CardDescription>
            </div>
            {canAddDeal ? (
              <CreateDealDialog onDealCreated={loadData} />
            ) : (
              <Button size="sm" variant="outline" asChild>
                <Link href="/business">Upgrade for More</Link>
              </Button>
            )}
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
              {deals.map((deal) => (
                <div
                  key={deal.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{deal.title}</p>
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
                      <p className="text-xs text-muted-foreground">
                        {(deal.promotion_metrics as any)?.views || 0} views
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={
                        deal.status === "active"
                          ? "bg-tinerary-peach text-tinerary-dark border-0"
                          : "bg-secondary text-secondary-foreground border-0"
                      }
                    >
                      {deal.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteDeal(deal.id)}
                      disabled={deletingId === deal.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
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
