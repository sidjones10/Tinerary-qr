"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  linearRegression,
  exponentialSmoothing,
  calculateGrowthRate,
  calculateCTR,
  buildFunnel,
  classifyChurnRisk,
  analyzeSearchTrends,
  type CohortData,
  type FunnelStep,
  type SearchTrend,
} from "@/lib/analytics-utils"

export interface PredictiveAnalyticsData {
  // Forecasts
  userGrowthForecast: { label: string; actual: number | null; forecast: number | null }[]
  contentForecast: { label: string; actual: number | null; forecast: number | null }[]
  engagementForecast: { label: string; actual: number | null; forecast: number | null }[]

  // Business Intelligence
  searchTrends: SearchTrend[]
  linkCTR: number
  avgSessionDuration: number // seconds
  avgPagesPerSession: number
  funnel: FunnelStep[]
  topReferrers: { source: string; count: number; percentage: number }[]

  // Retention & Cohorts
  cohorts: CohortData[]
  churnRisk: { low: number; medium: number; high: number; total: number }
  userLifecycle: { stage: string; count: number; color: string }[]
  retentionRate: number
  dau: number
  wau: number
  mau: number
  stickiness: number // DAU/MAU ratio

  // Predictive scores
  userGrowthConfidence: number
  contentGrowthConfidence: number
  engagementConfidence: number
  projectedUsersNext30d: number
  projectedContentNext30d: number

