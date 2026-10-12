import { NextResponse } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient, createServiceRoleClient } from "@/lib/supabase/server"

/**
 * Result of an admin authorization check.
 *
 * On failure `response` holds the NextResponse to return immediately.
 * On success `user` and `adminClient` are populated.
 */
export type RequireAdminResult =
  | { ok: false; response: NextResponse }
  | {
      ok: true
      user: { id: string; email: string | null }
      /** Service-role client — bypasses RLS. Only reachable after the admin check passes. */
      adminClient: SupabaseClient<any, "public", any>
    }

/**
 * Authenticate the caller and verify they are an admin.
 *
 * Every route that touches the service-role key must call this first.
 * Admin status is read from the database (`profiles.is_admin` / `profiles.role`),
 * never from a client-supplied header or a trusted-email header.
 *
 * Usage:
 *   const auth = await requireAdmin()
 *   if (!auth.ok) return auth.response
 *   const { adminClient, user } = auth
 */
export async function requireAdmin(): Promise<RequireAdminResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Authentication required" }, { status: 401 }),
    }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, role")
    .eq("id", user.id)
    .single()

  const isAdmin = profile?.is_admin === true || profile?.role === "admin"

  if (!isAdmin) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Admin access required" }, { status: 403 }),
    }
  }

  let adminClient: SupabaseClient<any, "public", any>
  try {
    adminClient = createServiceRoleClient()
  } catch {
    // SUPABASE_SERVICE_ROLE_KEY missing — never leak the reason to the caller.
    console.error("requireAdmin: SUPABASE_SERVICE_ROLE_KEY is not configured")
    return {
      ok: false,
      response: NextResponse.json({ error: "Server configuration error" }, { status: 500 }),
    }
  }

  return {
    ok: true,
    user: { id: user.id, email: user.email ?? null },
    adminClient,
  }
}

/**
 * Admin guard in `{ error } | { adminClient }` form.
 *
 * Same authorization as `requireAdmin`, shaped for the call sites that read:
 *   const result = await getAdminClient()
 *   if ("error" in result && !("adminClient" in result)) return result.error
 *   const { adminClient } = result as { adminClient: any }
 *
 * Prefer `requireAdmin` in new code — it is properly discriminated and also
 * hands back the authenticated user.
 */
export async function getAdminClient(): Promise<
  { error: NextResponse; adminClient?: undefined } | { adminClient: SupabaseClient<any, "public", any>; error?: undefined }
> {
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.response }
  return { adminClient: auth.adminClient }
}
