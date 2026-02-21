/**
 * Predictive Analytics Utility Functions
 *
 * Provides forecasting, trend analysis, cohort analysis, and scoring
 * for the admin analytics dashboard.
 */

// --- Linear Regression for Trend Projection ---

interface DataPoint {
  x: number
  y: number
}

interface RegressionResult {
  slope: number
  intercept: number
  r2: number
  predict: (x: number) => number
}

export function linearRegression(points: DataPoint[]): RegressionResult {
  const n = points.length
  if (n < 2) {
    return { slope: 0, intercept: 0, r2: 0, predict: () => 0 }
  }

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0
  for (const p of points) {
    sumX += p.x
    sumY += p.y
    sumXY += p.x * p.y
    sumX2 += p.x * p.x
    sumY2 += p.y * p.y
  }

  const denom = n * sumX2 - sumX * sumX
  if (denom === 0) {
    return { slope: 0, intercept: sumY / n, r2: 0, predict: () => sumY / n }
  }

  const slope = (n * sumXY - sumX * sumY) / denom
  const intercept = (sumY - slope * sumX) / n

  // R-squared
  const yMean = sumY / n
  let ssTot = 0, ssRes = 0
  for (const p of points) {
    ssTot += (p.y - yMean) ** 2
    ssRes += (p.y - (slope * p.x + intercept)) ** 2
  }
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot

  return {
    slope,
    intercept,
    r2: Math.max(0, r2),
    predict: (x: number) => Math.max(0, slope * x + intercept),
  }
}

// --- Exponential Smoothing for Short-term Forecasts ---

export function exponentialSmoothing(
  data: number[],
  alpha: number = 0.3,
  forecastPeriods: number = 7
): number[] {
  if (data.length === 0) return Array(forecastPeriods).fill(0)

  let smoothed = data[0]
  for (let i = 1; i < data.length; i++) {
    smoothed = alpha * data[i] + (1 - alpha) * smoothed
  }

  // Simple trend via double exponential smoothing
  let level = data[0]
  let trend = data.length > 1 ? data[1] - data[0] : 0
  const beta = 0.1

  for (let i = 1; i < data.length; i++) {
    const prevLevel = level
    level = alpha * data[i] + (1 - alpha) * (level + trend)
    trend = beta * (level - prevLevel) + (1 - beta) * trend
  }

  const forecast: number[] = []
  for (let i = 1; i <= forecastPeriods; i++) {
    forecast.push(Math.max(0, Math.round(level + trend * i)))
  }

  return forecast
}

// --- Moving Average ---

export function movingAverage(data: number[], window: number = 7): number[] {
  const result: number[] = []
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - window + 1)
    const slice = data.slice(start, i + 1)
    result.push(slice.reduce((a, b) => a + b, 0) / slice.length)
  }
  return result
}

// --- Cohort Retention Analysis ---

export interface CohortData {
  cohort: string // e.g. "Jan 2024"
  size: number
  retention: number[] // percentages for each period after signup
}

export function buildCohorts(
  users: { id: string; created_at: string }[],
  interactions: { user_id: string; created_at: string }[],
  periodDays: number = 7,
  numPeriods: number = 8
): CohortData[] {
  // Group users by cohort (week)
  const cohorts: Map<string, Set<string>> = new Map()
  const now = new Date()

  for (const user of users) {
    const created = new Date(user.created_at)
    const weekStart = new Date(created)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const key = weekStart.toISOString().split("T")[0]
    if (!cohorts.has(key)) cohorts.set(key, new Set())
    cohorts.get(key)!.add(user.id)
  }

  // Build interaction map: user_id -> Set<period_keys>
  const userActivityPeriods: Map<string, Set<number>> = new Map()
  for (const interaction of interactions) {
    const ts = new Date(interaction.created_at).getTime()
    if (!userActivityPeriods.has(interaction.user_id)) {
      userActivityPeriods.set(interaction.user_id, new Set())
    }
    // Store the timestamp for period calculation
    userActivityPeriods.get(interaction.user_id)!.add(ts)
  }

  // Calculate retention for each cohort
  const result: CohortData[] = []
  const sortedCohorts = Array.from(cohorts.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-numPeriods)

  for (const [cohortKey, userIds] of sortedCohorts) {
    const cohortStart = new Date(cohortKey)
    const cohortDate = cohortStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    const retention: number[] = []

    for (let period = 0; period < numPeriods; period++) {
      const periodStart = new Date(cohortStart.getTime() + period * periodDays * 86400000)
      const periodEnd = new Date(periodStart.getTime() + periodDays * 86400000)

      if (periodStart > now) {
        retention.push(-1) // future period
        continue
      }

      let activeCount = 0
      for (const userId of userIds) {
        const timestamps = userActivityPeriods.get(userId)
        if (timestamps) {
          for (const ts of timestamps) {
            if (ts >= periodStart.getTime() && ts < periodEnd.getTime()) {
              activeCount++
              break
            }
          }
        }
      }

      retention.push(userIds.size > 0 ? Math.round((activeCount / userIds.size) * 100) : 0)
    }

    result.push({
      cohort: cohortDate,
      size: userIds.size,
      retention,
    })
  }

  return result
}

