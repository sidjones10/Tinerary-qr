import { NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/auth/require-admin"


export async function GET(request: NextRequest) {
  try {
    const result = await getAdminClient()
    if ("error" in result && !("adminClient" in result)) return result.error
    const { adminClient } = result as { adminClient: any }

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get("filter") || "open"

    let ticketQuery = adminClient
      .from("support_tickets")
      .select(`*, profiles:user_id (name, email, avatar_url)`)
      .order("created_at", { ascending: false })

    if (filter !== "all") {
      ticketQuery = ticketQuery.eq("status", filter)
    }

    const [ticketsResult, openCount, inProgressCount, closedCount] = await Promise.all([
      ticketQuery.limit(50),
      adminClient.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "open"),
      adminClient.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "in_progress"),
      adminClient.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "closed"),
    ])

    return NextResponse.json({
      tickets: ticketsResult.data || [],
      counts: {
        open: openCount.count || 0,
        in_progress: inProgressCount.count || 0,
        closed: closedCount.count || 0,
      },
    })
  } catch (error: any) {
    console.error("Admin tickets error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await getAdminClient()
    if ("error" in result && !("adminClient" in result)) return result.error
    const { adminClient, user } = result as { adminClient: any; user: any }

    const body = await request.json()
    const { action, ticketId, note, priority } = body

    if (action === "update_status") {
      await adminClient.from("support_tickets").update({
        status: body.status,
        assigned_to: user.id,
        updated_at: new Date().toISOString(),
      }).eq("id", ticketId)
      return NextResponse.json({ success: true })
    }

    if (action === "add_note") {
      await adminClient.from("ticket_notes").insert({
        ticket_id: ticketId,
        user_id: user.id,
        content: note,
      })
      return NextResponse.json({ success: true })
    }

    if (action === "set_priority") {
      await adminClient.from("support_tickets").update({ priority }).eq("id", ticketId)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error: any) {
    console.error("Admin tickets POST error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
