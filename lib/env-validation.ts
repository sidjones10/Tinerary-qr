/**
 * Environment variable validation
 * Validates required environment variables at startup
 */

export interface EnvConfig {
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  NEXT_PUBLIC_SITE_URL?: string
  NEXT_PUBLIC_APP_URL?: string
}

/**
 * Validates and returns environment variables
 * Throws an error if required variables are missing
 */
export function validateEnv(): EnvConfig {
  const requiredVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ] as const

  const missingVars: string[] = []

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName)
    }
  }

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}\n` +
        "Please check your .env.local file and ensure all required variables are set."
    )
  }

  // Warn about optional but recommended variables
  const optionalVars = [
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_APP_URL",
  ] as const

  const missingOptional: string[] = []

  for (const varName of optionalVars) {
    if (!process.env[varName]) {
      missingOptional.push(varName)
    }
  }

  if (missingOptional.length > 0 && typeof console !== "undefined") {
    console.warn(
      `Warning: Optional environment variables not set: ${missingOptional.join(", ")}\n` +
        "Some features may use fallback values. Set these in production for proper functionality."
    )
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  }
}

/**
 * Gets the validated environment configuration
 * Safe to call multiple times - validation only runs once
 */
let cachedEnv: EnvConfig | null = null

export function getEnv(): EnvConfig {
  if (!cachedEnv) {
    cachedEnv = validateEnv()
  }
  return cachedEnv
}

/**
 * Get site URL with validation
 * Falls back to window.location.origin in browser if not set
 */
export function getSiteUrl(): string {
  const env = getEnv()

  if (env.NEXT_PUBLIC_SITE_URL) {
    return env.NEXT_PUBLIC_SITE_URL
  }

  if (env.NEXT_PUBLIC_APP_URL) {
    return env.NEXT_PUBLIC_APP_URL
  }

  if (typeof window !== "undefined") {
    return window.location.origin
  }

  throw new Error(
    "NEXT_PUBLIC_SITE_URL or NEXT_PUBLIC_APP_URL must be set in environment variables for server-side operations"
  )
}
