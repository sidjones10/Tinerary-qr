"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"

export default function CheckEnvironmentPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    details?: any
    error?: string
  } | null>(null)

  const checkEnvironment = async () => {
    setIsLoading(true)
    try {
      // Check environment variables
      const response = await fetch("/api/check-env", {
        method: "GET",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to check environment variables")
      }

      setResult({
        success: true,
        message: "Environment variables checked",
        details: data,
      })
    } catch (error) {
      setResult({
        success: false,
        message: "Failed to check environment variables",
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
          <CardTitle>Check Environment Variables</CardTitle>
          <CardDescription>Check if your application has the necessary environment variables</CardDescription>
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
                    <p className="font-semibold">Environment Variables:</p>
                    <pre className="text-xs overflow-auto mt-2">{JSON.stringify(result.details, null, 2)}</pre>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={checkEnvironment} disabled={isLoading} className="w-full">
            {isLoading ? "Checking..." : "Check Environment Variables"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
