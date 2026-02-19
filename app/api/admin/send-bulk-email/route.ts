import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { sendWhatsNewEmail } from "@/lib/email-notifications"
import { rateLimit, getClientIp } from "@/lib/rate-limit"
import { writeAuditLog } from "@/lib/audit-log"

// 3 bulk email operations per hour (admin action, should be rare)
const BULK_EMAIL_RATE_LIMIT = { maxRequests: 3, windowSeconds: 60 * 60 }

// Hard cap on recipients per batch to prevent abuse
const MAX_BATCH_SIZE = 500

export async function POST(request: Request) {
  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      )
    }

    // Rate limit bulk email operations
    const ip = getClientIp(request)
    const rl = await rateLimit(`admin-bulk-email:${ip}`, BULK_EMAIL_RATE_LIMIT)
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: "Bulk email rate limit exceeded. Try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
      )
    }

    const body = await request.json().catch(() => ({}))
    const { dryRun = false, limit } = body
    const safeBatchLimit = Math.min(Number(limit) || MAX_BATCH_SIZE, MAX_BATCH_SIZE)

    // Fetch all users with marketing consent enabled
    let query = supabase
      .from("profiles")
      .select("id, email, name, username, marketing_consent")
      .eq("marketing_consent", true)
      .not("email", "is", null)

    query = query.limit(safeBatchLimit)

    const { data: users, error: fetchError } = await query

    if (fetchError) {
      return NextResponse.json({
        success: false,
        error: "Failed to fetch users",
        details: fetchError.message,
      }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No users to send emails to",
        stats: { total: 0, sent: 0, failed: 0 },
      })
    }

    if (dryRun) {
      return NextResponse.json({
        success: true,
        message: "Dry run - no emails sent",
        stats: {
          total: users.length,
          wouldSend: users.length,
        },
        users: users.map(u => ({ email: u.email, name: u.name || u.username })),
      })
    }

    // Send emails to all users
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as { email: string; error: string }[],
    }

    for (const u of users) {
      if (!u.email) continue

      const result = await sendWhatsNewEmail({
        email: u.email,
        name: u.name || u.username || undefined,
      })

      if (result.success) {
        results.sent++
      } else {
        results.failed++
        results.errors.push({
          email: u.email,
          error: result.error || "Unknown error",
        })
      }

      // Small delay between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Audit log the bulk email action
    await writeAuditLog({
      actor_id: user.id,
      action: "send_bulk_email",
      ip_address: ip,
      metadata: { total: users.length, sent: results.sent, failed: results.failed, dryRun },
    })

    return NextResponse.json({
      success: true,
      message: `Sent ${results.sent} emails`,
      stats: {
        total: users.length,
        sent: results.sent,
        failed: results.failed,
      },
      errors: results.errors.length > 0 ? results.errors : undefined,
    })
  } catch (error: any) {
    console.error("Bulk email error:", error)
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Bulk email endpoint for sending 'What's New' emails to all users",
    usage: "POST with optional { dryRun?: boolean, limit?: number }",
    options: {
      dryRun: "Set to true to preview which users would receive emails without actually sending",
      limit: "Limit the number of users to email (useful for testing)",
    },
    note: "Requires admin authentication. Only sends to users with marketing_consent enabled.",
  })
}
