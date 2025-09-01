import { createClient as createBrowserClient } from "@supabase/supabase-js"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { NextRequest, NextResponse } from "next/server"
import type { Database } from "@/types/supabase"

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Browser client - use this in client components
export const createBrowserSupabaseClient = () => {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      storageKey: "supabase.auth.token",
      autoRefreshToken: true,
    },
  })
}

// Client component client - use this in client components with Next.js
export const getClientComponentClient = () => {
  return createClientComponentClient<Database>({
    options: {
      autoRefreshToken: true,
      persistSession: true,
    },
  })
}

// Singleton pattern for browser client to avoid multiple instances
let browserClient: ReturnType<typeof createBrowserSupabaseClient> | null = null

export const getBrowserClient = () => {
  if (!browserClient) {
    browserClient = createBrowserSupabaseClient()
  }
  return browserClient
}

// Server component client - use this in server components
export const getServerClient = () => {
  return createServerComponentClient<Database>({ cookies })
}

// Middleware client - use this in middleware.ts
export const getMiddlewareClient = (req: NextRequest, res: NextResponse) => {
  return createMiddlewareClient<Database>({ req, res })
}

// Reset the browser client (useful for testing or when auth state changes)
export const resetBrowserClient = () => {
  browserClient = null
}
