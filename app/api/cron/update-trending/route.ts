import { NextResponse } from "next/server"
import { updateTrendingScores } from "@/lib/discovery-algorithm"

// This endpoint can be called by a cron job to update trending scores
export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get("authorization")

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    )
  }

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
