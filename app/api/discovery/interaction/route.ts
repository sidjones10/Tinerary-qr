import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { trackUserInteraction } from "@/lib/discovery-algorithm"

/**
 * Track user interactions with itineraries for improving recommendations
 * POST /api/discovery/interaction
 */
export async function POST(request: Request) {
  try {
    // Authenticate the caller
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      )
    }

    const body = await request.json()
    const { itineraryId, interactionType } = body

    // Validate required fields
    if (!itineraryId || !interactionType) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
          message: "itineraryId and interactionType are required",
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

    // Use the authenticated user's ID instead of trusting the body
    await trackUserInteraction(user.id, itineraryId, interactionType)

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