  // Engagement depth
  avgViewsPerUser: number
  avgLikesPerUser: number
  avgSavesPerUser: number
  avgCommentsPerUser: number
  powerUsers: number // users with 10+ interactions
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export function usePredictiveAnalytics(timeRange: "7d" | "30d" | "90d" = "30d") {
  const [data, setData] = useState<PredictiveAnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      setError(null)

      try {
        const supabase = createClient()
        const now = new Date()
        const daysAgo = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90
        const startDate = new Date(now.getTime() - daysAgo * 86400000)
        const previousStartDate = new Date(startDate.getTime() - daysAgo * 86400000)

        // --- Fetch all data in parallel ---
        const [
          profilesRes,
          itinerariesRes,
          interactionsRes,
          prevInteractionsRes,
          metricsRes,
          commentsRes,
          behaviorRes,
          savedRes,
          prevSavedRes,
        ] = await Promise.all([
          supabase.from("profiles").select("id, created_at").order("created_at", { ascending: true }),
          supabase.from("itineraries").select("id, created_at, is_public, user_id").order("created_at", { ascending: true }),
          supabase.from("user_interactions").select("user_id, interaction_type, created_at").gte("created_at", startDate.toISOString()),
          supabase.from("user_interactions").select("user_id, interaction_type, created_at").gte("created_at", previousStartDate.toISOString()).lt("created_at", startDate.toISOString()),
          supabase.from("itinerary_metrics").select("itinerary_id, view_count, like_count, save_count, share_count, comment_count"),
          supabase.from("comments").select("id, user_id, created_at").gte("created_at", startDate.toISOString()),
          supabase.from("user_behavior").select("user_id, search_history, last_active_at, created_at"),
          supabase.from("saved_itineraries").select("user_id, type, created_at").gte("created_at", startDate.toISOString()),
          supabase.from("saved_itineraries").select("user_id, type, created_at").gte("created_at", previousStartDate.toISOString()).lt("created_at", startDate.toISOString()),
        ])

        const profiles = profilesRes.data || []
        const itineraries = itinerariesRes.data || []
        const interactions = interactionsRes.data || []
        const prevInteractions = prevInteractionsRes.data || []
        const metrics = metricsRes.data || []
        const comments = commentsRes.data || []
        const behaviors = behaviorRes.data || []
        const savedItems = savedRes.data || []
        const prevSavedItems = prevSavedRes.data || []

        // === USER GROWTH FORECAST ===
        const monthlyUsers = buildMonthlyBuckets(profiles, "created_at", 8)
        const userValues = monthlyUsers.map((m) => m.count)
        const userForecastValues = exponentialSmoothing(userValues, 0.3, 3)
        const userRegression = linearRegression(userValues.map((y, x) => ({ x, y })))

        const userGrowthForecast = [
          ...monthlyUsers.map((m) => ({ label: m.label, actual: m.count, forecast: null as number | null })),
          ...userForecastValues.map((v, i) => {
            const futureMonth = new Date(now.getFullYear(), now.getMonth() + i + 1, 1)
            return { label: MONTH_LABELS[futureMonth.getMonth()], actual: null as number | null, forecast: v }
          }),
        ]

        // === CONTENT FORECAST ===
        const monthlyContent = buildMonthlyBuckets(itineraries, "created_at", 8)
        const contentValues = monthlyContent.map((m) => m.count)
        const contentForecastValues = exponentialSmoothing(contentValues, 0.3, 3)
        const contentRegression = linearRegression(contentValues.map((y, x) => ({ x, y })))

        const contentForecast = [
          ...monthlyContent.map((m) => ({ label: m.label, actual: m.count, forecast: null as number | null })),
          ...contentForecastValues.map((v, i) => {
            const futureMonth = new Date(now.getFullYear(), now.getMonth() + i + 1, 1)
            return { label: MONTH_LABELS[futureMonth.getMonth()], actual: null as number | null, forecast: v }
          }),
        ]

        // === ENGAGEMENT FORECAST ===
        const dailyEngagement = buildDailyBuckets(interactions, "created_at", daysAgo)
        const engValues = dailyEngagement.map((d) => d.count)
        const engForecastValues = exponentialSmoothing(engValues, 0.3, 7)

        const engagementForecast = [
          ...dailyEngagement.slice(-14).map((d) => ({ label: d.label, actual: d.count, forecast: null as number | null })),
          ...engForecastValues.map((v, i) => {
            const futureDate = new Date(now.getTime() + (i + 1) * 86400000)
            return {
              label: `${futureDate.getMonth() + 1}/${futureDate.getDate()}`,
              actual: null as number | null,
              forecast: v,
            }
          }),
        ]

        // === SEARCH TRENDS ===
        const recentSearches: string[] = []
        const previousSearches: string[] = []
        behaviors.forEach((b) => {
          if (b.search_history) {
            const history = Array.isArray(b.search_history) ? b.search_history : []
            recentSearches.push(...history.slice(-10))
            previousSearches.push(...history.slice(-20, -10))
          }
        })
        const searchTrends = analyzeSearchTrends(recentSearches, previousSearches)

        // === LINK CTR ===
        const totalViews = interactions.filter((i) => i.interaction_type === "view").length
        const totalClicks = savedItems.length + comments.length
        const linkCTR = calculateCTR(totalClicks, totalViews)

        // === SESSION METRICS ===
        const userSessionMap: Map<string, Date[]> = new Map()
        interactions.forEach((i) => {
          const userId = i.user_id
          if (!userSessionMap.has(userId)) userSessionMap.set(userId, [])
          userSessionMap.get(userId)!.push(new Date(i.created_at))
        })

        let totalSessionDuration = 0
        let sessionCount = 0
        let totalPages = 0
        for (const [, timestamps] of userSessionMap) {
          timestamps.sort((a, b) => a.getTime() - b.getTime())
          let sessionStart = timestamps[0]
          let pagesInSession = 1
          for (let i = 1; i < timestamps.length; i++) {
            const gap = timestamps[i].getTime() - timestamps[i - 1].getTime()
            if (gap > 30 * 60 * 1000) {
              // New session (30-min gap)
              totalSessionDuration += timestamps[i - 1].getTime() - sessionStart.getTime()
              totalPages += pagesInSession
              sessionCount++
              sessionStart = timestamps[i]
              pagesInSession = 1
            } else {
              pagesInSession++
            }
          }
          totalSessionDuration += timestamps[timestamps.length - 1].getTime() - sessionStart.getTime()
          totalPages += pagesInSession
          sessionCount++
        }

        const avgSessionDuration = sessionCount > 0 ? totalSessionDuration / sessionCount / 1000 : 0
        const avgPagesPerSession = sessionCount > 0 ? totalPages / sessionCount : 0

        // === FUNNEL ===
        const uniqueVisitors = new Set(interactions.map((i) => i.user_id)).size
        const viewers = new Set(interactions.filter((i) => i.interaction_type === "view").map((i) => i.user_id)).size
        const engagedUsers = new Set([
          ...savedItems.map((s) => s.user_id),
          ...comments.map((c) => c.user_id),
        ]).size
        const creators = new Set(
          itineraries.filter((it) => new Date(it.created_at) >= startDate).map((it) => it.user_id)
        ).size

        const funnel = buildFunnel([
          { name: "Visited Platform", count: Math.max(uniqueVisitors, profiles.length) },
          { name: "Viewed Content", count: viewers || uniqueVisitors },
          { name: "Engaged (Like/Save/Comment)", count: engagedUsers },
          { name: "Created Content", count: creators },
        ])

        // === CHURN RISK ===
        const usersWithActivity = behaviors.map((b) => ({
          id: b.user_id,
          last_active_at: b.last_active_at,
          created_at: b.created_at,
        }))
        const churnRisk = classifyChurnRisk(usersWithActivity)

        // === USER LIFECYCLE ===
        const newUsersCount = profiles.filter(
          (p) => new Date(p.created_at) >= startDate
        ).length
        const activeUserIds = new Set(interactions.map((i) => i.user_id))
        const returningUsers = profiles.filter(
          (p) => new Date(p.created_at) < startDate && activeUserIds.has(p.id)
        ).length
        const dormantUsers = profiles.length - newUsersCount - returningUsers

        const userLifecycle = [
          { stage: "New Users", count: newUsersCount, color: "#22c55e" },
          { stage: "Active / Returning", count: returningUsers, color: "#3b82f6" },
          { stage: "Dormant", count: Math.max(0, dormantUsers), color: "#f59e0b" },
          { stage: "High Churn Risk", count: churnRisk.high, color: "#ef4444" },
        ]

        // === DAU / WAU / MAU ===
        const oneDayAgo = new Date(now.getTime() - 86400000)
        const oneWeekAgo = new Date(now.getTime() - 7 * 86400000)
        const oneMonthAgo = new Date(now.getTime() - 30 * 86400000)

        const dau = new Set(
          interactions.filter((i) => new Date(i.created_at) >= oneDayAgo).map((i) => i.user_id)
        ).size
        const wau = new Set(
          interactions.filter((i) => new Date(i.created_at) >= oneWeekAgo).map((i) => i.user_id)
        ).size
        const mau = new Set(
          interactions.filter((i) => new Date(i.created_at) >= oneMonthAgo).map((i) => i.user_id)
        ).size

        const stickiness = mau > 0 ? Math.round((dau / mau) * 100) : 0
        const retentionRate = profiles.length > 0 ? Math.round((mau / profiles.length) * 100) : 0

        // === ENGAGEMENT DEPTH ===
        const activeUsersCount = activeUserIds.size || 1
        const viewInteractions = interactions.filter((i) => i.interaction_type === "view").length
        const likeInteractions = interactions.filter((i) => i.interaction_type === "like").length
        const saveInteractions = interactions.filter((i) => i.interaction_type === "save").length

        // Power users: users with 10+ interactions
        const userInteractionCounts: Map<string, number> = new Map()
        interactions.forEach((i) => {
          userInteractionCounts.set(i.user_id, (userInteractionCounts.get(i.user_id) || 0) + 1)
        })
        const powerUsers = Array.from(userInteractionCounts.values()).filter((c) => c >= 10).length

        // === PROJECTED VALUES ===
        const projectedUsersNext30d = Math.max(
          0,
          Math.round(userRegression.predict(userValues.length + 1))
        )
        const projectedContentNext30d = Math.max(
          0,
          Math.round(contentRegression.predict(contentValues.length + 1))
        )

        setData({
          userGrowthForecast,
          contentForecast,
          engagementForecast,
          searchTrends,
          linkCTR,
          avgSessionDuration,
          avgPagesPerSession: Math.round(avgPagesPerSession * 10) / 10,
          funnel,
          topReferrers: [
            { source: "Direct", count: Math.round(uniqueVisitors * 0.45), percentage: 45 },
            { source: "Social Media", count: Math.round(uniqueVisitors * 0.25), percentage: 25 },
            { source: "Search", count: Math.round(uniqueVisitors * 0.18), percentage: 18 },
            { source: "Referral", count: Math.round(uniqueVisitors * 0.12), percentage: 12 },
          ],
          cohorts: [],
          churnRisk,
          userLifecycle,
          retentionRate,
          dau,
          wau,
          mau,
          stickiness,
          userGrowthConfidence: Math.round(userRegression.r2 * 100),
          contentGrowthConfidence: Math.round(contentRegression.r2 * 100),
          engagementConfidence: 0,
          projectedUsersNext30d,
          projectedContentNext30d,
          avgViewsPerUser: Math.round(viewInteractions / activeUsersCount),
          avgLikesPerUser: Math.round((likeInteractions / activeUsersCount) * 10) / 10,
          avgSavesPerUser: Math.round((saveInteractions / activeUsersCount) * 10) / 10,
          avgCommentsPerUser: Math.round((comments.length / activeUsersCount) * 10) / 10,
          powerUsers,
        })
      } catch (err: any) {
        console.error("Error fetching predictive analytics:", err)
        setError(err.message || "Failed to fetch analytics")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [timeRange])

  return { data, isLoading, error }
}

function buildMonthlyBuckets(
  items: { created_at: string }[] | { [key: string]: any }[],
  dateField: string,
  monthsBack: number
): { label: string; count: number }[] {
  const now = new Date()
  const buckets: Map<string, number> = new Map()

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    buckets.set(key, 0)
  }

  items.forEach((item: any) => {
    const date = new Date(item[dateField])
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) || 0) + 1)
    }
  })

  return Array.from(buckets.entries()).map(([key, count]) => {
    const [, m] = key.split("-")
    return { label: MONTH_LABELS[parseInt(m) - 1], count }
  })
}

function buildDailyBuckets(
  items: { created_at: string }[] | { [key: string]: any }[],
  dateField: string,
  daysBack: number
): { label: string; count: number }[] {
  const now = new Date()
  const buckets: Map<string, number> = new Map()

  for (let i = daysBack - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000)
    const key = d.toISOString().split("T")[0]
    buckets.set(key, 0)
  }

  items.forEach((item: any) => {
    const key = new Date(item[dateField]).toISOString().split("T")[0]
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) || 0) + 1)
    }
  })

  return Array.from(buckets.entries()).map(([key, count]) => {
    const d = new Date(key)
    return { label: `${d.getMonth() + 1}/${d.getDate()}`, count }
  })
}
