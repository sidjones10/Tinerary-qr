// Business Plan feature limits and helpers
// Defines what each business tier can access

import type { BusinessTierSlug } from "./tiers"

export interface BusinessPlanLimits {
  maxActivePromotions: number | null // null = unlimited
  listingPlacement: "standard" | "featured" | "top-tier"
  analyticsLevel: "basic" | "advanced" | "realtime"
  supportLevel: "email" | "priority" | "dedicated"
  reportFrequency: "monthly" | "weekly" | "daily"
  bookingIntegration: boolean
  mentionHighlights: number | null // null = unlimited, 0 = none
  customBrandedProfile: boolean
}

export const PLAN_LIMITS: Record<BusinessTierSlug, BusinessPlanLimits> = {
  basic: {
    maxActivePromotions: 5,
    listingPlacement: "standard",
    analyticsLevel: "basic",
    supportLevel: "email",
    reportFrequency: "monthly",
    bookingIntegration: false,
    mentionHighlights: 0,
    customBrandedProfile: false,
  },
  premium: {
    maxActivePromotions: null,
    listingPlacement: "featured",
    analyticsLevel: "advanced",
    supportLevel: "priority",
    reportFrequency: "weekly",
    bookingIntegration: true,
    mentionHighlights: 5,
    customBrandedProfile: false,
  },
  enterprise: {
    maxActivePromotions: null,
    listingPlacement: "top-tier",
    analyticsLevel: "realtime",
    supportLevel: "dedicated",
    reportFrequency: "daily",
    bookingIntegration: true,
    mentionHighlights: null,
    customBrandedProfile: true,
  },
}

export function getPlanLimits(tier: BusinessTierSlug): BusinessPlanLimits {
  return PLAN_LIMITS[tier]
}

export function canCreatePromotion(
  tier: BusinessTierSlug,
  currentActiveCount: number
): { allowed: boolean; reason?: string } {
  const limits = PLAN_LIMITS[tier]
  if (limits.maxActivePromotions === null) {
    return { allowed: true }
  }
  if (currentActiveCount >= limits.maxActivePromotions) {
    return {
      allowed: false,
      reason: `Your ${tier} plan allows up to ${limits.maxActivePromotions} active promotions. Upgrade to Premium for unlimited promotions.`,
    }
  }
  return { allowed: true }
}

export function getDefaultTier(): BusinessTierSlug {
  return "basic"
}
