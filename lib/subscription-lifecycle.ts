import { createClient } from "@/lib/supabase/client"
import type { BusinessTierSlug } from "@/lib/tiers"
import { STANDARD_PRICES, getEffectivePrice, type PricingOverride } from "@/lib/paywall"
import type { BusinessSubscription } from "@/lib/business-tier-service"

// ─── Tier Hierarchy ──────────────────────────────────────────
const TIER_RANK: Record<BusinessTierSlug, number> = {
  basic: 0,
  premium: 1,
  enterprise: 2,
}

function isUpgrade(from: BusinessTierSlug, to: BusinessTierSlug): boolean {
  return TIER_RANK[to] > TIER_RANK[from]
}

function isDowngrade(from: BusinessTierSlug, to: BusinessTierSlug): boolean {
  return TIER_RANK[to] < TIER_RANK[from]
}

// ─── Proration ───────────────────────────────────────────────

/**
 * Calculates the prorated amount when upgrading mid-period.
 * Returns the additional amount to charge for the remainder of the current period.
 */
export function calculateProratedAmount(
  currentTier: BusinessTierSlug,
  newTier: BusinessTierSlug,
  periodStart: string,
  periodEnd: string,
  currentOverride?: PricingOverride | null,
  newOverride?: PricingOverride | null
): { proratedAmount: number; daysRemaining: number; totalDays: number } {
  const start = new Date(periodStart)
  const end = new Date(periodEnd)
  const now = new Date()

  const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
  const daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

  const currentPrice = getEffectivePrice(currentTier, currentOverride).price
  const newPrice = getEffectivePrice(newTier, newOverride).price

  const dailyDifference = (newPrice - currentPrice) / totalDays
  const proratedAmount = Math.max(0, Math.round(dailyDifference * daysRemaining * 100) / 100)

  return { proratedAmount, daysRemaining, totalDays }
}

// ─── Subscription Actions ────────────────────────────────────

export interface SubscriptionActionResult {
  success: boolean
  error?: string
  subscription?: BusinessSubscription
  chargeAmount?: number
}

/**
 * Subscribe to a tier (new subscription or resubscribe in same period).
 *
 * Rule 1: If the user already has a canceled subscription within the current
 * billing period, just reactivate it — no additional charge.
 */
