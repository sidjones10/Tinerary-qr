import { NextResponse } from "next/server"
import { discoverItineraries, type DiscoveryFilters } from "@/lib/discovery-algorithm"
import { createClient } from "@/lib/supabase/client"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      userId,
      filters = {},
      limit = 20,
      offset = 0,
    }: {
      userId?: string
      filters?: Omit<DiscoveryFilters, "limit" | "offset">
      limit?: number
      offset?: number
    } = body

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
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = parseInt(searchParams.get("offset") || "0")
    const searchQuery = searchParams.get("search")
    const location = searchParams.get("location")
    const categories = searchParams.get("categories")?.split(",").filter(Boolean)

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
