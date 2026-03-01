import { createClient } from "@/lib/supabase/client"
import type { BusinessTierSlug } from "@/lib/tiers"
import type { PricingOverride } from "@/lib/paywall"

export interface BusinessSubscription {
  id: string
  business_id: string
  tier: BusinessTierSlug
  status: "active" | "canceled" | "past_due"
  mention_highlights_used: number
  mention_highlights_reset_at: string
  pricing_override: PricingOverride | null
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  pending_tier: BusinessTierSlug | null
  paid_amount: number | null
  canceled_at: string | null
  created_at: string
  updated_at: string
}

// Tier feature limits
const TIER_LIMITS = {
  basic: {
    maxPromotions: 5,
    featuredPlacement: false,
    enhancedProfile: false,
    analyticsLevel: "basic" as const,
    supportLevel: "email" as const,
    reportFrequency: "monthly" as const,
    bookingIntegration: false,
    mentionHighlightsIncluded: 0,
    customBranding: false,
  },
  premium: {
    maxPromotions: Infinity,
    featuredPlacement: true,
    enhancedProfile: true,
    analyticsLevel: "advanced" as const,
    supportLevel: "priority" as const,
    reportFrequency: "weekly" as const,
    bookingIntegration: true,
    mentionHighlightsIncluded: 5,
    customBranding: false,
  },
  enterprise: {
    maxPromotions: Infinity,
    featuredPlacement: true,
    enhancedProfile: true,
    analyticsLevel: "realtime" as const,
    supportLevel: "dedicated" as const,
    reportFrequency: "daily" as const,
    bookingIntegration: true,
    mentionHighlightsIncluded: Infinity,
    customBranding: true,
  },
} as const

export type TierLimits = (typeof TIER_LIMITS)[BusinessTierSlug]

export function getTierLimits(tier: BusinessTierSlug): TierLimits {
  return TIER_LIMITS[tier]
}

export async function getBusinessSubscription(
  businessId: string
): Promise<BusinessSubscription | null> {
  try {
    const supabase = createClient()

    // First try to find an active subscription
    const { data: activeSub, error: activeError } = await supabase
      .from("business_subscriptions")
      .select("*")
      .eq("business_id", businessId)
      .eq("status", "active")
      .single()

    if (activeSub) return activeSub

    if (activeError && activeError.code !== "PGRST116") {
      console.error("Error fetching active business subscription:", activeError)
    }

    // Fall back to a canceled subscription that is still within its paid period
    const { data: canceledSub, error: canceledError } = await supabase
      .from("business_subscriptions")
      .select("*")
      .eq("business_id", businessId)
      .eq("status", "canceled")
      .gte("current_period_end", new Date().toISOString())
      .single()

    if (canceledError && canceledError.code !== "PGRST116") {
      console.error("Error fetching canceled business subscription:", canceledError)
    }

    return canceledSub || null
  } catch {
    return null
  }
}

export async function getBusinessSubscriptionByUserId(
  userId: string
): Promise<{ subscription: BusinessSubscription | null; businessId: string | null; businessTier: BusinessTierSlug | null }> {
  try {
    const supabase = createClient()
    const { data: business } = await supabase
      .from("businesses")
      .select("id, business_tier")
      .eq("user_id", userId)
      .single()

    if (!business) return { subscription: null, businessId: null, businessTier: null }

    const subscription = await getBusinessSubscription(business.id)
    return {
      subscription,
      businessId: business.id,
      businessTier: (business.business_tier as BusinessTierSlug) || null,
    }
  } catch {
    return { subscription: null, businessId: null, businessTier: null }
  }
}

/**
 * Returns the tier the user should currently have access to.
 * - Active subscriptions return their tier.
 * - Canceled subscriptions still return their paid tier if within the billing period.
 * - After the period ends, falls back to the fallback tier.
 */
export function getEffectiveTier(
  subscription: BusinessSubscription | null,
  fallbackTier?: BusinessTierSlug | null
): BusinessTierSlug {
  if (!subscription) return fallbackTier || "basic"

  if (subscription.status === "active") return subscription.tier

  // Canceled but still within the paid period — keep access to the paid tier
  if (
    subscription.status === "canceled" &&
    subscription.current_period_end &&
    new Date(subscription.current_period_end) > new Date()
  ) {
    return subscription.tier
  }

  return fallbackTier || "basic"
}

export function canCreatePromotion(tier: BusinessTierSlug, currentCount: number): boolean {
  const limits = getTierLimits(tier)
  return currentCount < limits.maxPromotions
}

export function hasFeaturedPlacement(tier: BusinessTierSlug): boolean {
  return getTierLimits(tier).featuredPlacement
}

export function hasEnhancedProfile(tier: BusinessTierSlug): boolean {
  return getTierLimits(tier).enhancedProfile
}

export function hasBookingIntegration(tier: BusinessTierSlug): boolean {
  return getTierLimits(tier).bookingIntegration
}

export function getAnalyticsLevel(tier: BusinessTierSlug) {
  return getTierLimits(tier).analyticsLevel
}

export function getSupportLevel(tier: BusinessTierSlug) {
  return getTierLimits(tier).supportLevel
}

export function getReportFrequency(tier: BusinessTierSlug) {
  return getTierLimits(tier).reportFrequency
}

export function getMentionHighlightsRemaining(
  tier: BusinessTierSlug,
  used: number
): number {
  const included = getTierLimits(tier).mentionHighlightsIncluded
  if (included === Infinity) return Infinity
  return Math.max(0, included - used)
}

export function canUseMentionHighlight(
  tier: BusinessTierSlug,
  used: number
): boolean {
  return getMentionHighlightsRemaining(tier, used) > 0
}

// Featured feed score boost for premium/enterprise businesses
export function getFeaturedBoostMultiplier(tier: BusinessTierSlug): number {
  switch (tier) {
    case "enterprise":
      return 1.8
    case "premium":
      return 1.4
    default:
      return 1.0
  }
}