export async function subscribe(
  businessId: string,
  tier: BusinessTierSlug
): Promise<SubscriptionActionResult> {
  try {
    const supabase = createClient()
    const now = new Date()

    // Check for existing subscription (active or recently canceled)
    const { data: existingSub } = await supabase
      .from("business_subscriptions")
      .select("*")
      .eq("business_id", businessId)
      .single()

    // Case: Resubscribe within the same billing period — no charge
    if (
      existingSub &&
      existingSub.status === "canceled" &&
      existingSub.tier === tier &&
      new Date(existingSub.current_period_end) > now
    ) {
      const { data, error } = await supabase
        .from("business_subscriptions")
        .update({
          status: "active",
          cancel_at_period_end: false,
          canceled_at: null,
          pending_tier: null,
          updated_at: now.toISOString(),
        })
        .eq("id", existingSub.id)
        .select()
        .single()

      if (error) throw error
      return { success: true, subscription: data, chargeAmount: 0 }
    }

    // Case: Reactivate a cancel-at-period-end subscription — no charge
    if (
      existingSub &&
      existingSub.status === "active" &&
      existingSub.cancel_at_period_end &&
      existingSub.tier === tier
    ) {
      const { data, error } = await supabase
        .from("business_subscriptions")
        .update({
          cancel_at_period_end: false,
          canceled_at: null,
          pending_tier: null,
          updated_at: now.toISOString(),
        })
        .eq("id", existingSub.id)
        .select()
        .single()

      if (error) throw error
      return { success: true, subscription: data, chargeAmount: 0 }
    }

    // Case: New subscription
    const periodEnd = new Date(now)
    periodEnd.setMonth(periodEnd.getMonth() + 1)
    const price = STANDARD_PRICES[tier]

    if (existingSub) {
      // Update existing row
      const { data, error } = await supabase
        .from("business_subscriptions")
        .update({
          tier,
          status: "active",
          cancel_at_period_end: false,
          canceled_at: null,
          pending_tier: null,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          paid_amount: price,
          updated_at: now.toISOString(),
        })
        .eq("id", existingSub.id)
        .select()
        .single()

      if (error) throw error
      return { success: true, subscription: data, chargeAmount: price }
    }

    // Insert new row
    const { data, error } = await supabase
      .from("business_subscriptions")
      .insert({
        business_id: businessId,
        tier,
        status: "active",
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        paid_amount: price,
        mention_highlights_used: 0,
      })
      .select()
      .single()

    if (error) throw error
    return { success: true, subscription: data, chargeAmount: price }
  } catch (error) {
    console.error("Error subscribing:", error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Cancel a subscription.
 *
 * Rule 2: The user keeps access to all features they paid for until
 * current_period_end. The subscription is marked cancel_at_period_end.
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<SubscriptionActionResult> {
  try {
    const supabase = createClient()
    const now = new Date()

    const { data, error } = await supabase
      .from("business_subscriptions")
      .update({
        cancel_at_period_end: true,
        canceled_at: now.toISOString(),
        pending_tier: null,
        updated_at: now.toISOString(),
      })
      .eq("id", subscriptionId)
      .eq("status", "active")
      .select()
      .single()

    if (error) throw error
    return { success: true, subscription: data }
  } catch (error) {
    console.error("Error canceling subscription:", error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Resubscribe — undo a pending cancellation within the same billing period.
 *
 * Rule 1: No additional charge since the period is already paid for.
 */
export async function resubscribe(
  subscriptionId: string
): Promise<SubscriptionActionResult> {
  try {
    const supabase = createClient()
    const now = new Date()

    const { data, error } = await supabase
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

/**
 * Change tier (upgrade or downgrade).
 *
 * Rule 3 (Downgrade): Sets pending_tier — the actual tier change happens
 * at the next billing period. The user keeps their current tier until then.
 *
 * Rule 4 (Upgrade): Applies immediately and charges only the prorated
 * difference for the remaining days in the current period.
 */
export async function changeTier(
  subscriptionId: string,
  newTier: BusinessTierSlug
): Promise<SubscriptionActionResult> {
  try {
    const supabase = createClient()
    const now = new Date()

    // Fetch current subscription
    const { data: currentSub, error: fetchError } = await supabase
      .from("business_subscriptions")
      .select("*")
      .eq("id", subscriptionId)
      .single()

    if (fetchError || !currentSub) {
      throw new Error("Subscription not found")
    }

    if (currentSub.tier === newTier) {
      // Clear any pending tier if re-selecting the current tier
      if (currentSub.pending_tier) {
        const { data, error } = await supabase
          .from("business_subscriptions")
          .update({
            pending_tier: null,
            updated_at: now.toISOString(),
          })
          .eq("id", subscriptionId)
          .select()
          .single()

        if (error) throw error
        return { success: true, subscription: data, chargeAmount: 0 }
      }
      return { success: true, subscription: currentSub, chargeAmount: 0 }
    }

    if (isDowngrade(currentSub.tier, newTier)) {
      // DOWNGRADE: Schedule for next period, keep current tier now
      const { data, error } = await supabase
        .from("business_subscriptions")
        .update({
          pending_tier: newTier,
          cancel_at_period_end: false,
          canceled_at: null,
          updated_at: now.toISOString(),
        })
        .eq("id", subscriptionId)
        .select()
        .single()

      if (error) throw error
      return { success: true, subscription: data, chargeAmount: 0 }
    }

    // UPGRADE: Apply immediately, charge prorated difference
    const { proratedAmount } = calculateProratedAmount(
      currentSub.tier,
      newTier,
      currentSub.current_period_start,
      currentSub.current_period_end,
      currentSub.pricing_override as PricingOverride | null
    )

    const { data, error } = await supabase
      .from("business_subscriptions")
      .update({
        tier: newTier,
        pending_tier: null,
        cancel_at_period_end: false,
        canceled_at: null,
        paid_amount: (currentSub.paid_amount || 0) + proratedAmount,
        updated_at: now.toISOString(),
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

// ─── Subscription Status Helpers ─────────────────────────────

export interface SubscriptionStatus {
  /** The tier the user currently has access to */
  activeTier: BusinessTierSlug
  /** Whether the subscription will cancel at period end */
  willCancel: boolean
  /** If a downgrade is pending, the tier it will switch to */
  pendingDowngradeTo: BusinessTierSlug | null
  /** End of the current billing period */
  periodEnd: string | null
  /** Whether the subscription is within a paid period */
  isWithinPaidPeriod: boolean
}

export function getSubscriptionStatus(
  subscription: BusinessSubscription | null
): SubscriptionStatus {
  if (!subscription) {
    return {
      activeTier: "basic",
      willCancel: false,
      pendingDowngradeTo: null,
      periodEnd: null,
      isWithinPaidPeriod: false,
    }
  }

  const now = new Date()
  const periodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end)
    : null
  const isWithinPaidPeriod = periodEnd ? periodEnd > now : false

  return {
    activeTier: subscription.tier,
    willCancel: subscription.cancel_at_period_end,
    pendingDowngradeTo: subscription.pending_tier || null,
    periodEnd: subscription.current_period_end || null,
    isWithinPaidPeriod,
  }
}
