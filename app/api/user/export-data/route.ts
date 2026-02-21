import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

/**
 * API Endpoint: Export User Data
 *
 * Allows authenticated users to export all their data in JSON format
 * for GDPR compliance (Right to Data Portability)
 *
 * Queries tables directly instead of using an RPC function so that
 * the export works regardless of whether the latest migration has
 * been applied.
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // First, fetch profile and itineraries to get itinerary IDs
    const [profileResult, itinerariesResult] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("itineraries").select("*").eq("user_id", user.id),
    ])

    const itineraryIds = (itinerariesResult.data ?? []).map((i) => i.id)

    // Then fetch everything else in parallel (sub-tables need itinerary IDs)
    const [
      activitiesResult,
      packingItemsResult,
      expensesResult,
      commentsResult,
      savedResult,
      notificationsResult,
      behaviorResult,
    ] = await Promise.all([
      itineraryIds.length > 0
        ? supabase.from("activities").select("*").in("itinerary_id", itineraryIds)
        : Promise.resolve({ data: [], error: null }),
      itineraryIds.length > 0
        ? supabase.from("packing_items").select("*").in("itinerary_id", itineraryIds)
        : Promise.resolve({ data: [], error: null }),
      itineraryIds.length > 0
        ? supabase.from("expenses").select("*").in("itinerary_id", itineraryIds)
        : Promise.resolve({ data: [], error: null }),
      supabase.from("comments").select("*").eq("user_id", user.id),
      supabase.from("saved_itineraries").select("*").eq("user_id", user.id),
      supabase.from("notifications").select("*").eq("user_id", user.id),
      supabase.from("user_behavior").select("*").eq("user_id", user.id).single(),
    ])

    // Nest activities, packing items, and expenses under their itineraries
    const itineraries = (itinerariesResult.data ?? []).map((itinerary) => ({
      ...itinerary,
      activities: (activitiesResult.data ?? []).filter((a) => a.itinerary_id === itinerary.id),
      packing_items: (packingItemsResult.data ?? []).filter((p) => p.itinerary_id === itinerary.id),
      expenses: (expensesResult.data ?? []).filter((e) => e.itinerary_id === itinerary.id),
    }))

    const exportData = {
      export_date: new Date().toISOString(),
      user_id: user.id,
      profile: profileResult.data ?? null,
      itineraries,
      comments: commentsResult.data ?? [],
      saved_itineraries: savedResult.data ?? [],
      notifications: notificationsResult.data ?? [],
      behavior: behaviorResult.data ?? null,
    }

    // Format the filename with current date
    const timestamp = new Date().toISOString().split("T")[0] // YYYY-MM-DD
    const filename = `tinerary-data-export-${timestamp}.json`

    // Return the data as a downloadable JSON file
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    })
  } catch (error: any) {
    console.error("Error in export-data endpoint:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}
