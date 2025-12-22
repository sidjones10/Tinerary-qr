import { createClient } from "@/lib/supabase/client"

/**
 * Checks if the Supabase connection is working
 * @returns {Promise<boolean>} True if connection is working, false otherwise
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const supabase = createClient()
    // Try a simple query to check connectivity
    const { data, error } = await supabase.from("itineraries").select("count").limit(1).maybeSingle()

    if (error) {
      console.error("Supabase connection check failed:", error)
      return false
    }

    return true
  } catch (err) {
    console.error("Supabase connection check exception:", err)
    return false
  }
}

/**
 * Validates that the Supabase client is properly configured
 * @returns {boolean} True if configuration appears valid
 */
export function validateSupabaseConfig(): boolean {
  const supabase = createClient()
  if (!supabase) {
    console.error("Supabase client is not initialized")
    return false
  }

  if (!supabase.supabaseUrl || !supabase.supabaseKey) {
    console.error("Supabase URL or key is missing")
    return false
  }

  return true
}
