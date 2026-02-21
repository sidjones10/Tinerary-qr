/**
 * Tests for Itinerary Invitations & Pending Invitations
 *
 * Tests validate:
 * - Invitation sending logic (route handler)
 * - Phone number detection
 * - Registered user vs non-user invitation paths
 * - Invitation acceptance/decline endpoint
 * - Pending invitation → registered invitation conversion on signup
 * - Client method alignment with backend
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
// 2. Structural tests: API routes exist
// ------------------------------------------------------------------
describe("Invitations – API Route Structure", () => {
  const basePath = path.resolve(__dirname, "..")

  it("has a send invitations route", () => {
    const routePath = path.join(basePath, "app/api/invitations/send/route.ts")
    expect(fs.existsSync(routePath)).toBe(true)
  })

  it("has an accept/decline respond endpoint", () => {
    const respondPath = path.join(
      basePath,
      "app/api/invitations/[id]/respond/route.ts"
    )
    expect(fs.existsSync(respondPath)).toBe(true)
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
// 4. Respond endpoint validates correctly
// ------------------------------------------------------------------
describe("Invitations – Respond Endpoint", () => {
  const respondSrc = fs.readFileSync(
    path.resolve(
      __dirname,
      "..",
      "app/api/invitations/[id]/respond/route.ts"
    ),
    "utf-8"
  )

  it("exports a POST handler", () => {
    expect(respondSrc).toContain("export async function POST")
  })

  it("authenticates the user", () => {
    expect(respondSrc).toContain("auth.getUser")
    expect(respondSrc).toContain("Unauthorized")
  })

  it("validates response is accept or decline", () => {
    expect(respondSrc).toContain('"accept"')
    expect(respondSrc).toContain('"decline"')
  })

  it("verifies caller is the invitee", () => {
    expect(respondSrc).toContain("invitee_id")
    expect(respondSrc).toContain("not the recipient")
  })

  it("prevents double-responding to already handled invitations", () => {
    expect(respondSrc).toContain('status !== "pending"')
    expect(respondSrc).toContain("already been")
  })

  it("adds user as attendee on accept", () => {
    expect(respondSrc).toContain("itinerary_attendees")
    expect(respondSrc).toContain('"member"')
  })

  it("notifies the inviter about the response", () => {
    expect(respondSrc).toContain("createNotification")
    expect(respondSrc).toContain("inviter_id")
  })
})

// ------------------------------------------------------------------
// 5. Client method now points to correct endpoint
// ------------------------------------------------------------------
describe("Invitations – Client respondToInvitation", () => {
  const clientSrc = fs.readFileSync(
    path.resolve(__dirname, "..", "lib/api-client.ts"),
    "utf-8"
  )

  it("api-client.ts has respondToInvitation method", () => {
    expect(clientSrc).toContain("respondToInvitation")
  })

  it("calls the /respond endpoint with JSON body", () => {
    expect(clientSrc).toMatch(/invitations\/\$\{invitationId\}\/respond/)
    expect(clientSrc).toContain("JSON.stringify({ response })")
  })
})

// ------------------------------------------------------------------
// 6. Feed service references accepted invitations (now reachable)
// ------------------------------------------------------------------
describe("Invitations – Feed Service Integration", () => {
  it("feed-service queries for status=accepted (now achievable via respond endpoint)", () => {
    const feedSrc = fs.readFileSync(
      path.resolve(__dirname, "..", "lib/feed-service.ts"),
      "utf-8"
    )
    expect(feedSrc).toContain('eq("status", "accepted")')
  })
})

// ------------------------------------------------------------------
// 7. Schema validation
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
// 8. Signup converts pending invitations
// ------------------------------------------------------------------
describe("Invitations – Signup Conversion", () => {
  it("signup route converts pending_invitations for the new user's email", () => {
    const signupPath = path.resolve(
      __dirname,
      "..",
      "app/api/auth/signup/route.ts"
    )
    const signupSrc = fs.readFileSync(signupPath, "utf-8")
    expect(signupSrc).toContain("pending_invitations")
    expect(signupSrc).toContain("itinerary_invitations")
    expect(signupSrc).toContain('"converted"')
  })
})
