"use client"

import { useState } from "react"
import { Check, ChevronDown, ImageIcon, Palette, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface BackgroundOption {
  id: string
  name: string
  type: "gradient" | "image" | "color"
  value: string
  thumbnail: string
}

export function ItineraryCustomizer() {
  const [selectedBackground, setSelectedBackground] = useState<string>("gradient1")
  const [opacity, setOpacity] = useState(80)
  const [blur, setBlur] = useState(10)

  const backgroundOptions: BackgroundOption[] = [
    {
      id: "gradient1",
      name: "Sunset Gradient",
      type: "gradient",
      value: "linear-gradient(to bottom, #ffecd2, #fcb69f)",
      thumbnail: "/placeholder.svg?height=60&width=60",
    },
    {
      id: "gradient2",
      name: "Ocean Blue",
      type: "gradient",
      value: "linear-gradient(to bottom, #4facfe, #00f2fe)",
      thumbnail: "/placeholder.svg?height=60&width=60",
    },
    {
      id: "gradient3",
      name: "Forest Green",
      type: "gradient",
      value: "linear-gradient(to bottom, #a8ff78, #78ffd6)",
      thumbnail: "/placeholder.svg?height=60&width=60",
    },
    {
      id: "gradient4",
      name: "Purple Haze",
      type: "gradient",
      value: "linear-gradient(to bottom, #c471f5, #fa71cd)",
      thumbnail: "/placeholder.svg?height=60&width=60",
    },
    {
      id: "image1",
      name: "Beach",
      type: "image",
      value: "/placeholder.svg?height=1080&width=1920",
      thumbnail: "/placeholder.svg?height=60&width=60",
    },
    {
      id: "image2",
      name: "Mountains",
      type: "image",
      value: "/placeholder.svg?height=1080&width=1920",
      thumbnail: "/placeholder.svg?height=60&width=60",
    },
    {
      id: "image3",
      name: "City",
      type: "image",
      value: "/placeholder.svg?height=1080&width=1920",
      thumbnail: "/placeholder.svg?height=60&width=60",
    },
    {
      id: "color1",
      name: "White",
      type: "color",
      value: "#ffffff",
      thumbnail: "/placeholder.svg?height=60&width=60",
    },
    {
      id: "color2",
      name: "Light Gray",
      type: "color",
      value: "#f5f5f5",
      thumbnail: "/placeholder.svg?height=60&width=60",
    },
  ]

  const getSelectedBackgroundOption = () => {
    return backgroundOptions.find((option) => option.id === selectedBackground) || backgroundOptions[0]
  }

  const getBackgroundStyle = () => {
    const option = getSelectedBackgroundOption()

    if (option.type === "gradient") {
      return { background: option.value }
    } else if (option.type === "image") {
      return {
        backgroundImage: `url(${option.value})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    } else {
      return { backgroundColor: option.value }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Palette className="mr-2 h-5 w-5 text-orange-500" />
          Customize Appearance
        </CardTitle>
        <CardDescription>Personalize the look and feel of your itinerary</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Preview</Label>
          <div className="relative h-40 rounded-lg overflow-hidden">
            <div className="absolute inset-0" style={getBackgroundStyle()}></div>
            <div
              className="absolute inset-0 backdrop-blur-sm"
              style={{ backdropFilter: `blur(${blur}px)`, opacity: opacity / 100 }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-lg">
                <h3 className="font-bold">Weekend in NYC</h3>
                <p className="text-sm text-muted-foreground">Mar 15-17, 2025</p>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="background">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="background">Background</TabsTrigger>
            <TabsTrigger value="effects">Effects</TabsTrigger>
            <TabsTrigger value="theme">Theme</TabsTrigger>
          </TabsList>

          <TabsContent value="background" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Background Type</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  className={`flex flex-col items-center justify-center h-auto py-2 ${
                    getSelectedBackgroundOption().type === "gradient" ? "border-orange-500 bg-orange-50" : ""
                  }`}
                  onClick={() => setSelectedBackground("gradient1")}
                >
                  <div className="h-6 w-6 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 mb-1"></div>
                  <span className="text-xs">Gradient</span>
                </Button>
                <Button
                  variant="outline"
                  className={`flex flex-col items-center justify-center h-auto py-2 ${
                    getSelectedBackgroundOption().type === "image" ? "border-orange-500 bg-orange-50" : ""
                  }`}
                  onClick={() => setSelectedBackground("image1")}
                >
                  <ImageIcon className="h-6 w-6 mb-1" />
                  <span className="text-xs">Image</span>
                </Button>
                <Button
                  variant="outline"
                  className={`flex flex-col items-center justify-center h-auto py-2 ${
                    getSelectedBackgroundOption().type === "color" ? "border-orange-500 bg-orange-50" : ""
                  }`}
                  onClick={() => setSelectedBackground("color1")}
                >
                  <div className="h-6 w-6 rounded-full bg-gray-200 mb-1"></div>
                  <span className="text-xs">Solid Color</span>
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Select Background</Label>
              <div className="grid grid-cols-4 gap-2">
                {backgroundOptions
                  .filter((option) => option.type === getSelectedBackgroundOption().type)
                  .map((option) => (
                    <div
                      key={option.id}
                      className={`relative aspect-square rounded-md overflow-hidden cursor-pointer border-2 ${
                        selectedBackground === option.id ? "border-orange-500" : "border-transparent"
                      }`}
                      onClick={() => setSelectedBackground(option.id)}
                    >
                      <img
                        src={option.thumbnail || "/placeholder.svg"}
                        alt={option.name}
                        className="h-full w-full object-cover"
                      />
                      {selectedBackground === option.id && (
                        <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center">
                          <Check className="h-6 w-6 text-white" />
                        </div>
                      )}
                    </div>
                  ))}

                <div className="aspect-square rounded-md border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
            </div>

            {getSelectedBackgroundOption().type === "image" && (
              <div className="space-y-2">
                <Label>Upload Custom Background</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <div className="mx-auto w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-2">
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">Drag and drop an image, or click to browse</p>
                  <p className="text-xs text-muted-foreground">Recommended size: 1920 x 1080 pixels</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="effects" className="space-y-4 pt-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Overlay Opacity</Label>
                <span className="text-sm">{opacity}%</span>
              </div>
              <Slider value={[opacity]} min={0} max={100} step={5} onValueChange={(value) => setOpacity(value[0])} />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Blur Effect</Label>
                <span className="text-sm">{blur}px</span>
              </div>
              <Slider value={[blur]} min={0} max={20} step={1} onValueChange={(value) => setBlur(value[0])} />
            </div>

            <div className="space-y-2">
              <Label>Text Color</Label>
              <div className="grid grid-cols-6 gap-2">
                <div className="aspect-square rounded-full bg-white border cursor-pointer"></div>
                <div className="aspect-square rounded-full bg-black cursor-pointer"></div>
                <div className="aspect-square rounded-full bg-orange-500 cursor-pointer"></div>
                <div className="aspect-square rounded-full bg-blue-500 cursor-pointer"></div>
                <div className="aspect-square rounded-full bg-green-500 cursor-pointer"></div>
                <div className="aspect-square rounded-full bg-purple-500 cursor-pointer"></div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="theme" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Color Theme</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="justify-start border-orange-500 bg-orange-50">
                  <div className="h-4 w-4 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 mr-2"></div>
                  Sunset (Default)
                </Button>
                <Button variant="outline" className="justify-start">
                  <div className="h-4 w-4 rounded-full bg-gradient-to-r from-blue-400 to-cyan-300 mr-2"></div>
                  Ocean Blue
                </Button>
                <Button variant="outline" className="justify-start">
                  <div className="h-4 w-4 rounded-full bg-gradient-to-r from-green-400 to-emerald-300 mr-2"></div>
                  Forest Green
                </Button>
                <Button variant="outline" className="justify-start">
                  <div className="h-4 w-4 rounded-full bg-gradient-to-r from-violet-400 to-purple-300 mr-2"></div>
                  Purple Haze
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Font Style</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span>Inter (Default)</span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <div className="p-2">
                    <div className="cursor-pointer p-2 hover:bg-muted rounded-md">
                      <p className="font-sans">Inter (Default)</p>
                    </div>
                    <div className="cursor-pointer p-2 hover:bg-muted rounded-md">
                      <p className="font-serif">Serif</p>
                    </div>
                    <div className="cursor-pointer p-2 hover:bg-muted rounded-md">
                      <p className="font-mono">Monospace</p>
                    </div>
                    <div className="cursor-pointer p-2 hover:bg-muted rounded-md">
                      <p style={{ fontFamily: "cursive" }}>Cursive</p>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button className="btn-sunset">
            <Check className="mr-2 h-4 w-4" />
            Apply Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
