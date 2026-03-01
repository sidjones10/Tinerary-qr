import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const VALID_REASONS = ["spam", "inappropriate", "misleading", "harassment", "copyright", "other"] as const

// POST - Report an itinerary
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: itineraryId } = await params
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "You must be signed in to report an itinerary" }, { status: 401 })
    }

    const body = await request.json()
    const { reason, description } = body

    // Validate reason
    if (!reason || !VALID_REASONS.includes(reason)) {
      return NextResponse.json(
        { error: "Invalid report reason. Must be one of: " + VALID_REASONS.join(", ") },
        { status: 400 }
      )
    }

    // Verify itinerary exists and is public
    const { data: itinerary, error: itineraryError } = await supabase
      .from("itineraries")
      .select("id, user_id, is_public")
      .eq("id", itineraryId)
      .single()

    if (itineraryError || !itinerary) {
      return NextResponse.json({ error: "Itinerary not found" }, { status: 404 })
    }

    // Can't report your own itinerary
    if (itinerary.user_id === user.id) {
      return NextResponse.json({ error: "You cannot report your own itinerary" }, { status: 400 })
    }

    // Can only report public itineraries
    if (!itinerary.is_public) {
      return NextResponse.json({ error: "Only public itineraries can be reported" }, { status: 400 })
    }

    // Submit report
    const { data: report, error: insertError } = await supabase
      .from("itinerary_reports")
      .insert({
        itinerary_id: itineraryId,
        reporter_id: user.id,
        reason,
        description: description?.trim() || null,
      })
      .select("id")
      .single()

    if (insertError) {
      // Handle duplicate report
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "You have already reported this itinerary" },
          { status: 409 }
        )
      }
      console.error("Error creating report:", insertError)
      return NextResponse.json({ error: "Failed to submit report" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      reportId: report.id,
      message: "Report submitted. Our team will review it shortly.",
    })
  } catch (error: any) {
    console.error("Error reporting itinerary:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET - Check if current user has already reported this itinerary
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: itineraryId } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ hasReported: false })
    }

    const { data: existing } = await supabase
      .from("itinerary_reports")
      .select("id, status")
      .eq("itinerary_id", itineraryId)
      .eq("reporter_id", user.id)
      .maybeSingle()

    return NextResponse.json({
      hasReported: !!existing,
      reportStatus: existing?.status || null,
    })
  } catch (error: any) {
    console.error("Error checking report status:", error)
    return NextResponse.json({ hasReported: false })
  }
}
