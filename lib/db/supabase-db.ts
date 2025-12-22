// Database client helpers for Supabase
// DO NOT create singletons - always call createClient() when needed

import { createClient as createBrowserClient } from "@/lib/supabase/client"
import { createClient as createServerClient } from "@/lib/supabase"

/**
 * Test database connection
 * This creates a fresh client for testing
 */
export async function testConnection() {
  try {
    const supabase = createBrowserClient()
    const { data, error } = await supabase.from("profiles").select("count").limit(1)
    return { success: !error, error }
  } catch (error) {
    return { success: false, error }
  }
}

/**
 * Test server-side database connection
 * This creates a fresh server client for testing
 */
export async function testServerConnection() {
  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase.from("profiles").select("count").limit(1)
    return { success: !error, error }
  } catch (error) {
    return { success: false, error }
  }
}

// Re-export client creators for convenience
export { createBrowserClient, createServerClient }
