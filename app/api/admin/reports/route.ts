import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - List all reports (admin only)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin, role")
      .eq("id", user.id)
      .single()

    if (!profile?.is_admin && profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "pending"
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from("itinerary_reports")
      .select(`
        *,
        reporter:profiles!itinerary_reports_reporter_id_fkey(id, name, username, email, avatar_url),
        itinerary:itineraries!itinerary_reports_itinerary_id_fkey(id, title, user_id, is_public, image_url, location,
          owner:profiles!itineraries_user_id_fkey(id, name, username, email)
        ),
        reviewer:profiles!itinerary_reports_reviewed_by_fkey(id, name, username)
      `, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (status !== "all") {
      query = query.eq("status", status)
    }

    const { data: reports, count, error } = await query

    if (error) {
      console.error("Error fetching reports:", error)
      return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 })
    }

    return NextResponse.json({
      reports: reports || [],
      total: count || 0,
      page,
      limit,
    })
  } catch (error: any) {
    console.error("Error in admin reports:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH - Update report status (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin, role")
      .eq("id", user.id)
      .single()

    if (!profile?.is_admin && profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { reportId, status, adminNotes, action } = body

    if (!reportId) {
      return NextResponse.json({ error: "Report ID is required" }, { status: 400 })
    }

    const validStatuses = ["reviewed", "resolved", "dismissed"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Update the report
    const { error: updateError } = await supabase
      .from("itinerary_reports")
      .update({
        status,
        admin_notes: adminNotes || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", reportId)

    if (updateError) {
      console.error("Error updating report:", updateError)
      return NextResponse.json({ error: "Failed to update report" }, { status: 500 })
    }

    // If action is to make the itinerary private, do so
    if (action === "make_private") {
      const { data: report } = await supabase
        .from("itinerary_reports")
        .select("itinerary_id")
        .eq("id", reportId)
        .single()

      if (report) {
        await supabase
          .from("itineraries")
          .update({ is_public: false })
          .eq("id", report.itinerary_id)
      }
    }

    // If action is to delete the itinerary
    if (action === "delete_itinerary") {
      const { data: report } = await supabase
        .from("itinerary_reports")
        .select("itinerary_id")
        .eq("id", reportId)
        .single()

      if (report) {
        await supabase
          .from("itineraries")
          .delete()
          .eq("id", report.itinerary_id)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error updating report:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
