"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/server"
import type { BusinessTierSlug } from "@/lib/tiers"
import type { EnterpriseBrandingConfig } from "@/lib/enterprise"

const VALID_TIERS: BusinessTierSlug[] = ["basic", "premium", "enterprise"]

const BUSINESS_CATEGORIES = [
  "Accommodation",
  "Activities & Tours",
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Wellness & Spa",
  "Travel Services",
  "Other",
] as const

/**
 * Fetch the current user's business profile data for the dashboard.
 * Tries service-role client first (bypasses RLS), falls back to the
 * regular cookie-based client if the service role key isn't configured.
 */
export async function getBusinessProfileData() {
  try {
    const supabase = await createClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return { profile: null, business: null, promos: null, subscription: null, error: "no_session" }
    }

    // Prefer service role (bypasses RLS) but fall back to cookie-based client
    let db: typeof supabase
    try {
      db = createServiceRoleClient() as any
    } catch {
      db = supabase
    }

    const [profileResult, bizResult] = await Promise.all([
      db
        .from("profiles")
        .select("name, username, bio, location, website, avatar_url")
        .eq("id", session.user.id)
        .single(),
      // Use .limit(1) instead of .single() to handle duplicate business rows
      // gracefully (duplicates could exist from a past creation bug).
      db
        .from("businesses")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1),
    ])

    const profile = profileResult.data
    const business = bizResult.data?.[0] ?? null

    let promos: any[] | null = null
    let subscription: any | null = null
    if (business) {
      const [promosResult, subResult] = await Promise.all([
        db
          .from("promotions")
          .select("title, status, promotion_metrics(views, clicks, saves)")
          .eq("business_id", business.id)
          .order("created_at", { ascending: false }),
        db
          .from("business_subscriptions")
          .select("*")
          .eq("business_id", business.id)
          .eq("status", "active")
          .single(),
      ])
      promos = promosResult.data
      subscription = subResult.data
    }

    return { profile, business, promos, subscription, error: null }
  } catch (err) {
    console.error("getBusinessProfileData failed:", err)
    return { profile: null, business: null, promos: null, subscription: null, error: "server_error" }
  }
}

/**
 * Save enterprise branding configuration.
 * If the user doesn't have a businesses row yet (e.g. they selected their tier
 * in user_preferences but never completed the business setup wizard), this
 * creates a minimal business record first so the branding config has somewhere
 * to live.
 */
export async function saveBrandingConfig(
  config: EnterpriseBrandingConfig,
  existingBusinessId?: string | null
): Promise<{ success: boolean; businessId?: string; error?: string }> {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { success: false, error: "Not authenticated" }
  }

  let db: typeof supabase
  try {
    db = createServiceRoleClient() as any
  } catch {
    db = supabase
  }

  let businessId = existingBusinessId ?? undefined

  if (!businessId) {
    // Look up existing business row the client may not have seen (RLS timing).
    // Use .limit(1) instead of .single() to handle duplicate rows gracefully.
    const { data: existingRows } = await db
      .from("businesses")
      .select("id")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(1)

    const existing = existingRows?.[0] ?? null

    if (existing) {
      businessId = existing.id
    } else {
      // Read the user's profile name to use as a default business name
      const { data: profile } = await db
        .from("profiles")
        .select("name")
        .eq("id", session.user.id)
        .single()

      const { data: newBiz, error: insertErr } = await db
        .from("businesses")
        .insert({
          user_id: session.user.id,
          name: profile?.name || "My Business",
          category: "Other",
          business_tier: "enterprise" as BusinessTierSlug,
          branding_config: config as any,
        })
        .select("id")
        .single()

      if (insertErr) {
        console.error("Error creating business for branding:", insertErr)
        return { success: false, error: insertErr.message }
      }

      // Create a matching subscription record
      await db.from("business_subscriptions").insert({
        business_id: newBiz.id,
        tier: "enterprise" as BusinessTierSlug,
        status: "active",
        mention_highlights_used: 0,
      })

      revalidatePath("/business-profile")
      return { success: true, businessId: newBiz.id }
    }
  }

  // Update existing business row — use .select() to verify the update affected a row
  const { data: updated, error } = await db
    .from("businesses")
    .update({ branding_config: config as any })
    .eq("id", businessId)
    .select("id")
    .single()

  if (error) {
    console.error("Error saving branding config:", error)
    return { success: false, error: error.message }
  }

  if (!updated) {
    return { success: false, error: "No business row was updated — please refresh and try again." }
  }

  revalidatePath("/business-profile")
  revalidatePath("/settings")
  return { success: true, businessId }
}

export async function createBusiness(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return redirect("/auth?message=You must be logged in to create a business")
  }

  // Use service role to bypass RLS for the duplicate check + insert.
  // The anon key can't SELECT from businesses (missing RLS policy),
  // which previously caused unlimited duplicate rows.
  let db: typeof supabase
  try {
    db = createServiceRoleClient() as any
  } catch {
    db = supabase
  }

  // Check if user already has a business (use .limit(1) to handle duplicates)
  const { data: existingRows } = await db
    .from("businesses")
    .select("id")
    .eq("user_id", session.user.id)
    .limit(1)

  if (existingRows && existingRows.length > 0) {
    return { success: false, error: "You already have a business profile." }
  }

  const name = (formData.get("name") as string)?.trim()
  const category = formData.get("category") as string
  const description = (formData.get("description") as string)?.trim() || null
  const website = (formData.get("website") as string)?.trim() || null
  const tier = (formData.get("tier") as string) || "basic"

  // Validation
  if (!name || name.length < 2) {
    return { success: false, error: "Business name must be at least 2 characters." }
  }

  if (name.length > 100) {
    return { success: false, error: "Business name must be under 100 characters." }
  }

  if (!category || !BUSINESS_CATEGORIES.includes(category as typeof BUSINESS_CATEGORIES[number])) {
    return { success: false, error: "Please select a valid category." }
  }

  if (description && description.length > 500) {
    return { success: false, error: "Description must be under 500 characters." }
  }

  if (website && !/^https?:\/\/.+\..+/.test(website)) {
    return { success: false, error: "Please enter a valid website URL (e.g. https://example.com)." }
  }

  if (!VALID_TIERS.includes(tier as BusinessTierSlug)) {
    return { success: false, error: "Please select a valid plan." }
  }

  try {
    const { data, error } = await db
      .from("businesses")
      .insert({
        name,
        category,
        description,
        website,
        user_id: session.user.id,
        business_tier: tier as BusinessTierSlug,
      })
      .select()
      .single()

    if (error) throw error

    // Create a matching subscription record so the dashboard picks up the tier
    if (data) {
      const periodStart = new Date()
      const periodEnd = new Date()
      periodEnd.setMonth(periodEnd.getMonth() + 1)

      await db.from("business_subscriptions").insert({
        business_id: data.id,
        tier: tier as BusinessTierSlug,
        status: "active",
        mention_highlights_used: 0,
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        paid_amount: tier === "enterprise" ? 399 : tier === "premium" ? 149 : 49,
      })
    }

    revalidatePath("/business-profile")
    revalidatePath("/business")
    return { success: true, data }
  } catch (error) {
    console.error("Error creating business:", error)
    return { success: false, error: (error as Error).message }
  }
}
