"use client"

import { useState } from "react"
import { setupHelperFunctions } from "@/lib/db/supabase-db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, XCircle } from "lucide-react"

export default function SetupSupabasePage() {
  const [setupStatus, setSetupStatus] = useState<{
    success?: boolean
    message?: string
    error?: any
  }>({})
  const [isLoading, setIsLoading] = useState(false)

  const runSetup = async () => {
    setIsLoading(true)
    try {
      const result = await setupHelperFunctions()
      setSetupStatus(result)
    } catch (error: any) {
      setSetupStatus({
        success: false,
        message: "Error setting up helper functions",
        error: { message: error.message, stack: error.stack },
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Supabase Setup</CardTitle>
          <CardDescription>Initialize helper functions in your Supabase database</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Helper Functions</h3>
            <p className="text-sm text-muted-foreground">
              This will create the following helper functions in your Supabase database:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>
                <code>get_service_status()</code> - Returns basic information about the database
              </li>
              <li>
                <code>execute_sql(sql text)</code> - Allows executing SQL statements safely
              </li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              These functions are used by the diagnostic tools to test your Supabase connection and perform basic
              operations.
            </p>
          </div>

          {setupStatus.success !== undefined && (
            <Alert variant={setupStatus.success ? "default" : "destructive"}>
              <AlertTitle className="flex items-center gap-2">
                {setupStatus.success ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Setup Successful!
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    Setup Failed
                  </>
                )}
              </AlertTitle>
              <AlertDescription>
                <p>{setupStatus.message}</p>
                {setupStatus.error && (
                  <pre className="mt-2 text-xs overflow-auto p-2 bg-muted rounded">
                    {JSON.stringify(setupStatus.error, null, 2)}
                  </pre>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => (window.location.href = "/supabase-test")}>
            Go to Test Page
          </Button>
          <Button onClick={runSetup} disabled={isLoading}>
            {isLoading ? "Setting up..." : "Setup RPC Functions"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
