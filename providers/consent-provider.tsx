"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useAuth } from "@/providers/auth-provider"
import { createClient } from "@/lib/supabase/client"
import { ConsentDialog } from "@/components/consent-dialog"
import { Loader2 } from "lucide-react"

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

export function ConsentProvider({ children }: ConsentProviderProps) {
  const { user, isLoading: authLoading } = useAuth()
  const [hasConsent, setHasConsent] = useState(false)
  const [isCheckingConsent, setIsCheckingConsent] = useState(true)
  const [showConsentDialog, setShowConsentDialog] = useState(false)
  const [accountType, setAccountType] = useState<"minor" | "standard" | "business" | null>(null)
  const [canUsePayments, setCanUsePayments] = useState(false)
  const [canUseLocationTracking, setCanUseLocationTracking] = useState(false)

  const checkConsent = async () => {
    if (!user) {
      setHasConsent(false)
      setIsCheckingConsent(false)
      setShowConsentDialog(false)
      return
    }

    try {
      const supabase = createClient()
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("tos_accepted_at, privacy_policy_accepted_at, date_of_birth, account_type, parental_consent, location_tracking_consent")
        .eq("id", user.id)
        .single()

      if (error) {
        console.error("Error checking consent:", error)
        // If profile doesn't have these columns yet (migration not run), show consent dialog
        setHasConsent(false)
        setShowConsentDialog(true)
        setIsCheckingConsent(false)
        return
      }

      // Check if all required consent has been given
      const hasAllConsent = !!(
        profile?.tos_accepted_at &&
        profile?.privacy_policy_accepted_at &&
        profile?.date_of_birth
      )

      // For minors, also check parental consent
      const isMinor = profile?.account_type === "minor"
      const hasParentalConsent = profile?.parental_consent === true

      // Minors need parental consent acknowledgment
      const consentComplete = hasAllConsent && (!isMinor || hasParentalConsent)

      setHasConsent(consentComplete)
      setShowConsentDialog(!consentComplete)
      setAccountType(profile?.account_type || null)

      // Determine feature access
      setCanUsePayments(!isMinor || hasParentalConsent)
      setCanUseLocationTracking(
        profile?.location_tracking_consent === true && (!isMinor || hasParentalConsent)
      )
    } catch (err) {
      console.error("Error checking consent:", err)
      setHasConsent(false)
      setShowConsentDialog(true)
    } finally {
      setIsCheckingConsent(false)
    }
  }

  useEffect(() => {
    if (!authLoading) {
      checkConsent()
    }
  }, [user, authLoading])

  const refreshConsent = async () => {
    setIsCheckingConsent(true)
    await checkConsent()
  }

  const handleConsentComplete = () => {
    setShowConsentDialog(false)
    setHasConsent(true)
    refreshConsent()
  }

  // Show loading state while checking auth and consent
  if (authLoading || (user && isCheckingConsent)) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-orange-50 to-pink-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Show consent dialog if user is logged in but hasn't given consent
  if (user && showConsentDialog) {
    return <ConsentDialog userId={user.id} onConsentComplete={handleConsentComplete} />
  }

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
