"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EventCard } from "@/components/event-card"
import { DiscoveryFeed } from "@/components/discovery-feed"
import Link from "next/link"

// Sample data
const exampleEvents = [
  {
    id: "1",
    title: "Weekend in NYC",
    type: "Trip" as const,
    image: "/placeholder.svg?height=400&width=600",
    date: "Mar 15-17, 2025",
    location: "New York, NY",
    organizer: {
      name: "Alex Rodriguez",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    attendees: 6,
  },
  {
    id: "2",
    title: "Coachella Music Festival",
    type: "Event" as const,
    image: "/placeholder.svg?height=400&width=600",
    date: "Apr 10, 2025 • 12:00 PM - 11:00 PM",
    location: "Indio, CA",
    organizer: {
      name: "Taylor Moore",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    attendees: 12,
  },
  {
    id: "3",
    title: "Rooftop Birthday Party",
    type: "Event" as const,
    image: "/placeholder.svg?height=400&width=600",
    date: "Mar 22, 2025 • 8:00 PM - 1:00 AM",
    location: "Downtown LA",
    organizer: {
      name: "You",
    },
    isOrganizer: true,
    attendees: 25,
  },
  {
    id: "4",
    title: "Wine Tasting Tour",
    type: "Event" as const,
    image: "/placeholder.svg?height=400&width=600",
    date: "Mar 28, 2025 • 2:00 PM - 6:00 PM",
    location: "Napa Valley, CA",
    organizer: {
      name: "Jordan Davis",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    attendees: 8,
  },
  {
    id: "5",
    title: "Tokyo Adventure",
    type: "Trip" as const,
    image: "/placeholder.svg?height=400&width=600",
    date: "May 5-15, 2025",
    location: "Tokyo, Japan",
    organizer: {
      name: "Jordan Davis",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    attendees: 4,
  },
  {
    id: "6",
    title: "Beach Bonfire",
    type: "Event" as const,
    image: "/placeholder.svg?height=400&width=600",
    date: "Jun 15, 2025 • 7:00 PM - 11:00 PM",
    location: "Santa Monica, CA",
    organizer: {
      name: "Samantha Lee",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    attendees: 15,
  },
]

// Past events
const pastEvents = [
  {
    id: "7",
    title: "Hiking Trip",
    type: "Trip" as const,
    image: "/placeholder.svg?height=400&width=600",
    date: "Feb 10-12, 2025",
    location: "Yosemite, CA",
    organizer: {
      name: "Mike Johnson",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    attendees: 8,
  },
  {
    id: "8",
    title: "Art Gallery Opening",
    type: "Event" as const,
    image: "/placeholder.svg?height=400&width=600",
    date: "Jan 15, 2025 • 7:00 PM - 10:00 PM",
    location: "San Francisco, CA",
    organizer: {
      name: "Emma Wilson",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    attendees: 35,
  },
]

export function FeedPage() {
  const [feedTab, setFeedTab] = useState<"forYou" | "discover">("forYou")
  const [timeTab, setTimeTab] = useState<"upcoming" | "past">("upcoming")

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(to bottom, #ffecd2, #fcb69f 40%, #ffffff 80%)" }}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Your Feed</h1>
          <Button asChild className="btn-sunset">
            <Link href="/create">
              <Plus className="h-4 w-4 mr-2" />
              Create New
            </Link>
          </Button>
        </div>

        {/* Feed Tabs */}
        <div className="bg-white rounded-full p-1 mb-6 inline-flex w-full max-w-md">
          <button
            className={`flex-1 px-6 py-2 rounded-full text-sm font-medium transition-colors ${
              feedTab === "forYou" ? "bg-[#FF9B7D] text-white" : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setFeedTab("forYou")}
          >
            For You
          </button>
          <button
            className={`flex-1 px-6 py-2 rounded-full text-sm font-medium transition-colors ${
              feedTab === "discover" ? "bg-[#FF9B7D] text-white" : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setFeedTab("discover")}
          >
            Discover
          </button>
        </div>

        {feedTab === "forYou" && (
          <>
            {/* Time Tabs - Only show for "For You" tab */}
            <div className="bg-white rounded-full p-1 mb-8 inline-flex w-full max-w-md">
              <button
                className={`flex-1 px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                  timeTab === "upcoming" ? "bg-[#FF9B7D] text-white" : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setTimeTab("upcoming")}
              >
                Upcoming
              </button>
              <button
                className={`flex-1 px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                  timeTab === "past" ? "bg-[#FF9B7D] text-white" : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setTimeTab("past")}
              >
                Past
              </button>
            </div>

            {/* Event Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {timeTab === "upcoming"
                ? exampleEvents.map((event) => <EventCard key={event.id} event={event} />)
                : pastEvents.map((event) => <EventCard key={event.id} event={event} />)}
            </div>
          </>
        )}

        {feedTab === "discover" && (
          <div className="h-[calc(100vh-200px)]">
            <DiscoveryFeed />
          </div>
        )}
      </div>
    </div>
  )
}
