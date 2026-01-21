// Application configuration
import { getSiteUrl } from "./env-validation"

/**
 * Get application configuration
 * Uses validated environment variables with safe fallbacks
 */
export function getConfig() {
  const siteUrl = getSiteUrl()

  return {
    // Base URLs
    appUrl: siteUrl,
    apiUrl: `${siteUrl}/api`,

    // Feature flags
    features: {
      phoneVerification: true,
      socialSharing: true,
      notifications: true,
    },

    // Default settings
    defaults: {
      currency: "USD",
      locale: "en-US",
      timezone: "America/Los_Angeles",
    },
  }
}

// Export a default config instance for backward compatibility
// Note: This uses getters so URLs are always fresh
export const config = {
  get appUrl() {
    return getSiteUrl()
  },
  get apiUrl() {
    return `${getSiteUrl()}/api`
  },
  features: {
    phoneVerification: true,
    socialSharing: true,
    notifications: true,
  },
  defaults: {
    currency: "USD",
    locale: "en-US",
    timezone: "America/Los_Angeles",
  },
}
