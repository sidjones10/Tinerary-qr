import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const VALID_REASONS = [
  "harassment",
  "hate_speech",
  "spam",
  "impersonation",
  "inappropriate_content",
  "predatory_behavior",
  "scam",
  "underage",
  "self_harm",
  "other",
] as const

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { reportedUserId, reason, description } = body

    if (!reportedUserId || !reason) {
      return NextResponse.json(
        { error: "Reported user ID and reason are required" },
        { status: 400 }
      )
    }

    if (!VALID_REASONS.includes(reason)) {
      return NextResponse.json({ error: "Invalid reason" }, { status: 400 })
    }

    if (reportedUserId === user.id) {
      return NextResponse.json(
        { error: "You cannot report yourself" },
        { status: 400 }
      )
    }

    // Verify the reported user exists
    const { data: reportedUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", reportedUserId)
      .single()

    if (!reportedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Auto-assign severity based on reason
    const severityMap: Record<string, string> = {
      predatory_behavior: "critical",
      underage: "critical",
      self_harm: "critical",
      hate_speech: "high",
      harassment: "high",
      scam: "high",
      impersonation: "medium",
      inappropriate_content: "medium",
      spam: "low",
      other: "medium",
    }

    const { error: insertError } = await supabase.from("user_reports").insert({
      reported_user_id: reportedUserId,
      reporter_id: user.id,
      reason,
      description: description?.trim() || null,
      severity: severityMap[reason] || "medium",
    })

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json(
          {
            error:
              "You have already reported this user for this reason. Our team is reviewing it.",
          },
          { status: 409 }
        )
      }
      console.error("Error creating user report:", insertError)
      return NextResponse.json(
        { error: "Failed to submit report" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Report submitted successfully. Our team will review it.",
    })
  } catch (error: any) {
    console.error("Error in user report:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
