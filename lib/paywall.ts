// ─── Paywall Configuration ───────────────────────────────────
//
// Central config for all subscription gating. Every spoke page
// references a gate defined here.  During the testing phase the
// global PAYWALL_ENABLED flag is **false**, so all gates pass
// through.  Flip it to true when payments go live.
//
// Custom pricing overrides allow per-business price adjustments
// (e.g. early adopters, partnerships, promos) stored in
// business_subscriptions.pricing_override.

import type { BusinessTierSlug } from "./tiers"

// ─── Global Kill-Switch ──────────────────────────────────────
// Set to true when the payment integration (Stripe, etc.) is live.
// While false, every PaywallGate renders its children directly.
export const PAYWALL_ENABLED = false

// ─── Admin Paywall Testing ──────────────────────────────────
// localStorage key used by admin accounts to toggle paywalls
// on/off for their own session (testing purposes only).
export const ADMIN_PAYWALL_STORAGE_KEY = "tinerary_admin_paywall_enabled"

// ─── Gate Definitions ────────────────────────────────────────
// Each protected page / feature references a gate by id.

export type PaywallGateId =
  | "business_profile"
  | "deals_manage"
  | "business_analytics"
  | "mentions"
  | "transactions"
  | "affiliate"
  | "creator_hub"
  | "creator_analytics"
  | "creator_boost"
  | "creator_templates"
  | "creator_sponsorships"

export interface PaywallGateConfig {
  /** Human-readable label shown in upgrade prompts */
  label: string
  /** Minimum business tier required (null = any authenticated business) */
  requiredTier: BusinessTierSlug | null
  /** Minimum account type required */
  requiredAccountType: "business" | "creator" | null
  /** Route to redirect to for upgrade */
  upgradeRoute: string
  /** Short description shown on the upgrade prompt */
  upgradeMessage: string
}

export const PAYWALL_GATES: Record<PaywallGateId, PaywallGateConfig> = {
  business_profile: {
    label: "Business Dashboard",
    requiredTier: null,       // any business tier
    requiredAccountType: "business",
    upgradeRoute: "/business",
    upgradeMessage: "Create a business account to access your dashboard.",
  },
  deals_manage: {
    label: "Deals & Promotions",
    requiredTier: null,       // all tiers can manage deals
    requiredAccountType: "business",
    upgradeRoute: "/business",
    upgradeMessage: "Create a business account to manage deals and promotions.",
  },
  business_analytics: {
    label: "Advanced Analytics",
    requiredTier: "premium",  // locked for basic
    requiredAccountType: "business",
    upgradeRoute: "/business",
    upgradeMessage: "Upgrade to Premium to unlock audience insights, geographic data, and engagement trends.",
  },
  mentions: {
    label: "Mention Highlights",
    requiredTier: "premium",  // locked for basic
    requiredAccountType: "business",
    upgradeRoute: "/business",
    upgradeMessage: "Upgrade to Premium to highlight organic mentions and boost visibility.",
  },
  transactions: {
    label: "Transactions & Commission",
    requiredTier: "premium",
    requiredAccountType: "business",
    upgradeRoute: "/business",
    upgradeMessage: "Upgrade to Premium to access booking revenue and commission tracking.",
  },
  affiliate: {
    label: "Affiliate Marketing",
    requiredTier: null,
    requiredAccountType: null, // available to creators and businesses
    upgradeRoute: "/pricing",
    upgradeMessage: "Sign up for a Creator or Business account to access affiliate marketing.",
  },
  creator_hub: {
    label: "Creator Hub",
    requiredTier: null,
    requiredAccountType: "creator",
    upgradeRoute: "/creators",
    upgradeMessage: "Upgrade to Creator to access boost, templates, and sponsorship tools.",
  },
  creator_analytics: {
    label: "Creator Analytics",
    requiredTier: null,
    requiredAccountType: "creator",
    upgradeRoute: "/creators",
    upgradeMessage: "Upgrade to Creator to access detailed content analytics.",
  },
  creator_boost: {
    label: "Post Boost",
    requiredTier: null,
    requiredAccountType: "creator",
    upgradeRoute: "/creators",
    upgradeMessage: "Upgrade to Creator to boost your itineraries with targeted impressions.",
  },
  creator_templates: {
    label: "Template Marketplace",
    requiredTier: null,
    requiredAccountType: "creator",
    upgradeRoute: "/creators",
    upgradeMessage: "Upgrade to Creator to create and sell premium itinerary templates.",
  },
  creator_sponsorships: {
    label: "Sponsorship Inbox",
    requiredTier: null,
    requiredAccountType: "creator",
    upgradeRoute: "/creators",
    upgradeMessage: "Upgrade to Creator to receive brand collaboration opportunities.",
  },
}

