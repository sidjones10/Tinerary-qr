import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { sendAccountDeletionWarningEmail } from "@/lib/email-notifications"

/**
 * API Endpoint: Send Account Deletion Warnings
 *
 * This endpoint is called by a daily cron job to send 7-day warning emails
 * to users whose accounts are scheduled for deletion.
 *
 * Security: Should be protected by API key or run as Supabase Edge Function
 */
export async function POST(request: Request) {
  try {
    // Verify cron secret for security (optional but recommended)
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createClient()

    // Get accounts that need deletion warnings
    const { data: accountsNeedingWarnings, error: fetchError } = await supabase.rpc(
      "get_accounts_needing_deletion_warning",
    )

    if (fetchError) {
      console.error("Error fetching accounts needing warnings:", fetchError)
      return NextResponse.json({ error: "Failed to fetch accounts", details: fetchError.message }, { status: 500 })
    }

    if (!accountsNeedingWarnings || accountsNeedingWarnings.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No accounts need deletion warnings",
        warnings_sent: 0,
      })
    }

    // Send warning emails
    const results = []
    let successCount = 0
    let failureCount = 0

    for (const account of accountsNeedingWarnings) {
      try {
        // Send the warning email
        const emailResult = await sendAccountDeletionWarningEmail({
          email: account.email,
          name: account.name,
          username: account.username,
          deletionDate: account.deletion_scheduled_for,
          daysRemaining: account.days_until_deletion,
        })

        if (emailResult.success) {
          // Mark as sent in database
          const { error: markError } = await supabase.rpc("mark_deletion_warning_sent", {
            user_id: account.user_id,
          })

          if (markError) {
            console.error(`Failed to mark warning as sent for ${account.email}:`, markError)
            results.push({
              email: account.email,
              status: "email_sent_but_not_marked",
              error: markError.message,
            })
            failureCount++
          } else {
            results.push({
              email: account.email,
              status: "success",
            })
            successCount++
          }
        } else {
          results.push({
            email: account.email,
            status: "failed",
            error: "Email service returned failure",
          })
          failureCount++
        }
      } catch (emailError: any) {
        console.error(`Error sending warning to ${account.email}:`, emailError)
        results.push({
          email: account.email,
          status: "error",
          error: emailError.message,
        })
        failureCount++
      }
    }

    return NextResponse.json({
      success: true,
      total_accounts: accountsNeedingWarnings.length,
      warnings_sent: successCount,
      warnings_failed: failureCount,
      results: results,
    })
  } catch (error: any) {
    console.error("Error in send-deletion-warnings endpoint:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

// Allow GET for manual testing
export async function GET(request: Request) {
  try {
    const supabase = createClient()

    // Just return the list of accounts that would get warnings
    const { data: accountsNeedingWarnings, error } = await supabase.rpc("get_accounts_needing_deletion_warning")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      message: "Accounts that need deletion warnings (dry run - no emails sent)",
      count: accountsNeedingWarnings?.length || 0,
      accounts: accountsNeedingWarnings || [],
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
