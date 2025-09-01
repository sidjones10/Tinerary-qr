"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase-singleton"
import { useRouter } from "next/navigation"
import type { Session, User } from "@supabase/supabase-js"

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  signOut: () => Promise<void>
  refreshSession: () => Promise<{ success: boolean; message?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Use the singleton client
  const supabase = getSupabaseClient()

  useEffect(() => {
    const setupAuth = async () => {
      try {
        // Get initial session
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession()
        setSession(initialSession)
        setUser(initialSession?.user ?? null)

        // Set up auth state change listener
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, newSession) => {
          console.log("Auth state changed:", event, !!newSession)
          setSession(newSession)
          setUser(newSession?.user ?? null)

          // Refresh the router to update server components
          router.refresh()
        })

        return () => {
          subscription.unsubscribe()
        }
      } catch (error) {
        console.error("Auth setup error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    setupAuth()

    // Set up periodic session refresh (every 5 minutes)
    const refreshInterval = setInterval(
      async () => {
        // Only try to refresh if we have a session
        if (session) {
          try {
            console.log("Auto refreshing session...")
            const { data, error } = await supabase.auth.refreshSession()
            if (error) {
              console.error("Auto refresh error:", error)
            } else {
              console.log("Session refreshed successfully")
            }
          } catch (error) {
            console.error("Session refresh error:", error)
          }
        }
      },
      5 * 60 * 1000,
    ) // 5 minutes

    return () => {
      clearInterval(refreshInterval)
    }
  }, [supabase, router, session])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/auth")
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  const refreshSession = async () => {
    // First check if we have a session before trying to refresh
    try {
      const { data: sessionData } = await supabase.auth.getSession()

      // If no session exists, return early with a message
      if (!sessionData.session) {
        console.log("No session to refresh")
        return {
          success: false,
          message: "No active session found. Please log in.",
        }
      }

      // We have a session, try to refresh it
      console.log("Manual session refresh...")
      const { data, error } = await supabase.auth.refreshSession()

      if (error) {
        console.error("Manual refresh error:", error)
        return {
          success: false,
          message: error.message,
        }
      }

      console.log("Manual refresh success:", !!data.session)
      setSession(data.session)
      setUser(data.session?.user ?? null)

      return {
        success: true,
        message: "Session refreshed successfully",
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error("Manual session refresh error:", errorMessage)
      return {
        success: false,
        message: errorMessage,
      }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthenticated: !!session,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
