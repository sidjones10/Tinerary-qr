import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getTierLimits } from "@/lib/business-tier-service"
import type { BusinessTierSlug } from "@/lib/tiers"

/**
 * GET /api/business/reports
 *
 * Returns a performance report for the authenticated business user.
 * Report frequency (daily/weekly/monthly) is determined by subscription tier:
 *   - Basic: monthly
 *   - Premium: weekly
 *   - Enterprise: daily
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find business
    const { data: business } = await supabase
      .from("businesses")
      .select("id, name")
      .eq("user_id", session.user.id)
      .single()

    if (!business) {
      return NextResponse.json({ error: "No business profile found" }, { status: 404 })
    }

    // Get subscription tier
    const { data: sub } = await supabase
      .from("business_subscriptions")
      .select("tier, status")
      .eq("business_id", business.id)
      .eq("status", "active")
      .single()

    const tier = (sub?.tier as BusinessTierSlug) || "basic"
    const limits = getTierLimits(tier)

    // Determine date range based on report frequency
    const now = new Date()
    const rangeStart = new Date(now)
    if (limits.reportFrequency === "daily") {
      rangeStart.setDate(rangeStart.getDate() - 1)
    } else if (limits.reportFrequency === "weekly") {
      rangeStart.setDate(rangeStart.getDate() - 7)
    } else {
      rangeStart.setDate(rangeStart.getDate() - 30)
    }

    // Fetch promotions with metrics
    const { data: promotions } = await supabase
      .from("promotions")
      .select("id, title, status, category, location, promotion_metrics(*)")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })

    const promos = (promotions || []).map((p: any) => {
      const m = Array.isArray(p.promotion_metrics) ? p.promotion_metrics[0] : p.promotion_metrics
      return {
        id: p.id,
        title: p.title,
        status: p.status,
        category: p.category,
        location: p.location,
        views: m?.views || 0,
        clicks: m?.clicks || 0,
        saves: m?.saves || 0,
        shares: m?.shares || 0,
        ctr: m?.views > 0 ? ((m?.clicks || 0) / m.views * 100).toFixed(1) : "0.0",
      }
    })

    const totalViews = promos.reduce((s: number, p: any) => s + p.views, 0)
    const totalClicks = promos.reduce((s: number, p: any) => s + p.clicks, 0)
    const totalSaves = promos.reduce((s: number, p: any) => s + p.saves, 0)
    const totalShares = promos.reduce((s: number, p: any) => s + p.shares, 0)
    const activeCount = promos.filter((p: any) => p.status === "active").length

    return NextResponse.json({
      success: true,
      report: {
        businessName: business.name,
        tier,
        reportFrequency: limits.reportFrequency,
        periodStart: rangeStart.toISOString(),
        periodEnd: now.toISOString(),
        summary: {
          totalViews,
          totalClicks,
          totalSaves,
          totalShares,
          activePromotions: activeCount,
          avgCtr: totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : "0.0",
        },
        promotions: promos,
      },
    })
  } catch (error: any) {
    console.error("Error generating business report:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate report" },
      { status: 500 }
    )
  }
}
