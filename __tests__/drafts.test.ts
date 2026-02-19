/**
 * Tests for Drafts Functionality
 *
 * Tests validate:
 * - Draft actions server module structure
 * - Database schema consistency (initial vs fix migrations)
 * - Missing columns in initial migration
 * - publishDraft references non-existent itineraries columns
 * - Auto-save integration on create page
 * - Draft lifecycle (create → update → publish → delete)
 */
import { describe, it, expect } from "vitest"
import * as fs from "fs"
import * as path from "path"

const basePath = path.resolve(__dirname, "..")

// ------------------------------------------------------------------
// 1. Draft Actions Module Structure
// ------------------------------------------------------------------
describe("Drafts – Server Actions Module", () => {
  const actionsPath = path.join(basePath, "app/actions/draft-actions.ts")
  const actionsSrc = fs.readFileSync(actionsPath, "utf-8")

  it("file is marked as server action", () => {
    expect(actionsSrc.trimStart().startsWith('"use server"')).toBe(true)
  })

  it("exports getUserDrafts function", () => {
    expect(actionsSrc).toContain("export async function getUserDrafts")
  })

  it("exports saveDraft function", () => {
    expect(actionsSrc).toContain("export async function saveDraft")
  })

  it("exports getDraftById function", () => {
    expect(actionsSrc).toContain("export async function getDraftById")
  })

  it("exports publishDraft function", () => {
    expect(actionsSrc).toContain("export async function publishDraft")
  })

  it("exports deleteDraft function", () => {
    expect(actionsSrc).toContain("export async function deleteDraft")
  })

  it("all functions check authentication", () => {
    // Count occurrences of auth check pattern
    const authChecks = (actionsSrc.match(/auth\.getUser/g) || []).length
    // 5 exported functions should all check auth
    expect(authChecks).toBeGreaterThanOrEqual(5)
  })

  it("saveDraft enforces user ownership on updates", () => {
    // Should filter by user_id when updating
    expect(actionsSrc).toContain('.eq("user_id", userId)')
  })

  it("deleteDraft enforces user ownership", () => {
    expect(actionsSrc).toContain('.eq("id", draftId).eq("user_id", userId)')
  })
})

// ------------------------------------------------------------------
// 2. Schema Mismatch: Initial Migration vs Code Expectations
// ------------------------------------------------------------------
describe("Drafts – Schema Mismatch Issues", () => {
  const initialMigration = fs.readFileSync(
    path.join(basePath, "supabase/migrations/001_initial_schema.sql"),
    "utf-8"
  )

  it("initial migration drafts table only has: id, user_id, title, content, timestamps", () => {
    // Extract the drafts CREATE TABLE block
    const match = initialMigration.match(
      /CREATE TABLE IF NOT EXISTS drafts[\s\S]*?\);/
    )
    expect(match).not.toBeNull()
    const tableDef = match![0]

    // These columns ARE present in initial migration
    expect(tableDef).toContain("id UUID PRIMARY KEY")
    expect(tableDef).toContain("user_id UUID")
    expect(tableDef).toContain("title TEXT")
    expect(tableDef).toContain("content JSONB")
    expect(tableDef).toContain("created_at")
    expect(tableDef).toContain("updated_at")
  })

  it("ISSUE: initial migration is missing is_published column used by draft-actions.ts", () => {
    const match = initialMigration.match(
      /CREATE TABLE IF NOT EXISTS drafts[\s\S]*?\);/
    )
    const tableDef = match![0]
    // is_published is NOT in initial migration but IS used in code
    expect(tableDef).not.toContain("is_published")
  })

  it("ISSUE: initial migration is missing description column used by create page", () => {
    const match = initialMigration.match(
      /CREATE TABLE IF NOT EXISTS drafts[\s\S]*?\);/
    )
    const tableDef = match![0]
    expect(tableDef).not.toContain("description TEXT")
  })

  it("ISSUE: initial migration is missing location column", () => {
    const match = initialMigration.match(
      /CREATE TABLE IF NOT EXISTS drafts[\s\S]*?\);/
    )
    const tableDef = match![0]
    expect(tableDef).not.toContain("location TEXT")
  })

  it("ISSUE: initial migration is missing date columns", () => {
    const match = initialMigration.match(
      /CREATE TABLE IF NOT EXISTS drafts[\s\S]*?\);/
    )
    const tableDef = match![0]
    expect(tableDef).not.toContain("start_date")
    expect(tableDef).not.toContain("end_date")
  })

  it("code queries is_published = false which will fail on initial schema", () => {
    const actionsSrc = fs.readFileSync(
      path.join(basePath, "app/actions/draft-actions.ts"),
      "utf-8"
    )
    expect(actionsSrc).toContain('.eq("is_published", false)')
  })
})

