// Tinerary Revenue Model v3 — Tier Definitions, Pricing & Coins
// All data sourced from Revenue Model & Growth Protection Strategy v3.0

import type { BusinessTierConfig } from "./enterprise"

// ─── Platform User Tiers ───────────────────────────────────────

export type UserTierSlug = "user" | "creator" | "business"

export interface UserTier {
  slug: UserTierSlug
  name: string
  price: string
  priceSuffix: string
  description: string
  features: string[]
}

export const USER_TIERS: UserTier[] = [
  {
    slug: "user",
    name: "User",
    price: "Free",
    priceSuffix: "forever",
    description: "Everything you need to plan, share, and discover travel.",
    features: [
      "Unlimited itineraries (public or private)",
      "Unlimited collaborators",
      "Full discovery feed access",
      "Expense tracking & splitting",
      "Packing lists with product links",
      "Earn Tinerary Coins",
      "Tinerary Shop access",
      "Affiliate link sharing",
      "Community features (public posts)",
    ],
  },
  {
    slug: "creator",
    name: "Creator",
    price: "$49",
    priceSuffix: "per month",
    description:
      "Grow your audience, boost your content, and earn more as a travel creator.",
    features: [
      "Everything in User, plus:",
      "Boost individual posts",
      "Creator badge & verified profile",
      "Analytics dashboard",
      "Enhanced affiliate commissions (70/30)",
      "Priority in discovery feed",
      "Sell itinerary templates",
      "Sponsorship inbox",
      "Business-lite listing tools",
      "2x coin earning rate",
    ],
  },
  {
    slug: "business",
    name: "Business",
    price: "$49–$399",
    priceSuffix: "per month (tiered)",
    description:
      "Reach travelers at the moment they're planning with promotions, booking, and analytics.",
    features: [
      "Full business profile & branding",
      "Promotion listings",
      "Booking integration",
      "Organic Mention Highlights",
      "Advanced analytics + API",
      "Customer insights",
      "Multi-location support",
      "Dedicated support (Enterprise)",
      "QR code ticketing",
      "Revenue & commission reports",
    ],
  },
]

// ─── Business Advertising Subscription Tiers ───────────────────

export type BusinessTierSlug = "basic" | "premium" | "enterprise"

export interface BusinessTier {
  slug: BusinessTierSlug
  name: string
  price: number
  priceSuffix: string
  highlighted?: boolean
  features: string[]
}

export const BUSINESS_TIERS: BusinessTier[] = [
  {
    slug: "basic",
    name: "Basic",
    price: 49,
    priceSuffix: "per month",
    features: [
      "Standard listing placement",
      "Business profile page",
      "Up to 5 active promotions",
      "Basic analytics dashboard",
      "Email support",
      "Monthly performance report",
    ],
  },
  {
    slug: "premium",
    name: "Premium",
    price: 149,
    priceSuffix: "per month",
    highlighted: true,
    features: [
      "Featured placement in feeds",
      "Enhanced business profile",
      "Unlimited promotions",
      "Advanced analytics + insights",
      "Priority support",
      "Weekly performance reports",
      "Booking integration",
      "Mention Highlights (5/mo included)",
    ],
  },
  {
    slug: "enterprise",
    name: "Enterprise",
    price: 399,
    priceSuffix: "per month",
    features: [
      "Top-tier placement + enterprise badge",
      "Custom branded profile (colors, cover, logo, CTA, video banner)",
      "Unlimited promotions, locations, team members & uploads",
      "Real-time analytics dashboard + full API access",
      "Dedicated account manager with direct contact",
      "Daily performance reports with trend analysis",
      "Priority booking placement in all feeds",
      "Unlimited Mention Highlights (auto-highlight all)",
      "White-label report exports (CSV, PDF, JSON)",
      "Webhook integrations (up to 10)",
      "Competitor benchmarking & recommendations",
    ],
  },
]

// ─── Enterprise Feature Comparison (for /business page) ─────────

export interface FeatureComparison {
  feature: string
  basic: string
  premium: string
  enterprise: string
  category: "placement" | "profile" | "analytics" | "support" | "mentions" | "booking" | "limits"
}

