"use client"

import { useState } from "react"
import { Paintbrush, Check } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

interface AppearanceSettings {
  backgroundType: "gradient" | "image" | "solid" | "none"
  backgroundColor: string
  effects: string[]
  theme: "light" | "dark" | "auto"
}

export function CustomizeAppearance() {
  const [settings, setSettings] = useState<AppearanceSettings>({
    backgroundType: "gradient",
    backgroundColor: "peach",
    effects: [],
    theme: "light",
  })

  const [activeTab, setActiveTab] = useState("background")

  const backgroundColors = [
    { id: "peach", color: "bg-gradient-to-b from-orange-100 to-orange-200" },
    { id: "blue", color: "bg-gradient-to-b from-blue-100 to-blue-200" },
    { id: "green", color: "bg-gradient-to-b from-green-100 to-green-200" },
    { id: "purple", color: "bg-gradient-to-b from-purple-100 to-purple-200" },
  ]

  const handleBackgroundChange = (colorId: string) => {
    setSettings({
      ...settings,
      backgroundColor: colorId,
    })
  }

  const getPreviewStyle = () => {
    const bgColor = backgroundColors.find((bg) => bg.id === settings.backgroundColor)
    return bgColor ? bgColor.color : "bg-white"
  }

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="flex items-center text-xl font-semibold">
          <Paintbrush className="mr-2 h-5 w-5 text-orange-500" />
          Customize Appearance
        </CardTitle>
        <p className="text-sm text-muted-foreground">Personalize the look and feel of your itinerary</p>
      </CardHeader>
      <CardContent className="px-0 space-y-4">
        <div className="space-y-2">
          <p className="font-medium">Preview</p>
          <div className={`${getPreviewStyle()} rounded-lg p-4 flex justify-center items-center h-24`}>
            <div className="bg-white dark:bg-card rounded-lg p-3 shadow-sm w-40 text-center">
              <p className="font-semibold">Weekend in NYC</p>
              <p className="text-xs text-gray-500">Mar 15-17, 2025</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="background" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="background">Background</TabsTrigger>
            <TabsTrigger value="effects">Effects</TabsTrigger>
            <TabsTrigger value="theme">Theme</TabsTrigger>
          </TabsList>

          <TabsContent value="background" className="mt-4 space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Background Type</p>
              <div className="grid grid-cols-4 gap-2">
                <div
                  className={`border rounded-md p-2 flex flex-col items-center justify-center cursor-pointer ${
                    settings.backgroundType === "gradient" ? "border-orange-500 bg-orange-50" : ""
                  }`}
                  onClick={() => setSettings({ ...settings, backgroundType: "gradient" })}
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-orange-200 to-pink-200 mb-1 flex items-center justify-center">
                    {settings.backgroundType === "gradient" && <Check className="h-4 w-4 text-white" />}
                  </div>
                  <span className="text-xs">Gradient</span>
                </div>
                <div
                  className={`border rounded-md p-2 flex flex-col items-center justify-center cursor-pointer ${
                    settings.backgroundType === "image" ? "border-orange-500 bg-orange-50" : ""
                  }`}
                  onClick={() => setSettings({ ...settings, backgroundType: "image" })}
                >
                  <div className="h-8 w-8 rounded-full bg-gray-200 mb-1 flex items-center justify-center">
                    {settings.backgroundType === "image" ? <Check className="h-4 w-4 text-white" /> : "🖼️"}
                  </div>
                  <span className="text-xs">Image</span>
                </div>
                <div
                  className={`border rounded-md p-2 flex flex-col items-center justify-center cursor-pointer ${
                    settings.backgroundType === "solid" ? "border-orange-500 bg-orange-50" : ""
                  }`}
                  onClick={() => setSettings({ ...settings, backgroundType: "solid" })}
                >
                  <div className="h-8 w-8 rounded-full bg-orange-300 mb-1 flex items-center justify-center">
                    {settings.backgroundType === "solid" && <Check className="h-4 w-4 text-white" />}
                  </div>
                  <span className="text-xs">Solid Color</span>
                </div>
                <div
                  className={`border rounded-md p-2 flex flex-col items-center justify-center cursor-pointer ${
                    settings.backgroundType === "none" ? "border-orange-500 bg-orange-50" : ""
                  }`}
                  onClick={() => setSettings({ ...settings, backgroundType: "none" })}
                >
                  <div className="h-8 w-8 rounded-full bg-white dark:bg-card border border-gray-200 dark:border-border mb-1 flex items-center justify-center">
                    {settings.backgroundType === "none" && <Check className="h-4 w-4 text-gray-500" />}
                  </div>
                  <span className="text-xs">None</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Select Background</p>
              <div className="grid grid-cols-4 gap-2">
                {backgroundColors.map((bg) => (
                  <div
                    key={bg.id}
                    onClick={() => handleBackgroundChange(bg.id)}
                    className={`h-16 w-full rounded-md ${bg.color} cursor-pointer relative ${
                      settings.backgroundColor === bg.id ? "ring-2 ring-orange-500" : ""
                    }`}
                  >
                    {settings.backgroundColor === bg.id && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Check className="h-5 w-5 text-white drop-shadow-md" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="effects" className="mt-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Visual Effects</p>
              <div className="grid grid-cols-2 gap-2">
                <div
                  className={`border rounded-md p-3 cursor-pointer ${
                    settings.effects.includes("blur") ? "border-orange-500 bg-orange-50" : ""
                  }`}
                  onClick={() => {
                    const newEffects = settings.effects.includes("blur")
                      ? settings.effects.filter((e) => e !== "blur")
                      : [...settings.effects, "blur"]
                    setSettings({ ...settings, effects: newEffects })
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span>Blur Background</span>
                    {settings.effects.includes("blur") && <Check className="h-4 w-4 text-orange-500" />}
                  </div>
                </div>
                <div
                  className={`border rounded-md p-3 cursor-pointer ${
                    settings.effects.includes("shadow") ? "border-orange-500 bg-orange-50" : ""
                  }`}
                  onClick={() => {
                    const newEffects = settings.effects.includes("shadow")
                      ? settings.effects.filter((e) => e !== "shadow")
                      : [...settings.effects, "shadow"]
                    setSettings({ ...settings, effects: newEffects })
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span>Enhanced Shadows</span>
                    {settings.effects.includes("shadow") && <Check className="h-4 w-4 text-orange-500" />}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="theme" className="mt-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Color Theme</p>
              <div className="grid grid-cols-3 gap-2">
                <div
                  className={`border rounded-md p-3 cursor-pointer ${
                    settings.theme === "light" ? "border-orange-500 bg-orange-50" : ""
                  }`}
                  onClick={() => setSettings({ ...settings, theme: "light" })}
                >
                  <div className="flex items-center justify-between">
                    <span>Light</span>
                    {settings.theme === "light" && <Check className="h-4 w-4 text-orange-500" />}
                  </div>
                </div>
                <div
                  className={`border rounded-md p-3 cursor-pointer ${
                    settings.theme === "dark" ? "border-orange-500 bg-orange-50" : ""
                  }`}
                  onClick={() => setSettings({ ...settings, theme: "dark" })}
                >
                  <div className="flex items-center justify-between">
                    <span>Dark</span>
                    {settings.theme === "dark" && <Check className="h-4 w-4 text-orange-500" />}
                  </div>
                </div>
                <div
                  className={`border rounded-md p-3 cursor-pointer ${
                    settings.theme === "auto" ? "border-orange-500 bg-orange-50" : ""
                  }`}
                  onClick={() => setSettings({ ...settings, theme: "auto" })}
                >
                  <div className="flex items-center justify-between">
                    <span>Auto</span>
                    {settings.theme === "auto" && <Check className="h-4 w-4 text-orange-500" />}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Button className="w-full bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600">
          Apply Changes
        </Button>
      </CardContent>
    </Card>
  )
}
