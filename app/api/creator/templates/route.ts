import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/client"
import {
  getCreatorTemplates,
  getMarketplaceTemplates,
  createTemplate,
} from "@/lib/creator-service"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

const RATE_LIMIT = { maxRequests: 30, windowSeconds: 60 }

export async function GET(request: Request) {
  try {
    const ip = getClientIp(request)
    const rl = await rateLimit(`creator-templates:${ip}`, RATE_LIMIT)
    if (!rl.allowed) {
      return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429 })
    }

    const { searchParams } = new URL(request.url)
    const mode = searchParams.get("mode") || "marketplace"

    if (mode === "mine") {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
      }
      const templates = await getCreatorTemplates(session.user.id)
      return NextResponse.json({ success: true, data: templates })
    }

    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = parseInt(searchParams.get("offset") || "0")
    const templates = await getMarketplaceTemplates(limit, offset)
    return NextResponse.json({ success: true, data: templates })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch templates" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    const rl = await rateLimit(`creator-templates:${ip}`, RATE_LIMIT)
    if (!rl.allowed) {
      return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429 })
    }

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, location, duration, price, category, coverImage } = body

    if (!title || !description || price == null) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    const result = await createTemplate(session.user.id, {
      title,
      description,
      location: location || "",
      duration: duration || 0,
      price,
      category: category || "General",
      coverImage,
    })

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to create template" },
      { status: 500 }
    )
  }
}
