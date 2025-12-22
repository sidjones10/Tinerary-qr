"use client"

import { useState } from "react"
import { Check, Lightbulb, Loader2, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"

interface AiRecommendationsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: "event" | "trip"
}

export function AiRecommendations({ open, onOpenChange, type }: AiRecommendationsProps) {
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState("")
  const [hasRecommendations, setHasRecommendations] = useState(false)

  // Sample data - in a real app, this would come from an AI API
  const recommendations = {
    restaurants: [
      { name: "Nobu", description: "High-end Japanese fusion restaurant", location: "Downtown" },
      { name: "The Ivy", description: "Celebrity hotspot with California cuisine", location: "Beverly Hills" },
      { name: "Bestia", description: "Italian restaurant with rustic dishes", location: "Arts District" },
    ],
    activities: [
      { name: "Museum of Contemporary Art", description: "Modern art museum", location: "Downtown" },
      { name: "Griffith Observatory", description: "Astronomy exhibits with city views", location: "Los Feliz" },
      { name: "Venice Beach Boardwalk", description: "Beachfront promenade with shops", location: "Venice" },
    ],
    nightlife: [
      { name: "Academy Nightclub", description: "Multi-room dance club with DJs", location: "Hollywood" },
      { name: "The Spare Room", description: "Vintage bowling and cocktails", location: "Hollywood" },
      { name: "Good Times at Davey Wayne's", description: "70s-themed speakeasy", location: "Hollywood" },
    ],
  }

  const handleGetRecommendations = () => {
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      setHasRecommendations(true)
    }, 1500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Lightbulb className="mr-2 h-5 w-5 text-yellow-500" />
            AI Recommendations
          </DialogTitle>
          <DialogDescription>Get personalized suggestions based on your {type} details</DialogDescription>
        </DialogHeader>

        {!hasRecommendations ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="query">What are you looking for?</Label>
              <Input
                id="query"
                placeholder={type === "event" ? "Rooftop bars in Los Angeles" : "3-day itinerary in New York City"}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" onClick={() => setQuery("Restaurants")}>
                Restaurants
              </Button>
              <Button variant="outline" onClick={() => setQuery("Activities")}>
                Activities
              </Button>
              <Button variant="outline" onClick={() => setQuery("Nightlife")}>
                Nightlife
              </Button>
            </div>

            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Our AI will suggest options based on your location, dates, and preferences.
              </p>
            </div>
          </div>
        ) : (
          <div className="py-4">
            <Tabs defaultValue="restaurants">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="restaurants">Restaurants</TabsTrigger>
                <TabsTrigger value="activities">Activities</TabsTrigger>
                <TabsTrigger value="nightlife">Nightlife</TabsTrigger>
              </TabsList>

              <TabsContent value="restaurants" className="mt-4 space-y-4">
                {recommendations.restaurants.map((item, index) => (
                  <Card key={index} className="flex items-start p-4">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.location}</p>
                    </div>
                    <Button variant="outline" size="sm" className="ml-2">
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="activities" className="mt-4 space-y-4">
                {recommendations.activities.map((item, index) => (
                  <Card key={index} className="flex items-start p-4">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.location}</p>
                    </div>
                    <Button variant="outline" size="sm" className="ml-2">
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="nightlife" className="mt-4 space-y-4">
                {recommendations.nightlife.map((item, index) => (
                  <Card key={index} className="flex items-start p-4">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.location}</p>
                    </div>
                    <Button variant="outline" size="sm" className="ml-2">
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        )}

        <DialogFooter>
          {!hasRecommendations ? (
            <Button
              onClick={handleGetRecommendations}
              disabled={loading || !query}
              className="bg-gradient-to-r from-violet-500 via-pink-500 to-orange-400 hover:from-violet-600 hover:via-pink-600 hover:to-orange-500 text-white border-0"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Get Recommendations"
              )}
            </Button>
          ) : (
            <Button
              onClick={() => onOpenChange(false)}
              className="bg-gradient-to-r from-violet-500 via-pink-500 to-orange-400 hover:from-violet-600 hover:via-pink-600 hover:to-orange-500 text-white border-0"
            >
              <Check className="mr-2 h-4 w-4" />
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
