"use client"

import { useState } from "react"
import { ArrowRight, Clock, Hotel, MapPin, Plane, Tag, Ticket, Utensils } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

interface Deal {
  id: string
  title: string
  type: "hotel" | "flight" | "activity" | "restaurant"
  image: string
  location: string
  price: number
  originalPrice: number
  discount: number
  validUntil: string
  description: string
  provider: string
  rating: number
}

export function SpecialDeals() {
  const [deals] = useState<Deal[]>([
    {
      id: "1",
      title: "Luxury Beachfront Resort",
      type: "hotel",
      image: "/placeholder.svg?height=200&width=400",
      location: "Malibu, CA",
      price: 249,
      originalPrice: 399,
      discount: 38,
      validUntil: "May 31, 2025",
      description: "Ocean view rooms with private balconies. Includes breakfast and spa access.",
      provider: "Coastal Luxury Hotels",
      rating: 4.8,
    },
    {
      id: "2",
      title: "Round-trip to Tokyo",
      type: "flight",
      image: "/placeholder.svg?height=200&width=400",
      location: "LAX to NRT",
      price: 799,
      originalPrice: 1299,
      discount: 38,
      validUntil: "Jun 15, 2025",
      description: "Non-stop flights with premium economy option. Flexible dates available.",
      provider: "Pacific Airways",
      rating: 4.5,
    },
    {
      id: "3",
      title: "Wine Country Tour",
      type: "activity",
      image: "/placeholder.svg?height=200&width=400",
      location: "Napa Valley, CA",
      price: 129,
      originalPrice: 179,
      discount: 28,
      validUntil: "Aug 30, 2025",
      description: "Full-day tour of 4 premium wineries with tastings and lunch included.",
      provider: "Wine Country Explorers",
      rating: 4.9,
    },
    {
      id: "4",
      title: "Michelin Star Tasting Menu",
      type: "restaurant",
      image: "/placeholder.svg?height=200&width=400",
      location: "Downtown LA",
      price: 95,
      originalPrice: 145,
      discount: 34,
      validUntil: "Apr 30, 2025",
      description: "5-course tasting menu with wine pairing option at award-winning restaurant.",
      provider: "Stellar Dining Group",
      rating: 4.7,
    },
    {
      id: "5",
      title: "Boutique Hotel in NYC",
      type: "hotel",
      image: "/placeholder.svg?height=200&width=400",
      location: "SoHo, New York",
      price: 199,
      originalPrice: 299,
      discount: 33,
      validUntil: "Jul 31, 2025",
      description: "Stylish rooms in the heart of SoHo. Walking distance to major attractions.",
      provider: "Urban Retreats",
      rating: 4.6,
    },
    {
      id: "6",
      title: "Weekend in Barcelona",
      type: "flight",
      image: "/placeholder.svg?height=200&width=400",
      location: "LAX to BCN",
      price: 649,
      originalPrice: 999,
      discount: 35,
      validUntil: "Sep 30, 2025",
      description: "Round-trip flights with one stopover. Includes one checked bag.",
      provider: "Euro Connect Airlines",
      rating: 4.3,
    },
  ])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "hotel":
        return <Hotel className="h-4 w-4" />
      case "flight":
        return <Plane className="h-4 w-4" />
      case "activity":
        return <Ticket className="h-4 w-4" />
      case "restaurant":
        return <Utensils className="h-4 w-4" />
      default:
        return <Tag className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "hotel":
        return "from-blue-400 to-cyan-300"
      case "flight":
        return "from-violet-400 to-indigo-300"
      case "activity":
        return "from-green-400 to-emerald-300"
      case "restaurant":
        return "from-pink-400 to-rose-300"
      default:
        return "from-gray-400 to-gray-300"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Special Deals</h2>
        <Button variant="ghost" className="text-orange-500">
          View all
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-5 bg-white/70 dark:bg-card/70 backdrop-blur-sm">
          <TabsTrigger value="all">All Deals</TabsTrigger>
          <TabsTrigger value="hotels">Hotels</TabsTrigger>
          <TabsTrigger value="flights">Flights</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="restaurants">Restaurants</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deals.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="hotels" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deals
              .filter((deal) => deal.type === "hotel")
              .map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="flights" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deals
              .filter((deal) => deal.type === "flight")
              .map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="activities" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deals
              .filter((deal) => deal.type === "activity")
              .map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="restaurants" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deals
              .filter((deal) => deal.type === "restaurant")
              .map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function DealCard({ deal }: { deal: Deal }) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "hotel":
        return <Hotel className="h-4 w-4" />
      case "flight":
        return <Plane className="h-4 w-4" />
      case "activity":
        return <Ticket className="h-4 w-4" />
      case "restaurant":
        return <Utensils className="h-4 w-4" />
      default:
        return <Tag className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "hotel":
        return "from-blue-400 to-cyan-300"
      case "flight":
        return "from-violet-400 to-indigo-300"
      case "activity":
        return "from-green-400 to-emerald-300"
      case "restaurant":
        return "from-pink-400 to-rose-300"
      default:
        return "from-gray-400 to-gray-300"
    }
  }

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-lg">
      <div className="relative h-48 w-full">
        <img src={deal.image || "/placeholder.svg"} alt={deal.title} className="h-full w-full object-cover" />
        <div className="absolute top-3 left-3">
          <Badge className={`bg-gradient-to-r ${getTypeColor(deal.type)} border-0 flex items-center gap-1`}>
            {getTypeIcon(deal.type)}
            {deal.type.charAt(0).toUpperCase() + deal.type.slice(1)}
          </Badge>
        </div>
        <div className="absolute top-3 right-3">
          <Badge className="bg-gradient-to-r from-orange-400 to-red-400 border-0">{deal.discount}% OFF</Badge>
        </div>
      </div>

      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-lg">{deal.title}</CardTitle>
        <CardDescription className="flex items-center mt-1">
          <MapPin className="mr-1 h-4 w-4" />
          {deal.location}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground mb-3">{deal.description}</p>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center">
              <span className="text-2xl font-bold text-orange-600">${deal.price}</span>
              <span className="ml-2 text-sm line-through text-muted-foreground">${deal.originalPrice}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {deal.type === "hotel"
                ? "per night"
                : deal.type === "flight"
                  ? "round trip"
                  : deal.type === "restaurant"
                    ? "per person"
                    : "per ticket"}
            </p>
          </div>

          <div className="flex flex-col items-end">
            <div className="flex items-center">
              <span className="text-sm font-medium mr-1">{deal.rating}</span>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`h-3 w-3 ${i < Math.floor(deal.rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300 fill-gray-300"}`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">By {deal.provider}</p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <div className="flex items-center text-xs text-muted-foreground">
          <Clock className="mr-1 h-3 w-3" />
          Valid until {deal.validUntil}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Details
          </Button>
          <Button size="sm" className="btn-sunset">
            Add to Trip
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
