"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"

// ─── Get all mentions for the current user's business ─────────
export async function getBusinessMentions() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { success: false, data: [], error: "Not authenticated" }
  }

  try {
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("user_id", session.user.id)
      .single()

    if (!business) {
      return { success: true, data: [] }
    }

    const { data, error } = await supabase
      .from("business_mentions")
      .select(`
        *,
        itineraries (
          id, title, user_id, is_public,
          owner:profiles!itineraries_user_id_fkey(username),
          metrics:itinerary_metrics(view_count)
        ),
        mention_highlights (
          id, booking_url, offer_text, badge_style, click_count, view_count, expires_at
        )
      `)
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Error fetching mentions:", error)
    return { success: false, error: (error as Error).message, data: [] }
  }
}

// ─── Get active highlight plans for the current user's business ──
export async function getBusinessHighlightPlans() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { success: false, data: [], error: "Not authenticated" }
  }

  try {
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("user_id", session.user.id)
      .single()

    if (!business) {
      return { success: true, data: [] }
    }

    const { data, error } = await supabase
      .from("mention_highlight_plans")
      .select("*")
      .eq("business_id", business.id)
      .eq("status", "active")
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Error fetching plans:", error)
    return { success: false, error: (error as Error).message, data: [] }
  }
}

// ─── Purchase a highlight plan ────────────────────────────────
export async function purchaseHighlightPlan(planType: string) {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("user_id", session.user.id)
      .single()

    if (!business) {
      return { success: false, error: "No business profile found" }
    }

    // Map plan type to pricing and limits
    const planConfig: Record<string, { price: number; total: number; durationDays: number }> = {
      single: { price: 1000, total: 1, durationDays: 30 },
      bundle: { price: 4000, total: 5, durationDays: 30 },
      monthly_unlimited: { price: 9900, total: -1, durationDays: 30 },
      annual_unlimited: { price: 89900, total: -1, durationDays: 365 },
    }

    const config = planConfig[planType]
    if (!config) {
      return { success: false, error: "Invalid plan type" }
    }

    const now = new Date()
    const expiresAt = new Date(now)
    expiresAt.setDate(expiresAt.getDate() + config.durationDays)

    const { data, error } = await supabase
      .from("mention_highlight_plans")
      .insert({
        business_id: business.id,
        plan_type: planType,
        price_paid: config.price,
        highlights_total: config.total,
        highlights_used: 0,
        starts_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        status: "active",
      })
      .select()
      .single()

    if (error) throw error

    // For unlimited plans, auto-highlight all un-highlighted mentions
    if (planType === "monthly_unlimited" || planType === "annual_unlimited") {
      await autoHighlightMentions(business.id, data.id, expiresAt)
    }

    revalidatePath("/mentions")
    return { success: true, data }
  } catch (error) {
    console.error("Error purchasing plan:", error)
    return { success: false, error: (error as Error).message }
  }
}

// ─── Highlight a specific mention ─────────────────────────────
export async function highlightMention(
  mentionId: string,
  options: { bookingUrl?: string; offerText?: string } = {}
) {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    const { data: business } = await supabase
      .from("businesses")
      .select("id, website")
      .eq("user_id", session.user.id)
      .single()

    if (!business) {
      return { success: false, error: "No business profile found" }
    }

    // Find an active plan with remaining highlights
    const { data: plans } = await supabase
      .from("mention_highlight_plans")
      .select("*")
      .eq("business_id", business.id)
      .eq("status", "active")
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: true })

    const activePlan = plans?.find(
      (p) => p.highlights_total === -1 || p.highlights_used < p.highlights_total
    )

    if (!activePlan) {
      return { success: false, error: "No active plan with remaining highlights. Please purchase a plan first." }
    }

    // Verify the mention belongs to this business
    const { data: mention } = await supabase
      .from("business_mentions")
      .select("*")
      .eq("id", mentionId)
      .eq("business_id", business.id)
      .single()

    if (!mention) {
      return { success: false, error: "Mention not found" }
    }

    if (mention.status === "highlighted") {
      return { success: false, error: "This mention is already highlighted" }
    }

    // Create the highlight
    const { error: highlightError } = await supabase
      .from("mention_highlights")
      .insert({
        mention_id: mentionId,
        plan_id: activePlan.id,
        business_id: business.id,
        booking_url: options.bookingUrl || business.website || null,
        offer_text: options.offerText || null,
        badge_style: "default",
        starts_at: new Date().toISOString(),
        expires_at: activePlan.expires_at,
      })

    if (highlightError) throw highlightError

    // Update mention status
    await supabase
      .from("business_mentions")
      .update({ status: "highlighted", updated_at: new Date().toISOString() })
      .eq("id", mentionId)

    // Increment plan usage (for non-unlimited plans)
    if (activePlan.highlights_total !== -1) {
      await supabase
        .from("mention_highlight_plans")
        .update({ highlights_used: activePlan.highlights_used + 1 })
        .eq("id", activePlan.id)
    }

    revalidatePath("/mentions")
    return { success: true }
  } catch (error) {
    console.error("Error highlighting mention:", error)
    return { success: false, error: (error as Error).message }
  }
}

