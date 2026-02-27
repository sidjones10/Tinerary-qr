import { createClient } from "@/lib/supabase/client"
import type { BusinessTierSlug } from "@/lib/tiers"

export interface BusinessSubscription {
  id: string
  business_id: string
  tier: BusinessTierSlug
  status: "active" | "canceled" | "past_due"
  mention_highlights_used: number
  mention_highlights_reset_at: string
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
    const { data, error } = await supabase
      .from("business_subscriptions")
      .select("*")
      .eq("business_id", businessId)
      .eq("status", "active")
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching business subscription:", error)
    }

    return data || null
  } catch {
    return null
  }
}

export async function getBusinessSubscriptionByUserId(
  userId: string
): Promise<{ subscription: BusinessSubscription | null; businessId: string | null }> {
  try {
    const supabase = createClient()
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("user_id", userId)
      .single()

    if (!business) return { subscription: null, businessId: null }

    const subscription = await getBusinessSubscription(business.id)
    return { subscription, businessId: business.id }
  } catch {
    return { subscription: null, businessId: null }
  }
}

export function getEffectiveTier(subscription: BusinessSubscription | null): BusinessTierSlug {
  if (!subscription || subscription.status !== "active") return "basic"
  return subscription.tier
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
