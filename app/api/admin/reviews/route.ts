import { NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/auth/require-admin"


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
