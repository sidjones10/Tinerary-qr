"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Info, Download } from "lucide-react"
import { useAuth } from "@/providers/auth-provider"
import { createClient } from "@/lib/supabase/client"
import { Separator } from "@/components/ui/separator"
import { DeleteAccountDialog } from "@/components/delete-account-dialog"

export function PrivacySettings() {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  const [downloadingData, setDownloadingData] = useState(false)
  const [profilePrivacy, setProfilePrivacy] = useState("public")
  const [privacySettings, setPrivacySettings] = useState({
    shareLocation: false,
    locationHistory: true,
    personalizedRecs: true,
    dataCollection: true,
  })

  // Load privacy settings from database
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return

      try {
        const supabase = createClient()

        // Load privacy settings from user_preferences (source of truth)
        const { data: prefsData, error: prefsError } = await supabase
          .from("user_preferences")
          .select("privacy_preferences")
          .eq("user_id", user.id)
          .single()

        if (prefsError && prefsError.code !== "PGRST116") {
          console.error("Error loading privacy preferences:", prefsError)
          return
        }

        if (prefsData?.privacy_preferences) {
          // Restore the exact profile privacy level from JSONB
          // (the profiles.is_private boolean can't distinguish "followers" from "private")
          if (prefsData.privacy_preferences.profilePrivacy) {
            setProfilePrivacy(prefsData.privacy_preferences.profilePrivacy)
          }

          const { profilePrivacy: _profilePrivacy, ...toggleSettings } = prefsData.privacy_preferences
          setPrivacySettings((prev) => ({
            ...prev,
            ...toggleSettings,
          }))
        }
      } catch (error) {
        console.error("Error loading privacy settings:", error)
      }
    }

    loadPreferences()
  }, [user])

  const handleToggle = (key: keyof typeof privacySettings) => {
    setPrivacySettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleSave = async () => {
    if (!user) {
      toast({
        title: t("auth.authRequired"),
        description: t("auth.pleaseLogInSettings"),
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()

      // Ensure the user row exists in the users table (user_preferences has a FK to it)
      await supabase
        .from("users")
        .upsert({
          id: user.id,
          email: user.email ?? null,
          updated_at: new Date().toISOString(),
        }, { onConflict: "id" })

      // Save privacy settings to user_preferences (source of truth for the exact privacy level)
      const { error: upsertError } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: user.id,
          privacy_preferences: {
            ...privacySettings,
            profilePrivacy, // Store the exact privacy level
          },
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" })

      if (upsertError) throw upsertError

      toast({
        title: t("settings.privacy.settingsSaved"),
        description: t("settings.privacy.settingsSavedDesc"),
      })
    } catch (error: any) {
      console.error("Error saving privacy settings:", error)
      toast({
        title: t("common.error"),
        description: error.message || t("settings.privacy.saveError", "Failed to save privacy settings."),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadData = async () => {
    if (!user) {
      toast({
        title: t("auth.authRequired"),
        description: t("auth.pleaseLogInSettings"),
        variant: "destructive",
      })
      return
    }

    setDownloadingData(true)
    try {
      const response = await fetch("/api/user/export-data")

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || "Failed to download data")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const timestamp = new Date().toISOString().split("T")[0]
      a.download = `tinerary-data-export-${timestamp}.json`
      document.body.appendChild(a)
      a.click()

      // Delay cleanup so the browser has time to initiate the download
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }, 150)

      toast({
        title: t("dataPrivacy.dataExported"),
        description: t("dataPrivacy.dataExportedDesc"),
      })
    } catch (error: any) {
      console.error("Error downloading data:", error)
      toast({
        title: t("common.error"),
        description: error.message || t("dataPrivacy.downloadError", "Failed to download data."),
        variant: "destructive",
      })
    } finally {
      setDownloadingData(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.privacy.title")}</CardTitle>
        <CardDescription>{t("settings.privacy.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">{t("settings.privacy.profilePrivacy")}</h3>

          <RadioGroup value={profilePrivacy} onValueChange={setProfilePrivacy} className="space-y-3">
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="public" id="public" className="mt-1" />
              <div className="grid gap-1.5">
                <Label htmlFor="public" className="font-medium">
                  {t("settings.privacy.public")}
                </Label>
                <p className="text-sm text-muted-foreground">{t("settings.privacy.publicDesc")}</p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <RadioGroupItem value="followers" id="followers" className="mt-1" />
              <div className="grid gap-1.5">
                <Label htmlFor="followers" className="font-medium">
                  {t("settings.privacy.followersOnly")}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t("settings.privacy.followersOnlyDesc")}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <RadioGroupItem value="private" id="private" className="mt-1" />
              <div className="grid gap-1.5">
                <Label htmlFor="private" className="font-medium">
                  {t("settings.privacy.private")}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t("settings.privacy.privateDesc")}
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-medium text-muted-foreground">{t("settings.privacy.locationSharing")}</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t("settings.privacy.sharePreciseLocation")}</p>
                <p className="text-sm text-muted-foreground">{t("settings.privacy.sharePreciseLocationDesc")}</p>
              </div>
              <Switch checked={privacySettings.shareLocation} onCheckedChange={() => handleToggle("shareLocation")} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t("settings.privacy.locationHistory")}</p>
                <p className="text-sm text-muted-foreground">{t("settings.privacy.locationHistoryDesc")}</p>
              </div>
              <Switch
                checked={privacySettings.locationHistory}
                onCheckedChange={() => handleToggle("locationHistory")}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-medium text-muted-foreground">{t("settings.privacy.dataPersonalization")}</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t("settings.privacy.personalizedRecommendations")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("settings.privacy.personalizedRecommendationsDesc")}
                </p>
              </div>
              <Switch
                checked={privacySettings.personalizedRecs}
                onCheckedChange={() => handleToggle("personalizedRecs")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t("settings.privacy.dataCollection")}</p>
                <p className="text-sm text-muted-foreground">{t("settings.privacy.dataCollectionDesc")}</p>
              </div>
              <Switch checked={privacySettings.dataCollection} onCheckedChange={() => handleToggle("dataCollection")} />
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-md text-blue-800 text-sm flex items-start gap-2 mt-4">
            <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p>
              {t("settings.privacy.privacyNotice")}{" "}
              <a href="#" className="underline font-medium">
                {t("settings.privacy.privacyPolicy")}
              </a>{" "}
              {t("settings.privacy.privacyNoticeSuffix")}
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("common.saving")}
              </>
            ) : (
              t("settings.privacy.savePrivacySettings")
            )}
          </Button>
        </div>

        <Separator className="my-6" />

        {/* Data & Privacy Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">{t("dataPrivacy.title")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("dataPrivacy.description")}
            </p>
          </div>

          <div className="space-y-3">
            {/* Download Your Data */}
            <div className="flex items-start justify-between p-4 border rounded-lg">
              <div className="space-y-1 flex-1">
                <h4 className="font-medium">{t("dataPrivacy.downloadData")}</h4>
                <p className="text-sm text-muted-foreground">
                  {t("dataPrivacy.downloadDataDesc")}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleDownloadData}
                disabled={downloadingData}
                className="ml-4 shrink-0"
              >
                {downloadingData ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.downloading")}
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    {t("dataPrivacy.downloadButton")}
                  </>
                )}
              </Button>
            </div>

            {/* Delete Account */}
            <div className="flex items-start justify-between p-4 border border-red-200 rounded-lg bg-red-50/50">
              <div className="space-y-1 flex-1">
                <h4 className="font-medium text-red-900">{t("dataPrivacy.deleteAccount")}</h4>
                <p className="text-sm text-red-700">
                  {t("dataPrivacy.deleteAccountDesc")}
                </p>
              </div>
              <div className="ml-4 shrink-0">
                {user && <DeleteAccountDialog userId={user.id} userEmail={user.email} />}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
