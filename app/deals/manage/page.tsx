"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Tag, Eye, Crown, Trash2, Download, AlertCircle, Ticket } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { AppHeader } from "@/components/app-header"
import { PageHeader } from "@/components/page-header"
import { PaywallGate } from "@/components/paywall-gate"
import { CreateDealDialog } from "@/components/create-deal-dialog"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { deleteDeal, generatePerformanceReport } from "@/app/actions/promotion-actions"
import { getPlanLimits } from "@/lib/business-plan"
import { BUSINESS_TIERS } from "@/lib/tiers"
import type { BusinessTierSlug } from "@/lib/tiers"
import {
  getBusinessSubscription,
  getEffectiveTier,
  type BusinessSubscription,
} from "@/lib/business-tier-service"
import { isEnterprise, getTierFeatures } from "@/lib/enterprise"

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

export default function ManageDealsPage() {
  const [deals, setDeals] = useState<DealData[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [tier, setTier] = useState<BusinessTierSlug>("basic")
  const { toast } = useToast()

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setLoading(false); return }

    const { data: biz } = await supabase
      .from("businesses")
      .select("id, business_tier")
      .eq("user_id", session.user.id)
      .single()

    if (!biz) { setLoading(false); return }

    const sub = await getBusinessSubscription(biz.id)
    setTier(getEffectiveTier(sub))

    const { data: promos } = await supabase
      .from("promotions")
      .select("*, promotion_metrics(*)")
      .eq("business_id", biz.id)
      .order("created_at", { ascending: false })

    setDeals(promos || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  async function handleDeleteDeal(id: string) {
    setDeletingId(id)
    try {
      const result = await deleteDeal(id)
      if (result && "success" in result && result.success) {
        setDeals((prev) => prev.filter((d) => d.id !== id))
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

  const limits = getPlanLimits(tier)
  const tierConfig = BUSINESS_TIERS.find((t) => t.slug === tier)
  const isEnt = isEnterprise(tier)
  const enterpriseFeatures = getTierFeatures(tier)
  const activeDeals = deals.filter((d) => d.status === "active")
  const promotionLimitReached =
    limits.maxActivePromotions !== null && activeDeals.length >= limits.maxActivePromotions

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1">
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
          <Link href="/business-profile" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Business Dashboard
          </Link>
          <PageHeader
            title="Deals & Promotions"
            description={
              isEnt
                ? "Enterprise — unlimited promotions with priority booking placement."
                : tier === "premium"
                  ? "Premium — unlimited promotions with booking integration."
                  : `Basic — up to ${limits.maxActivePromotions} active promotions.`
            }
          />

          <PaywallGate gate="deals_manage">
          {loading ? (
            <div className="mt-6 flex flex-col gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse border-border">
                  <CardContent className="pt-6"><div className="h-16 bg-muted rounded" /></CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="mt-6 flex flex-col gap-6">
              {/* Promotion Limits (Basic only) */}
              {limits.maxActivePromotions !== null && (
                <Card className="border-border">
                  <CardContent className="pt-6">
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
                  </CardContent>
                </Card>
              )}

              {/* Create + Report Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isEnt && <Badge variant="secondary" className="text-[10px]">Unlimited</Badge>}
                  <span className="text-sm text-muted-foreground">{deals.length} total deals</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleGenerateReport} disabled={generatingReport}>
                    <Download className="mr-2 size-4" />
                    {generatingReport ? "Generating..." : "Report"}
                  </Button>
                  <CreateDealDialog
                    onDealCreated={loadData}
                    disabled={promotionLimitReached}
                    activeCount={activeDeals.length}
                    maxCount={limits.maxActivePromotions}
                  />
                </div>
              </div>

              {/* Deal List */}
              {deals.length === 0 ? (
                <Card className="border-border">
                  <CardContent className="py-12 text-center">
                    <Tag className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No deals yet. Create your first deal to start reaching travelers.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex flex-col gap-3">
                  {deals.map((deal) => {
                    const views = (deal.promotion_metrics as any)?.views || 0
                    const clicks = (deal.promotion_metrics as any)?.clicks || 0
                    const saves = (deal.promotion_metrics as any)?.saves || 0
                    const ctr = views > 0 ? Math.round((clicks / views) * 10000) / 100 : 0
                    return (
                      <Card key={deal.id} className="border-border">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-foreground truncate">{deal.title}</p>
                                {isEnt && enterpriseFeatures.hasPriorityBookingPlacement && (
                                  <Badge variant="outline" className="text-[10px] border-tinerary-gold/30 text-tinerary-gold">
                                    <Crown className="size-2.5 mr-0.5" /> Priority
                                  </Badge>
                                )}
                                <Badge variant="secondary" className={deal.status === "active" ? "bg-tinerary-peach text-tinerary-dark border-0" : "bg-secondary text-secondary-foreground border-0"}>
                                  {deal.status}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {deal.type} &middot; {deal.category} &middot; {deal.location}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {new Date(deal.start_date).toLocaleDateString()} – {new Date(deal.end_date).toLocaleDateString()}
                                {deal.price != null && ` · $${deal.price}`}
                                {deal.discount != null && ` · ${deal.discount}% off`}
                              </p>
                              {/* Inline metrics */}
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-xs text-muted-foreground">{views} views</span>
                                <span className="text-xs text-muted-foreground">{clicks} clicks</span>
                                <span className="text-xs text-muted-foreground">{saves} saves</span>
                                <span className="text-xs text-muted-foreground">{ctr}% CTR</span>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0 ml-4" onClick={() => handleDeleteDeal(deal.id)} disabled={deletingId === deal.id}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}

              {/* Upgrade CTA for basic tier */}
              {tier === "basic" && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="pt-6 text-center">
                    <Ticket className="size-8 text-primary mx-auto mb-2" />
                    <h3 className="text-sm font-bold text-foreground">Need more promotions?</h3>
                    <p className="text-xs text-muted-foreground mt-1 mb-3">
                      Upgrade to Premium for unlimited promotions, booking integration, and priority placement.
                    </p>
                    <Button className="btn-sunset" size="sm" asChild>
                      <Link href="/business">View Plans</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          </PaywallGate>

          <nav className="mt-10 border-t pt-6">
            <p className="text-xs text-muted-foreground mb-3">Related pages</p>
            <div className="flex flex-wrap gap-2">
              <Link href="/business-profile" className="text-sm text-primary hover:underline">Business Dashboard</Link>
              <span className="text-muted-foreground">·</span>
              <Link href="/business-analytics" className="text-sm text-primary hover:underline">Analytics</Link>
              <span className="text-muted-foreground">·</span>
              <Link href="/deals" className="text-sm text-primary hover:underline">Browse Deals</Link>
            </div>
          </nav>
        </div>
      </main>
    </div>
  )
}
