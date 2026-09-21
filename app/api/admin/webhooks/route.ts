import { NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/auth/require-admin"


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