export const ENTERPRISE_FEATURE_COMPARISON: FeatureComparison[] = [
  { feature: "Listing placement", basic: "Standard", premium: "Featured", enterprise: "Top-tier + enterprise badge", category: "placement" },
  { feature: "Profile badge", basic: "\u2014", premium: "Verified", enterprise: "Enterprise badge", category: "placement" },
  { feature: "Active promotions", basic: "Up to 5", premium: "Unlimited", enterprise: "Unlimited", category: "limits" },
  { feature: "Business locations", basic: "1", premium: "Up to 5", enterprise: "Unlimited", category: "limits" },
  { feature: "Team members", basic: "2", premium: "10", enterprise: "Unlimited", category: "limits" },
  { feature: "Custom branded profile", basic: "\u2014", premium: "\u2014", enterprise: "\u2713 Full branding suite", category: "profile" },
  { feature: "Analytics", basic: "Basic dashboard", premium: "Advanced + insights", enterprise: "Real-time + API access", category: "analytics" },
  { feature: "API access", basic: "\u2014", premium: "\u2014", enterprise: "\u2713 Full REST API", category: "analytics" },
  { feature: "Support", basic: "Email", premium: "Priority", enterprise: "Dedicated account manager", category: "support" },
  { feature: "Performance reports", basic: "Monthly", premium: "Weekly", enterprise: "Daily + trend analysis", category: "analytics" },
  { feature: "Report exports", basic: "\u2014", premium: "CSV", enterprise: "CSV, PDF, JSON (white-label)", category: "analytics" },
  { feature: "Booking integration", basic: "\u2014", premium: "\u2713", enterprise: "\u2713 Priority placement", category: "booking" },
  { feature: "Mention Highlights", basic: "\u2014", premium: "5/mo included", enterprise: "Unlimited (auto-highlight)", category: "mentions" },
  { feature: "Webhook integrations", basic: "\u2014", premium: "\u2014", enterprise: "Up to 10", category: "analytics" },
  { feature: "Competitor benchmarking", basic: "\u2014", premium: "\u2014", enterprise: "\u2713", category: "analytics" },
]

// ─── Creator Post Boost Pricing ────────────────────────────────

export interface BoostPackage {
  name: string
  price: number
  impressions: string
  duration: string
  costPer1K: string
}

export const BOOST_PACKAGES: BoostPackage[] = [
  {
    name: "Starter",
    price: 5,
    impressions: "~1,000",
    duration: "24 hours",
    costPer1K: "$5.00",
  },
  {
    name: "Growth",
    price: 15,
    impressions: "~5,000",
    duration: "3 days",
    costPer1K: "$3.00",
  },
  {
    name: "Amplify",
    price: 40,
    impressions: "~15,000",
    duration: "7 days",
    costPer1K: "$2.67",
  },
  {
    name: "Mega",
    price: 100,
    impressions: "~50,000",
    duration: "14 days",
    costPer1K: "$2.00",
  },
]

// ─── Organic Mention Highlight Pricing ─────────────────────────

export interface MentionHighlight {
  name: string
  price: number
  duration: string
  includes: string
}

export const MENTION_HIGHLIGHTS: MentionHighlight[] = [
  {
    name: "Single Mention",
    price: 10,
    duration: "30 days",
    includes: "Badge + booking link on 1 itinerary",
  },
  {
    name: "Bundle (5 mentions)",
    price: 40,
    duration: "30 days",
    includes: "Badge + booking link on 5 itineraries",
  },
  {
    name: "Monthly Unlimited",
    price: 99,
    duration: "30 days",
    includes: "Auto-highlight all new mentions",
  },
  {
    name: "Annual Unlimited",
    price: 899,
    duration: "12 months",
    includes: "All mentions + priority notification",
  },
]

// ─── Tinerary Coins — Earning Actions ──────────────────────────

export interface CoinAction {
  action: string
  coins: number
  reason: string
}

