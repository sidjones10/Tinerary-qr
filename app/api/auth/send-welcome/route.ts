import { NextResponse } from "next/server"
import { sendWelcomeEmail } from "@/lib/email-notifications"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

// Tight rate limit: 3 requests per IP per 15 minutes
const WELCOME_RATE_LIMIT = { maxRequests: 3, windowSeconds: 15 * 60 }

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    const rl = await rateLimit(`send-welcome:${ip}`, WELCOME_RATE_LIMIT)
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, message: "Too many requests" },
        { status: 429 },
      )
    }

    const { email, name } = await request.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 },
      )
    }

    const result = await sendWelcomeEmail(email, name || email.split("@")[0])

    return NextResponse.json({ success: result.success })
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to send welcome email" },
      { status: 500 },
    )
  }
}
