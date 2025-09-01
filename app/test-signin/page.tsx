"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"

export default function TestSignInPage() {
  const [email, setEmail] = useState("test@example.com")
  const [password, setPassword] = useState("Test123!")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    details?: any
    error?: string
  } | null>(null)

  const testSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      // Test sign in
      const response = await fetch("/api/test-signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Sign in failed")
      }

      setResult({
        success: true,
        message: "Sign in successful",
        details: data,
      })
    } catch (error: any) {
      setResult({
        success: false,
        message: "Sign in failed",
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
          <CardTitle>Test Sign In</CardTitle>
          <CardDescription>Test the sign in functionality directly</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={testSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>

            {result && (
              <Alert
                className={
                  result.success
                    ? "bg-green-50 border-green-200 text-green-800"
                    : "bg-red-50 border-red-200 text-red-800"
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

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Testing..." : "Test Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
