import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST - Create a review for a business
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { business_id, rating, comment } = body

    if (!business_id) {
      return NextResponse.json({ error: "business_id is required" }, { status: 400 })
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
    }

    // Check if user already reviewed this business
    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id")
      .eq("user_id", user.id)
      .eq("business_id", business_id)
      .maybeSingle()

    if (existingReview) {
      // Update existing review
      const { data: updated, error: updateError } = await supabase
        .from("reviews")
        .update({
          rating,
          comment: comment || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingReview.id)
        .select()
        .single()

      if (updateError) {
        console.error("Error updating review:", updateError)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, review: updated, updated: true })
    }

    // Create new review
    const { data: review, error: insertError } = await supabase
      .from("reviews")
      .insert({
        user_id: user.id,
        business_id,
        rating,
        comment: comment || null,
      })
      .select()
      .single()

    if (insertError) {
      console.error("Error inserting review:", insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, review, created: true })
  } catch (error: any) {
    console.error("Error in reviews API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET - Get reviews for a business
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get("business_id")

    if (!businessId) {
      return NextResponse.json({ error: "business_id is required" }, { status: 400 })
    }

    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50)
    const offset = parseInt(searchParams.get("offset") || "0")

    const { data, error, count } = await supabase
      .from("reviews")
      .select("*, profiles:user_id(name, username, avatar_url)", { count: "exact" })
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching reviews:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate average rating
    const { data: avgData } = await supabase
      .rpc("avg", { column_name: "rating" })

    const avgRating = data && data.length > 0
      ? data.reduce((sum: number, r: any) => sum + r.rating, 0) / data.length
      : 0

    return NextResponse.json({
      reviews: data || [],
      total: count || 0,
      average_rating: Math.round(avgRating * 10) / 10,
    })
  } catch (error: any) {
    console.error("Error in reviews GET:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