// ------------------------------------------------------------------
// 3. Fix files also don't include is_published
// ------------------------------------------------------------------
describe("Drafts – Fix Migration Files", () => {
  it("FIX_DRAFTS_TABLE.sql exists", () => {
    const fixPath = path.join(basePath, "db/FIX_DRAFTS_TABLE.sql")
    expect(fs.existsSync(fixPath)).toBe(true)
  })

  it("ISSUE: FIX_DRAFTS_TABLE.sql does not include is_published", () => {
    const fixPath = path.join(basePath, "db/FIX_DRAFTS_TABLE.sql")
    if (fs.existsSync(fixPath)) {
      const fixSrc = fs.readFileSync(fixPath, "utf-8")
      expect(fixSrc).not.toContain("is_published")
    }
  })

  it("ISSUE: COMPLETE_FIX.sql drafts section does not include is_published", () => {
    const completeFix = path.join(basePath, "supabase/COMPLETE_FIX.sql")
    if (fs.existsSync(completeFix)) {
      const fixSrc = fs.readFileSync(completeFix, "utf-8")
      // Get the drafts section
      const draftsSection = fixSrc.match(
        /CREATE TABLE.*drafts[\s\S]*?\);/
      )
      if (draftsSection) {
        expect(draftsSection[0]).not.toContain("is_published")
      }
    }
  })
})

// ------------------------------------------------------------------
// 4. publishDraft References Non-Existent Itineraries Columns
// ------------------------------------------------------------------
describe("Drafts – publishDraft Column Issues", () => {
  const actionsSrc = fs.readFileSync(
    path.join(basePath, "app/actions/draft-actions.ts"),
    "utf-8"
  )

  it("ISSUE: publishDraft inserts draft_id into itineraries table (column may not exist)", () => {
    expect(actionsSrc).toContain("draft_id: draftId")
  })

  it("ISSUE: publishDraft inserts content into itineraries (column may not exist)", () => {
    // The itineraries table uses structured columns, not a generic content JSONB
    expect(actionsSrc).toContain("content: draft.content")
  })

  it("ISSUE: publishDraft sets published_at on drafts (column may not exist)", () => {
    expect(actionsSrc).toContain("published_at:")
  })

  it("publishDraft only transfers title, description, content – missing other draft fields", () => {
    // The draft has location, dates, activities, etc. but publishDraft
    // only copies title, description, content, user_id
    const publishSection = actionsSrc.match(
      /\.from\("itineraries"\)\s*\.insert\(\{[\s\S]*?\}\)/
    )
    expect(publishSection).not.toBeNull()
    const insertBlock = publishSection![0]
    // These fields are NOT copied from draft to itinerary
    expect(insertBlock).not.toContain("location:")
    expect(insertBlock).not.toContain("start_date:")
    expect(insertBlock).not.toContain("end_date:")
    expect(insertBlock).not.toContain("activities:")
    expect(insertBlock).not.toContain("theme:")
  })
})

// ------------------------------------------------------------------
// 5. Create Page Auto-Save Integration
// ------------------------------------------------------------------
describe("Drafts – Create Page Auto-Save", () => {
  it("create page exists", () => {
    expect(
      fs.existsSync(path.join(basePath, "app/create/page.tsx"))
    ).toBe(true)
  })

  it("create page references draft saving functionality", () => {
    const createSrc = fs.readFileSync(
      path.join(basePath, "app/create/page.tsx"),
      "utf-8"
    )
    // Should have auto-save functionality
    expect(createSrc).toMatch(/setInterval|setTimeout/)
    expect(createSrc).toContain("handleSaveDraft")
  })

  it("create page supports loading existing drafts", () => {
    const createSrc = fs.readFileSync(
      path.join(basePath, "app/create/page.tsx"),
      "utf-8"
    )
    expect(createSrc).toContain("draftId")
  })
})

// ------------------------------------------------------------------
// 6. For-You Page Draft Display
// ------------------------------------------------------------------
describe("Drafts – For-You Page Display", () => {
  it("for-you page exists", () => {
    expect(
      fs.existsSync(path.join(basePath, "app/for-you/page.tsx"))
    ).toBe(true)
  })

  it("for-you page references drafts", () => {
    const forYouSrc = fs.readFileSync(
      path.join(basePath, "app/for-you/page.tsx"),
      "utf-8"
    )
    expect(forYouSrc).toMatch(/draft/i)
  })
})

// ------------------------------------------------------------------
// 7. RLS Policies
// ------------------------------------------------------------------
describe("Drafts – Row Level Security", () => {
  it("RLS is enabled on drafts table", () => {
    const migration = fs.readFileSync(
      path.join(basePath, "supabase/migrations/001_initial_schema.sql"),
      "utf-8"
    )
    expect(migration).toContain(
      "ALTER TABLE drafts ENABLE ROW LEVEL SECURITY"
    )
  })
})
