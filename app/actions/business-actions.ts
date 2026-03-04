"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/server"
import type { BusinessTierSlug } from "@/lib/tiers"
import type { EnterpriseBrandingConfig } from "@/lib/enterprise"
import { STANDARD_PRICES, getEffectivePrice, type PricingOverride } from "@/lib/paywall"
import type { BusinessSubscription } from "@/lib/business-tier-service"

const VALID_TIERS: BusinessTierSlug[] = ["basic", "premium", "enterprise"]

const TIER_RANK: Record<BusinessTierSlug, number> = {
  basic: 0,
  premium: 1,
  enterprise: 2,
}

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

// ─── Subscription Mutation Server Actions ────────────────────
// These wrap the subscription lifecycle operations with server-side
// Supabase clients that have proper write access (bypassing RLS).

interface SubscriptionActionResult {
  success: boolean
  error?: string
  subscription?: BusinessSubscription
  chargeAmount?: number
}

export async function changeBusinessTier(
  subscriptionId: string,
  newTier: BusinessTierSlug
): Promise<SubscriptionActionResult> {
  if (!subscriptionId) return { success: false, error: "Missing subscription ID" }
  if (!VALID_TIERS.includes(newTier)) return { success: false, error: "Invalid tier" }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not authenticated" }

    let db: typeof supabase
    try {
      db = createServiceRoleClient() as any
    } catch {
      console.warn("Service role client unavailable, falling back to authenticated client")
      db = supabase
    }

    const now = new Date()

    const { data: currentSub, error: fetchError } = await db
      .from("business_subscriptions")
      .select("*")
      .eq("id", subscriptionId)
      .single()

    if (fetchError || !currentSub) {
      throw new Error("Subscription not found")
    }

    // Verify the subscription belongs to this user's business
    const { data: biz } = await db
      .from("businesses")
      .select("id")
      .eq("user_id", user.id)
      .eq("id", currentSub.business_id)
      .single()

    if (!biz) return { success: false, error: "Unauthorized" }

    if (currentSub.tier === newTier) {
      if (currentSub.pending_tier) {
        const { data, error } = await db
          .from("business_subscriptions")
          .update({ pending_tier: null, updated_at: now.toISOString() })
          .eq("id", subscriptionId)
          .select()
          .single()

        if (error) throw error
        return { success: true, subscription: data, chargeAmount: 0 }
      }
      return { success: true, subscription: currentSub, chargeAmount: 0 }
    }

    // Ensure billing period dates exist (fix for legacy subscriptions)
    const periodStart = currentSub.current_period_start || now.toISOString()
    const periodEnd =
      currentSub.current_period_end ||
      new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const periodFix =
      !currentSub.current_period_start || !currentSub.current_period_end
        ? { current_period_start: periodStart, current_period_end: periodEnd }
        : {}

    const isDowngrade = TIER_RANK[newTier] < TIER_RANK[currentSub.tier as BusinessTierSlug]

    if (isDowngrade) {
      const { data, error } = await db
        .from("business_subscriptions")
        .update({
          pending_tier: newTier,
          cancel_at_period_end: false,
          canceled_at: null,
          updated_at: now.toISOString(),
          ...periodFix,
        })
        .eq("id", subscriptionId)
        .select()
        .single()

      if (error) throw error
      return { success: true, subscription: data, chargeAmount: 0 }
    }

    // UPGRADE: Apply immediately with prorated charge
    const currentPrice = getEffectivePrice(
      currentSub.tier as BusinessTierSlug,
      currentSub.pricing_override as PricingOverride | null
    ).price
    const newPrice = getEffectivePrice(newTier, null).price

    const start = new Date(periodStart)
    const end = new Date(periodEnd)
    const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
    const daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    const dailyDiff = (newPrice - currentPrice) / totalDays
    const proratedAmount = Math.max(0, Math.round(dailyDiff * daysRemaining * 100) / 100)

    const { data, error } = await db
      .from("business_subscriptions")
      .update({
        tier: newTier,
        pending_tier: null,
        cancel_at_period_end: false,
        canceled_at: null,
        paid_amount: (currentSub.paid_amount || 0) + proratedAmount,
        updated_at: now.toISOString(),
        ...periodFix,
      })
      .eq("id", subscriptionId)
      .select()
      .single()

    if (error) throw error
    return { success: true, subscription: data, chargeAmount: proratedAmount }
  } catch (error) {
    console.error("Error changing tier:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function cancelBusinessSubscription(
  subscriptionId: string
): Promise<SubscriptionActionResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not authenticated" }

    let db: typeof supabase
    try {
      db = createServiceRoleClient() as any
    } catch {
      db = supabase
    }

    // Fetch subscription
    const { data: currentSub, error: fetchError } = await db
      .from("business_subscriptions")
      .select("*")
      .eq("id", subscriptionId)
      .single()

    if (fetchError || !currentSub) {
      return { success: false, error: "Subscription not found" }
    }

    // Verify ownership via separate query (avoids join issues)
    const { data: biz } = await db
      .from("businesses")
      .select("id")
      .eq("user_id", user.id)
      .eq("id", currentSub.business_id)
      .single()

    if (!biz) return { success: false, error: "Unauthorized" }

    const now = new Date()
    const { data, error } = await db
      .from("business_subscriptions")
      .update({
        cancel_at_period_end: true,
        canceled_at: now.toISOString(),
        pending_tier: null,
        updated_at: now.toISOString(),
      })
      .eq("id", subscriptionId)
      .select()
      .single()

    if (error) throw error
    return { success: true, subscription: data }
  } catch (error) {
    console.error("Error canceling subscription:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function resubscribeBusiness(
  subscriptionId: string
): Promise<SubscriptionActionResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not authenticated" }

    let db: typeof supabase
    try {
      db = createServiceRoleClient() as any
    } catch {
      db = supabase
    }

    // Fetch subscription
    const { data: currentSub, error: fetchError } = await db
      .from("business_subscriptions")
      .select("*")
      .eq("id", subscriptionId)
      .single()

    if (fetchError || !currentSub) {
      return { success: false, error: "Subscription not found" }
    }

    // Verify ownership via separate query (avoids join issues)
    const { data: biz } = await db
      .from("businesses")
      .select("id")
      .eq("user_id", user.id)
      .eq("id", currentSub.business_id)
      .single()

    if (!biz) return { success: false, error: "Unauthorized" }

    const now = new Date()
    const { data, error } = await db
      .from("business_subscriptions")
      .update({
        cancel_at_period_end: false,
        canceled_at: null,
        updated_at: now.toISOString(),
      })
      .eq("id", subscriptionId)
      .select()
      .single()

    if (error) throw error
    return { success: true, subscription: data, chargeAmount: 0 }
  } catch (error) {
    console.error("Error resubscribing:", error)
    return { success: false, error: (error as Error).message }
  }
}

// ─── Plan Change Confirmation Email ──────────────────────────

export async function sendPlanChangeEmail(
  changeType: "upgrade" | "downgrade",
  fromTier: BusinessTierSlug,
  toTier: BusinessTierSlug,
  chargeAmount: number,
  periodEnd: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not authenticated" }

    const { sendPlanChangeReceiptEmail } = await import("@/lib/email-notifications")
    await sendPlanChangeReceiptEmail(
      user.email!,
      changeType,
      fromTier,
      toTier,
      chargeAmount,
      periodEnd
    )

    return { success: true }
  } catch (error) {
    console.error("Error sending plan change email:", error)
    return { success: false, error: (error as Error).message }
  }
}
