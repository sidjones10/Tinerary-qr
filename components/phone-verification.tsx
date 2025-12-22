"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Check, Phone } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface PhoneVerificationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  phoneNumber: string
}

export function PhoneVerification({ open, onOpenChange, phoneNumber }: PhoneVerificationProps) {
  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(""))
  const [isVerifying, setIsVerifying] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(60)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Timer for resend code
  useEffect(() => {
    if (!open) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [open, setTimeLeft])

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setOtpValues(Array(6).fill(""))
      setIsVerifying(false)
      setIsVerified(false)
      setError(null)
      setTimeLeft(60)

      // Focus the first input when dialog opens
      setTimeout(() => {
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus()
        }
      }, 100)
    }
  }, [open])

  const handleOtpChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return

    const newOtpValues = [...otpValues]

    // Handle paste event with multiple characters
    if (value.length > 1) {
      const pastedValues = value.split("").slice(0, 6 - index)

      for (let i = 0; i < pastedValues.length; i++) {
        if (index + i < 6) {
          newOtpValues[index + i] = pastedValues[i]
        }
      }

      setOtpValues(newOtpValues)

      // Focus the next empty input or the last input
      const nextIndex = Math.min(index + pastedValues.length, 5)
      if (inputRefs.current[nextIndex]) {
        inputRefs.current[nextIndex].focus()
      }

      return
    }

    // Handle single character input
    newOtpValues[index] = value
    setOtpValues(newOtpValues)

    // Auto-focus next input
    if (value && index < 5) {
      if (inputRefs.current[index + 1]) {
        inputRefs.current[index + 1].focus()
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Move to previous input on backspace if current input is empty
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      if (inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus()
      }
    }

    // Handle arrow keys
    if (e.key === "ArrowLeft" && index > 0) {
      if (inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus()
      }
    }

    if (e.key === "ArrowRight" && index < 5) {
      if (inputRefs.current[index + 1]) {
        inputRefs.current[index + 1].focus()
      }
    }
  }

  const handleVerify = () => {
    const otp = otpValues.join("")

    // Check if OTP is complete
    if (otp.length !== 6) {
      setError("Please enter all 6 digits")
      return
    }

    setIsVerifying(true)
    setError(null)

    // Call API to verify OTP
    fetch("/api/auth/phone/verify-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber, code: otp }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setIsVerified(true)
          setIsVerifying(false)

        // Close dialog after showing success message
        setTimeout(() => {
          onOpenChange(false)
        }, 1500)
      } else {
        setError("Invalid verification code. Please try again.")
        setIsVerifying(false)
      }
    }, 1500)
  }

  const handleResendCode = () => {
    // Reset OTP inputs
    setOtpValues(Array(6).fill(""))
    setError(null)
    setTimeLeft(60)

    // Focus the first input
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }

    // Simulate sending a new code
    // In a real app, you would call your API here
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-orange-500" />
            Verify Your Phone Number
          </DialogTitle>
          <DialogDescription>We've sent a 6-digit verification code to {phoneNumber}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {isVerified ? (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-4">
                <Check className="h-6 w-6" />
              </div>
              <p className="text-lg font-medium text-green-600">Phone Verified Successfully!</p>
            </div>
          ) : (
            <>
              <div className="flex justify-center gap-2">
                {otpValues.map((value, index) => (
                  <Input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={value}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-10 h-12 text-center text-lg font-medium"
                  />
                ))}
              </div>

              {error && <div className="text-sm text-red-500 text-center">{error}</div>}

              <div className="text-center text-sm text-muted-foreground">
                Didn't receive the code?{" "}
                {timeLeft > 0 ? (
                  <span>Resend in {timeLeft}s</span>
                ) : (
                  <button onClick={handleResendCode} className="text-orange-500 hover:text-orange-600 font-medium">
                    Resend Code
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          {!isVerified && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleVerify} disabled={otpValues.some((v) => !v) || isVerifying} className="btn-sunset">
                {isVerifying ? "Verifying..." : "Verify"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