export const COIN_EARNING_ACTIONS: CoinAction[] = [
  {
    action: "Publish a public itinerary",
    coins: 50,
    reason: "Adds content to discovery feed",
  },
  {
    action: "Itinerary gets 10+ views",
    coins: 25,
    reason: "Rewards quality content",
  },
  {
    action: "Itinerary gets saved by others",
    coins: 15,
    reason: "Signals high-value content",
  },
  {
    action: "Leave a review on a business",
    coins: 10,
    reason: "Builds trust layer for businesses",
  },
  {
    action: "Refer a new user who signs up",
    coins: 100,
    reason: "Direct growth driver",
  },
  {
    action: "Complete a booking",
    coins: 20,
    reason: "Drives transaction revenue",
  },
  {
    action: "Share itinerary to social media",
    coins: 10,
    reason: "Expands reach beyond platform",
  },
  {
    action: "Add 5+ activities to an itinerary",
    coins: 15,
    reason: "Creates richer, more useful content",
  },
  {
    action: "First itinerary ever created",
    coins: 75,
    reason: "Onboarding milestone reward",
  },
]

// ─── Tinerary Coins — Spending / Rewards ───────────────────────

export interface CoinReward {
  reward: string
  cost: number
  details: string
}

export const COIN_SPENDING_REWARDS: CoinReward[] = [
  {
    reward: "Tinerary Shop discount (10%)",
    cost: 200,
    details: "Applies to any Shop product",
  },
  {
    reward: "Tinerary Shop discount (25%)",
    cost: 500,
    details: "Applies to any Shop product",
  },
  {
    reward: "Free shipping on Shop order",
    cost: 150,
    details: "Domestic orders only",
  },
  {
    reward: "Exclusive itinerary templates",
    cost: 100,
    details: "Premium templates from Creators",
  },
  {
    reward: "Custom cover photo for itinerary",
    cost: 50,
    details: "AI-generated or curated options",
  },
  {
    reward: "Profile badge (Traveler, Explorer, etc.)",
    cost: 300,
    details: "Visible on profile and posts",
  },
  {
    reward: "Early access to new features",
    cost: 250,
    details: "Beta feature previews",
  },
  {
    reward: "Single post boost (mini)",
    cost: 400,
    details: "~500 impressions, 12-hour boost",
  },
]

// ─── Affiliate Commission Splits ───────────────────────────────

export interface AffiliateCommission {
  userType: string
  userShare: string
  tineraryShare: string
}

export const AFFILIATE_COMMISSIONS: AffiliateCommission[] = [
  { userType: "Standard User", userShare: "60%", tineraryShare: "40%" },
  { userType: "Creator", userShare: "70%", tineraryShare: "30%" },
]

// ─── Tinerary Shop Product Categories ──────────────────────────

export interface ShopCategory {
  category: string
  examples: string
  priceRange: string
  margin: string
}

export const SHOP_CATEGORIES: ShopCategory[] = [
  {
    category: "Travel Journals & Planners",
    examples:
      "Tinerary-branded linen journals, trip planning notebooks, memory books",
    priceRange: "$18–$35",
    margin: "60–70%",
  },
  {
    category: "Curated Travel Books",
    examples:
      "City guides, coffee table books, indie travel writing, curated reading lists",
    priceRange: "$15–$45",
    margin: "40–50%",
  },
  {
    category: "Artisanal Travel Gear",
    examples:
      "Leather passport holders, custom luggage tags, packing cubes, dopp kits",
    priceRange: "$25–$75",
    margin: "50–65%",
  },
  {
    category: "Aesthetic Accessories",
    examples:
      "Travel candles, destination-scented items, map prints, travel tokens",
    priceRange: "$12–$40",
    margin: "55–70%",
  },
  {
    category: "Tech Travel Essentials",
    examples:
      "Curated portable chargers, adapters, AirTag holders, cable organizers",
    priceRange: "$20–$60",
    margin: "35–50%",
  },
  {
    category: "Tinerary Originals",
    examples: "Branded apparel, tote bags, water bottles, sticker packs",
    priceRange: "$8–$50",
    margin: "65–80%",
  },
]
