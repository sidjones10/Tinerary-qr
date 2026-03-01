// Enterprise Business Plan Feature Service
// Handles tier-based access control, limits, and feature flags for business accounts

import type { BusinessTierSlug } from "./tiers"

// ─── Enterprise Tier Limits ─────────────────────────────────────

export interface BusinessTierLimits {
  maxActivePromotions: number | null // null = unlimited
  maxMentionHighlightsPerMonth: number | null // null = unlimited
  maxLocations: number | null // null = unlimited
  maxTeamMembers: number | null // null = unlimited
  maxApiRequestsPerDay: number | null // null = unlimited
  maxImageUploads: number | null // null = unlimited
}

export interface BusinessTierFeatures {
  listingPlacement: "standard" | "featured" | "top-tier"
  hasBadge: boolean
  badgeType: "none" | "verified" | "enterprise"
  hasCustomBrandedProfile: boolean
  brandedProfileOptions: string[]
  analyticsLevel: "basic" | "advanced" | "realtime"
  hasApiAccess: boolean
  supportLevel: "email" | "priority" | "dedicated-manager"
  reportFrequency: "monthly" | "weekly" | "daily"
  hasBookingIntegration: boolean
  hasPriorityBookingPlacement: boolean
  mentionHighlightAllocation: "none" | "limited" | "unlimited"
  includedMentionHighlights: number // 0 for none, -1 for unlimited
  hasCustomAnalyticsDashboard: boolean
  hasRealtimeMetrics: boolean
  hasExportCapability: boolean
  hasWhiteLabelReports: boolean
}

export interface BusinessTierConfig {
  slug: BusinessTierSlug
  limits: BusinessTierLimits
  features: BusinessTierFeatures
}

export const BUSINESS_TIER_CONFIGS: Record<BusinessTierSlug, BusinessTierConfig> = {
  basic: {
    slug: "basic",
    limits: {
      maxActivePromotions: 5,
      maxMentionHighlightsPerMonth: 0,
      maxLocations: 1,
      maxTeamMembers: 2,
      maxApiRequestsPerDay: 0,
      maxImageUploads: 20,
    },
    features: {
      listingPlacement: "standard",
      hasBadge: false,
      badgeType: "none",
      hasCustomBrandedProfile: false,
      brandedProfileOptions: [],
      analyticsLevel: "basic",
      hasApiAccess: false,
      supportLevel: "email",
      reportFrequency: "monthly",
      hasBookingIntegration: false,
      hasPriorityBookingPlacement: false,
      mentionHighlightAllocation: "none",
      includedMentionHighlights: 0,
      hasCustomAnalyticsDashboard: false,
      hasRealtimeMetrics: false,
      hasExportCapability: false,
      hasWhiteLabelReports: false,
    },
  },
  premium: {
    slug: "premium",
    limits: {
      maxActivePromotions: null,
      maxMentionHighlightsPerMonth: 5,
      maxLocations: 5,
      maxTeamMembers: 10,
      maxApiRequestsPerDay: 0,
      maxImageUploads: 100,
    },
    features: {
      listingPlacement: "featured",
      hasBadge: true,
      badgeType: "verified",
      hasCustomBrandedProfile: false,
      brandedProfileOptions: [],
      analyticsLevel: "advanced",
      hasApiAccess: false,
      supportLevel: "priority",
      reportFrequency: "weekly",
      hasBookingIntegration: true,
      hasPriorityBookingPlacement: false,
      mentionHighlightAllocation: "limited",
      includedMentionHighlights: 5,
      hasCustomAnalyticsDashboard: true,
      hasRealtimeMetrics: false,
      hasExportCapability: true,
      hasWhiteLabelReports: false,
    },
  },
  enterprise: {
    slug: "enterprise",
    limits: {
      maxActivePromotions: null,
      maxMentionHighlightsPerMonth: null,
      maxLocations: null,
      maxTeamMembers: null,
      maxApiRequestsPerDay: null,
      maxImageUploads: null,
    },
    features: {
      listingPlacement: "top-tier",
      hasBadge: true,
      badgeType: "enterprise",
      hasCustomBrandedProfile: true,
      brandedProfileOptions: [
        "custom_colors",
        "cover_image",
        "logo_placement",
        "custom_cta_buttons",
        "branded_qr_codes",
        "custom_fonts",
        "video_banner",
      ],
      analyticsLevel: "realtime",
      hasApiAccess: true,
      supportLevel: "dedicated-manager",
      reportFrequency: "daily",
      hasBookingIntegration: true,
      hasPriorityBookingPlacement: true,
      mentionHighlightAllocation: "unlimited",
      includedMentionHighlights: -1,
      hasCustomAnalyticsDashboard: true,
      hasRealtimeMetrics: true,
      hasExportCapability: true,
      hasWhiteLabelReports: true,
    },
  },
}

// ─── Helper Functions ────────────────────────────────────────────

export function getTierConfig(tier: BusinessTierSlug): BusinessTierConfig {
  return BUSINESS_TIER_CONFIGS[tier]
}

export function getTierFeatures(tier: BusinessTierSlug): BusinessTierFeatures {
  return BUSINESS_TIER_CONFIGS[tier].features
}

export function getTierLimits(tier: BusinessTierSlug): BusinessTierLimits {
  return BUSINESS_TIER_CONFIGS[tier].limits
}

export function isEnterprise(tier: BusinessTierSlug): boolean {
  return tier === "enterprise"
}

