import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

async function getAdminClient() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: "Authentication required" }, { status: 401 }) }

  const { data: profile } = await supabase.from("profiles").select("is_admin, role").eq("id", user.id).single()
  if (!profile?.is_admin && profile?.role !== "admin") {
    return { error: NextResponse.json({ error: "Admin access required" }, { status: 403 }) }
  }

  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  return { adminClient }
}

export async function GET(request: NextRequest) {
  try {
    const result = await getAdminClient()
    if ("error" in result && !("adminClient" in result)) return result.error
    const { adminClient } = result as { adminClient: any }

    const [reviewsResult, totalReviews, commentsResult, totalComments] = await Promise.all([
      adminClient
        .from("reviews")
        .select(`*, profiles:user_id (name, email, avatar_url)`)
        .order("created_at", { ascending: false })
        .limit(50),
      adminClient.from("reviews").select("*", { count: "exact", head: true }),
      adminClient
        .from("comments")
        .select(`*, profiles:user_id (name, email, avatar_url)`)
        .order("created_at", { ascending: false })
        .limit(50),
      adminClient.from("comments").select("*", { count: "exact", head: true }),
    ])

    const reviews = reviewsResult.data || []
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.length
      : 0

    return NextResponse.json({
      reviews,
      comments: commentsResult.data || [],
      stats: {
        totalReviews: totalReviews.count || 0,
        totalComments: totalComments.count || 0,
        averageRating: Math.round(avgRating * 10) / 10,
      },
    })
  } catch (error: any) {
    console.error("Admin reviews error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const result = await getAdminClient()
    if ("error" in result && !("adminClient" in result)) return result.error
    const { adminClient } = result as { adminClient: any }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const type = searchParams.get("type") || "review"

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    if (type === "review") {
      await adminClient.from("reviews").delete().eq("id", id)
    } else {
      await adminClient.from("comments").delete().eq("id", id)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Admin reviews DELETE error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
