"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import EmailAuthForm from "@/components/email-auth-form"
import { PhoneLoginForm } from "@/components/phone-login-form"
import { Mail, Phone, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/providers/auth-provider"

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("email")
  const [mounted, setMounted] = useState(false)
  const searchParams = useSearchParams()
  const { user, isLoading } = useAuth()
  const router = useRouter()

  const message = searchParams?.get("message")
  const redirectTo = searchParams?.get("redirectTo")

  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (mounted && !isLoading && user) {
      router.push(redirectTo || "/dashboard")
    }
  }, [user, isLoading, redirectTo, router, mounted])

  // Prevent hydration mismatch - show loading during initial mount
  if (!mounted || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-orange-50 to-pink-50 p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Don't render auth form if user is already logged in
  if (user) {
    return null
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-orange-50 to-pink-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Tinerary</CardTitle>
          <CardDescription className="text-center">
            Sign in to start planning your perfect journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert className="mb-4 bg-amber-50 border-amber-200">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {redirectTo && (
            <Alert className="mb-4">
              <AlertDescription>Please log in to access this page</AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </TabsTrigger>
              <TabsTrigger value="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email">
              <EmailAuthForm />
            </TabsContent>

            <TabsContent value="phone">
              <PhoneLoginForm />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
