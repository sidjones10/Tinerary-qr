"use client"

import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface ProfileItinerariesProps {
  itineraries: any[]
  loading: boolean
  onCreateNew: () => void
}

export function ProfileItineraries({ itineraries, loading, onCreateNew }: ProfileItinerariesProps) {
  const router = useRouter()

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Itineraries</CardTitle>
          <CardDescription>View and manage all your created itineraries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-2 text-muted-foreground">Loading your itineraries...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Itineraries</CardTitle>
        <CardDescription>View and manage all your created itineraries</CardDescription>
      </CardHeader>
      <CardContent>
        {itineraries.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">You haven't created any itineraries yet.</p>
            <Button onClick={onCreateNew} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Create your first itinerary
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {itineraries.map((itinerary) => (
              <Card key={itinerary.id} className="overflow-hidden">
                <div className="aspect-video bg-muted relative">
                  {itinerary.cover_image_url ? (
                    <img
                      src={itinerary.cover_image_url || "/placeholder.svg"}
                      alt={itinerary.title}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <span className="text-white font-medium">{itinerary.location || "Itinerary"}</span>
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium truncate">{itinerary.title || "Untitled Itinerary"}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(itinerary.start_date).toLocaleDateString()} -{" "}
                    {new Date(itinerary.end_date).toLocaleDateString()}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/event/${itinerary.id}`)}
                    className="mt-3 w-full"
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
