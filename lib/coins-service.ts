import { createClient } from "@/lib/supabase/client"
import { COIN_EARNING_ACTIONS, COIN_SPENDING_REWARDS } from "@/lib/tiers"

// ─── Action Keys (machine-readable identifiers) ─────────────────

export type CoinEarnAction =
  | "publish_public_itinerary"
  | "itinerary_10_views"
  | "itinerary_saved"
  | "leave_review"
  | "refer_user"
  | "complete_booking"
  | "share_social"
  | "add_5_activities"
  | "first_itinerary"

export type CoinSpendAction =
  | "shop_discount_10"
  | "shop_discount_25"
  | "free_shipping"
  | "exclusive_templates"
  | "custom_cover"
  | "profile_badge"
  | "early_access"
  | "mini_boost"

// ─── Coin amounts (matching tiers.ts config) ────────────────────

export const COIN_AMOUNTS: Record<CoinEarnAction, number> = {
  publish_public_itinerary: 50,
  itinerary_10_views: 25,
  itinerary_saved: 15,
  leave_review: 10,
  refer_user: 100,
  complete_booking: 20,
  share_social: 10,
  add_5_activities: 15,
  first_itinerary: 75,
}

export const REWARD_COSTS: Record<CoinSpendAction, number> = {
  shop_discount_10: 200,
  shop_discount_25: 500,
  free_shipping: 150,
  exclusive_templates: 100,
  custom_cover: 50,
  profile_badge: 300,
  early_access: 250,
  mini_boost: 400,
}

export const REWARD_NAMES: Record<CoinSpendAction, string> = {
  shop_discount_10: "Tinerary Shop discount (10%)",
  shop_discount_25: "Tinerary Shop discount (25%)",
  free_shipping: "Free shipping on Shop order",
  exclusive_templates: "Exclusive itinerary templates",
  custom_cover: "Custom cover photo for itinerary",
  profile_badge: "Profile badge (Traveler, Explorer, etc.)",
  early_access: "Early access to new features",
  mini_boost: "Single post boost (mini)",
}

// ─── Action descriptions (human-readable) ────────────────────────

const ACTION_DESCRIPTIONS: Record<CoinEarnAction, string> = {
  publish_public_itinerary: "Published a public itinerary",
  itinerary_10_views: "Itinerary reached 10+ views",
  itinerary_saved: "Itinerary was saved by another user",
  leave_review: "Left a review on a business",
  refer_user: "Referred a new user who signed up",
  complete_booking: "Completed a booking",
  share_social: "Shared itinerary to social media",
  add_5_activities: "Added 5+ activities to an itinerary",
  first_itinerary: "Created first itinerary ever",
}

// ─── Service Functions ───────────────────────────────────────────

export interface CoinBalance {
  balance: number
  lifetime_earned: number
  lifetime_spent: number
}

export interface CoinTransaction {
  id: string
  amount: number
  type: "earn" | "spend"
  action: string
  description: string
  reference_type: string | null
  reference_id: string | null
  created_at: string
}

export interface RedeemResult {
  success: boolean
  redemption_id?: string
  transaction_id?: string
  new_balance?: number
  error?: string
}

/**
 * Get a user's coin balance
 */
export async function getCoinBalance(userId: string, supabaseClient?: any): Promise<CoinBalance> {
  const supabase = supabaseClient || createClient()

  const { data, error } = await supabase
    .from("coin_balances")
    .select("balance, lifetime_earned, lifetime_spent")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    console.error("Error fetching coin balance:", error)
    return { balance: 0, lifetime_earned: 0, lifetime_spent: 0 }
  }

  if (!data) {
    return { balance: 0, lifetime_earned: 0, lifetime_spent: 0 }
  }

  return {
    balance: data.balance,
    lifetime_earned: data.lifetime_earned,
    lifetime_spent: data.lifetime_spent,
  }
}

/**
 * Get a user's transaction history
 */
