"use client"

import type React from "react"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { DeleteAccountDialog } from "@/components/delete-account-dialog"
import { MfaSettings } from "@/components/mfa-settings"
import { createClient } from "@/lib/supabase/client"

export function AccountSettings() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long"
    }
    if (!/\d/.test(password)) {
      return "Password must contain at least one number"
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter"
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return "Password must contain at least one special character"
    }
    return null
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate all fields are filled
      if (!currentPassword || !newPassword || !confirmPassword) {
        throw new Error("All fields are required")
      }

      // Validate passwords match
      if (newPassword !== confirmPassword) {
        throw new Error("New passwords don't match")
      }

      // Validate password strength
      const validationError = validatePassword(newPassword)
      if (validationError) {
        throw new Error(validationError)
      }

      // Update password using Supabase
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        throw error
      }

      toast({
        title: t("settings.account.passwordUpdated"),
        description: t("settings.account.passwordUpdatedDesc"),
      })

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message || "There was a problem updating your password.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.account.title")}</CardTitle>
          <CardDescription>{t("settings.account.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>{t("settings.account.emailLabel")}</Label>
            <div className="flex gap-2">
              <Input value={user?.email || ""} disabled className="flex-1" />
            </div>
            <p className="text-xs text-muted-foreground">{t("settings.account.emailHint")}</p>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4 pt-4 border-t">
            <h3 className="font-medium">{t("settings.account.changePassword")}</h3>
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t("settings.account.currentPassword")}</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t("settings.account.newPassword")}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t("settings.account.confirmPassword")}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="bg-amber-50 p-3 rounded-md text-amber-800 text-sm">
              <p>
                {t("settings.account.passwordRequirements")}
              </p>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.updating")}
                  </>
                ) : (
                  t("settings.account.updatePassword")
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <MfaSettings />

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">{t("settings.account.dangerZone")}</CardTitle>
          <CardDescription>{t("settings.account.dangerZoneDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-1">{t("settings.account.deleteAccount")}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t("settings.account.deleteAccountDesc")}
              </p>
              <DeleteAccountDialog userId={user?.id || ""} userEmail={user?.email} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
