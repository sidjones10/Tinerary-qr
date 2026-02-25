"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Info } from "lucide-react"
import { useAuth } from "@/providers/auth-provider"
import { createClient } from "@/lib/supabase/client"
import { LANGUAGE_TO_LOCALE } from "@/lib/i18n"

export function LanguageSettings() {
  const [isLoading, setIsLoading] = useState(false)
  const { t, i18n } = useTranslation()
  const { toast } = useToast()
  const { user } = useAuth()

  const [language, setLanguage] = useState("english")
  const [region, setRegion] = useState("united-states")
  const [timeZone, setTimeZone] = useState("pacific")
  const [dateFormat, setDateFormat] = useState("mm/dd/yyyy")
  const [timeFormat, setTimeFormat] = useState("12-hour")
  const [currency, setCurrency] = useState("USD")
  const [distanceUnit, setDistanceUnit] = useState("miles")

  // Apply language change immediately when user selects from dropdown
  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage)
    const locale = LANGUAGE_TO_LOCALE[newLanguage]
    if (locale && locale !== i18n.language) {
      i18n.changeLanguage(locale)
    }
  }

  // Load language and region preferences from database
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return

      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("user_preferences")
          .select("language_preferences")
          .eq("user_id", user.id)
          .single()

        if (error && error.code !== "PGRST116") {
          console.error("Error loading language preferences:", error)
          return
        }

        if (data?.language_preferences) {
          const prefs = data.language_preferences
          if (prefs.language) setLanguage(prefs.language)
          if (prefs.region) setRegion(prefs.region)
          if (prefs.timeZone) setTimeZone(prefs.timeZone)
          if (prefs.dateFormat) setDateFormat(prefs.dateFormat)
          if (prefs.timeFormat) setTimeFormat(prefs.timeFormat)
          if (prefs.currency) setCurrency(prefs.currency.toUpperCase())
          if (prefs.distanceUnit) setDistanceUnit(prefs.distanceUnit)
        }
      } catch (error) {
        console.error("Error loading language preferences:", error)
      }
    }

    loadPreferences()
  }, [user])

  const handleSave = async () => {
    if (!user) {
      toast({
        title: t("auth.authRequired"),
        description: t("auth.pleaseLogIn"),
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()

      const languagePreferences = {
        language,
        region,
        timeZone,
        dateFormat,
        timeFormat,
        currency,
        distanceUnit,
      }

      // Try to update existing preferences
      const { error: updateError } = await supabase
        .from("user_preferences")
        .update({
          language_preferences: languagePreferences,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)

      // If no rows were updated, insert a new row
      if (updateError && updateError.code === "PGRST116") {
        const { error: insertError } = await supabase
          .from("user_preferences")
          .insert({
            user_id: user.id,
            language_preferences: languagePreferences,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

        if (insertError) throw insertError
      } else if (updateError) {
        throw updateError
      }

      // Sync i18n language immediately
      const locale = LANGUAGE_TO_LOCALE[language]
      if (locale && locale !== i18n.language) {
        i18n.changeLanguage(locale)
      }

      toast({
        title: t("settings.language.preferencesSaved"),
        description: t("settings.language.preferencesSavedDesc"),
      })
    } catch (error: any) {
      console.error("Error saving language preferences:", error)
      toast({
        title: t("common.error"),
        description: error.message || "Failed to save preferences.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.language.title")}</CardTitle>
        <CardDescription>{t("settings.language.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="language">{t("settings.language.language")}</Label>
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger id="language">
                <SelectValue placeholder={t("settings.language.selectLanguage")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">{t("settings.language.languages.english")}</SelectItem>
                <SelectItem value="spanish">{t("settings.language.languages.spanish")}</SelectItem>
                <SelectItem value="french">{t("settings.language.languages.french")}</SelectItem>
                <SelectItem value="german">{t("settings.language.languages.german")}</SelectItem>
                <SelectItem value="japanese">{t("settings.language.languages.japanese")}</SelectItem>
                <SelectItem value="chinese">{t("settings.language.languages.chinese")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="region">{t("settings.language.region")}</Label>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger id="region">
                <SelectValue placeholder={t("settings.language.selectRegion")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="united-states">{t("settings.language.regions.united-states")}</SelectItem>
                <SelectItem value="canada">{t("settings.language.regions.canada")}</SelectItem>
                <SelectItem value="united-kingdom">{t("settings.language.regions.united-kingdom")}</SelectItem>
                <SelectItem value="australia">{t("settings.language.regions.australia")}</SelectItem>
                <SelectItem value="japan">{t("settings.language.regions.japan")}</SelectItem>
                <SelectItem value="germany">{t("settings.language.regions.germany")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">{t("settings.language.timeZone")}</Label>
            <Select value={timeZone} onValueChange={setTimeZone}>
              <SelectTrigger id="timezone">
                <SelectValue placeholder={t("settings.language.selectTimeZone")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pacific">{t("settings.language.timeZones.pacific")}</SelectItem>
                <SelectItem value="mountain">{t("settings.language.timeZones.mountain")}</SelectItem>
                <SelectItem value="central">{t("settings.language.timeZones.central")}</SelectItem>
                <SelectItem value="eastern">{t("settings.language.timeZones.eastern")}</SelectItem>
                <SelectItem value="gmt">{t("settings.language.timeZones.gmt")}</SelectItem>
                <SelectItem value="cet">{t("settings.language.timeZones.cet")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="pt-4 border-t">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">{t("settings.language.formatPreferences")}</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date-format">{t("settings.language.dateFormat")}</Label>
              <Select value={dateFormat} onValueChange={setDateFormat}>
                <SelectTrigger id="date-format">
                  <SelectValue placeholder={t("settings.language.selectDateFormat")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mm/dd/yyyy">{t("settings.language.dateFormats.mm/dd/yyyy")}</SelectItem>
                  <SelectItem value="dd/mm/yyyy">{t("settings.language.dateFormats.dd/mm/yyyy")}</SelectItem>
                  <SelectItem value="yyyy/mm/dd">{t("settings.language.dateFormats.yyyy/mm/dd")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time-format">{t("settings.language.timeFormat")}</Label>
              <Select value={timeFormat} onValueChange={setTimeFormat}>
                <SelectTrigger id="time-format">
                  <SelectValue placeholder={t("settings.language.selectTimeFormat")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12-hour">{t("settings.language.timeFormats.12-hour")}</SelectItem>
                  <SelectItem value="24-hour">{t("settings.language.timeFormats.24-hour")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">{t("settings.language.currency")}</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency">
                  <SelectValue placeholder={t("settings.language.selectCurrency")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="JPY">JPY (¥)</SelectItem>
                  <SelectItem value="CAD">CAD ($)</SelectItem>
                  <SelectItem value="AUD">AUD ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="distance-unit">{t("settings.language.distanceUnit")}</Label>
              <Select value={distanceUnit} onValueChange={setDistanceUnit}>
                <SelectTrigger id="distance-unit">
                  <SelectValue placeholder={t("settings.language.selectDistanceUnit")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="miles">{t("settings.language.miles")}</SelectItem>
                  <SelectItem value="kilometers">{t("settings.language.kilometers")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-3 rounded-md text-blue-800 text-sm flex items-start gap-2 mt-4">
          <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p>
            {t("settings.language.languageNote")}
          </p>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("common.saving")}
              </>
            ) : (
              t("settings.language.savePreferences")
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
