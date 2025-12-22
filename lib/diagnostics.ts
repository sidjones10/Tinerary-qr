import { createClient } from "@/lib/supabase/client"

export type DiagnosticResult = {
  success: boolean
  message: string
  details?: any
  timestamp: string
}

export type DiagnosticReport = {
  environment: {
    supabaseUrl: string
    hasAnonKey: boolean
    browser: string
    timestamp: string
  }
  tests: {
    [key: string]: DiagnosticResult
  }
  summary: {
    totalTests: number
    passedTests: number
    failedTests: number
  }
}

export async function runConnectionDiagnostics(): Promise<DiagnosticReport> {
  const supabase = createClient()
  const report: DiagnosticReport = {
    environment: {
      supabaseUrl: supabase.supabaseUrl || "Not configured",
      hasAnonKey: !!supabase.supabaseKey,
      browser: typeof window !== "undefined" ? window.navigator.userAgent : "Server",
      timestamp: new Date().toISOString(),
    },
    tests: {},
    summary: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
    },
  }

  // Test 1: Basic Supabase Configuration
  try {
    report.tests.basicConfig = {
      success: !!supabase.supabaseUrl && !!supabase.supabaseKey,
      message:
        !!supabase.supabaseUrl && !!supabase.supabaseKey
          ? "Supabase client is properly configured"
          : "Supabase client is missing URL or key",
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    report.tests.basicConfig = {
      success: false,
      message: "Error checking Supabase configuration",
      details: error,
      timestamp: new Date().toISOString(),
    }
  }

  // Test 2: Network Connectivity
  try {
    const startTime = Date.now()
    const { data, error } = await supabase.from("itineraries").select("count").limit(1)
    const endTime = Date.now()

    report.tests.networkConnectivity = {
      success: !error,
      message: !error
        ? `Successfully connected to Supabase (${endTime - startTime}ms)`
        : `Failed to connect to Supabase: ${error.message}`,
      details: error ? error : { responseTime: endTime - startTime },
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    report.tests.networkConnectivity = {
      success: false,
      message: "Network error when connecting to Supabase",
      details: error,
      timestamp: new Date().toISOString(),
    }
  }

  // Test 3: Authentication Status
  try {
    const { data, error } = await supabase.auth.getSession()

    report.tests.authStatus = {
      success: !error,
      message: !error
        ? `Authentication check completed: ${data.session ? "User is authenticated" : "No active session"}`
        : `Authentication check failed: ${error.message}`,
      details: {
        hasSession: !!data.session,
        error: error || null,
      },
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    report.tests.authStatus = {
      success: false,
      message: "Error checking authentication status",
      details: error,
      timestamp: new Date().toISOString(),
    }
  }

  // Test 4: Session Refresh
  try {
    const startTime = Date.now()
    const { data, error } = await supabase.auth.refreshSession()
    const endTime = Date.now()

    report.tests.sessionRefresh = {
      success: !error,
      message: !error
        ? `Session refresh completed in ${endTime - startTime}ms: ${data.session ? "Session refreshed" : "No session to refresh"}`
        : `Session refresh failed: ${error.message}`,
      details: {
        hasSession: !!data.session,
        responseTime: endTime - startTime,
        error: error || null,
      },
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    report.tests.sessionRefresh = {
      success: false,
      message: "Error refreshing session",
      details: error,
      timestamp: new Date().toISOString(),
    }
  }

  // Test 5: Middleware Simulation
  try {
    // This simulates what the actual middleware does in middleware.ts
    // The middleware uses getUser() to validate the JWT token directly
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    // Simulate protected route check
    const testPath = "/profile"
    const protectedRoutes = ["/dashboard", "/profile", "/create", "/settings", "/my-events", "/saved"]
    const isProtectedRoute = protectedRoutes.some((route) => testPath.startsWith(route))

    // Middleware redirects to /auth if no user on protected route
    const wouldRedirect = isProtectedRoute && !user
    const redirectUrl = wouldRedirect ? `/auth?redirectTo=${testPath}` : null

    report.tests.middlewareSimulation = {
      success: !error,
      message: !error
        ? `Middleware simulation completed: ${wouldRedirect ? `Would redirect to ${redirectUrl}` : "User authenticated, no redirect needed"}`
        : `Middleware simulation failed: ${error.message}`,
      details: {
        hasUser: !!user,
        userId: user?.id || null,
        isProtectedRoute,
        wouldRedirect,
        redirectUrl,
        error: error || null,
      },
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    report.tests.middlewareSimulation = {
      success: false,
      message: "Error in middleware simulation",
      details: error,
      timestamp: new Date().toISOString(),
    }
  }

  // Calculate summary
  report.summary.totalTests = Object.keys(report.tests).length
  report.summary.passedTests = Object.values(report.tests).filter((test) => test.success).length
  report.summary.failedTests = report.summary.totalTests - report.summary.passedTests

  return report
}