// ─── Dismiss a mention ────────────────────────────────────────
export async function dismissMention(mentionId: string) {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("user_id", session.user.id)
      .single()

    if (!business) {
      return { success: false, error: "No business profile found" }
    }

    const { error } = await supabase
      .from("business_mentions")
      .update({ status: "dismissed", updated_at: new Date().toISOString() })
      .eq("id", mentionId)
      .eq("business_id", business.id)

    if (error) throw error

    revalidatePath("/mentions")
    return { success: true }
  } catch (error) {
    console.error("Error dismissing mention:", error)
    return { success: false, error: (error as Error).message }
  }
}

// ─── Get mention highlight stats for the business ─────────────
export async function getMentionStats() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { success: false, data: null }
  }

  try {
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("user_id", session.user.id)
      .single()

    if (!business) {
      return { success: true, data: null }
    }

    // Get total mentions
    const { count: totalMentions } = await supabase
      .from("business_mentions")
      .select("*", { count: "exact", head: true })
      .eq("business_id", business.id)

    // Get highlighted count
    const { count: highlightedCount } = await supabase
      .from("business_mentions")
      .select("*", { count: "exact", head: true })
      .eq("business_id", business.id)
      .eq("status", "highlighted")

    // Get total highlight views and clicks
    const { data: highlights } = await supabase
      .from("mention_highlights")
      .select("view_count, click_count")
      .eq("business_id", business.id)

    const totalViews = highlights?.reduce((sum, h) => sum + (h.view_count || 0), 0) || 0
    const totalClicks = highlights?.reduce((sum, h) => sum + (h.click_count || 0), 0) || 0

    // Get active plans
    const { data: activePlans } = await supabase
      .from("mention_highlight_plans")
      .select("*")
      .eq("business_id", business.id)
      .eq("status", "active")
      .gte("expires_at", new Date().toISOString())

    // Calculate remaining highlights
    let remainingHighlights = 0
    let hasUnlimited = false
    activePlans?.forEach((plan) => {
      if (plan.highlights_total === -1) {
        hasUnlimited = true
      } else {
        remainingHighlights += plan.highlights_total - plan.highlights_used
      }
    })

    return {
      success: true,
      data: {
        totalMentions: totalMentions || 0,
        highlightedCount: highlightedCount || 0,
        totalViews,
        totalClicks,
        remainingHighlights: hasUnlimited ? -1 : remainingHighlights,
        hasUnlimited,
        activePlans: activePlans || [],
      },
    }
  } catch (error) {
    console.error("Error fetching mention stats:", error)
    return { success: false, error: (error as Error).message, data: null }
  }
}

