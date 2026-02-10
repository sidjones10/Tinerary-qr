import { createClient } from "@/lib/supabase/client"

export type ErrorType = "client" | "server" | "api" | "database" | "auth"

interface LogErrorParams {
  type: ErrorType
  message: string
  stack?: string
  component?: string
  url?: string
  userId?: string
  metadata?: Record<string, any>
}

// Client-side error logging
export async function logError(params: LogErrorParams): Promise<string | null> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("error_logs")
      .insert({
        error_type: params.type,
        error_message: params.message,
        error_stack: params.stack,
        component: params.component,
        url: params.url || (typeof window !== "undefined" ? window.location.href : undefined),
        user_id: params.userId,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        metadata: params.metadata || {},
      })
      .select("id")
      .single()

    if (error) {
      console.error("Failed to log error:", error)
      return null
    }

    return data?.id || null
  } catch (err) {
    console.error("Error logging failed:", err)
    return null
  }
}

// Global error handler setup
export function setupGlobalErrorHandler(userId?: string) {
  if (typeof window === "undefined") return

  // Handle unhandled errors
  window.onerror = (message, source, lineno, colno, error) => {
    logError({
      type: "client",
      message: String(message),
      stack: error?.stack,
      component: source || undefined,
      url: window.location.href,
      userId,
      metadata: { lineno, colno },
    })
    return false // Don't prevent default handling
  }

  // Handle unhandled promise rejections
  window.onunhandledrejection = (event) => {
    logError({
      type: "client",
      message: event.reason?.message || String(event.reason),
      stack: event.reason?.stack,
      url: window.location.href,
      userId,
      metadata: { type: "unhandledrejection" },
    })
  }
}

// React error boundary helper
export function logReactError(error: Error, errorInfo: { componentStack: string }, userId?: string) {
  logError({
    type: "client",
    message: error.message,
    stack: error.stack,
    component: "React Error Boundary",
    userId,
    metadata: { componentStack: errorInfo.componentStack },
  })
}
