import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

async function verifyAdmin(supabase: any) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, role")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin && profile?.role !== "admin") return null
  return user
}

// GET - List all user reports (admin only)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const user = await verifyAdmin(supabase)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "pending"
    const severity = searchParams.get("severity") || "all"
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    // First try with column-based FK disambiguation (more reliable than constraint names)
    let query = supabase
      .from("user_reports")
      .select(
        `
        *,
        reported_user:profiles!reported_user_id(id, name, username, email, avatar_url, bio),
        reporter:profiles!reporter_id(id, name, username, email, avatar_url),
        reviewer:profiles!reviewed_by(id, name, username)
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (status !== "all") {
      query = query.eq("status", status)
    }
    if (severity !== "all") {
      query = query.eq("severity", severity)
    }

    let { data: reports, count, error } = await query

    if (error) {
      console.error("Error fetching user reports with joins:", error)
      // Fallback: fetch without joins so admin can still see reports
      let fallbackQuery = supabase
        .from("user_reports")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)

      if (status !== "all") {
        fallbackQuery = fallbackQuery.eq("status", status)
      }
      if (severity !== "all") {
        fallbackQuery = fallbackQuery.eq("severity", severity)
      }

      const fallback = await fallbackQuery
      if (fallback.error) {
        console.error("Error fetching user reports (fallback):", fallback.error)
        return NextResponse.json(
          { error: "Failed to fetch user reports: " + fallback.error.message },
          { status: 500 }
        )
      }
      reports = fallback.data
      count = fallback.count
    }

    // Get counts for each status
    const [pendingRes, reviewedRes, resolvedRes, criticalRes] =
      await Promise.all([
        supabase
          .from("user_reports")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("user_reports")
          .select("id", { count: "exact", head: true })
          .eq("status", "reviewed"),
        supabase
          .from("user_reports")
          .select("id", { count: "exact", head: true })
          .eq("status", "resolved"),
        supabase
          .from("user_reports")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending")
          .in("severity", ["critical", "high"]),
      ])

    return NextResponse.json({
      reports: reports || [],
      total: count || 0,
      page,
      limit,
      counts: {
        pending: pendingRes.count || 0,
        reviewed: reviewedRes.count || 0,
        resolved: resolvedRes.count || 0,
        critical: criticalRes.count || 0,
      },
    })
  } catch (error: any) {
    console.error("Error in admin user reports:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH - Update report status and take action (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const user = await verifyAdmin(supabase)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { reportId, status, adminNotes, adminAction, severity } = body

    if (!reportId) {
      return NextResponse.json(
        { error: "Report ID is required" },
        { status: 400 }
      )
    }

    const validStatuses = ["reviewed", "resolved", "dismissed"]
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const updateData: Record<string, any> = {
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (status) updateData.status = status
    if (adminNotes !== undefined) updateData.admin_notes = adminNotes || null
    if (adminAction) updateData.admin_action = adminAction
    if (severity) updateData.severity = severity

    const { error: updateError } = await supabase
      .from("user_reports")
      .update(updateData)
      .eq("id", reportId)

    if (updateError) {
      console.error("Error updating user report:", updateError)
      return NextResponse.json(
        { error: "Failed to update report" },
        { status: 500 }
      )
    }

    // If admin action is to suspend or ban, update the reported user's profile
    if (adminAction === "suspended" || adminAction === "banned") {
      const { data: report } = await supabase
        .from("user_reports")
        .select("reported_user_id")
        .eq("id", reportId)
        .single()

      if (report) {
        await supabase
          .from("profiles")
          .update({
            account_status: adminAction,
            updated_at: new Date().toISOString(),
          })
          .eq("id", report.reported_user_id)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error updating user report:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
