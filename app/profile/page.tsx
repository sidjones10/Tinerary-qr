"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/providers/auth-provider"
import { Loader2 } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { useTranslation } from "react-i18next"

export default function ProfileRedirectPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const { t } = useTranslation()

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
        <p className="mt-4 text-muted-foreground">{t("profilePage.loadingProfile")}</p>
      </div>
    </ProtectedRoute>
  )
}
