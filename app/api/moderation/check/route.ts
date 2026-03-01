import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { moderateItineraryContent } from "@/lib/content-moderation"

// POST - Check content for moderation issues before publishing
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Require authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, location, activityTitles, activityDescriptions } = body

    const result = moderateItineraryContent({
      title,
      description,
      location,
      activityTitles,
      activityDescriptions,
    })

    // Determine if content should be blocked or just censored
    const hasSevereContent = result.issues.some((i) => i.severity === "severe")

    return NextResponse.json({
      approved: !hasSevereContent,
      isClean: result.isClean,
      issues: result.issues,
      censoredFields: result.censoredFields,
      message: hasSevereContent
        ? "This content contains language that violates our community guidelines and cannot be published."
        : result.isClean
          ? "Content approved."
          : "Some content will be automatically censored to comply with community guidelines.",
    })
  } catch (error: any) {
    console.error("Error in content moderation:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
