"use client"

import type React from "react"
import { useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, ArrowLeft, CheckCircle, ShieldAlert } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function ForgotPasswordPage() {
  const searchParams = useSearchParams()
  const revoked = searchParams.get("revoked")

  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const isRevoked = revoked === "true"
  const isAlreadyRevoked = revoked === "already"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const result = await res.json()

      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to send reset email")
      }

      setEmailSent(true)
    } catch (error: any) {
      console.error("Forgot password error:", error)
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <h2 className="text-xl font-semibold">Check your email</h2>
              <p className="text-gray-600 dark:text-gray-400">
                We sent a password reset link to <strong>{email}</strong>. Click the link in the email to reset your password.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Didn&apos;t receive the email? Check your spam folder or{" "}
                <button
                  onClick={() => setEmailSent(false)}
                  className="text-blue-600 hover:underline"
                >
                  try again
                </button>
                .
              </p>
              <div className="pt-2">
                <Link href="/auth">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-background">
      <Card className="w-full max-w-md">
        {(isRevoked || isAlreadyRevoked) && (
          <div className="px-6 pt-6">
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertDescription>
                {isRevoked
                  ? "Your account has been secured. All sessions have been signed out and your password has been reset. Check your email for a password reset link, or enter your email below to request a new one."
                  : "This session was already revoked. If you still need to reset your password, enter your email below."}
              </AlertDescription>
            </Alert>
          </div>
        )}
        <CardHeader>
          <CardTitle>{isRevoked ? "Reset Your Password" : "Forgot Password"}</CardTitle>
          <CardDescription>
            {isRevoked
              ? "Enter your email to receive a new password reset link."
              : "Enter your email address and we'll send you a link to reset your password."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending reset link...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>
          <div className="mt-4">
            <Link href="/auth">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign In
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
