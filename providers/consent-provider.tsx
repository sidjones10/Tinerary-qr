"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useAuth } from "@/providers/auth-provider"
import { createClient } from "@/lib/supabase/client"

interface ConsentContextType {
  hasConsent: boolean
  isCheckingConsent: boolean
  accountType: "minor" | "standard" | "business" | null
  canUsePayments: boolean
  canUseLocationTracking: boolean
  refreshConsent: () => Promise<void>
}

const ConsentContext = createContext<ConsentContextType | undefined>(undefined)

interface ConsentProviderProps {
  children: React.ReactNode
}

// Consent is now collected at signup time in the email-auth-form
// This provider just checks the consent status for feature gating
export function ConsentProvider({ children }: ConsentProviderProps) {
  const { user, isLoading: authLoading } = useAuth()
  const [hasConsent, setHasConsent] = useState(true) // Default to true - consent collected at signup
  const [isCheckingConsent, setIsCheckingConsent] = useState(false)
  const [accountType, setAccountType] = useState<"minor" | "standard" | "business" | null>(null)
  const [canUsePayments, setCanUsePayments] = useState(true)
  const [canUseLocationTracking, setCanUseLocationTracking] = useState(false)

  const checkConsent = async () => {
    if (!user) {
      setHasConsent(true) // Guests don't need consent checks
      setIsCheckingConsent(false)
      return
    }

    setIsCheckingConsent(true)

    try {
      const supabase = createClient()

      // First try to get just the basic profile fields that definitely exist
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, name, email")
        .eq("id", user.id)
        .single()

      if (error) {
        console.error("Error fetching profile:", error)
        // Profile doesn't exist or error - default to allowing access
        setHasConsent(true)
        setIsCheckingConsent(false)
        return
      }

      // Try to get consent-related fields if they exist (migration may not have run)
      try {
        const { data: consentData } = await supabase
          .from("profiles")
          .select("tos_accepted_at, privacy_policy_accepted_at, date_of_birth, account_type, parental_consent, location_tracking_consent")
          .eq("id", user.id)
          .single()

        if (consentData) {
          // Check consent status from new columns
          const hasAllConsent = !!(
            consentData.tos_accepted_at &&
            consentData.privacy_policy_accepted_at &&
            consentData.date_of_birth
          )

          const isMinor = consentData.account_type === "minor"
          const hasParentalConsent = consentData.parental_consent === true

          // Consent is complete if all required fields are filled
          // Minors also need parental consent acknowledgment
          const consentComplete = hasAllConsent && (!isMinor || hasParentalConsent)

          setHasConsent(consentComplete)
          setAccountType(consentData.account_type || null)
          setCanUsePayments(!isMinor || hasParentalConsent)
          setCanUseLocationTracking(
            consentData.location_tracking_consent === true && (!isMinor || hasParentalConsent)
          )
        } else {
          // Consent data not available, assume consent given (legacy user)
          setHasConsent(true)
        }
      } catch {
        // Consent columns don't exist yet (migration not run)
        // Default to allowing access for existing users
        console.log("Consent columns not available - migration may not have run yet")
        setHasConsent(true)
      }
    } catch (err) {
      console.error("Error checking consent:", err)
      // On error, default to allowing access
      setHasConsent(true)
    } finally {
      setIsCheckingConsent(false)
    }
  }

  useEffect(() => {
    if (!authLoading && user) {
      checkConsent()
    }
  }, [user, authLoading])

  const refreshConsent = async () => {
    await checkConsent()
  }

  // No blocking - just render children immediately
  // Consent is collected at signup, not via a blocking dialog
  return (
    <ConsentContext.Provider
      value={{
        hasConsent,
        isCheckingConsent,
        accountType,
        canUsePayments,
        canUseLocationTracking,
        refreshConsent,
      }}
    >
      {children}
    </ConsentContext.Provider>
  )
}

export function useConsent() {
  const context = useContext(ConsentContext)
  if (context === undefined) {
    throw new Error("useConsent must be used within a ConsentProvider")
  }
  return context
}
