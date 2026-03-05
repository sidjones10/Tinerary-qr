/**
 * Phase 2 Feature Flag
 *
 * Set to `true` to enable Phase 2 features for all users.
 * When `false`, Phase 2 pages are hidden from normal users but still
 * accessible to admins (determined by the same admin check used in
 * the admin dashboard: email list + profiles.is_admin / role).
 *
 * Phase 2 features: Explore, Pricing, Mentions, Deals, Business pages
 * & toggles, Creator pages & toggles, Coins, Transactions, Affiliate.
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
  "/explore",
  "/transactions",
  "/affiliate",
  "/mentions",
  "/pricing",
]

/** Returns true if the given path is a Phase 2 route. */
export function isPhase2Route(path: string): boolean {
  return PHASE_2_ROUTES.some((route) => path.startsWith(route))
}
