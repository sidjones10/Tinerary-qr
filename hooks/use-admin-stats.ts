"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export interface AdminStats {
  totalUsers: number
  totalItineraries: number
  totalViews: number
  totalLikes: number
  totalShares: number
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
    likes: number
    saves: number
    shares: number
    creator: string
    creatorId: string
  }[]
  userTrend: number
  itineraryTrend: number
  viewsTrend: number
}

// Uses server-side API route to bypass RLS so admin sees ALL data with accurate stats
export function useAdminStats(timeRange: "7d" | "30d" | "90d" = "30d") {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true)
      setError(null)

      try {
        const res = await fetch(`/api/admin/stats?timeRange=${timeRange}`)
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        } else {
          const errData = await res.json().catch(() => ({ error: "Unknown error" }))
          setError(errData.error || "Failed to fetch stats")
        }
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

// Hook to fetch all users for the users page
export function useAdminUsers(page = 1, limit = 20, search = "", refreshKey = 0) {
  const [users, setUsers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [adminCount, setAdminCount] = useState(0)
  const [minorCount, setMinorCount] = useState(0)
  const [suspendedCount, setSuspendedCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const refetch = () => {
    fetchUsers()
  }

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

    // Fetch total counts for admins, minors, and suspended (across all users, not just current page)
    const { count: totalAdmins } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("is_admin", true)

    const { count: totalMinors } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("account_type", "minor")

    const { count: totalSuspended } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("is_suspended", true)

    setAdminCount(totalAdmins || 0)
    setMinorCount(totalMinors || 0)
    setSuspendedCount(totalSuspended || 0)

    setIsLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [page, limit, search, refreshKey])

  return { users, total, adminCount, minorCount, suspendedCount, isLoading, refetch }
}

// Hook to fetch all itineraries for the itineraries page
// Uses server-side API route to bypass RLS so admin can see ALL itineraries
export function useAdminItineraries(page = 1, limit = 20, search = "") {
  const [itineraries, setItineraries] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const refetch = () => setRefreshKey((k: number) => k + 1)

  useEffect(() => {
    async function fetchItineraries() {
      setIsLoading(true)

      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        })
        if (search) {
          params.set("search", search)
        }

        const res = await fetch(`/api/admin/itineraries?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          setItineraries(data.itineraries || [])
          setTotal(data.total || 0)
        } else {
          console.error("Failed to fetch admin itineraries:", res.status)
          setItineraries([])
          setTotal(0)
        }
      } catch (err) {
        console.error("Error fetching admin itineraries:", err)
        setItineraries([])
        setTotal(0)
      }

      setIsLoading(false)
    }

    fetchItineraries()
  }, [page, limit, search, refreshKey])

  return { itineraries, total, isLoading, refetch }
}
