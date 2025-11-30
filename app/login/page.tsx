"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

/**
 * Legacy login page - redirects to /auth
 * Kept for backward compatibility with existing links
 */
export default function LoginRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Preserve redirectTo parameter if present
    const redirectTo = searchParams?.get("redirectTo")
    const authUrl = redirectTo ? `/auth?redirectTo=${encodeURIComponent(redirectTo)}` : "/auth"
    router.replace(authUrl)
  }, [router, searchParams])

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}
