"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"

export default function TestDirectDatabasePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    details?: any
    error?: string
  } | null>(null)

  const testDatabase = async () => {
    setIsLoading(true)
    try {
      // Test direct database connection
      const response = await fetch("/api/test-direct-db", {
        method: "GET",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to connect to database")
      }

      setResult({
        success: true,
        message: "Successfully connected to database directly",
        details: data,
      })
    } catch (error) {
      setResult({
        success: false,
        message: "Failed to connect to database directly",
        error: error.message || String(error),
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Test Direct Database Connection</CardTitle>
          <CardDescription>
            Check if your application can connect directly to the database without Supabase
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result && (
            <Alert
              className={
                result.success ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
              }
            >
              {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
              <AlertDescription>
                {result.message}
                {result.error && (
                  <div className="mt-2 text-sm">
                    <code className="p-2 bg-gray-100 block rounded">{result.error}</code>
                  </div>
                )}
                {result.details && (
                  <div className="mt-4 p-4 bg-gray-100 rounded-md">
                    <p className="font-semibold">Details:</p>
                    <pre className="text-xs overflow-auto mt-2">{JSON.stringify(result.details, null, 2)}</pre>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={testDatabase} disabled={isLoading} className="w-full">
            {isLoading ? "Testing..." : "Test Direct Database Connection"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
