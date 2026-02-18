"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertTriangle, Shield, Calendar, FileText, Lock, PartyPopper } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const TOS_VERSION = "1.0.0"
const PRIVACY_POLICY_VERSION = "1.0.0"

interface ConsentDialogProps {
  userId: string
  onConsentComplete: () => void
}

// Generate arrays for date selection
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

export function ConsentDialog({ userId, onConsentComplete }: ConsentDialogProps) {
  const [step, setStep] = useState<"age" | "consent" | "parental" | "success">("age")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Age verification state
  const [birthMonth, setBirthMonth] = useState("")
  const [birthDay, setBirthDay] = useState("")
  const [birthYear, setBirthYear] = useState("")
  const [userAge, setUserAge] = useState<number | null>(null)
  const [accountType, setAccountType] = useState<"minor" | "standard" | null>(null)

  // Consent state
  const [tosAccepted, setTosAccepted] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [dataProcessingAccepted, setDataProcessingAccepted] = useState(false)
  const [marketingAccepted, setMarketingAccepted] = useState(false)

  // Parental consent state (for minors)
  const [parentalEmail, setParentalEmail] = useState("")
  const [parentalConsentAcknowledged, setParentalConsentAcknowledged] = useState(false)

  // Calculate available days based on selected month and year
  const daysInMonth = getDaysInMonth(birthMonth, birthYear)
  const days = Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, "0"))

  // Reset day if it exceeds days in the selected month
  useEffect(() => {
    if (birthDay && parseInt(birthDay) > daysInMonth) {
      setBirthDay("")
    }
  }, [birthMonth, birthYear, birthDay, daysInMonth])

  const handleAgeVerification = () => {
    if (!birthMonth || !birthDay || !birthYear) {
      setError("Please select your complete date of birth")
      return
    }

    const birthDate = new Date(parseInt(birthYear), parseInt(birthMonth) - 1, parseInt(birthDay))
    const age = calculateAge(birthDate)

    if (age < 13) {
      setError("You must be at least 13 years old to use Tinerary. We do not collect personal information from children under 13.")
      return
    }

    setUserAge(age)
    setAccountType(age < 18 ? "minor" : "standard")
    setError(null)
    setStep("consent")
  }

  const handleConsentSubmit = async () => {
    if (!tosAccepted || !privacyAccepted || !dataProcessingAccepted) {
      setError("Please accept all required agreements to continue")
      return
    }

    // If user is a minor, go to parental consent step
    if (accountType === "minor") {
      setError(null)
      setStep("parental")
      return
    }

    // For adults, save consent and complete
    await saveConsent()
  }

  const handleParentalConsentSubmit = async () => {
    if (!parentalConsentAcknowledged) {
      setError("Please acknowledge the parental consent requirement")
      return
    }

    // Basic email validation for parental email (optional but recommended)
    if (parentalEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentalEmail)) {
      setError("Please enter a valid email address for your parent/guardian")
      return
    }

    await saveConsent(true)
  }

  const saveConsent = async (withParentalConsent = false) => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const birthDate = `${birthYear}-${birthMonth}-${birthDay}`

      // Update profile with consent information
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          date_of_birth: birthDate,
          account_type: accountType,
          tos_accepted_at: new Date().toISOString(),
          tos_version: TOS_VERSION,
          privacy_policy_accepted_at: new Date().toISOString(),
          privacy_policy_version: PRIVACY_POLICY_VERSION,
          data_processing_consent: true,
          marketing_consent: marketingAccepted,
          parental_consent: withParentalConsent,
          parental_consent_at: withParentalConsent ? new Date().toISOString() : null,
          parental_email: parentalEmail || null,
        })
        .eq("id", userId)

      if (updateError) {
        throw updateError
      }

      // Record consent in audit log
      const consentRecords = [
        { user_id: userId, consent_type: "tos", consent_version: TOS_VERSION, consent_given: true },
        { user_id: userId, consent_type: "privacy_policy", consent_version: PRIVACY_POLICY_VERSION, consent_given: true },
        { user_id: userId, consent_type: "data_processing", consent_version: "1.0.0", consent_given: true },
        { user_id: userId, consent_type: "marketing", consent_version: "1.0.0", consent_given: marketingAccepted },
      ]

      if (withParentalConsent) {
        consentRecords.push({
          user_id: userId,
          consent_type: "parental",
          consent_version: "1.0.0",
          consent_given: true,
        })
      }

      await supabase.from("consent_records").insert(consentRecords)

      setStep("success")

      // Delay slightly before completing to show success state
      setTimeout(() => {
        onConsentComplete()
      }, 2000)
    } catch (err: any) {
      console.error("Error saving consent:", err)
      setError(err.message || "Failed to save consent. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-card rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-pink-500 p-6 rounded-t-2xl text-white">
          <h1 className="text-2xl font-bold mb-1">Welcome to Tinerary</h1>
          <p className="text-white/90 text-sm">
            {step === "age" && "Let's verify your age to get started"}
            {step === "consent" && "Please review and accept our terms"}
            {step === "parental" && "Parental consent required"}
            {step === "success" && "You're all set!"}
          </p>
        </div>

        <div className="p-6">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Age Verification */}
          {step === "age" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h2 className="font-semibold">Date of Birth</h2>
                  <p className="text-sm text-muted-foreground">You must be 13 or older to use Tinerary</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="birth-month">Month</Label>
                  <Select value={birthMonth} onValueChange={setBirthMonth}>
                    <SelectTrigger id="birth-month">
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birth-day">Day</Label>
                  <Select value={birthDay} onValueChange={setBirthDay}>
                    <SelectTrigger id="birth-day">
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birth-year">Year</Label>
                  <Select value={birthYear} onValueChange={setBirthYear}>
                    <SelectTrigger id="birth-year">
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
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4 text-sm text-blue-800 dark:text-blue-300">
                <p className="font-medium mb-1">Why do we ask for your date of birth?</p>
                <p>
                  Tinerary offers different features based on your age to comply with privacy laws like COPPA and GDPR. Users aged 13-17 have access to planning features with some restrictions on payments and location tracking.
                </p>
              </div>

              <Button onClick={handleAgeVerification} className="w-full" size="lg">
                Continue
              </Button>
            </div>
          )}

          {/* Step 2: Consent */}
          {step === "consent" && (
            <div className="space-y-6">
              {accountType === "minor" && (
                <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                  <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <AlertDescription className="text-amber-800 dark:text-amber-300">
                    <strong>Minor Account:</strong> As a user under 18, you&apos;ll have access to trip planning and collaboration features. Payments and location tracking require parental consent.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <Checkbox
                    id="tos"
                    checked={tosAccepted}
                    onCheckedChange={(checked) => setTosAccepted(checked === true)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor="tos" className="font-medium cursor-pointer">
                      Terms of Service <span className="text-red-500">*</span>
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      I have read and agree to the{" "}
                      <Link href="/terms" target="_blank" className="text-primary hover:underline">
                        Terms of Service
                      </Link>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <Checkbox
                    id="privacy"
                    checked={privacyAccepted}
                    onCheckedChange={(checked) => setPrivacyAccepted(checked === true)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor="privacy" className="font-medium cursor-pointer">
                      Privacy Policy <span className="text-red-500">*</span>
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      I have read and agree to the{" "}
                      <Link href="/privacy" target="_blank" className="text-primary hover:underline">
                        Privacy Policy
                      </Link>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <Checkbox
                    id="data-processing"
                    checked={dataProcessingAccepted}
                    onCheckedChange={(checked) => setDataProcessingAccepted(checked === true)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor="data-processing" className="font-medium cursor-pointer">
                      Data Processing Consent <span className="text-red-500">*</span>
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      I consent to the processing of my personal data as described in the Privacy Policy for the purposes of providing and improving the Service.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-white/5 transition-colors bg-orange-50/50 dark:bg-orange-900/10">
                  <Checkbox
                    id="marketing"
                    checked={marketingAccepted}
                    onCheckedChange={(checked) => setMarketingAccepted(checked === true)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor="marketing" className="font-medium cursor-pointer">
                      Marketing Communications
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      I would like to receive emails about new features, travel tips, and special offers from Tinerary. You can unsubscribe at any time in your notification settings.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("age")} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleConsentSubmit}
                  disabled={!tosAccepted || !privacyAccepted || !dataProcessingAccepted || isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Parental Consent (for minors) */}
          {step === "parental" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h2 className="font-semibold">Parental Consent</h2>
                  <p className="text-sm text-muted-foreground">Required for users under 18</p>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg p-4 space-y-3">
                <p className="text-sm text-amber-900 dark:text-amber-200 dark:text-amber-200">
                  <strong>As a minor account holder, you can:</strong>
                </p>
                <ul className="text-sm text-amber-800 dark:text-amber-300 list-disc pl-4 space-y-1">
                  <li>Join and collaborate on shared itineraries</li>
                  <li>Create and plan your own trips</li>
                  <li>Use all planning and organization features</li>
                  <li>Save and like public itineraries</li>
                </ul>
                <p className="text-sm text-amber-900 dark:text-amber-200 mt-3">
                  <strong>With parental consent, you can also:</strong>
                </p>
                <ul className="text-sm text-amber-800 dark:text-amber-300 list-disc pl-4 space-y-1">
                  <li>Make purchases and process payments</li>
                  <li>Enable location tracking features</li>
                </ul>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="parental-email">Parent/Guardian Email (Optional)</Label>
                  <input
                    id="parental-email"
                    type="email"
                    placeholder="parent@example.com"
                    value={parentalEmail}
                    onChange={(e) => setParentalEmail(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground">
                    We&apos;ll send a notification to verify parental consent for full features.
                  </p>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <Checkbox
                    id="parental-ack"
                    checked={parentalConsentAcknowledged}
                    onCheckedChange={(checked) => setParentalConsentAcknowledged(checked === true)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor="parental-ack" className="font-medium cursor-pointer">
                      Parental Acknowledgment <span className="text-red-500">*</span>
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      I confirm that my parent or legal guardian is aware of and approves my use of Tinerary, and has reviewed the Terms of Service and Privacy Policy.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("consent")} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleParentalConsentSubmit}
                  disabled={!parentalConsentAcknowledged || isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Complete Setup"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === "success" && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <PartyPopper className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-bold mb-2">You&apos;re all set!</h2>
              <p className="text-muted-foreground mb-4">
                {accountType === "minor"
                  ? "Your minor account has been set up. Start planning your adventures!"
                  : "Your account is ready. Start planning your perfect journey!"}
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Redirecting...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