// ─── Tier Hierarchy ──────────────────────────────────────────
// Used by meetsMinimumTier() to compare tiers.
const TIER_RANK: Record<BusinessTierSlug, number> = {
  basic: 0,
  premium: 1,
  enterprise: 2,
}

/** Returns true if `actual` tier meets or exceeds `required` tier. */
export function meetsMinimumTier(
  actual: BusinessTierSlug,
  required: BusinessTierSlug | null
): boolean {
  if (required === null) return true
  return TIER_RANK[actual] >= TIER_RANK[required]
}

// ─── Custom Pricing Overrides ────────────────────────────────
// Per-business price adjustments stored in business_subscriptions.
// Allows discounted rates for early adopters, partnerships, etc.

export interface PricingOverride {
  /** Custom monthly price (null = use standard tier price) */
  monthlyPrice: number | null
  /** Optional discount label shown to the business ("Early Adopter", "Partner Rate") */
  label: string | null
  /** ISO date: when the override expires (null = permanent) */
  expiresAt: string | null
  /** Reason for the override (internal note, not shown to user) */
  reason: string | null
}

/** Standard tier prices (source of truth from tiers.ts) */
export const STANDARD_PRICES: Record<BusinessTierSlug, number> = {
  basic: 49,
  premium: 149,
  enterprise: 399,
}

/**
 * Returns the effective monthly price for a business, taking any
 * active override into account.
 */
export function getEffectivePrice(
  tier: BusinessTierSlug,
  override: PricingOverride | null | undefined
): { price: number; isOverridden: boolean; label: string | null } {
  if (!override || override.monthlyPrice === null) {
    return { price: STANDARD_PRICES[tier], isOverridden: false, label: null }
  }

  // Check expiry
  if (override.expiresAt && new Date(override.expiresAt) < new Date()) {
    return { price: STANDARD_PRICES[tier], isOverridden: false, label: null }
  }

  return {
    price: override.monthlyPrice,
    isOverridden: true,
    label: override.label,
  }
}

/**
 * Checks whether a gate should block or pass through.
 * When PAYWALL_ENABLED is false, always returns { allowed: true }.
 */
export function checkGate(
  gateId: PaywallGateId,
  context: {
    isAuthenticated: boolean
    accountType: "standard" | "creator" | "business" | null
    businessTier: BusinessTierSlug | null
  }
): { allowed: boolean; gate: PaywallGateConfig } {
  const gate = PAYWALL_GATES[gateId]

  // Bypass mode: everything passes
  if (!PAYWALL_ENABLED) {
    return { allowed: true, gate }
  }

  // Must be logged in
  if (!context.isAuthenticated) {
    return { allowed: false, gate }
  }

  // Account type check
  if (gate.requiredAccountType && context.accountType !== gate.requiredAccountType) {
    // Special case: business accounts also satisfy creator gates
    if (gate.requiredAccountType === "creator" && context.accountType === "business") {
      // business includes creator features — allow
    } else {
      return { allowed: false, gate }
    }
  }

  // Business tier check
  if (gate.requiredTier && context.accountType === "business") {
    const effectiveTier = context.businessTier || "basic"
    if (!meetsMinimumTier(effectiveTier, gate.requiredTier)) {
      return { allowed: false, gate }
    }
  }

  return { allowed: true, gate }
}
