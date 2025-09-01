import { NextResponse } from "next/server"
import { generateDiscoveryFeed } from "@/lib/recommendation-algorithm"
import type { DiscoveryFeedRequest } from "@/lib/recommendation-types"

// This would be replaced with actual database queries in a real implementation
const mockData = {
  users: {
    user1: {
      likes: ["itinerary1", "itinerary3", "deal2"],
      searches: ["beach", "new york", "japan"],
      views: ["itinerary1", "itinerary2", "deal1", "promotion1"],
      categories: ["beach", "city", "adventure"],
      location: { latitude: 34.0522, longitude: -118.2437 }, // Los Angeles
    },
  },
  social: {
    user1: {
      friends: {
        friend1: ["itinerary2", "deal3"],
        friend2: ["itinerary1", "promotion2"],
      },
      following: ["user2", "user3"],
    },
  },
  items: {
    itineraries: [
      {
        id: "itinerary1",
        title: "Weekend in NYC",
        description: "The perfect 3-day NYC itinerary! Includes all the must-see spots.",
        type: "trip",
        startDate: "2025-03-15",
        endDate: "2025-03-17",
        location: "New York, NY",
        coverImage: "/placeholder.svg?height=600&width=400",
        createdBy: "user2",
        isPublic: true,
        isPromoted: false,
        activities: [],
        collaborators: [],
        likes: 2453,
        saves: 342,
        views: 5678,
      },
      {
        id: "itinerary2",
        title: "Tokyo Adventure",
        description: "10 days in Tokyo! From traditional temples to futuristic neighborhoods.",
        type: "trip",
        startDate: "2025-05-05",
        endDate: "2025-05-15",
        location: "Tokyo, Japan",
        coverImage: "/placeholder.svg?height=600&width=400",
        createdBy: "user3",
        isPublic: true,
        isPromoted: false,
        activities: [],
        collaborators: [],
        likes: 8932,
        saves: 1203,
        views: 15678,
      },
      {
        id: "itinerary3",
        title: "Bali Retreat",
        description: "Relaxing week in Bali with beaches, temples, and amazing food.",
        type: "trip",
        startDate: "2025-06-10",
        endDate: "2025-06-17",
        location: "Bali, Indonesia",
        coverImage: "/placeholder.svg?height=600&width=400",
        createdBy: "user4",
        isPublic: true,
        isPromoted: false,
        activities: [],
        collaborators: [],
        likes: 5432,
        saves: 876,
        views: 9876,
      },
    ],
    deals: [
      {
        id: "deal1",
        title: "Coastal Luxury Resort",
        type: "hotel",
        image: "/placeholder.svg?height=600&width=400",
        location: "Malibu, CA",
        price: 299,
        originalPrice: 499,
        discount: 40,
        validUntil: "2025-12-31",
        description: "Escape to our beachfront paradise with private cabanas and ocean-view dining.",
        provider: "Malibu Shores Resort",
        rating: 4.9,
      },
      {
        id: "deal2",
        title: "Round-trip to Tokyo",
        type: "flight",
        image: "/placeholder.svg?height=600&width=400",
        location: "LAX to NRT",
        price: 799,
        originalPrice: 1299,
        discount: 38,
        validUntil: "2025-12-31",
        description: "Non-stop flights with premium economy option. Flexible dates available.",
        provider: "Japan Airlines",
        rating: 4.7,
      },
      {
        id: "deal3",
        title: "Wine Country Tour",
        type: "activity",
        image: "/placeholder.svg?height=600&width=400",
        location: "Napa Valley, CA",
        price: 129,
        originalPrice: 179,
        discount: 28,
        validUntil: "2025-12-31",
        description: "Full-day tour of 4 premium wineries with tastings and lunch included.",
        provider: "Wine Country Tours",
        rating: 4.9,
      },
    ],
    promotions: [
      {
        id: "promotion1",
        type: "business",
        title: "Sunset Rooftop Bar",
        description: "Experience breathtaking views and craft cocktails at our rooftop oasis.",
        location: "Downtown LA",
        startDate: "2025-01-01",
        endDate: "2025-12-31",
        website: "https://example.com",
        image: "/placeholder.svg?height=600&width=400",
        budget: 1000,
        duration: 365,
        status: "active",
        createdBy: "business1",
        impressions: 5000,
        clicks: 500,
        saves: 100,
      },
      {
        id: "promotion2",
        type: "personal",
        title: "Group Trip to Hawaii",
        description: "Looking for 5 more people to join our group trip to Hawaii!",
        location: "Hawaii",
        startDate: "2025-07-15",
        endDate: "2025-07-22",
        website: "https://example.com",
        image: "/placeholder.svg?height=600&width=400",
        budget: 500,
        duration: 7,
        status: "active",
        createdBy: "user5",
        impressions: 2000,
        clicks: 300,
        saves: 50,
      },
    ],
    destinations: [
      {
        id: "destination1",
        name: "Kyoto",
        country: "Japan",
        description: "Historic city with beautiful temples, gardens, and traditional culture.",
        image: "/placeholder.svg?height=600&width=400",
        popularity: 0.85,
        tags: ["culture", "history", "temples"],
      },
      {
        id: "destination2",
        name: "Santorini",
        country: "Greece",
        description: "Stunning island with white-washed buildings and breathtaking sunsets.",
        image: "/placeholder.svg?height=600&width=400",
        popularity: 0.9,
        tags: ["beach", "romantic", "island"],
      },
      {
        id: "destination3",
        name: "Barcelona",
        country: "Spain",
        description: "Vibrant city with unique architecture, beaches, and amazing food.",
        image: "/placeholder.svg?height=600&width=400",
        popularity: 0.88,
        tags: ["city", "architecture", "food"],
      },
    ],
    users: [
      {
        id: "user2",
        email: "user2@example.com",
        name: "Alex Rodriguez",
        username: "alexr",
        avatar: "/placeholder.svg?height=40&width=40",
        createdAt: "2023-01-15",
      },
      {
        id: "user3",
        email: "user3@example.com",
        name: "Jordan Davis",
        username: "jordand",
        avatar: "/placeholder.svg?height=40&width=40",
        createdAt: "2023-02-20",
      },
      {
        id: "user4",
        email: "user4@example.com",
        name: "Taylor Kim",
        username: "taylork",
        avatar: "/placeholder.svg?height=40&width=40",
        createdAt: "2023-03-10",
      },
    ],
  },
  trending: ["itinerary2", "deal1", "promotion1", "destination2"],
}

export async function POST(request: Request) {
  try {
    const body: DiscoveryFeedRequest = await request.json()
    const { userId } = body

    // In a real implementation, you would fetch this data from a database
    const userPreferences = mockData.users[userId] || {
      likes: [],
      searches: [],
      views: [],
      categories: [],
      location: body.location,
    }

    const socialData = mockData.social[userId] || {
      friends: {},
      following: [],
    }

    const discoveryFeed = generateDiscoveryFeed(
      userId,
      userPreferences,
      socialData,
      {
        itineraries: mockData.items.itineraries,
        deals: mockData.items.deals,
        promotions: mockData.items.promotions,
        destinations: mockData.items.destinations,
        users: mockData.items.users,
      },
      mockData.trending,
      body.filters,
    )

    return NextResponse.json(discoveryFeed)
  } catch (error) {
    console.error("Error generating discovery feed:", error)
    return NextResponse.json({ error: "Failed to generate discovery feed" }, { status: 500 })
  }
}