// ─── Auto-highlight all un-highlighted mentions (for unlimited plans) ──
async function autoHighlightMentions(businessId: string, planId: string, expiresAt: Date) {
  const supabase = await createClient()

  try {
    // Get business website for default booking URL
    const { data: business } = await supabase
      .from("businesses")
      .select("website")
      .eq("id", businessId)
      .single()

    // Find all un-highlighted mentions
    const { data: mentions } = await supabase
      .from("business_mentions")
      .select("id")
      .eq("business_id", businessId)
      .eq("status", "detected")

    if (!mentions || mentions.length === 0) return

    // Create highlights for each
    const highlights = mentions.map((m) => ({
      mention_id: m.id,
      plan_id: planId,
      business_id: businessId,
      booking_url: business?.website || null,
      badge_style: "default",
      starts_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    }))

    await supabase.from("mention_highlights").insert(highlights)

    // Update mention statuses
    const mentionIds = mentions.map((m) => m.id)
    await supabase
      .from("business_mentions")
      .update({ status: "highlighted", updated_at: new Date().toISOString() })
      .in("id", mentionIds)
  } catch (error) {
    console.error("Error auto-highlighting mentions:", error)
  }
}

// ─── Detect mentions in an itinerary's activities ─────────────
export async function detectMentionsForItinerary(itineraryId: string) {
  const supabase = await createClient()

  try {
    // Fetch all activities for this itinerary
    const { data: activities, error: actError } = await supabase
      .from("activities")
      .select("id, title, location, description")
      .eq("itinerary_id", itineraryId)

    if (actError || !activities || activities.length === 0) return { success: true, detected: 0 }

    // Fetch the itinerary creator's username
    const { data: itinerary } = await supabase
      .from("itineraries")
      .select("user_id, profiles!itineraries_user_id_fkey(username)")
      .eq("id", itineraryId)
      .single()

    const creator = Array.isArray(itinerary?.profiles) ? itinerary.profiles[0] : itinerary?.profiles
    const creatorUsername = (creator as any)?.username || null

    // Fetch all businesses
    const { data: businesses, error: bizError } = await supabase
      .from("businesses")
      .select("id, name, user_id")

    if (bizError || !businesses || businesses.length === 0) return { success: true, detected: 0 }

    // Don't detect mentions in the business owner's own itineraries
    const itineraryOwnerId = itinerary?.user_id

    let detected = 0

    for (const activity of activities) {
      for (const business of businesses) {
        // Skip if the itinerary is owned by the business owner
        if (business.user_id === itineraryOwnerId) continue

        const businessNameLower = business.name.toLowerCase()
        const fields: { field: string; text: string | null }[] = [
          { field: "title", text: activity.title },
          { field: "location", text: activity.location },
          { field: "description", text: activity.description },
        ]

        for (const { field, text } of fields) {
          if (!text) continue
          if (text.toLowerCase().includes(businessNameLower)) {
            // Build a context snippet (up to 120 chars centered on the match)
            const idx = text.toLowerCase().indexOf(businessNameLower)
            const start = Math.max(0, idx - 40)
            const end = Math.min(text.length, idx + business.name.length + 40)
            const snippet =
              (start > 0 ? "..." : "") +
              text.slice(start, end) +
              (end < text.length ? "..." : "")

            // Upsert to avoid duplicates
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

              // Send notification to business owner
              await supabase.from("notifications").insert({
                user_id: business.user_id,
                type: "mention",
                title: "Your business was mentioned!",
                message: `"${business.name}" was mentioned in the itinerary "${activity.title}" by @${creatorUsername || "someone"}`,
                link_url: "/mentions",
              })
            }

            break // Only one match per activity per business
          }
        }
      }
    }

    return { success: true, detected }
  } catch (error) {
    console.error("Error detecting mentions:", error)
    return { success: false, error: (error as Error).message, detected: 0 }
  }
}

// ─── Get highlights for a specific itinerary (public, for overlay rendering) ──
export async function getItineraryHighlights(itineraryId: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from("mention_highlights")
      .select(`
        id,
        booking_url,
        offer_text,
        badge_style,
        expires_at,
        business_mentions!inner (
          itinerary_id,
          activity_id,
          matched_text,
          business_id,
          businesses (
            id, name, logo, website
          )
        )
      `)
      .eq("business_mentions.itinerary_id", itineraryId)
      .gte("expires_at", new Date().toISOString())

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Error fetching itinerary highlights:", error)
    return { success: false, data: [] }
  }
}
