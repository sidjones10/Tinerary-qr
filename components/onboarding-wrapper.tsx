"use client"

import { useState, useEffect } from "react"
import { OnboardingFlow } from "@/components/onboarding-flow"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/providers/auth-provider"

interface OnboardingWrapperProps {
  children: React.ReactNode
}

export function OnboardingWrapper({ children }: OnboardingWrapperProps) {
  const { user } = useAuth()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState<string>()

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      const supabase = createClient()
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, username")
        .eq("id", user.id)
        .single()

      if (profile) {
        setUserName(profile.name || profile.username || "")
      }

      setLoading(false)
    }

    checkOnboarding()
  }, [user])

  if (loading) {
    return <>{children}</>
  }

  if (showOnboarding && user) {
    return (
      <>
        <OnboardingFlow
          userId={user.id}
          userName={userName}
          onComplete={() => setShowOnboarding(false)}
        />
        {children}
      </>
    )
  }

  return <>{children}</>
}