export async function getCoinTransactions(
  userId: string,
  options: { limit?: number; offset?: number; type?: "earn" | "spend" } = {},
  supabaseClient?: any
): Promise<{ transactions: CoinTransaction[]; total: number }> {
  const supabase = supabaseClient || createClient()
  const { limit = 20, offset = 0, type } = options

  let query = supabase
    .from("coin_transactions")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (type) {
    query = query.eq("type", type)
  }

  const { data, error, count } = await query

  if (error) {
    console.error("Error fetching coin transactions:", error)
    return { transactions: [], total: 0 }
  }

  return { transactions: data || [], total: count || 0 }
}

/**
 * Award coins for an action. Uses the database function which handles
 * creator tier 2x multiplier automatically.
 */
export async function awardCoins(
  userId: string,
  action: CoinEarnAction,
  referenceType?: string,
  referenceId?: string,
  supabaseClient?: any
): Promise<{ success: boolean; transaction_id?: string; error?: string }> {
  const supabase = supabaseClient || createClient()
  const amount = COIN_AMOUNTS[action]
  const description = ACTION_DESCRIPTIONS[action]

  const { data, error } = await supabase.rpc("award_coins", {
    p_user_id: userId,
    p_amount: amount,
    p_action: action,
    p_description: description,
    p_reference_type: referenceType || null,
    p_reference_id: referenceId || null,
    p_metadata: {},
  })

  if (error) {
    console.error("Error awarding coins:", error)
    return { success: false, error: error.message }
  }

  return { success: true, transaction_id: data }
}

/**
 * Redeem coins for a reward
 */
export async function redeemReward(
  userId: string,
  rewardSlug: CoinSpendAction,
  supabaseClient?: any
): Promise<RedeemResult> {
  const supabase = supabaseClient || createClient()
  const cost = REWARD_COSTS[rewardSlug]
  const rewardName = REWARD_NAMES[rewardSlug]

  if (!cost || !rewardName) {
    return { success: false, error: "Invalid reward" }
  }

  // Use spend_coins database function (handles balance check + race conditions)
  const { data: transactionId, error: spendError } = await supabase.rpc("spend_coins", {
    p_user_id: userId,
    p_amount: cost,
    p_action: rewardSlug,
    p_description: `Redeemed: ${rewardName}`,
    p_reference_type: "redemption",
    p_reference_id: null,
    p_metadata: { reward_slug: rewardSlug },
  })

  if (spendError) {
    // Check for insufficient balance error
    if (spendError.message?.includes("Insufficient")) {
      return { success: false, error: "Insufficient coin balance" }
    }
    console.error("Error spending coins:", spendError)
    return { success: false, error: spendError.message }
  }

  // Create redemption record
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30) // 30-day expiry

  const { data: redemption, error: redeemError } = await supabase
    .from("coin_redemptions")
    .insert({
      user_id: userId,
      transaction_id: transactionId,
      reward_slug: rewardSlug,
      reward_name: rewardName,
      cost: cost,
      status: "active",
      expires_at: expiresAt.toISOString(),
    })
    .select("id")
    .single()

  if (redeemError) {
    console.error("Error creating redemption:", redeemError)
    // Coins already spent — still return success with transaction
    return { success: true, transaction_id: transactionId }
  }

  // Get new balance
  const balance = await getCoinBalance(userId, supabase)

  return {
    success: true,
    redemption_id: redemption.id,
    transaction_id: transactionId,
    new_balance: balance.balance,
  }
}

/**
 * Get user's active redemptions
 */
export async function getActiveRedemptions(
  userId: string,
  supabaseClient?: any
): Promise<any[]> {
  const supabase = supabaseClient || createClient()

  const { data, error } = await supabase
    .from("coin_redemptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching redemptions:", error)
    return []
  }

  return data || []
}

/**
 * Check if a specific earn action has already been awarded for a reference.
 * Prevents duplicate awards (e.g., awarding "first itinerary" twice).
 */
export async function hasAlreadyEarned(
  userId: string,
  action: CoinEarnAction,
  referenceId?: string,
  supabaseClient?: any
): Promise<boolean> {
  const supabase = supabaseClient || createClient()

  let query = supabase
    .from("coin_transactions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("action", action)
    .eq("type", "earn")

  if (referenceId) {
    query = query.eq("reference_id", referenceId)
  }

  const { count, error } = await query

  if (error) {
    console.error("Error checking earn history:", error)
    return false
  }

  return (count || 0) > 0
}
