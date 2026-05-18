"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/providers/auth-provider"
import { createClient } from "@/lib/supabase/client"
import { resolveAccess } from "@/lib/access-control"

interface UseAccessResult {
  /** Admin (email allowlist or profiles.is_admin / role = 'admin'). */
  isAdmin: boolean
  /** Admin or allowlisted creator — may use the full app during soft launch. */
  isAllowed: boolean
  /** True until auth + the profile role check have resolved. */
  isLoading: boolean
}

/**
 * Client-side mirror of the middleware access check. The middleware is the
 * real enforcement point; this just lets components show the right view
 * (e.g. landing vs. feed) without a flash of restricted content.
 */
export function useAccess(): UseAccessResult {
  const { user, isLoading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isAllowed, setIsAllowed] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let cancelled = false

    const check = async () => {
      if (authLoading) return

      if (!user) {
        if (cancelled) return
        setIsAdmin(false)
        setIsAllowed(false)
        setChecking(false)
        return
      }

      let profile: { is_admin: boolean | null; role: string | null } | null = null
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from("profiles")
          .select("is_admin, role")
          .eq("id", user.id)
          .single()
        profile = data
      } catch {
        // Fall back to email-only check on query failure.
      }

      if (cancelled) return
      const access = resolveAccess(user.email, profile)
      setIsAdmin(access.isAdmin)
      setIsAllowed(access.isAllowed)
      setChecking(false)
    }

    check()
    return () => {
      cancelled = true
    }
  }, [user, authLoading])

  return { isAdmin, isAllowed, isLoading: authLoading || checking }
}
