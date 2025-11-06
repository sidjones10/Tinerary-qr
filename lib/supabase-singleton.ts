// Supabase singleton compatibility layer
import { createClient } from "@/lib/supabase/client"

// Export a singleton instance
export const supabase = createClient()

// Export for compatibility
export function getSupabaseClient() {
  return supabase
}

// Default export
export default supabase
