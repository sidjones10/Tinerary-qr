// Compatibility layer for old imports
// Re-export from the actual supabase client
import { createClient } from "@/lib/supabase/client"

export { createClient }
export const supabase = createClient()

// Stub functions for promotion handling (compatibility)
export async function getPromotionById(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase.from("promotions").select("*").eq("id", id).single()
  return { data, error }
}

export async function recordPromotionView(id: string, userId?: string) {
  const supabase = createClient()
  // Increment view count logic would go here
  console.log("recordPromotionView called for", id, userId)
  return { success: true }
}

export default supabase
