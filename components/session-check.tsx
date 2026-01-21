"use client"

import { useEffect } from "react"
import { useAuth } from "@/providers/auth-provider"
import { useRouter } from "next/navigation"
import { AUTH_CONFIG } from "@/lib/config"

export function SessionCheck() {
  const { session, refreshSession, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Try to refresh the session when the component mounts
    const checkSession = async () => {
      if (!isLoading && !session) {
        try {
          await refreshSession()
        } catch (error) {
          console.error("Session check failed:", error)
          router.push("/auth")
        }
      }
    }

    checkSession()

    // Set up periodic checks using configurable interval
    const intervalId = setInterval(checkSession, AUTH_CONFIG.SESSION_CHECK_INTERVAL)

    return () => clearInterval(intervalId)
  }, [session, refreshSession, isLoading, router])

  return null
}
