"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import type { BusinessTierSlug } from "@/lib/tiers"

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
 * Uses server-side Supabase (cookie auth) to avoid client-side RLS issues.
 */
export async function getBusinessProfileData() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { profile: null, business: null, promos: null }
  }

  const [profileResult, bizResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("name, username, bio, location, website, avatar_url")
      .eq("id", session.user.id)
      .single(),
    supabase
      .from("businesses")
      .select("*")
      .eq("user_id", session.user.id)
      .single(),
  ])

  const profile = profileResult.data
  const business = bizResult.data

  let promos: any[] | null = null
  if (business) {
    const { data } = await supabase
      .from("promotions")
      .select("title, status, promotion_metrics(views, clicks, saves)")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
    promos = data
  }

  return { profile, business, promos }
}

export async function createBusiness(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return redirect("/auth?message=You must be logged in to create a business")
  }

  // Check if user already has a business
  const { data: existing } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", session.user.id)
    .single()

  if (existing) {
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
    const { data, error } = await supabase
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
      await supabase.from("business_subscriptions").insert({
        business_id: data.id,
        tier: tier as BusinessTierSlug,
        status: "active",
        mention_highlights_used: 0,
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
