import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * POST /api/mentions/detect
 * Scans an itinerary's activities for business name mentions.
 * Called after itinerary creation/update.
 * Body: { itineraryId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { itineraryId } = await request.json()

    if (!itineraryId) {
      return NextResponse.json({ error: "itineraryId is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify the itinerary exists and is public
    const { data: itinerary, error: itinError } = await supabase
      .from("itineraries")
      .select("id, user_id, title, is_public, profiles!itineraries_user_id_fkey(username)")
      .eq("id", itineraryId)
      .single()

    if (itinError || !itinerary) {
      return NextResponse.json({ error: "Itinerary not found" }, { status: 404 })
    }

    // Only scan public itineraries
    if (!itinerary.is_public) {
      return NextResponse.json({ detected: 0, message: "Skipped: private itinerary" })
    }

    // Fetch activities
    const { data: activities } = await supabase
      .from("activities")
      .select("id, title, location, description")
      .eq("itinerary_id", itineraryId)

    if (!activities || activities.length === 0) {
      return NextResponse.json({ detected: 0 })
    }

    const creator = Array.isArray(itinerary.profiles) ? itinerary.profiles[0] : itinerary.profiles
    const creatorUsername = (creator as any)?.username || null

    // Fetch all businesses (excluding the itinerary owner's business)
    const { data: businesses } = await supabase
      .from("businesses")
      .select("id, name, user_id")
      .neq("user_id", itinerary.user_id)

    if (!businesses || businesses.length === 0) {
      return NextResponse.json({ detected: 0 })
    }

    let detected = 0

    for (const activity of activities) {
      for (const business of businesses) {
        const businessNameLower = business.name.toLowerCase()
        const fields: { field: string; text: string | null }[] = [
          { field: "title", text: activity.title },
          { field: "location", text: activity.location },
          { field: "description", text: activity.description },
        ]

        for (const { field, text } of fields) {
          if (!text) continue
          if (text.toLowerCase().includes(businessNameLower)) {
            const idx = text.toLowerCase().indexOf(businessNameLower)
            const start = Math.max(0, idx - 40)
            const end = Math.min(text.length, idx + business.name.length + 40)
            const snippet =
              (start > 0 ? "..." : "") +
              text.slice(start, end) +
              (end < text.length ? "..." : "")

            const { error: insertError } = await supabase
              .from("business_mentions")
              .upsert(
                {
                  business_id: business.id,
                  itinerary_id: itineraryId,
                  activity_id: activity.id,
                  matched_text: business.name,
                  match_field: field,
                  context_snippet: snippet,
                  creator_username: creatorUsername,
                  status: "detected",
                },
                { onConflict: "business_id,itinerary_id,activity_id" }
              )

            if (!insertError) {
              detected++

              // Notify the business owner
              await supabase.from("notifications").insert({
                user_id: business.user_id,
                type: "mention",
                title: "Your business was mentioned!",
                message: `"${business.name}" was mentioned in "${itinerary.title}" by @${creatorUsername || "someone"}`,
                link_url: "/mentions",
              })
            }

            break // One match per activity per business
          }
        }
      }
    }

    // For businesses with unlimited plans, auto-highlight new mentions
    if (detected > 0) {
      const uniqueBusinessIds = [
        ...new Set(
          businesses
            .filter((b) => {
              // Check if any activity mentioned this business
              return activities.some((a) => {
                const fields = [a.title, a.location, a.description]
                return fields.some(
                  (f) => f && f.toLowerCase().includes(b.name.toLowerCase())
                )
              })
            })
            .map((b) => b.id)
        ),
      ]

      for (const bizId of uniqueBusinessIds) {
        // Check for unlimited plans
        const { data: plans } = await supabase
          .from("mention_highlight_plans")
          .select("id, expires_at")
          .eq("business_id", bizId)
          .eq("status", "active")
          .in("plan_type", ["monthly_unlimited", "annual_unlimited"])
          .gte("expires_at", new Date().toISOString())
          .limit(1)

        if (plans && plans.length > 0) {
          const plan = plans[0]

          // Find newly detected mentions for this business
          const { data: newMentions } = await supabase
            .from("business_mentions")
            .select("id")
            .eq("business_id", bizId)
            .eq("itinerary_id", itineraryId)
            .eq("status", "detected")

          if (newMentions && newMentions.length > 0) {
            const { data: business } = await supabase
              .from("businesses")
              .select("website")
              .eq("id", bizId)
              .single()

            const highlights = newMentions.map((m) => ({
              mention_id: m.id,
              plan_id: plan.id,
              business_id: bizId,
              booking_url: business?.website || null,
              badge_style: "default",
              starts_at: new Date().toISOString(),
              expires_at: plan.expires_at,
            }))

            await supabase.from("mention_highlights").insert(highlights)

            await supabase
              .from("business_mentions")
              .update({ status: "highlighted", updated_at: new Date().toISOString() })
              .in("id", newMentions.map((m) => m.id))
          }
        }
      }
    }

    return NextResponse.json({ detected })
  } catch (error) {
    console.error("Mention detection error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
