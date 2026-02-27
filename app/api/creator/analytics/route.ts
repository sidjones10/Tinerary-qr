import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/client"
import { getCreatorAnalytics } from "@/lib/creator-service"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

const RATE_LIMIT = { maxRequests: 30, windowSeconds: 60 }

export async function GET(request: Request) {
  try {
    const ip = getClientIp(request)
    const rl = await rateLimit(`creator-analytics:${ip}`, RATE_LIMIT)
    if (!rl.allowed) {
      return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429 })
    }

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const analytics = await getCreatorAnalytics(session.user.id)
    return NextResponse.json({ success: true, data: analytics })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics" },
      { status: 500 }
    )
  }
}
