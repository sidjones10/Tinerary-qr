"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

export function PhoneLoginForm() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [isCodeSent, setIsCodeSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Clean up any pending operations when component unmounts
  useEffect(() => {
    return () => {
      setIsLoading(false)
    }
  }, [])

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!phoneNumber || phoneNumber.length < 10) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid phone number",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/phone/send-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `API error: ${response.status}`)
      }

      setIsCodeSent(true)
      toast({
        title: "Verification code sent",
        description: "Please check your phone for the verification code",
      })
    } catch (error) {
      console.error("Error sending verification code:", error)
      toast({
        title: "Error sending verification code",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!verificationCode || verificationCode.length < 4) {
      toast({
        title: "Invalid verification code",
        description: "Please enter the verification code sent to your phone",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/phone/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber,
          code: verificationCode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `API error: ${response.status}`)
      }

      toast({
        title: "Success!",
        description: "You have been signed in successfully",
      })

      // Redirect to dashboard
      setTimeout(() => {
        router.push("/dashboard")
        router.refresh()
      }, 500)
    } catch (error) {
      console.error("Error verifying code:", error)
      toast({
        title: "Error verifying code",
        description: error instanceof Error ? error.message : "Please try again with a valid code",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToPhone = () => {
    setIsCodeSent(false)
    setVerificationCode("")
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Sign In</h1>
        <p className="text-gray-500 dark:text-gray-400">Enter your phone number to sign in or create an account</p>
      </div>

      {!isCodeSent ? (
        <form onSubmit={handleSendCode} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Include your country code (e.g., +1 for US)
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Sending..." : "Send Verification Code"}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              type="text"
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              maxLength={6}
              required
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Check your console for the verification code (development mode)
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Verifying..." : "Verify Code"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleBackToPhone}
            disabled={isLoading}
          >
            Back
          </Button>
        </form>
      )}
    </div>
  )
}
