"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User, Session } from "@supabase/supabase-js"
import { signInWithEmail, ensureProfileExists } from "@/lib/auth-service"

interface AuthContextType {
  user: User | null
  session: Session | null
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, username?: string, fullName?: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  loading: boolean
  isLoading?: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Check if the user's profile still exists; sign them out if it was deleted
  const verifyProfileExists = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .single()

      if (!data) {
        // Profile was deleted (admin deletion) — force sign out
        console.warn("Profile not found for user, signing out:", userId)
        await supabase.auth.signOut()
        setUser(null)
        setSession(null)
      }
    } catch {
      // Query failed — don't sign out on network errors
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false) // Set loading false IMMEDIATELY - don't block on profile check

      // Verify the user's profile still exists (admin may have deleted it)
      if (session?.user) {
        verifyProfileExists(session.user.id).catch((error) => {
          console.error("Failed to verify profile exists:", error)
        })
      }
    }).catch((error) => {
      console.error("Error getting session:", error)
      setLoading(false) // Always stop loading even on error
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false) // Set loading false IMMEDIATELY

      // On sign-in, ensure profile exists (for legacy/new users)
      // On other events (e.g. TOKEN_REFRESHED), verify profile wasn't deleted
      if (session?.user && _event === "SIGNED_IN") {
        ensureProfileExists(session.user.id, session.user.email || "").catch((error) => {
          console.error("Failed to ensure profile exists:", error)
        })
      } else if (session?.user) {
        verifyProfileExists(session.user.id).catch((error) => {
          console.error("Failed to verify profile exists:", error)
        })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const result = await signInWithEmail(email, password)

      if (!result.success) {
        return { error: new Error(result.error || "Sign in failed") }
      }

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signUp = async (email: string, password: string, username?: string, fullName?: string) => {
    try {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username || email.split("@")[0],
            full_name: fullName
          },  // This gets passed to the trigger via raw_user_meta_data
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        return { error }
      }

      if (data.user) {
        // No manual insert needed - database trigger handles it!
        // The trigger creates entries in both users and profiles tables
      }

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const refreshSession = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setSession(session)
    setUser(session?.user ?? null)
  }

  const value = {
    user,
    session,
    signIn,
    signUp,
    signOut,
    refreshSession,
    loading,
    isLoading: loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
