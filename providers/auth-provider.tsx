"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase-client"
import type { User } from "@supabase/supabase-js"
import { Loader2 } from "lucide-react"

type AuthContextType = {
  user: User | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any | null }>
  signUp: (email: string, password: string, username: string) => Promise<{ error: any | null }>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Public routes that don't require authentication
const publicRoutes = ["/", "/app", "/auth", "/login", "/signup", "/discover", "/event"]

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Check if current route is public
  const isPublicRoute = () => {
    if (!pathname) return true

    return publicRoutes.some((route) => {
      // Handle dynamic routes
      if (pathname.startsWith(route)) {
        return true
      }
      return route === pathname
    })
  }

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error
      setUser(data.session?.user || null)
    } catch (error) {
      console.error("Error refreshing session:", error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Initial session check
    refreshSession()

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event)
      setUser(session?.user || null)
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Handle protected routes
  useEffect(() => {
    if (!isLoading && !user && !isPublicRoute()) {
      // Store the intended destination for post-login redirect
      if (typeof window !== "undefined") {
        sessionStorage.setItem("redirectAfterLogin", pathname || "/")
      }
      router.push("/auth?redirectTo=" + encodeURIComponent(pathname || "/"))
    }
  }, [user, isLoading, pathname, router])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })

      if (!error) {
        let redirectPath = "/app"
        if (typeof window !== "undefined") {
          redirectPath = sessionStorage.getItem("redirectAfterLogin") || "/app"
          sessionStorage.removeItem("redirectAfterLogin")
        }
        router.push(redirectPath)
      }
      return { error }
    } catch (error) {
      console.error("Sign in error:", error)
      return { error }
    }
  }

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (!error && data.user) {
        // After signup, create user profile in the correct table
        try {
          const { error: profileError } = await supabase.from("profiles").insert([
            {
              id: data.user.id,
              name: username,
            },
          ])

          if (profileError) {
            console.error("Profile creation error:", profileError)
            // Don't fail the entire signup if profile creation fails
            // The database trigger should handle this anyway
          }
        } catch (profileErr) {
          console.error("Profile creation exception:", profileErr)
          // Continue anyway since the auth account was created
        }

        router.push("/auth?message=Please check your email to verify your account")
      }
      return { error }
    } catch (error) {
      console.error("Sign up error:", error)
      return { error }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("Sign out error:", error)
      }
      setUser(null)
      router.push("/")
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut, refreshSession }}>
      {isLoading && !isPublicRoute() ? (
        <div className="flex h-screen w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        children
      )}
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
