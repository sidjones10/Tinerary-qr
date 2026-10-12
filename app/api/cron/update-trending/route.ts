import { NextResponse } from "next/server"
import { updateTrendingScores } from "@/lib/discovery-algorithm"
import { requireCron } from "@/lib/auth/require-cron"

// This endpoint can be called by a cron job to update trending scores
export async function GET(request: Request) {
  const unauthorized = requireCron(request)
  if (unauthorized) return unauthorized

  try {
    await updateTrendingScores()
    return NextResponse.json({ success: true, message: "Trending scores updated successfully" })
  } catch (error) {
    console.error("Error updating trending scores:", error)
    return NextResponse.json(
      { success: false, message: "Failed to update trending scores" },
      { status: 500 },
    )
  }
}
