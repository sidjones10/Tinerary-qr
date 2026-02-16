"use client"

import { useEffect } from "react"
import { ErrorBoundary } from "@/components/error-boundary"
import { setupGlobalErrorHandler } from "@/lib/error-logger"
import { useAuth } from "@/providers/auth-provider"

export function GlobalErrorHandler({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  useEffect(() => {
    setupGlobalErrorHandler(user?.id)
  }, [user?.id])

  return <ErrorBoundary>{children}</ErrorBoundary>
}
