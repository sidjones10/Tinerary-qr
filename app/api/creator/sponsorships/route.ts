import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/client"
import { getSponsorshipMessages, updateSponsorshipStatus } from "@/lib/creator-service"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

const RATE_LIMIT = { maxRequests: 30, windowSeconds: 60 }

export async function GET(request: Request) {
  try {
    const ip = getClientIp(request)
    const rl = await rateLimit(`creator-sponsorships:${ip}`, RATE_LIMIT)
    if (!rl.allowed) {
      return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429 })
    }

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const messages = await getSponsorshipMessages(session.user.id)
    return NextResponse.json({ success: true, data: messages })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch sponsorship messages" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const ip = getClientIp(request)
    const rl = await rateLimit(`creator-sponsorships:${ip}`, RATE_LIMIT)
    if (!rl.allowed) {
      return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429 })
    }

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { messageId, status } = body

    if (!messageId || !status) {
      return NextResponse.json(
        { success: false, error: "Missing messageId or status" },
        { status: 400 }
      )
    }

    const validStatuses = ["new", "read", "replied", "accepted", "declined"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status" },
        { status: 400 }
      )
    }

    const result = await updateSponsorshipStatus(messageId, session.user.id, status)
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update sponsorship status" },
      { status: 500 }
    )
  }
}
