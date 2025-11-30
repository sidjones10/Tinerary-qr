import { NextResponse } from "next/server"
import { trackUserInteraction } from "@/lib/discovery-algorithm"

/**
 * Track user interactions with itineraries for improving recommendations
 * POST /api/discovery/interaction
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, itineraryId, interactionType } = body

    // Validate required fields
    if (!userId || !itineraryId || !interactionType) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
          message: "userId, itineraryId, and interactionType are required",
        },
        { status: 400 },
      )
    }

    // Validate interaction type
    const validTypes = ["view", "save", "like", "share", "comment"]
    if (!validTypes.includes(interactionType)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid interaction type",
          message: `interactionType must be one of: ${validTypes.join(", ")}`,
        },
        { status: 400 },
      )
    }

    // Track the interaction using the discovery algorithm
    await trackUserInteraction(userId, itineraryId, interactionType)

    return NextResponse.json({
      success: true,
      message: `${interactionType} interaction tracked successfully`,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error logging interaction:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to log interaction",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
