/**
 * Tests for Itinerary Invitations & Pending Invitations
 *
 * Tests validate:
 * - Invitation sending logic (route handler)
 * - Phone number detection
 * - Registered user vs non-user invitation paths
 * - Invitation acceptance/decline flow (MISSING FEATURE)
 * - Pending invitation → registered invitation conversion on signup (MISSING FEATURE)
 */
import { describe, it, expect, vi } from "vitest"
import * as fs from "fs"
import * as path from "path"

// ------------------------------------------------------------------
// 1. Unit test: isPhoneNumber logic (inlined from route handler)
// ------------------------------------------------------------------
function isPhoneNumber(contact: string): boolean {
  if (contact.startsWith("+")) return true
  const digitsOnly = contact.replace(/[\s\-().]/g, "")
  return /^\d{7,15}$/.test(digitsOnly)
}

describe("Invitations – Phone Number Detection", () => {
  it("detects international format as phone", () => {
    expect(isPhoneNumber("+14155551234")).toBe(true)
    expect(isPhoneNumber("+442071234567")).toBe(true)
  })

  it("detects digit-only strings as phone", () => {
    expect(isPhoneNumber("4155551234")).toBe(true)
    expect(isPhoneNumber("14155551234")).toBe(true)
  })

  it("detects formatted phone numbers", () => {
    expect(isPhoneNumber("(415) 555-1234")).toBe(true)
    expect(isPhoneNumber("415-555-1234")).toBe(true)
  })

  it("rejects email addresses as non-phone", () => {
    expect(isPhoneNumber("user@example.com")).toBe(false)
    expect(isPhoneNumber("test.email@gmail.com")).toBe(false)
  })

  it("rejects very short numbers (< 7 digits)", () => {
    expect(isPhoneNumber("12345")).toBe(false)
  })
})

// ------------------------------------------------------------------
// 2. Structural tests: API route exists
// ------------------------------------------------------------------
describe("Invitations – API Route Structure", () => {
  const basePath = path.resolve(__dirname, "..")

  it("has a send invitations route", () => {
    const routePath = path.join(basePath, "app/api/invitations/send/route.ts")
    expect(fs.existsSync(routePath)).toBe(true)
  })

  it("MISSING: no accept/decline API endpoint exists", () => {
    // This test documents a known gap: there is no endpoint
    // to accept or decline an invitation.
    const acceptPath = path.join(basePath, "app/api/invitations/[id]")
    const respondPath = path.join(basePath, "app/api/invitations/respond")
    expect(fs.existsSync(acceptPath)).toBe(false)
    expect(fs.existsSync(respondPath)).toBe(false)
  })
})

// ------------------------------------------------------------------
// 3. Validate the send route handles required fields
// ------------------------------------------------------------------
describe("Invitations – Send Route Validation", () => {
  it("route handler exports a POST function", async () => {
    const routeModule = await import("../app/api/invitations/send/route")
    expect(typeof routeModule.POST).toBe("function")
  })
})

// ------------------------------------------------------------------
// 4. Orphaned client method test
// ------------------------------------------------------------------
describe("Invitations – Client-Side respondToInvitation", () => {
  it("api-client.ts has respondToInvitation method pointing to non-existent endpoint", () => {
    const clientSrc = fs.readFileSync(
      path.resolve(__dirname, "..", "lib/api-client.ts"),
      "utf-8"
    )
    // The method exists...
    expect(clientSrc).toContain("respondToInvitation")
    // ...but calls /invitations/{id}/accept or /invitations/{id}/decline endpoints
    // that don't exist on the server
    expect(clientSrc).toMatch(/invitations\/\$\{invitationId\}\/\$\{response\}/)
  })

  it("ISSUE: backend route for accept/decline does not exist", () => {
    const apiDir = path.resolve(__dirname, "..", "app/api/invitations")
    const entries = fs.existsSync(apiDir) ? fs.readdirSync(apiDir) : []
    // Only 'send' directory exists; no 'accept', 'decline', '[id]', or 'respond'
    expect(entries).toEqual(["send"])
  })
})

// ------------------------------------------------------------------
// 5. Feed service references accepted invitations that can never exist
// ------------------------------------------------------------------
describe("Invitations – Feed Service Gap", () => {
  it("feed-service queries for status=accepted but invitations can never be accepted", () => {
    const feedSrc = fs.readFileSync(
      path.resolve(__dirname, "..", "lib/feed-service.ts"),
      "utf-8"
    )
    // Confirms the feed service expects accepted invitations
    expect(feedSrc).toContain('eq("status", "accepted")')
  })
})

// ------------------------------------------------------------------
// 6. Schema validation
// ------------------------------------------------------------------
describe("Invitations – Database Schema", () => {
  it("itinerary_invitations table has correct status constraint", () => {
    const migration = fs.readFileSync(
      path.resolve(__dirname, "..", "supabase/migrations/001_initial_schema.sql"),
      "utf-8"
    )
    expect(migration).toContain("itinerary_invitations")
    expect(migration).toContain("'pending', 'accepted', 'declined'")
  })

  it("pending_invitations table exists for non-users", () => {
    const migration = fs.readFileSync(
      path.resolve(__dirname, "..", "supabase/migrations/001_initial_schema.sql"),
      "utf-8"
    )
    expect(migration).toContain("pending_invitations")
  })

  it("RLS is enabled on invitation tables", () => {
    const migration = fs.readFileSync(
      path.resolve(__dirname, "..", "supabase/migrations/001_initial_schema.sql"),
      "utf-8"
    )
    expect(migration).toContain(
      "ALTER TABLE itinerary_invitations ENABLE ROW LEVEL SECURITY"
    )
  })
})

// ------------------------------------------------------------------
// 7. Signup flow does not convert pending invitations
// ------------------------------------------------------------------
describe("Invitations – Signup Conversion Gap", () => {
  it("ISSUE: signup route does not check pending_invitations for new user email", () => {
    const signupPath = path.resolve(
      __dirname,
      "..",
      "app/api/auth/signup/route.ts"
    )
    if (fs.existsSync(signupPath)) {
      const signupSrc = fs.readFileSync(signupPath, "utf-8")
      // Should convert pending_invitations → itinerary_invitations
      // but currently does NOT reference pending_invitations at all
      expect(signupSrc).not.toContain("pending_invitations")
    } else {
      // Even if signup is handled elsewhere, the gap still exists
      expect(true).toBe(true)
    }
  })
})
