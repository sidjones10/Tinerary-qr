"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ShieldAlert } from "lucide-react"
import { useAuth } from "@/providers/auth-provider"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// List of admin email addresses
// In production, this should be stored in the database or environment variables
const ADMIN_EMAILS = [
  process.env.NEXT_PUBLIC_ADMIN_EMAIL,
  // Add additional admin emails here or load from database
].filter(Boolean)

interface AdminAuthGuardProps {
  children: React.ReactNode
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (authLoading) return

      if (!user) {
        // Not logged in
        setIsAdmin(false)
        setIsChecking(false)
        return
      }

      // Check if user email is in admin list
      const isAdminEmail = ADMIN_EMAILS.includes(user.email || "")

      // Also check database for admin role (more secure)
      const supabase = createClient()
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("is_admin, role")
        .eq("id", user.id)
        .single()

      if (error) {
        console.error("Error checking admin status:", error)
        // Fall back to email check only
        setIsAdmin(isAdminEmail)
      } else {
        // User is admin if either email is in list OR has admin role in database
        setIsAdmin(isAdminEmail || profile?.is_admin === true || profile?.role === "admin")
      }

      setIsChecking(false)
    }

    checkAdminStatus()
  }, [user, authLoading])

  // Loading state
  if (authLoading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-purple-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-purple-50">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-xl">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h1>
          <p className="text-muted-foreground mb-6">
            You must be logged in to access the admin dashboard.
          </p>
          <div className="flex gap-3 justify-center">
            <Button asChild variant="outline">
              <Link href="/">Go Home</Link>
            </Button>
            <Button asChild className="bg-orange-500 hover:bg-orange-600">
              <Link href="/auth">Sign In</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Not an admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-purple-50">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-xl">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You do not have permission to access the admin dashboard.
            This area is restricted to authorized administrators only.
          </p>
          <div className="flex gap-3 justify-center">
            <Button asChild variant="outline">
              <Link href="/">Go Home</Link>
            </Button>
            <Button asChild className="bg-orange-500 hover:bg-orange-600">
              <Link href="/discover">Browse Itineraries</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-6">
            If you believe this is an error, please contact support.
          </p>
        </div>
      </div>
    )
  }

  // User is admin, render children
  return <>{children}</>
}
