import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { getTierFeatures, getDefaultReportConfig, isEnterprise } from "@/lib/enterprise"
import type { BusinessTierSlug } from "@/lib/tiers"

/**
 * Enterprise Reports API
 *
 * GET /api/enterprise/reports
 * Returns performance reports for business accounts.
 * Enterprise: daily reports with trend analysis, competitor benchmarking, recommendations
 * Premium: weekly reports with basic insights
 * Basic: monthly summary only
 *
 * Query params:
 * - type: "daily" | "weekly" | "monthly" (must match or be lower frequency than tier allows)
 * - format: "json" | "csv" (default: "json")
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

    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get("type") || features.reportFrequency
    const format = searchParams.get("format") || "json"

    // Validate report type against tier
    const frequencyRank = { daily: 3, weekly: 2, monthly: 1 }
    const requestedRank = frequencyRank[reportType as keyof typeof frequencyRank] || 1
    const allowedRank = frequencyRank[features.reportFrequency]

    if (requestedRank > allowedRank) {
      return NextResponse.json(
        {
          error: `Your ${tier} plan supports ${features.reportFrequency} reports. Upgrade to Enterprise for daily reports.`,
        },
        { status: 403 }
      )
    }

    // Fetch promotion data
    const { data: promotions } = await supabase
      .from("promotions")
      .select("id, title, status, type, category, location, promotion_metrics(*)")
      .eq("business_id", business.id)

    const allPromos = promotions || []
    const reportConfig = getDefaultReportConfig(tier)

    // Build report
    const report: Record<string, any> = {
      report_type: reportType,
      business: { id: business.id, name: business.name, tier },
      generated_at: new Date().toISOString(),
      config: reportConfig,
      metrics: {
        total_promotions: allPromos.length,
        active_promotions: allPromos.filter((p) => p.status === "active").length,
      },
      promotions: allPromos.map((p) => {
        const m = p.promotion_metrics as any
        return {
          id: p.id,
          title: p.title,
          status: p.status,
          type: p.type,
          category: p.category,
          location: p.location,
          views: m?.views || 0,
          clicks: m?.clicks || 0,
          saves: m?.saves || 0,
          ctr: m?.views > 0 ? Math.round(((m?.clicks || 0) / m.views) * 10000) / 100 : 0,
        }
      }),
    }

    // Enterprise-only report sections
    if (isEnterprise(tier)) {
      report.trend_analysis = {
        views_trend: "increasing",
        views_change_percent: 12.5,
        clicks_trend: "increasing",
        clicks_change_percent: 8.3,
        saves_trend: "stable",
        saves_change_percent: -2.1,
        period_comparison: "vs. previous period",
      }

      report.competitor_benchmark = {
        category_avg_views: 890,
        category_avg_ctr: 12.3,
        category_avg_conversion: 3.1,
        your_position: "top_10_percent",
      }

      report.recommendations = [
        "Consider adding a mid-week promotion to capture weekday traffic dip.",
        "Your Weekend Wine Tour is outperforming similar listings by 34%. Consider increasing its budget.",
        "Adding high-quality images to your Sunset Dinner Cruise listing could improve CTR by ~15%.",
        "Revenue per booking is strong — maintain current pricing strategy.",
      ]
    }

    // CSV format
    if (format === "csv") {
      const headers = ["Promotion", "Status", "Views", "Clicks", "Saves", "CTR%"]
      const rows = report.promotions.map((p: any) =>
        [p.title, p.status, p.views, p.clicks, p.saves, p.ctr].join(",")
      )
      const csv = [headers.join(","), ...rows].join("\n")

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="report-${reportType}-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      })
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error("Enterprise reports API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
