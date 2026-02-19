/**
 * Tests for User Interactions Table
 *
 * Tests validate:
 * - Database schema for user_interactions
 * - API endpoint structure and validation
 * - trackUserInteraction logic (discovery algorithm)
 * - View tracking on event detail page
 * - Feed service uses interactions for recommendations
 */
import { describe, it, expect } from "vitest"
import * as fs from "fs"
import * as path from "path"

const basePath = path.resolve(__dirname, "..")

// ------------------------------------------------------------------
// 1. Database Schema
// ------------------------------------------------------------------
describe("User Interactions – Database Schema", () => {
  const migration = fs.readFileSync(
    path.join(basePath, "supabase/migrations/001_initial_schema.sql"),
    "utf-8"
  )

  it("user_interactions table is defined in initial migration", () => {
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS user_interactions")
  })

  it("has correct interaction_type CHECK constraint", () => {
    expect(migration).toContain(
      "interaction_type IN ('view', 'save', 'like', 'share', 'comment')"
    )
  })

  it("references profiles and itineraries with CASCADE", () => {
    // Extract the CREATE TABLE block for user_interactions
    const tableMatch = migration.match(
      /CREATE TABLE IF NOT EXISTS user_interactions[\s\S]*?\);/
    )
    expect(tableMatch).not.toBeNull()
    const tableDef = tableMatch![0]
    expect(tableDef).toContain("REFERENCES profiles(id) ON DELETE CASCADE")
    expect(tableDef).toContain("REFERENCES itineraries(id) ON DELETE CASCADE")
  })

  it("has performance indexes on user_id and itinerary_id", () => {
    expect(migration).toContain("idx_user_interactions_user_id")
    expect(migration).toContain("idx_user_interactions_itinerary_id")
  })

  it("RLS is enabled on user_interactions", () => {
    expect(migration).toContain(
      "ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY"
    )
  })
})

// ------------------------------------------------------------------
// 2. API Endpoint Structure
// ------------------------------------------------------------------
describe("User Interactions – API Endpoint", () => {
  it("discovery/interaction route file exists", () => {
    expect(
      fs.existsSync(
        path.join(basePath, "app/api/discovery/interaction/route.ts")
      )
    ).toBe(true)
  })

  it("exports a POST handler", async () => {
    const routeModule = await import(
      "../app/api/discovery/interaction/route"
    )
    expect(typeof routeModule.POST).toBe("function")
  })

  it("validates required fields (userId, itineraryId, interactionType)", () => {
    const routeSrc = fs.readFileSync(
      path.join(basePath, "app/api/discovery/interaction/route.ts"),
      "utf-8"
    )
    expect(routeSrc).toContain("userId")
    expect(routeSrc).toContain("itineraryId")
    expect(routeSrc).toContain("interactionType")
    expect(routeSrc).toContain("Missing required fields")
  })

  it("validates interaction type against allowed values", () => {
    const routeSrc = fs.readFileSync(
      path.join(basePath, "app/api/discovery/interaction/route.ts"),
      "utf-8"
    )
    expect(routeSrc).toContain("Invalid interaction type")
    expect(routeSrc).toContain('"view"')
    expect(routeSrc).toContain('"save"')
    expect(routeSrc).toContain('"like"')
    expect(routeSrc).toContain('"share"')
    expect(routeSrc).toContain('"comment"')
  })

  it("ISSUE: endpoint does not authenticate the caller (no auth check)", () => {
    const routeSrc = fs.readFileSync(
      path.join(basePath, "app/api/discovery/interaction/route.ts"),
      "utf-8"
    )
    // The endpoint accepts userId from the body without verifying auth
    // This means anyone can track interactions as any user
    expect(routeSrc).not.toContain("auth.getUser")
    expect(routeSrc).not.toContain("getUser()")
    expect(routeSrc).not.toContain("Unauthorized")
  })
})

// ------------------------------------------------------------------
// 3. Discovery Algorithm – trackUserInteraction
// ------------------------------------------------------------------
describe("User Interactions – trackUserInteraction Function", () => {
  const algoSrc = fs.readFileSync(
    path.join(basePath, "lib/discovery-algorithm.ts"),
    "utf-8"
  )

  it("exports trackUserInteraction function", () => {
    expect(algoSrc).toContain("export async function trackUserInteraction")
  })

  it("handles all five interaction types via RPC", () => {
    expect(algoSrc).toContain("increment_view_count")
    expect(algoSrc).toContain("increment_save_count")
    expect(algoSrc).toContain("increment_like_count")
    expect(algoSrc).toContain("increment_share_count")
    expect(algoSrc).toContain("increment_comment_count")
  })

  it("updates user_behavior table for view/save/like", () => {
    expect(algoSrc).toContain("viewed_itineraries")
    expect(algoSrc).toContain("saved_itineraries")
    expect(algoSrc).toContain("liked_itineraries")
  })

  it("limits viewed_itineraries history to 100 items", () => {
    expect(algoSrc).toContain(".slice(0, 100)")
  })
})

// ------------------------------------------------------------------
// 4. Event Detail View Tracking
// ------------------------------------------------------------------
describe("User Interactions – View Tracking on Event Page", () => {
  it("event detail page tracks views in user_interactions", () => {
    const eventPagePath = path.join(basePath, "app/event/[id]/page.tsx")
    if (fs.existsSync(eventPagePath)) {
      const src = fs.readFileSync(eventPagePath, "utf-8")
      expect(src).toContain("user_interactions")
      expect(src).toContain('interaction_type: "view"')
    }
  })
})

// ------------------------------------------------------------------
// 5. Feed Service Uses Interactions for Recommendations
// ------------------------------------------------------------------
describe("User Interactions – Feed Service Integration", () => {
  it("feed service queries user_interactions for personalization", () => {
    const feedSrc = fs.readFileSync(
      path.join(basePath, "lib/feed-service.ts"),
      "utf-8"
    )
    expect(feedSrc).toContain("user_interactions")
    // Checks that it queries for view/save/like interactions
    expect(feedSrc).toMatch(/interaction_type.*view.*save.*like/)
  })
})

// ------------------------------------------------------------------
// 6. itinerary_metrics table exists for aggregated counts
// ------------------------------------------------------------------
describe("User Interactions – Metrics Table", () => {
  const migration = fs.readFileSync(
    path.join(basePath, "supabase/migrations/001_initial_schema.sql"),
    "utf-8"
  )

  it("itinerary_metrics table exists", () => {
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS itinerary_metrics")
  })

  it("tracks view_count, save_count, like_count, share_count, comment_count", () => {
    expect(migration).toContain("view_count INTEGER DEFAULT 0")
    expect(migration).toContain("save_count INTEGER DEFAULT 0")
    expect(migration).toContain("like_count INTEGER DEFAULT 0")
    expect(migration).toContain("share_count INTEGER DEFAULT 0")
    expect(migration).toContain("comment_count INTEGER DEFAULT 0")
  })

  it("has trending_score for discovery algorithm", () => {
    expect(migration).toContain("trending_score")
  })
})
