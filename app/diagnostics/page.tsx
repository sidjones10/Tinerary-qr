"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, CheckCircle2, XCircle, AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { runConnectionDiagnostics, type DiagnosticReport } from "@/lib/diagnostics"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function DiagnosticsPage() {
  const [report, setReport] = useState<DiagnosticReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [runningTest, setRunningTest] = useState<string | null>(null)
  const router = useRouter()

  async function runDiagnostics() {
    setLoading(true)
    setError(null)
    setRunningTest("Running diagnostics...")

    try {
      const diagnosticReport = await runConnectionDiagnostics()
      setReport(diagnosticReport)
    } catch (err) {
      console.error("Error running diagnostics:", err)
      setError("Failed to run diagnostics: " + (err instanceof Error ? err.message : String(err)))
    } finally {
      setLoading(false)
      setRunningTest(null)
    }
  }

  async function testSpecificRoute(route: string) {
    setRunningTest(`Testing ${route} route...`)

    try {
      const supabase = createClient()

      // Check auth status using getUser() to match middleware behavior
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError(`You need to be logged in to access ${route}. Please log in first.`)
        setRunningTest(null)
        return
      }

      // If authenticated, navigate to the route
      router.push(route)
    } catch (err) {
      console.error(`Error testing ${route} route:`, err)
      setError(`Failed to test ${route} route: ` + (err instanceof Error ? err.message : String(err)))
      setRunningTest(null)
    }
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  return (
    <div className="container px-4 py-6 md:py-10">
      <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Link>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Connection Diagnostics</h1>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between items-center mb-6">
          <p className="text-muted-foreground">This tool helps diagnose connectivity issues with protected routes.</p>
          <Button onClick={runDiagnostics} disabled={loading} className="flex items-center gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {loading ? "Running..." : "Run Diagnostics"}
          </Button>
        </div>

        {runningTest && (
          <div className="flex items-center justify-center p-6 mb-6 bg-muted rounded-lg">
            <Loader2 className="h-6 w-6 animate-spin mr-2 text-primary" />
            <p>{runningTest}</p>
          </div>
        )}

        {report && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Environment Information</CardTitle>
                <CardDescription>Details about your current environment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Supabase URL:</p>
                    <p className="text-sm text-muted-foreground break-all">{report.environment.supabaseUrl}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Anon Key Configured:</p>
                    <p className="text-sm text-muted-foreground">{report.environment.hasAnonKey ? "Yes" : "No"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Browser:</p>
                    <p className="text-sm text-muted-foreground">{report.environment.browser}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Timestamp:</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(report.environment.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Diagnostic Summary</CardTitle>
                <CardDescription>
                  {report.summary.passedTests} of {report.summary.totalTests} tests passed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-3 flex-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${report.summary.passedTests === report.summary.totalTests ? "bg-green-500" : report.summary.passedTests > 0 ? "bg-amber-500" : "bg-red-500"}`}
                      style={{ width: `${(report.summary.passedTests / report.summary.totalTests) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">
                    {Math.round((report.summary.passedTests / report.summary.totalTests) * 100)}%
                  </span>
                </div>

                {Object.entries(report.tests).map(([testName, result]) => (
                  <div key={testName} className="mb-4">
                    <div className="flex items-start gap-2 mb-1">
                      {result.success ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                      )}
                      <div>
                        <p className="font-medium">
                          {testName.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                        </p>
                        <p className="text-sm text-muted-foreground">{result.message}</p>
                        {result.details && (
                          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Test Protected Routes</CardTitle>
                <CardDescription>Test navigation to specific protected routes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    onClick={() => testSpecificRoute("/profile")}
                    disabled={!!runningTest}
                    className="w-full"
                  >
                    Test Profile Route
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => testSpecificRoute("/settings")}
                    disabled={!!runningTest}
                    className="w-full"
                  >
                    Test Settings Route
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => testSpecificRoute("/create")}
                    disabled={!!runningTest}
                    className="w-full"
                  >
                    Test Create Route
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Troubleshooting Steps</CardTitle>
                <CardDescription>Recommended actions based on diagnostic results</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!report.tests.basicConfig?.success && (
                  <div>
                    <h3 className="font-medium mb-1">Supabase Configuration Issue</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Your Supabase URL or Anon Key is not properly configured.
                    </p>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li>Check your environment variables in .env.local</li>
                      <li>Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set correctly</li>
                      <li>Restart your development server after making changes</li>
                    </ul>
                  </div>
                )}

                {!report.tests.networkConnectivity?.success && (
                  <div>
                    <h3 className="font-medium mb-1">Network Connectivity Issue</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Cannot connect to Supabase. This could be due to network issues or incorrect credentials.
                    </p>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li>Check your internet connection</li>
                      <li>Verify your Supabase URL and Anon Key</li>
                      <li>Check if Supabase service is operational</li>
                      <li>Check browser console for CORS errors</li>
                    </ul>
                  </div>
                )}

                {!report.tests.authStatus?.success && (
                  <div>
                    <h3 className="font-medium mb-1">Authentication Issue</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      There was a problem checking your authentication status.
                    </p>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li>Try logging out and logging back in</li>
                      <li>Clear your browser cookies and local storage</li>
                      <li>Check if your session has expired</li>
                    </ul>
                  </div>
                )}

                {!report.tests.sessionRefresh?.success && (
                  <div>
                    <h3 className="font-medium mb-1">Session Refresh Issue</h3>
                    <p className="text-sm text-muted-foreground mb-2">Unable to refresh your authentication session.</p>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li>Your session may have expired</li>
                      <li>Try logging out and logging back in</li>
                      <li>Check if cookies are being properly stored</li>
                    </ul>
                  </div>
                )}

                {!report.tests.middlewareSimulation?.success && (
                  <div>
                    <h3 className="font-medium mb-1">Middleware Issue</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      The authentication middleware simulation failed.
                    </p>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li>Check your middleware.ts file for errors</li>
                      <li>Ensure the middleware is correctly handling authentication</li>
                      <li>Verify that redirects are working properly</li>
                    </ul>
                  </div>
                )}

                {Object.values(report.tests).every((test) => test.success) && (
                  <div>
                    <h3 className="font-medium mb-1 text-green-600">All Tests Passed</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Your connection diagnostics look good. If you're still experiencing issues:
                    </p>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li>Check for specific errors in the browser console</li>
                      <li>Try using the "Test Protected Routes" buttons above</li>
                      <li>Clear your browser cache and cookies</li>
                      <li>Try a different browser to rule out browser-specific issues</li>
                    </ul>
                  </div>
                )}

                <Separator />

                <div>
                  <h3 className="font-medium mb-1">General Troubleshooting</h3>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    <li>Check browser console for JavaScript errors</li>
                    <li>Inspect network requests for failed API calls</li>
                    <li>Verify that cookies are not being blocked</li>
                    <li>Try disabling browser extensions that might interfere</li>
                    <li>Ensure your Supabase project is active and not in maintenance mode</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
