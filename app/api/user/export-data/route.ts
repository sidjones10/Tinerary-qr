import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

/**
 * API Endpoint: Export User Data
 *
 * Allows authenticated users to export all their data in JSON format
 * for GDPR compliance (Right to Data Portability)
 */
export async function GET(request: Request) {
  try {
    const supabase = createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Call the database function to export user data
    const { data: exportData, error: exportError } = await supabase.rpc("export_user_data", {
      user_id: user.id,
    })

    if (exportError) {
      console.error("Error exporting user data:", exportError)
      return NextResponse.json(
        { error: "Failed to export data", details: exportError.message },
        { status: 500 },
      )
    }

    if (!exportData) {
      return NextResponse.json({ error: "No data found for user" }, { status: 404 })
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
