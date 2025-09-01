import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/supabase"

// Browser client - use this in client components
export const supabase = createClientComponentClient<Database>({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
})

// Create a client for use in browser components - this is for compatibility with existing code
export function createClient() {
  return createClientComponentClient<Database>({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  })
}

// Helper functions for promotions
export async function getPromotions(limit = 10, offset = 0, filters?: any) {
  let query = supabase
    .from("promotions")
    .select(`
      *,
      business:businesses(name, logo, rating),
      engagement_metrics:promotion_metrics(views, clicks, saves, shares)
    `)
    .order("rank_score", { ascending: false })
    .limit(limit)
    .range(offset, offset + limit - 1)

  // Apply filters if provided
  if (filters) {
    if (filters.type) {
      query = query.eq("type", filters.type)
    }
    if (filters.location) {
      query = query.ilike("location", `%${filters.location}%`)
    }
    if (filters.category) {
      query = query.eq("category", filters.category)
    }
    if (filters.priceRange) {
      query = query.gte("price", filters.priceRange[0]).lte("price", filters.priceRange[1])
    }
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching promotions:", error)
    return []
  }

  return data
}

export async function getPromotionById(id: string) {
  const { data, error } = await supabase
    .from("promotions")
    .select(`
      *,
      business:businesses(id, name, logo, description, website, rating, review_count),
      engagement_metrics:promotion_metrics(views, clicks, saves, shares),
      reviews:promotion_reviews(id, user_id, rating, content, created_at, users(name, avatar))
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching promotion:", error)
    return null
  }

  return data
}

export async function recordPromotionView(promotionId: string, userId?: string) {
  // Record view in analytics table
  const { error } = await supabase.from("promotion_analytics").insert({
    promotion_id: promotionId,
    user_id: userId || null,
    action: "view",
    timestamp: new Date().toISOString(),
  })

  if (error) {
    console.error("Error recording promotion view:", error)
  }

  // Update metrics count
  await supabase.rpc("increment_promotion_views", { p_id: promotionId })

  // Update rank score
  await updatePromotionRankScore(promotionId)
}

export async function recordPromotionClick(promotionId: string, userId?: string) {
  // Record click in analytics table
  const { error } = await supabase.from("promotion_analytics").insert({
    promotion_id: promotionId,
    user_id: userId || null,
    action: "click",
    timestamp: new Date().toISOString(),
  })

  if (error) {
    console.error("Error recording promotion click:", error)
  }

  // Update metrics count
  await supabase.rpc("increment_promotion_clicks", { p_id: promotionId })

  // Update rank score with higher weight for clicks
  await updatePromotionRankScore(promotionId)
}

// Helper function to update promotion rank score
async function updatePromotionRankScore(promotionId: string) {
  // This calls a Supabase function that calculates the rank score
  // based on views, clicks, saves, shares with different weights
  await supabase.rpc("calculate_promotion_rank", { p_id: promotionId })
}
