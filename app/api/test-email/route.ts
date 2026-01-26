import { NextResponse } from "next/server"
import { Resend } from "resend"

export async function GET(request: Request) {
  try {
    // Get email from query params
    const { searchParams } = new URL(request.url)
    const testEmail = searchParams.get("email") || "test@example.com"

    const resend = new Resend(process.env.RESEND_API_KEY)

    const { data, error } = await resend.emails.send({
      from: "Tinerary <noreply@tinerary-app.com>",
      to: testEmail,
      subject: "Test Email from Tinerary",
      html: "<h1>✅ It works!</h1><p>If you receive this, Resend email is configured correctly.</p>",
    })

    if (error) {
      return NextResponse.json({
        success: false,
        error: error,
        apiKey: process.env.RESEND_API_KEY ? "✅ API key is set" : "❌ API key is missing!",
      })
    }

    return NextResponse.json({
      success: true,
      data,
      message: "Email sent successfully! Check your inbox.",
      sentTo: testEmail,
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      apiKey: process.env.RESEND_API_KEY ? "✅ API key is set" : "❌ API key is missing!",
    })
  }
}
