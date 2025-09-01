"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/supabase"

// Create a single instance of the Supabase client
let supabaseInstance: ReturnType<typeof createClientComponentClient<Database>> | null = null

export function getSupabaseClient() {
  if (typeof window === "undefined") {
    throw new Error("getSupabaseClient should only be called in client components")
  }

  if (!supabaseInstance) {
    console.log("Creating new Supabase client instance")
    supabaseInstance = createClientComponentClient<Database>({
      options: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  }
  return supabaseInstance
}

// Reset function for testing purposes
export function resetSupabaseClient() {
  supabaseInstance = null
}
