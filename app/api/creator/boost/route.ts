import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/client"
import { getBoostCampaigns, createBoostCampaign } from "@/lib/creator-service"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

const RATE_LIMIT = { maxRequests: 20, windowSeconds: 60 }

export async function GET(request: Request) {
  try {
    const ip = getClientIp(request)
    const rl = await rateLimit(`creator-boost:${ip}`, RATE_LIMIT)
    if (!rl.allowed) {
      return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429 })
    }

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const campaigns = await getBoostCampaigns(session.user.id)
    return NextResponse.json({ success: true, data: campaigns })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch boost campaigns" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    const rl = await rateLimit(`creator-boost:${ip}`, RATE_LIMIT)
    if (!rl.allowed) {
      return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429 })
    }

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { itineraryId, packageName } = body

    if (!itineraryId || !packageName) {
      return NextResponse.json(
        { success: false, error: "Missing itineraryId or packageName" },
        { status: 400 }
      )
    }

    const result = await createBoostCampaign(session.user.id, itineraryId, packageName)
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to create boost campaign" },
      { status: 500 }
    )
  }
}