// --- User Health Score ---

export interface UserHealthScore {
  score: number // 0-100
  label: "Healthy" | "At Risk" | "Critical"
  color: string
}

export function calculateUserHealthScore(
  totalUsers: number,
  activeUsers: number,
  newUsers: number,
  churned: number
): UserHealthScore {
  if (totalUsers === 0) return { score: 0, label: "Critical", color: "#ef4444" }

  const activeRatio = activeUsers / totalUsers
  const growthRatio = newUsers / Math.max(totalUsers, 1)
  const churnRatio = churned / Math.max(totalUsers, 1)

  // Weighted score
  const score = Math.min(100, Math.round(
    activeRatio * 50 +
    growthRatio * 30 * 10 + // amplify since new users / total is typically small
    (1 - churnRatio) * 20
  ))

  if (score >= 70) return { score, label: "Healthy", color: "#22c55e" }
  if (score >= 40) return { score, label: "At Risk", color: "#f59e0b" }
  return { score, label: "Critical", color: "#ef4444" }
}

// --- Engagement Score per User ---

export function calculateEngagementScore(
  views: number,
  likes: number,
  comments: number,
  saves: number,
  shares: number
): number {
  return Math.min(100, Math.round(
    views * 1 +
    likes * 3 +
    comments * 5 +
    saves * 4 +
    shares * 6
  ))
}

// --- Growth Rate Calculation ---

export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

// --- Click-Through Rate ---

export function calculateCTR(clicks: number, impressions: number): number {
  if (impressions === 0) return 0
  return Math.round((clicks / impressions) * 10000) / 100
}

// --- Projected Value ---

export function projectValue(
  historicalValues: number[],
  periodsAhead: number
): { projected: number; confidence: number } {
  if (historicalValues.length < 2) {
    return { projected: historicalValues[0] || 0, confidence: 0 }
  }

  const points: DataPoint[] = historicalValues.map((y, i) => ({ x: i, y }))
  const reg = linearRegression(points)
  const projected = Math.max(0, Math.round(reg.predict(historicalValues.length - 1 + periodsAhead)))

  return { projected, confidence: Math.round(reg.r2 * 100) }
}

// --- Format Helpers ---

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function formatCompactNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

// --- Churn Risk Classification ---

export interface ChurnRisk {
  userId: string
  daysSinceActive: number
  risk: "low" | "medium" | "high"
  score: number
}

export function classifyChurnRisk(
  users: { id: string; last_active_at: string | null; created_at: string }[],
  now: Date = new Date()
): { low: number; medium: number; high: number; total: number } {
  let low = 0, medium = 0, high = 0

  for (const user of users) {
    const lastActive = user.last_active_at ? new Date(user.last_active_at) : new Date(user.created_at)
    const daysSinceActive = Math.floor((now.getTime() - lastActive.getTime()) / 86400000)

    if (daysSinceActive <= 7) low++
    else if (daysSinceActive <= 30) medium++
    else high++
  }

  return { low, medium, high, total: users.length }
}

// --- Funnel Analysis ---

export interface FunnelStep {
  name: string
  count: number
  percentage: number
  dropoff: number
}

export function buildFunnel(steps: { name: string; count: number }[]): FunnelStep[] {
  if (steps.length === 0) return []

  const firstCount = steps[0].count || 1
  return steps.map((step, i) => ({
    name: step.name,
    count: step.count,
    percentage: Math.round((step.count / firstCount) * 100),
    dropoff: i === 0 ? 0 : Math.round(((steps[i - 1].count - step.count) / Math.max(steps[i - 1].count, 1)) * 100),
  }))
}

// --- Search Trend Analysis ---

export interface SearchTrend {
  term: string
  count: number
  trend: "rising" | "stable" | "declining"
  change: number
}

export function analyzeSearchTrends(
  recentSearches: string[],
  previousSearches: string[]
): SearchTrend[] {
  const recentCounts: Map<string, number> = new Map()
  const previousCounts: Map<string, number> = new Map()

  for (const s of recentSearches) {
    const term = s.toLowerCase().trim()
    if (term) recentCounts.set(term, (recentCounts.get(term) || 0) + 1)
  }

  for (const s of previousSearches) {
    const term = s.toLowerCase().trim()
    if (term) previousCounts.set(term, (previousCounts.get(term) || 0) + 1)
  }

  const trends: SearchTrend[] = []
  for (const [term, count] of recentCounts) {
    const prevCount = previousCounts.get(term) || 0
    const change = calculateGrowthRate(count, prevCount)
    let trend: "rising" | "stable" | "declining" = "stable"
    if (change > 20) trend = "rising"
    else if (change < -20) trend = "declining"

    trends.push({ term, count, trend, change })
  }

  return trends.sort((a, b) => b.count - a.count).slice(0, 15)
}
