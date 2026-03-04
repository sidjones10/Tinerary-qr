import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    // Authenticate the caller
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Verify admin privileges
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin, role")
      .eq("id", user.id)
      .single()

    if (!profile?.is_admin && profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      )
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "20", 10)
    const search = searchParams.get("search") || ""

    // Use service role client to bypass RLS (so admin can see ALL itineraries)
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }

    const adminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    let query = adminClient
      .from("itineraries")
      .select(`
        *,
        profiles!itineraries_user_id_fkey (name, username, email),
        itinerary_metrics (view_count, save_count, like_count, share_count)
      `, { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (search) {
      // Simple search by title and location
      query = query.or(`title.ilike.%${search}%,location.ilike.%${search}%`)
    }

    const { data, count, error } = await query

    if (error) {
      console.error("Error fetching admin itineraries:", error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // For each itinerary, compute real like/save counts from saved_itineraries
    // in case itinerary_metrics is out of sync
    const itineraryIds = (data || []).map((item: any) => item.id)

    let realCounts: Record<string, { likes: number; saves: number }> = {}

    if (itineraryIds.length > 0) {
      // Get actual like counts
      const { data: likeCounts } = await adminClient
        .from("saved_itineraries")
        .select("itinerary_id")
        .in("itinerary_id", itineraryIds)
        .eq("type", "like")

      // Get actual save counts
      const { data: saveCounts } = await adminClient
        .from("saved_itineraries")
        .select("itinerary_id")
        .in("itinerary_id", itineraryIds)
        .eq("type", "save")

      // Aggregate counts
      for (const id of itineraryIds) {
        realCounts[id] = {
          likes: (likeCounts || []).filter((r: any) => r.itinerary_id === id).length,
          saves: (saveCounts || []).filter((r: any) => r.itinerary_id === id).length,
        }
      }
    }

    // Merge real counts into the response, preferring actual data over stale metrics
    const enrichedData = (data || []).map((item: any) => {
      const metrics = item.itinerary_metrics?.[0] || {}
      const real = realCounts[item.id] || { likes: 0, saves: 0 }

      return {
        ...item,
        itinerary_metrics: [{
          view_count: metrics.view_count || 0,
          like_count: Math.max(metrics.like_count || 0, real.likes),
          save_count: Math.max(metrics.save_count || 0, real.saves),
          share_count: metrics.share_count || 0,
        }],
      }
    })

    return NextResponse.json({
      itineraries: enrichedData,
      total: count || 0,
    })
  } catch (error: any) {
    console.error("Admin itineraries error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
