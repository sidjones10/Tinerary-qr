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

// Define known cron jobs with their correct HTTP methods
const CRON_JOBS = [
  {
    id: "update-trending",
    name: "Update Trending Scores",
    endpoint: "/api/cron/update-trending",
    method: "GET" as const,
    schedule: "Every hour",
    description: "Recalculates trending scores for itineraries",
  },
  {
    id: "send-deletion-warnings",
    name: "Send Deletion Warnings",
    endpoint: "/api/cron/send-deletion-warnings",
    method: "POST" as const,
    schedule: "Daily",
    description: "Sends warnings to users with accounts scheduled for deletion",
  },
  {
    id: "send-reminders",
    name: "Send Event Reminders",
    endpoint: "/api/reminders/send",
    method: "POST" as const,
    schedule: "Hourly",
    description: "Sends upcoming event reminders to users",
  },
]

export async function GET(request: NextRequest) {
  try {
    const result = await getAdminClient()
    if ("error" in result && !("adminClient" in result)) return result.error
    const { adminClient } = result as { adminClient: any }

    // Try to fetch cron job logs if the table exists
    let cronLogs: any[] = []
    const { data: logs, error: logsError } = await adminClient
      .from("cron_job_logs")
      .select("*")
      .order("executed_at", { ascending: false })
      .limit(50)

    if (!logsError) {
      cronLogs = logs || []
    }

    // Build job status from logs
    const jobStatuses = CRON_JOBS.map((job) => {
      const jobLogs = cronLogs.filter((l: any) => l.job_id === job.id)
      const lastRun = jobLogs[0]
      const recentFailures = jobLogs.filter((l: any) => l.status === "failed").length
      const totalRuns = jobLogs.length

      return {
        ...job,
        lastRun: lastRun?.executed_at || null,
        lastStatus: lastRun?.status || "unknown",
        lastDuration: lastRun?.duration_ms || null,
        lastError: lastRun?.error_message || null,
        recentFailures,
        totalRuns,
        isHealthy: lastRun ? lastRun.status === "success" : null,
      }
    })

    return NextResponse.json({
      jobs: jobStatuses,
      recentLogs: cronLogs,
    })
  } catch (error: any) {
    console.error("Admin cron jobs error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await getAdminClient()
    if ("error" in result && !("adminClient" in result)) return result.error

    const body = await request.json()
    const { jobId } = body

    const job = CRON_JOBS.find((j) => j.id === jobId)
    if (!job) return NextResponse.json({ error: "Unknown job" }, { status: 400 })

    // Build base URL - use NEXT_PUBLIC_APP_URL first, then VERCEL_URL, then fallback
    let baseUrl: string
    if (process.env.NEXT_PUBLIC_APP_URL) {
      baseUrl = process.env.NEXT_PUBLIC_APP_URL
    } else if (process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`
    } else {
      baseUrl = "http://localhost:3000"
    }
    // Remove trailing slash
    baseUrl = baseUrl.replace(/\/$/, "")

    // Build headers - pass CRON_SECRET if configured
    const headers: Record<string, string> = {}
    if (process.env.CRON_SECRET) {
      headers["authorization"] = `Bearer ${process.env.CRON_SECRET}`
    }

    const startTime = Date.now()
    try {
      const response = await fetch(`${baseUrl}${job.endpoint}`, {
        method: job.method,
        headers,
      })
      const duration = Date.now() - startTime
      let responseBody: any = null
      try {
        responseBody = await response.json()
      } catch {
        // Response may not be JSON
      }

      return NextResponse.json({
        success: response.ok,
        status: response.status,
        duration,
        response: responseBody,
      })
    } catch (fetchError: any) {
      return NextResponse.json({
        success: false,
        error: fetchError.message,
        duration: Date.now() - startTime,
      })
    }
  } catch (error: any) {
    console.error("Admin cron trigger error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
