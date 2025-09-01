"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Sun, Moon, Monitor, Grid, List } from "lucide-react"

export function AppearanceSettings() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const [theme, setTheme] = useState("light")
  const [colorTheme, setColorTheme] = useState("lavender")
  const [fontSize, setFontSize] = useState("medium")
  const [layout, setLayout] = useState("grid")

  const handleSave = async () => {
    setIsLoading(true)

    try {
      // Save appearance settings logic would go here

      toast({
        title: "Preferences saved",
        description: "Your appearance preferences have been updated.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save preferences.",
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
