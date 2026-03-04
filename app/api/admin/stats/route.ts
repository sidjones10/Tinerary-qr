import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    // Authenticate the caller
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Verify admin privileges
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin, role")
      .eq("id", user.id)
      .single()

    if (!profile?.is_admin && profile?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get("timeRange") || "30d"

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    // Service role client bypasses RLS — admin sees ALL data
    const adminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Calculate date range
    const now = new Date()
    const daysAgo = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    const previousStartDate = new Date(startDate.getTime() - daysAgo * 24 * 60 * 60 * 1000)

    // Run independent queries in parallel
    const [
      totalUsersResult,
      currentPeriodUsersResult,
      previousPeriodUsersResult,
      totalItinerariesResult,
      currentPeriodItinerariesResult,
      previousPeriodItinerariesResult,
      metricsResult,
      totalSearchesResult,
      userGrowthResult,
      recentUsersResult,
      topItinerariesResult,
      actualLikesResult,
      actualSavesResult,
    ] = await Promise.all([
      adminClient.from("profiles").select("*", { count: "exact", head: true }),
      adminClient.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", startDate.toISOString()),
      adminClient.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", previousStartDate.toISOString()).lt("created_at", startDate.toISOString()),
      adminClient.from("itineraries").select("*", { count: "exact", head: true }),
      adminClient.from("itineraries").select("*", { count: "exact", head: true }).gte("created_at", startDate.toISOString()),
      adminClient.from("itineraries").select("*", { count: "exact", head: true }).gte("created_at", previousStartDate.toISOString()).lt("created_at", startDate.toISOString()),
      adminClient.from("itinerary_metrics").select("view_count, like_count, share_count"),
      adminClient.from("user_interactions").select("*", { count: "exact", head: true }).gte("created_at", startDate.toISOString()),
      adminClient.from("profiles").select("created_at").order("created_at", { ascending: true }),
      adminClient.from("profiles").select("id, name, email, avatar_url, created_at").order("created_at", { ascending: false }).limit(5),
      adminClient.from("itineraries").select(`
        id, title, user_id,
        profiles!itineraries_user_id_fkey (name, username),
        itinerary_metrics (view_count, save_count, like_count, share_count)
      `).eq("is_public", true).order("created_at", { ascending: false }).limit(20),
      // Get actual total likes from saved_itineraries
      adminClient.from("saved_itineraries").select("*", { count: "exact", head: true }).eq("type", "like"),
      // Get actual total saves from saved_itineraries
      adminClient.from("saved_itineraries").select("*", { count: "exact", head: true }).eq("type", "save"),
    ])

    const totalUsers = totalUsersResult.count || 0
    const currentPeriodUsers = currentPeriodUsersResult.count || 0
    const previousPeriodUsers = previousPeriodUsersResult.count || 0
    const totalItineraries = totalItinerariesResult.count || 0
    const currentPeriodItineraries = currentPeriodItinerariesResult.count || 0
    const previousPeriodItineraries = previousPeriodItinerariesResult.count || 0

    const userTrend = previousPeriodUsers > 0
      ? Math.round((currentPeriodUsers - previousPeriodUsers) / previousPeriodUsers * 100)
      : 0

    const itineraryTrend = previousPeriodItineraries > 0
      ? Math.round((currentPeriodItineraries - previousPeriodItineraries) / previousPeriodItineraries * 100)
      : 0

    // Compute totals from metrics table
    const metricsViews = metricsResult.data?.reduce((sum: number, m: any) => sum + (m.view_count || 0), 0) || 0
    const metricsLikes = metricsResult.data?.reduce((sum: number, m: any) => sum + (m.like_count || 0), 0) || 0
    const metricsShares = metricsResult.data?.reduce((sum: number, m: any) => sum + (m.share_count || 0), 0) || 0

    // Use actual counts from saved_itineraries as the source of truth for likes
    const actualTotalLikes = actualLikesResult.count || 0
    const totalViews = metricsViews
    const totalLikes = Math.max(metricsLikes, actualTotalLikes)
    const totalShares = metricsShares

    // Process user growth
    const userGrowth = processUserGrowth(userGrowthResult.data || [])

    // Get itinerary counts for recent users
    const recentUsers = await Promise.all(
      (recentUsersResult.data || []).map(async (u: any) => {
        const { count } = await adminClient
          .from("itineraries")
          .select("*", { count: "exact", head: true })
          .eq("user_id", u.id)

        return {
          id: u.id,
          name: u.name || u.email?.split("@")[0] || "Unknown",
          email: u.email || "",
          avatar_url: u.avatar_url,
          joined: formatRelativeTime(u.created_at),
          itineraryCount: count || 0,
        }
      })
    )

    // Process top itineraries — cross-reference actual likes/saves
    const topItineraryIds = (topItinerariesResult.data || []).map((i: any) => i.id)
    let topRealCounts: Record<string, { likes: number; saves: number }> = {}

    if (topItineraryIds.length > 0) {
      const [topLikes, topSaves] = await Promise.all([
        adminClient.from("saved_itineraries").select("itinerary_id").in("itinerary_id", topItineraryIds).eq("type", "like"),
        adminClient.from("saved_itineraries").select("itinerary_id").in("itinerary_id", topItineraryIds).eq("type", "save"),
      ])

      for (const id of topItineraryIds) {
        topRealCounts[id] = {
          likes: (topLikes.data || []).filter((r: any) => r.itinerary_id === id).length,
          saves: (topSaves.data || []).filter((r: any) => r.itinerary_id === id).length,
        }
      }
    }

    const topItineraries = (topItinerariesResult.data || [])
      .map((item: any) => {
        const metrics = item.itinerary_metrics?.[0] || {}
        const real = topRealCounts[item.id] || { likes: 0, saves: 0 }

        return {
          id: item.id,
          title: item.title,
          views: metrics.view_count || 0,
          likes: Math.max(metrics.like_count || 0, real.likes),
          saves: Math.max(metrics.save_count || 0, real.saves),
          shares: metrics.share_count || 0,
          creator: item.profiles?.name || item.profiles?.username || "Unknown",
          creatorId: item.user_id,
        }
      })
      .sort((a: any, b: any) => b.views - a.views)
      .slice(0, 4)

    return NextResponse.json({
      totalUsers,
      totalItineraries,
      totalViews,
      totalLikes,
      totalShares,
      totalSearches: totalSearchesResult.count || 0,
      userGrowth,
      recentUsers,
      topItineraries,
      userTrend,
      itineraryTrend,
      viewsTrend: 0,
    })
  } catch (error: any) {
    console.error("Admin stats error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

function processUserGrowth(users: { created_at: string }[]): { month: string; users: number }[] {
  const months: { [key: string]: number } = {}
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  const now = new Date()
  for (let i = 7; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    months[key] = 0
  }

  users.forEach((user) => {
    const date = new Date(user.created_at)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    if (key in months) {
      months[key]++
    }
  })

  let runningTotal = 0
  const sortedKeys = Object.keys(months).sort()

  const firstTrackedDate = sortedKeys[0]
  const [year, month] = firstTrackedDate.split("-").map(Number)
  const firstDate = new Date(year, month, 1)
  const usersBeforePeriod = users.filter(u => new Date(u.created_at) < firstDate).length
  runningTotal = usersBeforePeriod

  return sortedKeys.map((key) => {
    runningTotal += months[key]
    const [, month] = key.split("-").map(Number)
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

  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
  return date.toLocaleDateString()
}
