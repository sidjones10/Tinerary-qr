// components/email-auth-form.tsx
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Mail, Eye, EyeOff, AlertTriangle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 100 }, (_, i) => currentYear - i)
const months = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
]

function getDaysInMonth(month: string, year: string): number {
  if (!month || !year) return 31
  return new Date(parseInt(year), parseInt(month), 0).getDate()
}

function calculateAge(birthDate: Date): number {
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

export default function EmailAuthForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
  })

  // Age verification
  const [birthMonth, setBirthMonth] = useState("")
  const [birthDay, setBirthDay] = useState("")
  const [birthYear, setBirthYear] = useState("")
  const [ageError, setAgeError] = useState<string | null>(null)

  // Consent checkboxes
  const [tosAccepted, setTosAccepted] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [marketingAccepted, setMarketingAccepted] = useState(false)

  const [authResult, setAuthResult] = useState<{
    success: boolean
    message: string
    needsVerification?: boolean
  } | null>(null)

  const supabase = createClient()

  // Calculate available days based on selected month and year
  const daysInMonth = getDaysInMonth(birthMonth, birthYear)
  const days = Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, "0"))

  // Reset day if it exceeds days in the selected month
  useEffect(() => {
    if (birthDay && parseInt(birthDay) > daysInMonth) {
      setBirthDay("")
    }
  }, [birthMonth, birthYear, birthDay, daysInMonth])

  // Validate age when date changes
  useEffect(() => {
    if (birthMonth && birthDay && birthYear) {
      const birthDate = new Date(parseInt(birthYear), parseInt(birthMonth) - 1, parseInt(birthDay))
      const age = calculateAge(birthDate)
      if (age < 13) {
        setAgeError("You must be at least 13 years old to use Tinerary")
      } else {
        setAgeError(null)
      }
    } else {
      setAgeError(null)
    }
  }, [birthMonth, birthDay, birthYear])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email || !formData.password) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setAuthResult(null)

    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      })

      const result = await res.json()

      if (!res.ok || !result.success) {
        throw new Error(result.message || "Sign in failed")
      }

      setAuthResult({
        success: true,
        message: "Successfully signed in! Redirecting...",
      })

      setTimeout(() => {
        if (typeof window !== "undefined") {
          const redirectTo = new URLSearchParams(window.location.search).get("redirectTo") || "/dashboard"
          window.location.href = redirectTo
        }
      }, 1500)
    } catch (error: any) {
      console.error("Sign in error:", error)
      toast({
        title: "Sign In Failed",
        description: error.message || "Please check your credentials and try again",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    // Validate birthdate
    if (!birthMonth || !birthDay || !birthYear) {
      toast({
        title: "Date of Birth Required",
        description: "Please enter your date of birth",
        variant: "destructive",
      })
      return
    }

    // Check age
    const birthDate = new Date(parseInt(birthYear), parseInt(birthMonth) - 1, parseInt(birthDay))
    const age = calculateAge(birthDate)
    if (age < 13) {
      toast({
        title: "Age Requirement",
        description: "You must be at least 13 years old to use Tinerary",
        variant: "destructive",
      })
      return
    }

    // Validate consent
    if (!tosAccepted || !privacyAccepted) {
      toast({
        title: "Consent Required",
        description: "Please agree to the Terms of Service and Privacy Policy",
        variant: "destructive",
      })
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (formData.password.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      })
      return
    }

    if (!/[A-Z]/.test(formData.password) || !/[a-z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      toast({
        title: "Weak Password",
        description: "Password must contain at least one uppercase letter, one lowercase letter, and one number",
        variant: "destructive",
      })
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setAuthResult(null)

    try {
      const accountType = age < 18 ? "minor" : "standard"
      const dateOfBirth = `${birthYear}-${birthMonth}-${birthDay}`

      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username: formData.username || formData.email.split("@")[0],
            date_of_birth: dateOfBirth,
            account_type: accountType,
            tos_accepted: true,
            privacy_accepted: true,
          },
        },
      })

      if (error) {
        throw error
      }

      if (data.user) {
        // Send welcome email via server-side API
        fetch("/api/auth/send-welcome", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            name: formData.username || formData.email.split("@")[0],
          }),
        }).catch(() => {}) // fire-and-forget, don't block signup

        // Update profile with consent data (the trigger creates the profile)
        // We'll update it after creation
        setTimeout(async () => {
          try {
            const now = new Date().toISOString()

            // Update profile with consent data
            await supabase
              .from("profiles")
              .update({
                date_of_birth: dateOfBirth,
                account_type: accountType,
                tos_accepted_at: now,
                tos_version: "1.0.0",
                privacy_policy_accepted_at: now,
                privacy_policy_version: "1.0.0",
                data_processing_consent: true,
                marketing_consent: marketingAccepted,
              })
              .eq("id", data.user.id)

            // Record consent in audit log (consent_records table)
            const consentRecords = [
              { user_id: data.user.id, consent_type: "tos", consent_version: "1.0.0", consent_given: true },
              { user_id: data.user.id, consent_type: "privacy_policy", consent_version: "1.0.0", consent_given: true },
              { user_id: data.user.id, consent_type: "data_processing", consent_version: "1.0.0", consent_given: true },
              { user_id: data.user.id, consent_type: "marketing", consent_version: "1.0.0", consent_given: marketingAccepted },
            ]

            await supabase.from("consent_records").insert(consentRecords)
          } catch (updateErr) {
            // Columns might not exist yet - that's ok, we'll handle gracefully
            console.log("Profile update note:", updateErr)
          }
        }, 500)

        setAuthResult({
          success: true,
          message: age < 18
            ? "Account created! As a minor, some features require parental consent."
            : "Account created successfully! Redirecting...",
        })

        setTimeout(() => {
          if (typeof window !== "undefined") {
            const redirectTo = new URLSearchParams(window.location.search).get("redirectTo") || "/dashboard"
            window.location.href = redirectTo
          }
        }, 2000)
      }
    } catch (error: any) {
      console.error("Sign up error:", error)
      toast({
        title: "Sign Up Failed",
        description: error.message || "Please try again with different credentials",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!formData.email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address first",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : ""
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${origin}/auth/reset-password`,
      })

      if (error) {
        throw error
      }

      toast({
        title: "Reset Email Sent",
        description: "Check your email for password reset instructions",
      })
    } catch (error: any) {
      toast({
        title: "Reset Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const isSignupValid =
    formData.email &&
    formData.password &&
    formData.confirmPassword &&
    birthMonth &&
    birthDay &&
    birthYear &&
    !ageError &&
    tosAccepted &&
    privacyAccepted

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="space-y-2 text-center">
        <div className="flex items-center justify-center mb-4">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">Welcome</h1>
        <p className="text-gray-500 dark:text-gray-400">Sign in to your account or create a new one</p>
      </div>

      {authResult && (
        <Alert variant={authResult.success ? "default" : "destructive"}>
          <AlertDescription>{authResult.message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>Enter your email and password to sign in</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="w-full"
                  onClick={handleForgotPassword}
                  disabled={isLoading}
                >
                  Forgot your password?
                </Button>
              </form>
            </CardContent>
          </TabsContent>

          <TabsContent value="signup">
            <CardHeader>
              <CardTitle>Create Account</CardTitle>
              <CardDescription>Enter your information to create a new account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email *</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-username">Username (optional)</Label>
                  <Input
                    id="signup-username"
                    name="username"
                    type="text"
                    placeholder="Choose a username"
                    value={formData.username}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Date of Birth */}
                <div className="space-y-2">
                  <Label>Date of Birth *</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Select value={birthMonth} onValueChange={setBirthMonth}>
                      <SelectTrigger>
                        <SelectValue placeholder="Month" />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((month) => (
                          <SelectItem key={month.value} value={month.value}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={birthDay} onValueChange={setBirthDay}>
                      <SelectTrigger>
                        <SelectValue placeholder="Day" />
                      </SelectTrigger>
                      <SelectContent>
                        {days.map((day) => (
                          <SelectItem key={day} value={day}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={birthYear} onValueChange={setBirthYear}>
                      <SelectTrigger>
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={String(year)}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {ageError && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {ageError}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min 8 chars, uppercase, lowercase, number"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Confirm Password *</Label>
                  <Input
                    id="signup-confirm-password"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {/* Consent Checkboxes */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="tos"
                      checked={tosAccepted}
                      onCheckedChange={(checked) => setTosAccepted(checked === true)}
                      className="mt-0.5"
                    />
                    <Label htmlFor="tos" className="text-sm font-normal cursor-pointer">
                      I agree to the{" "}
                      <Link href="/terms" target="_blank" className="text-primary hover:underline">
                        Terms of Service
                      </Link>{" "}
                      *
                    </Label>
                  </div>
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="privacy"
                      checked={privacyAccepted}
                      onCheckedChange={(checked) => setPrivacyAccepted(checked === true)}
                      className="mt-0.5"
                    />
                    <Label htmlFor="privacy" className="text-sm font-normal cursor-pointer">
                      I agree to the{" "}
                      <Link href="/privacy" target="_blank" className="text-primary hover:underline">
                        Privacy Policy
                      </Link>{" "}
                      and consent to data processing *
                    </Label>
                  </div>
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="marketing"
                      checked={marketingAccepted}
                      onCheckedChange={(checked) => setMarketingAccepted(checked === true)}
                      className="mt-0.5"
                    />
                    <Label htmlFor="marketing" className="text-sm font-normal cursor-pointer">
                      Send me travel tips, feature updates, and special offers
                    </Label>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading || !isSignupValid}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}
