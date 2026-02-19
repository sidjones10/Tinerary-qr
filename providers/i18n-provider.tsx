"use client"

import { useEffect } from "react"
import { I18nextProvider } from "react-i18next"
import i18n, { LANGUAGE_TO_LOCALE } from "@/lib/i18n"
import { useAuth } from "@/providers/auth-provider"
import { createClient } from "@/lib/supabase/client"

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  useEffect(() => {
    const loadLanguagePreference = async () => {
      if (!user) return

      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("user_preferences")
          .select("language_preferences")
          .eq("user_id", user.id)
          .single()

        if (error && error.code !== "PGRST116") {
          console.error("Error loading language preference:", error)
          return
        }

        if (data?.language_preferences?.language) {
          const locale = LANGUAGE_TO_LOCALE[data.language_preferences.language]
          if (locale && locale !== i18n.language) {
            i18n.changeLanguage(locale)
          }
        }
      } catch (error) {
        console.error("Error loading language preference:", error)
      }
    }

    loadLanguagePreference()
  }, [user])

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
