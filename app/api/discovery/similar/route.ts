import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/client"
import { discoverItineraries } from "@/lib/discovery-algorithm"

/**
 * Find similar itineraries based on a given itinerary
 * GET /api/discovery/similar?itineraryId=xxx
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const itineraryId = searchParams.get("itineraryId")
    const limit = parseInt(searchParams.get("limit") || "6")

    if (!itineraryId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing itineraryId parameter",
        },
        { status: 400 },
      )
    }

    const supabase = createClient()

    // 1. Get the source itinerary to extract features
    const { data: sourceItinerary, error: itineraryError } = await supabase
      .from("itineraries")
      .select(
        `
        *,
        itinerary_categories(category)
      `,
      )
      .eq("id", itineraryId)
      .single()

    if (itineraryError || !sourceItinerary) {
      return NextResponse.json(
        {
          success: false,
          error: "Itinerary not found",
          message: itineraryError?.message,
        },
        { status: 404 },
      )
    }

    // 2. Extract features from the source itinerary
    const categories = sourceItinerary.itinerary_categories?.map((cat: any) => cat.category) || []
    const location = sourceItinerary.location

    // 3. Find similar itineraries using the discovery algorithm
    const similarItineraries = await discoverItineraries(null, {
      categories: categories.length > 0 ? categories : undefined,
      location: location || undefined,
      limit: limit + 1, // Get one extra to exclude the source
    })

    // 4. Remove the source itinerary from results and limit
    const filteredResults = similarItineraries.filter((item) => item.id !== itineraryId).slice(0, limit)

    // 5. Calculate similarity scores based on matching features
    const resultsWithScores = filteredResults.map((itinerary) => {
      let similarityScore = 0.5 // Base score

      // Location similarity
      if (itinerary.location && location && itinerary.location.toLowerCase().includes(location.toLowerCase())) {
        similarityScore += 0.3
      }

      // Category similarity
      const itineraryCategories = itinerary.categories || []
      const matchingCategories = itineraryCategories.filter((cat: string) => categories.includes(cat))
      if (categories.length > 0 && itineraryCategories.length > 0) {
        similarityScore += (matchingCategories.length / categories.length) * 0.2
      }

      // Travel style similarity
      if (
        sourceItinerary.travel_style &&
        itinerary.travel_style &&
        sourceItinerary.travel_style === itinerary.travel_style
      ) {
        similarityScore += 0.15
      }

      // Budget similarity
      if (sourceItinerary.budget && itinerary.budget && sourceItinerary.budget === itinerary.budget) {
        similarityScore += 0.1
      }

      return {
        ...itinerary,
        similarityScore: Math.min(similarityScore, 1),
      }
    })

    // 6. Sort by similarity score and return
    resultsWithScores.sort((a, b) => b.similarityScore - a.similarityScore)

    return NextResponse.json({
      success: true,
      data: resultsWithScores,
      total: resultsWithScores.length,
      sourceItinerary: {
        id: sourceItinerary.id,
        title: sourceItinerary.title,
        location: sourceItinerary.location,
        categories,
      },
    })
  } catch (error) {
    console.error("Error finding similar itineraries:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to find similar itineraries",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
