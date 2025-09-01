"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { createTestUser } from "../actions/create-test-user"
import { useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"

export default function CreateTestUserPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    credentials?: {
      email: string
      password: string
    }
    error?: string
  } | null>(null)

  const handleCreateTestUser = async () => {
    setIsLoading(true)
    try {
      const response = await createTestUser()
      setResult(response)
    } catch (error) {
      setResult({
        success: false,
        message: "An unexpected error occurred",
        error: String(error),
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Test User</CardTitle>
          <CardDescription>Create a test user account for testing purposes</CardDescription>
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
                    <code>{result.error}</code>
                  </div>
                )}
                {result.credentials && (
                  <div className="mt-4 p-4 bg-gray-100 rounded-md">
                    <p className="font-semibold">Test User Credentials:</p>
                    <p>Email: {result.credentials.email}</p>
                    <p>Password: {result.credentials.password}</p>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleCreateTestUser} disabled={isLoading} className="w-full">
            {isLoading ? "Creating..." : "Create Test User"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
