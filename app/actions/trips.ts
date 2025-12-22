"use server"

import { createClient } from "@/utils/supabase/server"

export async function getTripById(tripId: string) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("itineraries")
      .select(`
        *,
        user:user_id (
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .eq("id", tripId)
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error("Error fetching trip:", error)
    return { success: false, error: (error as Error).message }
  }
}
