"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ShieldCheck } from "lucide-react"

export function SignInForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // MFA challenge state
  const [mfaRequired, setMfaRequired] = useState(false)
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null)
  const [totpCode, setTotpCode] = useState("")
  const [isVerifyingMfa, setIsVerifyingMfa] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const result = await res.json()

      if (!res.ok || !result.success) {
        setError(result.message || "Sign in failed")
        return
      }

      // Check if the server detected verified MFA factors for this user
      if (result.mfaRequired && result.mfaFactorId) {
        setMfaFactorId(result.mfaFactorId)
        setMfaRequired(true)
        return
      }

      router.refresh()
      router.push("/")
    } catch (err) {
      setError("An unexpected error occurred")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mfaFactorId || totpCode.length !== 6) return
    setIsVerifyingMfa(true)
    setError(null)

    try {
      const res = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ factorId: mfaFactorId, code: totpCode }),
      })
      const result = await res.json()

      if (!result.success) {
        setError(result.message || "Invalid verification code")
        setTotpCode("")
        return
      }

      router.refresh()
      router.push("/")
    } catch (err) {
      setError("An unexpected error occurred")
      console.error(err)
    } finally {
      setIsVerifyingMfa(false)
    }
  }

  // ── MFA challenge screen ──
  if (mfaRequired) {
    return (
      <form onSubmit={handleMfaVerify} className="space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <ShieldCheck className="h-10 w-10 text-blue-600" />
          <h2 className="text-lg font-semibold">Two-factor authentication</h2>
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit code from your authenticator app
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div>
          <Label htmlFor="totp-code">Verification code</Label>
          <div className="mt-1">
            <Input
              id="totp-code"
              placeholder="000000"
              maxLength={6}
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
              className="text-center text-lg tracking-widest font-mono"
              autoComplete="one-time-code"
              autoFocus
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={totpCode.length !== 6 || isVerifyingMfa}
        >
          {isVerifyingMfa ? "Verifying..." : "Verify"}
        </Button>

        <button
          type="button"
          className="w-full text-sm text-muted-foreground hover:underline"
          onClick={() => {
            setMfaRequired(false)
            setMfaFactorId(null)
            setTotpCode("")
            setError(null)
          }}
        >
          Back to sign in
        </button>
      </form>
    )
  }

  // ── Normal sign-in form ──
  return (
    <form onSubmit={handleSignIn} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div>
        <Label htmlFor="email">Email address</Label>
        <div className="mt-1">
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <div className="mt-1">
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm">
          <Link href="/auth/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
            Forgot your password?
          </Link>
        </div>
      </div>

      <div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>
      </div>

      <div className="text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/auth/sign-up" className="font-medium text-blue-600 hover:text-blue-500">
          Sign up
        </Link>
      </div>
    </form>
  )
}
