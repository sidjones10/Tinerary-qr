"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"
import { createClient } from "@supabase/supabase-js"

export default function TestConnectionPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    details?: any
    error?: string
  } | null>(null)

  const testSupabaseConnection = async () => {
    setIsLoading(true)
    try {
      // Get Supabase URL and key from environment variables
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseKey) {
        setResult({
          success: false,
          message: "Supabase environment variables are missing",
          details: {
            NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? "✅ Set" : "❌ Missing",
            NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseKey ? "✅ Set" : "❌ Missing",
          },
        })
        return
      }

      // Create Supabase client
      const supabase = createClient(supabaseUrl, supabaseKey)

      // Test connection with a simple query
      const { data, error } = await supabase.from("users").select("count").limit(1)

      if (error) {
        throw error
      }

      setResult({
        success: true,
        message: "Successfully connected to Supabase",
        details: {
          data,
          environment: {
            NEXT_PUBLIC_SUPABASE_URL: "✅ Set",
            NEXT_PUBLIC_SUPABASE_ANON_KEY: "✅ Set",
          },
        },
      })
    } catch (error: any) {
      setResult({
        success: false,
        message: "Failed to connect to Supabase",
        error: error.message || String(error),
        details: {
          environment: {
            NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing",
            NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing",
          },
        },
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Test Supabase Connection</CardTitle>
          <CardDescription>Check if your application can connect to Supabase</CardDescription>
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
          <Button onClick={testSupabaseConnection} disabled={isLoading} className="w-full">
            {isLoading ? "Testing..." : "Test Connection"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
