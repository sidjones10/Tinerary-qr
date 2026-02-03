"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/providers/auth-provider"
import { Loader2 } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"

export default function ProfileRedirectPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      // Redirect to the unified profile page
      router.replace(`/user/${user.id}`)
    }
  }, [user, isLoading, router])

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your profile...</p>
      </div>
    </ProtectedRoute>
  )
}
