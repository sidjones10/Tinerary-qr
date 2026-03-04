/**
 * Phase 2 Feature Flag
 *
 * Set to `true` to enable Phase 2 features for all users.
 * When `false`, Phase 2 pages are hidden from normal users but still
 * accessible to admins (determined by the same admin check used in
 * the admin dashboard: email list + profiles.is_admin / role).
 *
 * Phase 2 features: Events page, Deals, Business pages & toggles,
 * Creator pages & toggles, Coins.
 */
export const PHASE_2_ENABLED = false

/** Routes that are gated behind the Phase 2 flag. */
export const PHASE_2_ROUTES = [
  "/coins",
  "/deals",
  "/business",
  "/business-profile",
  "/business-onboarding",
  "/business-analytics",
  "/creator",
  "/creators",
]
