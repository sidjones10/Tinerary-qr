"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Sun, Moon, Monitor, Grid, List } from "lucide-react"
import { useTheme } from "next-themes"
import { useAuth } from "@/providers/auth-provider"
import { createClient } from "@/lib/supabase/client"

export function AppearanceSettings() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const { user } = useAuth()

  const [colorTheme, setColorTheme] = useState("lavender")
  const [fontSize, setFontSize] = useState("medium")
  const [layout, setLayout] = useState("grid")

  // Load appearance preferences from database
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return

      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("user_preferences")
          .select("appearance_preferences")
          .eq("user_id", user.id)
          .single()

        if (error && error.code !== "PGRST116") {
          console.error("Error loading appearance preferences:", error)
          return
        }

        if (data?.appearance_preferences) {
          const prefs = data.appearance_preferences
          if (prefs.colorTheme) setColorTheme(prefs.colorTheme)
          if (prefs.fontSize) setFontSize(prefs.fontSize)
          if (prefs.layout) setLayout(prefs.layout)
          // Theme is handled by next-themes provider
        }
      } catch (error) {
        console.error("Error loading appearance preferences:", error)
      }
    }

    loadPreferences()
  }, [user])

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to save preferences.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()

      const appearancePreferences = {
        theme: theme || "system",
        colorTheme,
        fontSize,
        layout,
      }

      // Try to update existing preferences
      const { error: updateError } = await supabase
        .from("user_preferences")
        .update({
          appearance_preferences: appearancePreferences,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)

      // If no rows were updated, insert a new row
      if (updateError && updateError.code === "PGRST116") {
        const { error: insertError } = await supabase
          .from("user_preferences")
          .insert({
            user_id: user.id,
            appearance_preferences: appearancePreferences,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

        if (insertError) throw insertError
      } else if (updateError) {
        throw updateError
      }

      toast({
        title: "Preferences saved",
        description: "Your appearance preferences have been updated.",
      })
    } catch (error: any) {
      console.error("Error saving appearance preferences:", error)
      toast({
        title: "Error",
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
        <CardTitle>Appearance Settings</CardTitle>
        <CardDescription>Customize how Itinerary looks for you</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Theme</h3>

          <div className="grid grid-cols-3 gap-4">
            <div
              className={`border rounded-md p-4 cursor-pointer flex flex-col items-center gap-2 ${
                theme === "light" ? "border-primary bg-primary/5" : ""
              }`}
              onClick={() => setTheme("light")}
            >
              <div className="h-20 w-full bg-white border rounded-md flex items-center justify-center">
                <Sun className="h-8 w-8 text-amber-500" />
              </div>
              <span className="text-sm font-medium">Light</span>
            </div>

            <div
              className={`border rounded-md p-4 cursor-pointer flex flex-col items-center gap-2 ${
                theme === "dark" ? "border-primary bg-primary/5" : ""
              }`}
              onClick={() => setTheme("dark")}
            >
              <div className="h-20 w-full bg-gray-900 border rounded-md flex items-center justify-center">
                <Moon className="h-8 w-8 text-blue-400" />
              </div>
              <span className="text-sm font-medium">Dark</span>
            </div>

            <div
              className={`border rounded-md p-4 cursor-pointer flex flex-col items-center gap-2 ${
                theme === "system" ? "border-primary bg-primary/5" : ""
              }`}
              onClick={() => setTheme("system")}
            >
              <div className="h-20 w-full bg-gradient-to-r from-white to-gray-900 border rounded-md flex items-center justify-center">
                <Monitor className="h-8 w-8 text-purple-500" />
              </div>
              <span className="text-sm font-medium">System</span>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-medium text-muted-foreground">Color Theme</h3>

          <div className="flex flex-wrap gap-4">
            <div
              className={`w-12 h-12 rounded-full bg-red-500 cursor-pointer flex items-center justify-center ${
                colorTheme === "sunset" ? "ring-2 ring-offset-2 ring-red-500" : ""
              }`}
              onClick={() => setColorTheme("sunset")}
            >
              {colorTheme === "sunset" && <div className="w-3 h-3 bg-white rounded-full" />}
            </div>

            <div
              className={`w-12 h-12 rounded-full bg-blue-500 cursor-pointer flex items-center justify-center ${
                colorTheme === "ocean" ? "ring-2 ring-offset-2 ring-blue-500" : ""
              }`}
              onClick={() => setColorTheme("ocean")}
            >
              {colorTheme === "ocean" && <div className="w-3 h-3 bg-white rounded-full" />}
            </div>

            <div
              className={`w-12 h-12 rounded-full bg-green-500 cursor-pointer flex items-center justify-center ${
                colorTheme === "forest" ? "ring-2 ring-offset-2 ring-green-500" : ""
              }`}
              onClick={() => setColorTheme("forest")}
            >
              {colorTheme === "forest" && <div className="w-3 h-3 bg-white rounded-full" />}
            </div>

            <div
              className={`w-12 h-12 rounded-full bg-purple-500 cursor-pointer flex items-center justify-center ${
                colorTheme === "lavender" ? "ring-2 ring-offset-2 ring-purple-500" : ""
              }`}
              onClick={() => setColorTheme("lavender")}
            >
              {colorTheme === "lavender" && <div className="w-3 h-3 bg-white rounded-full" />}
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-medium text-muted-foreground">Font Size</h3>

          <div className="flex gap-4">
            <Button
              variant={fontSize === "small" ? "default" : "outline"}
              onClick={() => setFontSize("small")}
              className="flex-1"
            >
              Small
            </Button>

            <Button
              variant={fontSize === "medium" ? "default" : "outline"}
              onClick={() => setFontSize("medium")}
              className="flex-1"
            >
              Medium
            </Button>

            <Button
              variant={fontSize === "large" ? "default" : "outline"}
              onClick={() => setFontSize("large")}
              className="flex-1"
            >
              Large
            </Button>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-medium text-muted-foreground">Home Screen Layout</h3>

          <div className="grid grid-cols-2 gap-4">
            <div
              className={`border rounded-md p-4 cursor-pointer flex flex-col items-center gap-2 ${
                layout === "grid" ? "border-primary bg-primary/5" : ""
              }`}
              onClick={() => setLayout("grid")}
            >
              <div className="h-16 w-full flex items-center justify-center">
                <Grid className="h-8 w-8" />
              </div>
              <span className="text-sm font-medium">Grid</span>
            </div>

            <div
              className={`border rounded-md p-4 cursor-pointer flex flex-col items-center gap-2 ${
                layout === "list" ? "border-primary bg-primary/5" : ""
              }`}
              onClick={() => setLayout("list")}
            >
              <div className="h-16 w-full flex items-center justify-center">
                <List className="h-8 w-8" />
              </div>
              <span className="text-sm font-medium">List</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Preferences"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
