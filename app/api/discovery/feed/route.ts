import { NextResponse } from "next/server"
import { discoverItineraries, type DiscoveryFilters } from "@/lib/discovery-algorithm"
import { createClient } from "@/lib/supabase/client"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

// 30 requests per IP per minute
const FEED_RATE_LIMIT = { maxRequests: 30, windowSeconds: 60 }

// Clamp a number between min and max
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function POST(request: Request) {
  try {
    // Rate limit
    const ip = getClientIp(request)
    const rl = await rateLimit(`discovery:${ip}`, FEED_RATE_LIMIT)
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
      )
    }

    const body = await request.json()
    const {
      userId,
      filters = {},
      limit: rawLimit = 20,
      offset: rawOffset = 0,
    }: {
      userId?: string
      filters?: Omit<DiscoveryFilters, "limit" | "offset">
      limit?: number
      offset?: number
    } = body

    // Clamp pagination to prevent resource exhaustion
    const limit = clamp(Number(rawLimit) || 20, 1, 50)
    const offset = clamp(Number(rawOffset) || 0, 0, 10000)

    // Merge pagination with filters
    const discoveryFilters: DiscoveryFilters = {
      ...filters,
      limit,
      offset,
    }

    // Use the real discovery algorithm with database queries
    const discoveredItineraries = await discoverItineraries(userId || null, discoveryFilters)

    return NextResponse.json({
      success: true,
      data: discoveredItineraries,
      total: discoveredItineraries.length,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Error generating discovery feed:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate discovery feed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// GET endpoint for easier testing
export async function GET(request: Request) {
  try {
    // Rate limit
    const ip = getClientIp(request)
    const rl = await rateLimit(`discovery:${ip}`, FEED_RATE_LIMIT)
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const limit = clamp(parseInt(searchParams.get("limit") || "20") || 20, 1, 50)
    const offset = clamp(parseInt(searchParams.get("offset") || "0") || 0, 0, 10000)
    const searchQuery = searchParams.get("search")?.slice(0, 200) || null
    const location = searchParams.get("location")?.slice(0, 200) || null
    const categories = searchParams.get("categories")?.slice(0, 500).split(",").filter(Boolean)

    const filters: DiscoveryFilters = {
      limit,
      offset,
    }

    if (searchQuery) filters.searchQuery = searchQuery
    if (location) filters.location = location
    if (categories && categories.length > 0) filters.categories = categories

    const discoveredItineraries = await discoverItineraries(userId || null, filters)

    return NextResponse.json({
      success: true,
      data: discoveredItineraries,
      total: discoveredItineraries.length,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Error generating discovery feed:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate discovery feed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
