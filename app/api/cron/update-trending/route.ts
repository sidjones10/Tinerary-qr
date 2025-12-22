import { NextResponse } from "next/server"
import { updateTrendingScores } from "@/lib/discovery-algorithm"

// This endpoint can be called by a cron job to update trending scores
export async function GET() {
  try {
    await updateTrendingScores()
    return NextResponse.json({ success: true, message: "Trending scores updated successfully" })
  } catch (error) {
    console.error("Error updating trending scores:", error)
    return NextResponse.json(
      { success: false, message: "Failed to update trending scores", error: String(error) },
      { status: 500 },
    )
  }
}
