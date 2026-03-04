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

    // Enterprise-only report sections — computed from real metrics
    if (isEnterprise(tier)) {
      // Calculate trend analysis by comparing current vs previous period metrics
      const now = new Date()
      const periodDays = reportType === "daily" ? 1 : reportType === "weekly" ? 7 : 30

      // Fetch current period metrics
      const currentStart = new Date(now)
      currentStart.setDate(currentStart.getDate() - periodDays)
      const previousStart = new Date(currentStart)
      previousStart.setDate(previousStart.getDate() - periodDays)

      const { data: currentMetrics } = await supabase
        .from("promotions")
        .select("promotion_metrics(views, clicks, saves)")
        .eq("business_id", business.id)
        .gte("updated_at", currentStart.toISOString())

      const { data: previousMetrics } = await supabase
        .from("promotions")
        .select("promotion_metrics(views, clicks, saves)")
        .eq("business_id", business.id)
        .gte("updated_at", previousStart.toISOString())
        .lt("updated_at", currentStart.toISOString())

      const sumMetrics = (items: any[]) => {
        let views = 0, clicks = 0, saves = 0
        for (const p of items) {
          const m = Array.isArray(p.promotion_metrics) ? p.promotion_metrics[0] : p.promotion_metrics
          views += m?.views || 0
          clicks += m?.clicks || 0
          saves += m?.saves || 0
        }
        return { views, clicks, saves }
      }

      const current = sumMetrics(currentMetrics || [])
      const previous = sumMetrics(previousMetrics || [])

      const calcChange = (curr: number, prev: number) =>
        prev > 0 ? Math.round(((curr - prev) / prev) * 1000) / 10 : 0
      const trendLabel = (change: number) =>
        change > 2 ? "increasing" : change < -2 ? "decreasing" : "stable"

      const viewsChange = calcChange(current.views, previous.views)
      const clicksChange = calcChange(current.clicks, previous.clicks)
      const savesChange = calcChange(current.saves, previous.saves)

      report.trend_analysis = {
        views_trend: trendLabel(viewsChange),
        views_change_percent: viewsChange,
        clicks_trend: trendLabel(clicksChange),
        clicks_change_percent: clicksChange,
        saves_trend: trendLabel(savesChange),
        saves_change_percent: savesChange,
        period_comparison: `vs. previous ${periodDays}-day period`,
      }

      // Competitor benchmark: compare against category averages from real data
      const categories = [...new Set(allPromos.map((p) => p.category).filter(Boolean))]
      const primaryCategory = categories[0] || null

      if (primaryCategory) {
        const { data: categoryPromos } = await supabase
          .from("promotions")
          .select("promotion_metrics(views, clicks, saves)")
          .eq("category", primaryCategory)
          .neq("business_id", business.id)

        const catItems = categoryPromos || []
        const catMetrics = sumMetrics(catItems)
        const catCount = catItems.length || 1
        const catAvgViews = Math.round(catMetrics.views / catCount)
        const catAvgCtr = catMetrics.views > 0
          ? Math.round((catMetrics.clicks / catMetrics.views) * 1000) / 10
          : 0

        const yourViews = current.views
        const businessesAbove = catItems.filter((p) => {
          const m = Array.isArray(p.promotion_metrics) ? p.promotion_metrics[0] : p.promotion_metrics
          return (m?.views || 0) > yourViews
        }).length
        const percentile = catCount > 0
          ? Math.round(((catCount - businessesAbove) / catCount) * 100)
          : 50

        report.competitor_benchmark = {
          category: primaryCategory,
          category_avg_views: catAvgViews,
          category_avg_ctr: catAvgCtr,
          businesses_in_category: catCount,
          your_percentile: percentile,
        }
      } else {
        report.competitor_benchmark = {
          category: null,
          note: "No category data available for benchmarking. Add a category to your promotions to enable competitor comparison.",
        }
      }

      // Generate recommendations based on actual performance
      const recommendations: string[] = []
      const totalViews = report.promotions.reduce((s: number, p: any) => s + p.views, 0)
      const totalClicks = report.promotions.reduce((s: number, p: any) => s + p.clicks, 0)
      const overallCtr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0

      if (overallCtr < 5 && totalViews > 0) {
        recommendations.push("Your click-through rate is below 5%. Consider updating promotion titles and images to increase engagement.")
      }
      if (report.metrics.active_promotions === 0) {
        recommendations.push("You have no active promotions. Create or reactivate promotions to start generating traffic.")
      }
      if (viewsChange < -10) {
        recommendations.push(`Views dropped ${Math.abs(viewsChange)}% compared to the previous period. Consider boosting your promotions or updating their content.`)
      }
      if (totalViews > 100 && overallCtr > 10) {
        recommendations.push("Strong click-through rate! Consider increasing your promotion reach to capitalize on high engagement.")
      }
      // Top performing promotion insight
      const topPromo = report.promotions.reduce(
        (top: any, p: any) => (p.views > (top?.views || 0) ? p : top),
        null
      )
      if (topPromo && topPromo.views > 0) {
        recommendations.push(`"${topPromo.title}" is your top performer with ${topPromo.views} views. Consider creating similar promotions.`)
      }
      if (recommendations.length === 0) {
        recommendations.push("Keep your promotions active and monitor performance regularly to identify growth opportunities.")
      }

      report.recommendations = recommendations
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
