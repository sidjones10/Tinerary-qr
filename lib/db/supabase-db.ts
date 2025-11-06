// Supabase database compatibility layer
import { createClient } from "@/lib/supabase/client"

// Export the supabase client for database operations
export const supabaseDb = createClient()
export const supabaseClient = supabaseDb

// Stub functions for compatibility
export async function setupHelperFunctions() {
  console.log("setupHelperFunctions called - functionality not implemented")
  return { success: true }
}

export async function testConnection() {
  try {
    const { data, error } = await supabaseClient.from("profiles").select("count")
    return { success: !error, error }
  } catch (error) {
    return { success: false, error }
  }
}

// Default export
export default supabaseDb
