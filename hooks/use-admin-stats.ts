"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { normalizeLocation } from "@/lib/location-utils"

export interface AdminStats {
  totalUsers: number
  totalItineraries: number
  totalViews: number
  totalSearches: number
  userGrowth: { month: string; users: number }[]
  recentUsers: {
    id: string
    name: string
    email: string
    avatar_url: string | null
    joined: string
    itineraryCount: number
  }[]
  topItineraries: {
    id: string
    title: string
    views: number
    saves: number
    creator: string
    creatorId: string
  }[]
  userTrend: number
  itineraryTrend: number
  viewsTrend: number
}

export function useAdminStats(timeRange: "7d" | "30d" | "90d" = "30d") {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true)
      setError(null)

      try {
        const supabase = createClient()

        // Calculate date range
        const now = new Date()
        const daysAgo = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90
        const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
        const previousStartDate = new Date(startDate.getTime() - daysAgo * 24 * 60 * 60 * 1000)

        // Fetch total users
        const { count: totalUsers } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })

        // Fetch users in current period
        const { count: currentPeriodUsers } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gte("created_at", startDate.toISOString())

        // Fetch users in previous period
        const { count: previousPeriodUsers } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gte("created_at", previousStartDate.toISOString())
          .lt("created_at", startDate.toISOString())

        // Calculate user trend
        const userTrend = previousPeriodUsers && previousPeriodUsers > 0
          ? Math.round(((currentPeriodUsers || 0) - previousPeriodUsers) / previousPeriodUsers * 100)
          : 0

        // Fetch total itineraries
        const { count: totalItineraries } = await supabase
          .from("itineraries")
          .select("*", { count: "exact", head: true })

        // Fetch itineraries in current period
        const { count: currentPeriodItineraries } = await supabase
          .from("itineraries")
          .select("*", { count: "exact", head: true })
          .gte("created_at", startDate.toISOString())

        // Fetch itineraries in previous period
        const { count: previousPeriodItineraries } = await supabase
          .from("itineraries")
          .select("*", { count: "exact", head: true })
          .gte("created_at", previousStartDate.toISOString())
          .lt("created_at", startDate.toISOString())

        // Calculate itinerary trend
        const itineraryTrend = previousPeriodItineraries && previousPeriodItineraries > 0
          ? Math.round(((currentPeriodItineraries || 0) - previousPeriodItineraries) / previousPeriodItineraries * 100)
          : 0

        // Fetch total views from metrics
        const { data: metricsData } = await supabase
          .from("itinerary_metrics")
          .select("view_count")

        const totalViews = metricsData?.reduce((sum, m) => sum + (m.view_count || 0), 0) || 0

        // Fetch user interactions count (as proxy for searches/activity)
        const { count: totalSearches } = await supabase
          .from("user_interactions")
          .select("*", { count: "exact", head: true })
          .gte("created_at", startDate.toISOString())

        // Fetch user growth data (monthly)
        const { data: userGrowthRaw } = await supabase
          .from("profiles")
          .select("created_at")
          .order("created_at", { ascending: true })

        // Process user growth into monthly buckets
        const userGrowth = processUserGrowth(userGrowthRaw || [])

        // Fetch recent users with itinerary count
        const { data: recentUsersData } = await supabase
          .from("profiles")
          .select(`
            id,
            name,
            email,
            avatar_url,
            created_at
          `)
          .order("created_at", { ascending: false })
          .limit(5)

        // Get itinerary counts for recent users
        const recentUsers = await Promise.all(
          (recentUsersData || []).map(async (user) => {
            const { count } = await supabase
              .from("itineraries")
              .select("*", { count: "exact", head: true })
              .eq("user_id", user.id)

            return {
              id: user.id,
              name: user.name || user.email?.split("@")[0] || "Unknown",
              email: user.email || "",
              avatar_url: user.avatar_url,
              joined: formatRelativeTime(user.created_at),
              itineraryCount: count || 0,
            }
          })
        )

        // Fetch top itineraries by views
        const { data: topItinerariesData } = await supabase
          .from("itineraries")
          .select(`
            id,
            title,
            user_id,
            profiles!itineraries_user_id_fkey (name, username),
            itinerary_metrics (view_count, save_count)
          `)
          .eq("is_public", true)
          .order("created_at", { ascending: false })
          .limit(20)

        // Sort by views and take top 4
        const topItineraries = (topItinerariesData || [])
          .map((item: any) => ({
            id: item.id,
            title: item.title,
            views: item.itinerary_metrics?.[0]?.view_count || 0,
            saves: item.itinerary_metrics?.[0]?.save_count || 0,
            creator: item.profiles?.name || item.profiles?.username || "Unknown",
            creatorId: item.user_id,
          }))
          .sort((a, b) => b.views - a.views)
          .slice(0, 4)

        setStats({
          totalUsers: totalUsers || 0,
          totalItineraries: totalItineraries || 0,
          totalViews,
          totalSearches: totalSearches || 0,
          userGrowth,
          recentUsers,
          topItineraries,
          userTrend,
          itineraryTrend,
          viewsTrend: 0, // Would need historical data to calculate
        })
      } catch (err: any) {
        console.error("Error fetching admin stats:", err)
        setError(err.message || "Failed to fetch stats")
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [timeRange])

  return { stats, isLoading, error }
}

