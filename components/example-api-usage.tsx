"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useItinerary } from "@/hooks/use-itinerary"
import { ApiClient } from "@/lib/api-client"
import type { Deal } from "@/lib/api-types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// This is an example component showing how to use the API client
export function ExampleApiUsage() {
  const { user, isAuthenticated, login, logout } = useAuth()
  const { itinerary, isLoading, error, fetchItinerary, createItinerary } = useItinerary()
  const [deals, setDeals] = useState<Deal[]>([])
  const [dealsLoading, setDealsLoading] = useState(false)

  // Example login
  const handleLogin = async () => {
    const result = await login({
      email: "user@example.com",
      password: "password123",
    })

    if (!result.success) {
      console.error("Login failed:", result.error)
    }
  }

  // Example itinerary creation
  const handleCreateItinerary = async () => {
    const newItinerary = await createItinerary({
      title: "Weekend in NYC",
      description: "Exploring the best of New York City",
      type: "trip",
      startDate: "2025-03-15",
      endDate: "2025-03-17",
      location: "New York, NY",
      isPublic: true,
      activities: [
        {
          title: "Brunch at Sarabeth's",
          description: "Meet up for brunch to start our NYC adventure!",
          location: "Central Park South",
          date: "2025-03-15",
          time: "10:00 AM",
          day: "Day 1",
        },
        {
          title: "Metropolitan Museum of Art",
          description: "Explore one of the world's greatest art museums.",
          location: "5th Avenue",
          date: "2025-03-15",
          time: "1:00 PM",
          day: "Day 1",
        },
      ],
    })

    if (newItinerary) {
      console.log("Created new itinerary:", newItinerary)
    }
  }

  // Example of fetching deals
  const fetchDeals = async () => {
    setDealsLoading(true)
    try {
      const response = await ApiClient.getDeals()
      if (response.data) {
        setDeals(response.data)
      }
    } catch (error) {
      console.error("Error fetching deals:", error)
    } finally {
      setDealsLoading(false)
    }
  }

  // Fetch an itinerary when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      fetchItinerary("123")
      fetchDeals()
    }
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>API Example</CardTitle>
          <CardDescription>You need to log in to use the API</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleLogin}>Log In</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Example</CardTitle>
        <CardDescription>
          Logged in as {user?.name} ({user?.email})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Itinerary</h3>
          {isLoading ? (
            <p>Loading itinerary...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : itinerary ? (
            <div>
              <p>
                <strong>{itinerary.title}</strong>
              </p>
              <p>{itinerary.description}</p>
              <p>
                {itinerary.location} • {itinerary.startDate}
                {itinerary.endDate && ` to ${itinerary.endDate}`}
              </p>
              <p>{itinerary.activities.length} activities</p>
            </div>
          ) : (
            <p>No itinerary loaded</p>
          )}
          <Button onClick={() => fetchItinerary("123")} className="mr-2">
            Fetch Itinerary
          </Button>
          <Button onClick={handleCreateItinerary}>Create New Itinerary</Button>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-medium">Deals</h3>
          {dealsLoading ? (
            <p>Loading deals...</p>
          ) : deals.length > 0 ? (
            <ul className="space-y-2">
              {deals.map((deal) => (
                <li key={deal.id} className="p-2 border rounded">
                  <p>
                    <strong>{deal.title}</strong> - {deal.discount}% OFF
                  </p>
                  <p>
                    {deal.location} • ${deal.price} (was ${deal.originalPrice})
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No deals loaded</p>
          )}
          <Button onClick={fetchDeals}>Fetch Deals</Button>
        </div>

        <Button variant="outline" onClick={logout}>
          Log Out
        </Button>
      </CardContent>
    </Card>
  )
}
