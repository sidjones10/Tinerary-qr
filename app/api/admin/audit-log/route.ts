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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = 30
    const offset = (page - 1) * limit

    const [logsResult, totalResult, loginEventsResult] = await Promise.all([
      adminClient
        .from("admin_audit_logs")
        .select(`*, admin:admin_id (name, email)`)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1),
      adminClient.from("admin_audit_logs").select("*", { count: "exact", head: true }),
      adminClient
        .from("login_events")
        .select(`*, profiles:user_id (name, email)`)
        .order("created_at", { ascending: false })
        .limit(20),
    ])

    return NextResponse.json({
      logs: logsResult.data || [],
      loginEvents: loginEventsResult.data || [],
      total: totalResult.count || 0,
      page,
      totalPages: Math.ceil((totalResult.count || 0) / limit),
    })
  } catch (error: any) {
    console.error("Admin audit log error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
