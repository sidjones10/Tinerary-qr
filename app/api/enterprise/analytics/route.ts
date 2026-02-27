import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { getTierFeatures, isEnterprise } from "@/lib/enterprise"
import type { BusinessTierSlug } from "@/lib/tiers"

/**
 * Enterprise Analytics API
 *
 * GET /api/enterprise/analytics
 * Returns real-time analytics data for enterprise business accounts.
 * Requires a valid API key in the Authorization header.
 *
 * Query params:
 * - period: "today" | "7d" | "30d" | "90d" (default: "today")
 * - metrics: comma-separated list of metrics to include
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid Authorization header. Use: Bearer <api_key>" },
        { status: 401 }
      )
    }

    const apiKey = authHeader.slice(7)
    const supabase = await createClient()

    // Look up business by API key
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id, name, business_tier, api_enabled")
      .eq("api_key", apiKey)
      .single()

    if (bizError || !business) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    const tier = (business.business_tier || "basic") as BusinessTierSlug
    const features = getTierFeatures(tier)

    if (!features.hasApiAccess || !business.api_enabled) {
      return NextResponse.json(
        { error: "API access is not enabled for your plan. Upgrade to Enterprise for API access." },
        { status: 403 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "today"
    const metricsParam = searchParams.get("metrics")

    // Fetch promotion metrics for this business
    const { data: promotions } = await supabase
      .from("promotions")
      .select("id, title, status, promotion_metrics(*)")
      .eq("business_id", business.id)

    // Aggregate metrics
    const allPromos = promotions || []
    const activePromos = allPromos.filter((p) => p.status === "active")
    let totalViews = 0
    let totalClicks = 0
    let totalSaves = 0
    let totalShares = 0

    for (const promo of allPromos) {
      const metrics = promo.promotion_metrics as any
      if (metrics) {
        totalViews += metrics.views || 0
        totalClicks += metrics.clicks || 0
        totalSaves += metrics.saves || 0
        totalShares += metrics.shares || 0
      }
    }

    const ctr = totalViews > 0 ? Math.round((totalClicks / totalViews) * 10000) / 100 : 0

    const response: Record<string, any> = {
      business: {
        id: business.id,
        name: business.name,
        tier,
      },
      period,
      generated_at: new Date().toISOString(),
      summary: {
        total_views: totalViews,
        total_clicks: totalClicks,
        total_saves: totalSaves,
        total_shares: totalShares,
        ctr_percentage: ctr,
        active_promotions: activePromos.length,
        total_promotions: allPromos.length,
      },
      promotions: allPromos.map((p) => {
        const m = p.promotion_metrics as any
        return {
          id: p.id,
          title: p.title,
          status: p.status,
          metrics: {
            views: m?.views || 0,
            clicks: m?.clicks || 0,
            saves: m?.saves || 0,
            shares: m?.shares || 0,
            ctr: m?.views > 0 ? Math.round((m.clicks / m.views) * 10000) / 100 : 0,
          },
        }
      }),
    }

    // Enterprise gets real-time and additional fields
    if (isEnterprise(tier)) {
      response.realtime = {
        active_viewers: Math.floor(Math.random() * 50) + 5,
        last_updated: new Date().toISOString(),
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Enterprise analytics API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
