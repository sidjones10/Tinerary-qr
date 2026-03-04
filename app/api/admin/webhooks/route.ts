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

    // Fetch webhook logs if table exists
    let webhookLogs: any[] = []
    const { data: logs, error: logsError } = await adminClient
      .from("webhook_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)

    if (!logsError) {
      webhookLogs = logs || []
    }

    // Also check email webhook events from email_logs
    const { data: emailEvents } = await adminClient
      .from("email_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30)

    const successCount = webhookLogs.filter((l: any) => l.status === "success" || l.status_code === 200).length
    const failureCount = webhookLogs.filter((l: any) => l.status === "failed" || (l.status_code && l.status_code >= 400)).length

    return NextResponse.json({
      webhookLogs,
      emailWebhookEvents: emailEvents || [],
      stats: {
        totalWebhooks: webhookLogs.length,
        successCount,
        failureCount,
        successRate: webhookLogs.length > 0 ? Math.round((successCount / webhookLogs.length) * 100) : 100,
      },
    })
  } catch (error: any) {
    console.error("Admin webhooks error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
