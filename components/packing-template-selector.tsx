"use client"

import { useState } from "react"
import { Sparkles, Cloud, ThermometerSun, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getAllTemplates, getWeatherRecommendations, type PackingTemplate } from "@/lib/packing-templates"

interface PackingTemplateSelectorProps {
  onSelectTemplate: (items: { name: string; category: string; quantity: number }[]) => void
  location?: string
}

export function PackingTemplateSelector({ onSelectTemplate, location }: PackingTemplateSelectorProps) {
  const [open, setOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<PackingTemplate | null>(null)
  const [showWeather, setShowWeather] = useState(false)
  const [weatherTemp, setWeatherTemp] = useState("75")
  const [weatherCondition, setWeatherCondition] = useState("Clear")

  const templates = getAllTemplates()

  const handleSelectTemplate = () => {
    if (selectedTemplate) {
      const items = selectedTemplate.items.map((item) => ({
        name: item.name,
        category: item.category,
        quantity: item.quantity,
      }))
      onSelectTemplate(items)
      setOpen(false)
      setSelectedTemplate(null)
    }
  }

  const weatherRecommendations = showWeather ? getWeatherRecommendations(weatherCondition, parseInt(weatherTemp)) : null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Sparkles className="h-4 w-4" />
          Use Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Packing List Templates</DialogTitle>
          <DialogDescription>
            Choose a template to quickly fill your packing list, or get weather-based recommendations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Weather Recommendations Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Cloud className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold">Weather-Based Recommendations</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowWeather(!showWeather)}
              >
                {showWeather ? "Hide" : "Show"} Weather Tips
              </Button>
            </div>

            {showWeather && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weather-temp">Temperature (°F)</Label>
                    <div className="flex items-center gap-2">
                      <ThermometerSun className="h-4 w-4 text-orange-500" />
                      <Input
                        id="weather-temp"
                        type="number"
                        value={weatherTemp}
                        onChange={(e) => setWeatherTemp(e.target.value)}
                        placeholder="75"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weather-condition">Condition</Label>
                    <select
                      id="weather-condition"
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={weatherCondition}
                      onChange={(e) => setWeatherCondition(e.target.value)}
                    >
                      <option value="Clear">Clear/Sunny</option>
                      <option value="Cloudy">Cloudy</option>
                      <option value="Rain">Rainy</option>
                      <option value="Snow">Snowy</option>
                      <option value="Windy">Windy</option>
                    </select>
                  </div>
                </div>

                {weatherRecommendations && (
                  <Alert>
                    <Cloud className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="font-semibold">{weatherRecommendations.condition} Weather Tips:</p>
                        <p className="text-sm">{weatherRecommendations.notes}</p>
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-2">Recommended items:</p>
                          <div className="flex flex-wrap gap-1">
                            {weatherRecommendations.items.map((item, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Template Selection */}
          <div>
            <h3 className="font-semibold mb-4">Choose a Template</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedTemplate?.id === template.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <span className="text-2xl">{template.icon}</span>
                      <span>{template.name}</span>
                    </CardTitle>
                    <CardDescription className="text-xs">{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{template.items.length} items</span>
                        <Badge variant="outline" className="text-xs">
                          {template.items.filter((i) => i.essential).length} essential
                        </Badge>
                      </div>
                      {selectedTemplate?.id === template.id && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs font-medium mb-2">Preview items:</p>
                          <div className="flex flex-wrap gap-1">
                            {template.items.slice(0, 6).map((item, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {item.name}
                              </Badge>
                            ))}
                            {template.items.length > 6 && (
                              <Badge variant="secondary" className="text-xs">
                                +{template.items.length - 6} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSelectTemplate}
            disabled={!selectedTemplate}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add {selectedTemplate?.items.length || 0} Items
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