export function hasFeature(
  tier: BusinessTierSlug,
  feature: keyof BusinessTierFeatures
): boolean {
  const features = getTierFeatures(tier)
  const value = features[feature]
  if (typeof value === "boolean") return value
  if (typeof value === "string") return value !== "none" && value !== "standard" && value !== "basic"
  if (typeof value === "number") return value !== 0
  return false
}

export function isWithinLimit(
  tier: BusinessTierSlug,
  limitKey: keyof BusinessTierLimits,
  currentCount: number
): boolean {
  const limits = getTierLimits(tier)
  const limit = limits[limitKey]
  if (limit === null) return true // unlimited
  return currentCount < limit
}

export function canUseMentionHighlight(
  tier: BusinessTierSlug,
  usedThisMonth: number
): boolean {
  const features = getTierFeatures(tier)
  if (features.includedMentionHighlights === -1) return true // unlimited
  return usedThisMonth < features.includedMentionHighlights
}

// ─── Placement Score Boost ───────────────────────────────────────

export function getPlacementBoost(tier: BusinessTierSlug): number {
  switch (tier) {
    case "enterprise":
      return 2.0 // 2x boost for top-tier placement
    case "premium":
      return 1.5 // 1.5x boost for featured placement
    case "basic":
    default:
      return 1.0 // no boost
  }
}

export function getBookingPlacementPriority(tier: BusinessTierSlug): number {
  switch (tier) {
    case "enterprise":
      return 100 // highest priority
    case "premium":
      return 50
    case "basic":
    default:
      return 0
  }
}

// ─── Enterprise Branding Config ──────────────────────────────────

export interface EnterpriseBrandingConfig {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  coverImageUrl: string | null
  logoUrl: string | null
  logoPosition: "left" | "center" | "right"
  ctaButtonText: string
  ctaButtonUrl: string
  ctaButtonStyle: "solid" | "outline" | "gradient"
  customFontFamily: string | null
  videoBannerUrl: string | null
  showBrandedQrCode: boolean
}

export const DEFAULT_BRANDING_CONFIG: EnterpriseBrandingConfig = {
  primaryColor: "#1a1a2e",
  secondaryColor: "#16213e",
  accentColor: "#e94560",
  coverImageUrl: null,
  logoUrl: null,
  logoPosition: "left",
  ctaButtonText: "Book Now",
  ctaButtonUrl: "",
  ctaButtonStyle: "solid",
  customFontFamily: null,
  videoBannerUrl: null,
  showBrandedQrCode: false,
}

// ─── Account Manager ────────────────────────────────────────────

export interface AccountManager {
  name: string
  email: string
  phone: string | null
  avatarUrl: string | null
  title: string
  availability: string
}

export const ENTERPRISE_ACCOUNT_MANAGERS: AccountManager[] = [
  {
    name: "Sarah Chen",
    email: "sarah.chen@tinerary.com",
    phone: "+1 (415) 555-0142",
    avatarUrl: null,
    title: "Senior Account Manager",
    availability: "Mon-Fri, 8am-6pm PST",
  },
  {
    name: "James Wilson",
    email: "james.wilson@tinerary.com",
    phone: "+1 (415) 555-0187",
    avatarUrl: null,
    title: "Enterprise Account Director",
    availability: "Mon-Fri, 9am-7pm EST",
  },
]

// ─── Performance Report Config ──────────────────────────────────

export interface PerformanceReportConfig {
  frequency: "monthly" | "weekly" | "daily"
  includeMetrics: string[]
  includeCharts: boolean
  includeCompetitorBenchmark: boolean
  includeTrendAnalysis: boolean
  includeRecommendations: boolean
  deliveryMethod: "email" | "dashboard" | "both"
  deliveryTime: string // HH:MM format
}

export function getDefaultReportConfig(tier: BusinessTierSlug): PerformanceReportConfig {
  const features = getTierFeatures(tier)

  return {
    frequency: features.reportFrequency,
    includeMetrics: tier === "enterprise"
      ? ["views", "clicks", "saves", "bookings", "revenue", "ctr", "conversion_rate", "roi", "audience_demographics", "competitor_comparison"]
      : tier === "premium"
      ? ["views", "clicks", "saves", "bookings", "ctr"]
      : ["views", "clicks", "saves"],
    includeCharts: tier !== "basic",
    includeCompetitorBenchmark: tier === "enterprise",
    includeTrendAnalysis: tier === "enterprise",
    includeRecommendations: tier === "enterprise",
    deliveryMethod: tier === "enterprise" ? "both" : "email",
    deliveryTime: "08:00",
  }
}

// ─── API Access Config ──────────────────────────────────────────

export interface ApiAccessConfig {
  enabled: boolean
  rateLimitPerMinute: number
  allowedEndpoints: string[]
  webhooksEnabled: boolean
  maxWebhooks: number
}

export function getApiAccessConfig(tier: BusinessTierSlug): ApiAccessConfig {
  if (tier !== "enterprise") {
    return {
      enabled: false,
      rateLimitPerMinute: 0,
      allowedEndpoints: [],
      webhooksEnabled: false,
      maxWebhooks: 0,
    }
  }

  return {
    enabled: true,
    rateLimitPerMinute: 60,
    allowedEndpoints: [
      "/api/enterprise/analytics",
      "/api/enterprise/reports",
      "/api/enterprise/promotions",
      "/api/enterprise/mentions",
      "/api/enterprise/bookings",
      "/api/enterprise/profile",
      "/api/enterprise/webhooks",
    ],
    webhooksEnabled: true,
    maxWebhooks: 10,
  }
}

