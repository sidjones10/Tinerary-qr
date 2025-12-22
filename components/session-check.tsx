"use client"

import { useEffect } from "react"
import { useAuth } from "@/app/providers"
import { useRouter } from "next/navigation"

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

    // Set up periodic checks
    const intervalId = setInterval(checkSession, 60 * 1000) // Check every minute

    return () => clearInterval(intervalId)
  }, [session, refreshSession, isLoading, router])

  return null
}
