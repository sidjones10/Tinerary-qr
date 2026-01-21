// Compatibility layer for old imports
// IMPORTANT: This file maintains backward compatibility with code that imports the singleton
// However, it's recommended to use createClient() directly instead of the singleton

import { createClient } from "@/lib/supabase/client"

// Export createClient for proper usage
export { createClient }

/**
 * @deprecated Use createClient() instead of this singleton
 * This singleton can cause issues with stale auth state in React
 */
export const supabase = createClient()

// Promotion handling functions (using fresh clients)
export async function getPromotionById(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase.from("promotions").select("*").eq("id", id).single()
  return { data, error }
}

export async function recordPromotionView(id: string, userId?: string) {
  const supabase = createClient()
  // Increment view count logic would go here
  return { success: true }
}

export default supabase
