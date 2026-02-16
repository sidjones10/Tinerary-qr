import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { Resend } from "resend"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

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

    // Get user's profile to check admin status
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, is_admin")
      .eq("id", user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      )
    }

    const { email: targetEmail, type = "welcome" } = await request.json()
    const recipientEmail = targetEmail || user.email

    // Check environment configuration
    const diagnostics = {
      hasResendApiKey: !!process.env.RESEND_API_KEY,
      appUrl: APP_URL,
      recipientEmail,
      emailType: type,
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({
        success: false,
        error: "RESEND_API_KEY environment variable is not set",
        diagnostics,
        fix: "Add RESEND_API_KEY=re_xxxx to your .env.local file. Get your API key from https://resend.com/api-keys"
      }, { status: 500 })
    }

    // Initialize Resend client
    const resend = new Resend(process.env.RESEND_API_KEY)

    // For testing, we'll use different from addresses based on verification status
    // Resend's test domain allows sending to any email
    const useTestDomain = process.env.NODE_ENV === "development" || process.env.USE_RESEND_TEST_DOMAIN === "true"
    const fromEmail = useTestDomain
      ? "Tinerary Test <onboarding@resend.dev>"
      : "Tinerary <noreply@tinerary-app.com>"

    let emailContent: { subject: string; html: string }

    switch (type) {
      case "welcome":
        emailContent = {
          subject: "🧪 Test: Welcome to Tinerary!",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #F97316 0%, #EC4899 100%); padding: 40px 20px; text-align: center; border-radius: 12px; }
                .header h1 { color: white; margin: 0; font-size: 28px; }
                .content { padding: 30px 20px; background: #f9fafb; border-radius: 12px; margin-top: 20px; }
                .test-badge { background: #FEF3C7; border: 2px solid #F59E0B; padding: 10px 20px; border-radius: 8px; display: inline-block; margin-bottom: 20px; }
                .button { display: inline-block; background: #F97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
                .footer { text-align: center; color: #6b7280; margin-top: 30px; font-size: 14px; }
                .diagnostics { background: #1F2937; color: #10B981; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 12px; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🧪 Email Test Successful!</h1>
                </div>
                <div class="content">
                  <div class="test-badge">⚠️ TEST EMAIL</div>
                  <h2>Email delivery is working!</h2>
                  <p>This is a test email sent from Tinerary to verify email functionality.</p>
                  <p><strong>Sent to:</strong> ${recipientEmail}</p>
                  <p><strong>From:</strong> ${fromEmail}</p>
                  <p><strong>Time:</strong> ${new Date().toISOString()}</p>

                  <div class="diagnostics">
                    <strong>Diagnostics:</strong><br>
                    App URL: ${APP_URL}<br>
                    Environment: ${process.env.NODE_ENV || "unknown"}<br>
                    Using test domain: ${useTestDomain}
                  </div>

                  <a href="${APP_URL}" class="button">Open Tinerary</a>
                </div>
                <div class="footer">
                  <p>This is a test email from Tinerary</p>
                </div>
              </div>
            </body>
            </html>
          `,
        }
        break

      case "reminder":
        emailContent = {
          subject: "🧪 Test: Event Reminder",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #F97316 0%, #F59E0B 100%); padding: 40px 20px; text-align: center; border-radius: 12px; color: white; }
                .content { padding: 30px 20px; background: #f9fafb; border-radius: 12px; margin-top: 20px; }
                .test-badge { background: #FEF3C7; border: 2px solid #F59E0B; padding: 10px 20px; border-radius: 8px; display: inline-block; margin-bottom: 20px; }
                .countdown { font-size: 48px; font-weight: bold; color: #F97316; text-align: center; padding: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>⏰ Test Reminder</h1>
                </div>
                <div class="content">
                  <div class="test-badge">⚠️ TEST EMAIL</div>
                  <div class="countdown">2 days</div>
                  <p style="text-align: center;">until <strong>Sample Event</strong> begins!</p>
                </div>
              </div>
            </body>
            </html>
          `,
        }
        break

      default:
        emailContent = {
          subject: "🧪 Test Email from Tinerary",
          html: `<p>This is a test email sent at ${new Date().toISOString()}</p>`,
        }
    }

    // Send the test email
    const result = await resend.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject: emailContent.subject,
      html: emailContent.html,
    })

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully to ${recipientEmail}`,
      emailId: result.data?.id,
      diagnostics: {
        ...diagnostics,
        fromEmail,
        useTestDomain,
        resendResponse: result,
      },
    })
  } catch (error: any) {
    console.error("Test email error:", error)

    // Parse Resend-specific errors
    let errorDetails = error.message
    let fix = ""

    if (error.message?.includes("domain is not verified")) {
      fix = "The domain tinerary-app.com is not verified in Resend. Either:\n1. Verify the domain at https://resend.com/domains\n2. Set USE_RESEND_TEST_DOMAIN=true in .env.local to use Resend's test domain (onboarding@resend.dev)"
    } else if (error.message?.includes("API key")) {
      fix = "Your RESEND_API_KEY may be invalid. Get a new one from https://resend.com/api-keys"
    } else if (error.message?.includes("rate limit")) {
      fix = "You've hit Resend's rate limit. Wait a few minutes and try again."
    }

    return NextResponse.json({
      success: false,
      error: errorDetails,
      fix,
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Test email endpoint",
    usage: "POST with { email?: string, type?: 'welcome' | 'reminder' }",
    note: "If email is not provided, sends to the authenticated user's email",
  })
}
