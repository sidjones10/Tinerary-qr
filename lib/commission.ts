// Commission calculation utilities for affiliate earnings
// Payment processing is gated behind ENABLE_AFFILIATE_PAYOUTS flag

import type { UserTierSlug } from "./tiers"

// Feature flag — set to true when ready to process real payouts
export const ENABLE_AFFILIATE_PAYOUTS = false

// Commission split percentages by user tier
const COMMISSION_SPLITS: Record<string, { user: number; platform: number }> = {
  user: { user: 0.6, platform: 0.4 },
  creator: { user: 0.7, platform: 0.3 },
  business: { user: 0.6, platform: 0.4 },
}

export interface CommissionBreakdown {
  grossAmount: number
  userCommission: number
  platformCommission: number
  userTier: string
  splitPercentage: string
}

/**
 * Calculate the commission split for a given gross amount and user tier.
 */
export function calculateCommission(
  grossAmount: number,
  userTier: UserTierSlug = "user"
): CommissionBreakdown {
  const split = COMMISSION_SPLITS[userTier] || COMMISSION_SPLITS.user

  const userCommission = Math.round(grossAmount * split.user * 100) / 100
  const platformCommission = Math.round(grossAmount * split.platform * 100) / 100

  return {
    grossAmount,
    userCommission,
    platformCommission,
    userTier,
    splitPercentage: `${split.user * 100}/${split.platform * 100}`,
  }
}

/**
 * Estimate commission for a product purchase based on typical partner rates.
 */
export function estimateProductCommission(
  productPrice: number,
  partner: string,
  userTier: UserTierSlug = "user"
): CommissionBreakdown {
  // Typical affiliate commission rates by partner
  const partnerRates: Record<string, number> = {
    amazon: 0.04,      // 4% for most categories
    rei: 0.05,         // 5%
    "booking.com": 0.04,
    viator: 0.08,      // 8%
    "airbnb experiences": 0.03,
  }

  const partnerRate = partnerRates[partner.toLowerCase()] || 0.05
  const grossCommission = Math.round(productPrice * partnerRate * 100) / 100

  return calculateCommission(grossCommission, userTier)
}

/**
 * Record an affiliate earning. When ENABLE_AFFILIATE_PAYOUTS is false,
 * this logs the earning for tracking but doesn't trigger any payout.
 */
export async function recordAffiliateEarning(params: {
  userId: string
  affiliateCode: string
  grossAmount: number
  userTier: UserTierSlug
  bookingId?: string
  supabaseClient: any
}): Promise<{ success: boolean; commission?: CommissionBreakdown; error?: string }> {
  const { userId, affiliateCode, grossAmount, userTier, bookingId, supabaseClient } = params

  const commission = calculateCommission(grossAmount, userTier)

  try {
    const { error } = await supabaseClient
      .from("affiliate_earnings")
      .insert({
        user_id: userId,
        affiliate_code: affiliateCode,
        booking_id: bookingId || null,
        gross_amount: commission.grossAmount,
        user_commission: commission.userCommission,
        platform_commission: commission.platformCommission,
        user_tier: userTier,
        status: ENABLE_AFFILIATE_PAYOUTS ? "approved" : "pending",
        created_at: new Date().toISOString(),
      })

    if (error) {
      console.warn("Could not record affiliate earning (table may not exist yet):", error.message)
      return { success: false, error: error.message }
    }

    return { success: true, commission }
  } catch (error) {
    console.warn("Error recording affiliate earning:", error)
    return { success: false, error: (error as Error).message }
  }
}