function processUserGrowth(users: { created_at: string }[]): { month: string; users: number }[] {
  const months: { [key: string]: number } = {}
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  // Get last 8 months
  const now = new Date()
  for (let i = 7; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    months[key] = 0
  }

  // Count users per month
  let cumulative = 0
  users.forEach((user) => {
    const date = new Date(user.created_at)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    if (key in months) {
      months[key]++
    }
    cumulative++
  })

  // Convert to array with cumulative counts
  let runningTotal = 0
  const sortedKeys = Object.keys(months).sort()

  // Calculate base (users before the tracked period)
  const firstTrackedDate = sortedKeys[0]
  const [year, month] = firstTrackedDate.split("-").map(Number)
  const firstDate = new Date(year, month, 1)
  const usersBeforePeriod = users.filter(u => new Date(u.created_at) < firstDate).length
  runningTotal = usersBeforePeriod

  return sortedKeys.map((key) => {
    runningTotal += months[key]
    const [year, month] = key.split("-").map(Number)
    return {
      month: monthNames[month],
      users: runningTotal,
    }
  })
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) {
    return `${diffMins} min ago`
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
  } else {
    return date.toLocaleDateString()
  }
}

// Hook to fetch all users for the users page
export function useAdminUsers(page = 1, limit = 20, search = "") {
  const [users, setUsers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchUsers() {
      setIsLoading(true)
      const supabase = createClient()

      let query = supabase
        .from("profiles")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range((page - 1) * limit, page * limit - 1)

      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,username.ilike.%${search}%`)
      }

      const { data, count, error } = await query

      if (!error) {
        setUsers(data || [])
        setTotal(count || 0)
      }
      setIsLoading(false)
    }

    fetchUsers()
  }, [page, limit, search])

  return { users, total, isLoading }
}

// Hook to fetch all itineraries for the itineraries page
export function useAdminItineraries(page = 1, limit = 20, search = "") {
  const [itineraries, setItineraries] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchItineraries() {
      setIsLoading(true)
      const supabase = createClient()

      let query = supabase
        .from("itineraries")
        .select(`
          *,
          profiles!itineraries_user_id_fkey (name, username, email),
          itinerary_metrics (view_count, save_count, like_count)
        `, { count: "exact" })
        .order("created_at", { ascending: false })
        .range((page - 1) * limit, page * limit - 1)

      if (search) {
        // Get location variations (TX -> Texas, NYC -> New York, etc.)
        const locationVariations = normalizeLocation(search)

        // Build OR conditions for all location variations
        const locationConditions = locationVariations
          .map(v => `location.ilike.%${v}%`)
          .join(",")

        query = query.or(`title.ilike.%${search}%,${locationConditions}`)
      }

      const { data, count, error } = await query

      if (!error) {
        setItineraries(data || [])
        setTotal(count || 0)
      }
      setIsLoading(false)
    }

    fetchItineraries()
  }, [page, limit, search])

  return { itineraries, total, isLoading }
}
