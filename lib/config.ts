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

// Authentication configuration constants
export const AUTH_CONFIG = {
  // Session check interval in milliseconds (default: 60 seconds)
  SESSION_CHECK_INTERVAL: Number(process.env.NEXT_PUBLIC_SESSION_CHECK_INTERVAL) || 60 * 1000,

  // Auto refresh interval in milliseconds (default: 5 minutes)
  AUTO_REFRESH_INTERVAL: Number(process.env.NEXT_PUBLIC_AUTO_REFRESH_INTERVAL) || 5 * 60 * 1000,

  // Session expiry warning time in milliseconds (default: 5 minutes before expiry)
  SESSION_EXPIRY_WARNING: Number(process.env.NEXT_PUBLIC_SESSION_EXPIRY_WARNING) || 5 * 60 * 1000,
}

// Phone verification configuration
export const PHONE_VERIFICATION_CONFIG = {
  // Code expiry time in minutes
  CODE_EXPIRY_MINUTES: Number(process.env.PHONE_CODE_EXPIRY_MINUTES) || 15,

  // Maximum verification attempts
  MAX_VERIFICATION_ATTEMPTS: Number(process.env.PHONE_MAX_ATTEMPTS) || 3,
}
