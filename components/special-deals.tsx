"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Clock, Hotel, MapPin, Plane, Tag, Ticket, Utensils, Star } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"

interface Deal {
  id: string
  title: string
  type: string
  category: string
  image: string | null
  location: string
  price: number | null
  original_price: number | null
  discount: number | null
  start_date: string
  end_date: string
  description: string | null
  business_name: string | null
  business_rating: number | null
}

const DEMO_DEALS: Deal[] = [
  {
    id: "demo-1",
    title: "Luxury Beachfront Resort",
    type: "deal",
    category: "hotel",
    image: "/placeholder.svg?height=200&width=400",
    location: "Malibu, CA",
    price: 249,
    original_price: 399,
    discount: 38,
    start_date: "2025-06-01",
    end_date: "2025-08-31",
    description: "Ocean view rooms with private balconies. Includes breakfast and spa access.",
    business_name: "Coastal Luxury Hotels",
    business_rating: 4.8,
  },
  {
    id: "demo-2",
    title: "Wine Country Tour",
    type: "experience",
    category: "activity",
    image: "/placeholder.svg?height=200&width=400",
    location: "Napa Valley, CA",
    price: 129,
    original_price: 179,
    discount: 28,
    start_date: "2025-04-01",
    end_date: "2025-10-31",
    description: "Full-day tour of 4 premium wineries with tastings and lunch included.",
    business_name: "Wine Country Explorers",
    business_rating: 4.9,
  },
  {
    id: "demo-3",
    title: "Michelin Star Tasting Menu",
    type: "deal",
    category: "restaurant",
    image: "/placeholder.svg?height=200&width=400",
    location: "Downtown LA",
    price: 95,
    original_price: 145,
    discount: 34,
    start_date: "2025-03-01",
    end_date: "2025-06-30",
    description: "5-course tasting menu with wine pairing option at award-winning restaurant.",
    business_name: "Stellar Dining Group",
    business_rating: 4.7,
  },
  {
    id: "demo-4",
    title: "Boutique Hotel in NYC",
    type: "promotion",
    category: "hotel",
    image: "/placeholder.svg?height=200&width=400",
    location: "SoHo, New York",
    price: 199,
    original_price: 299,
    discount: 33,
    start_date: "2025-05-01",
    end_date: "2025-09-30",
    description: "Stylish rooms in the heart of SoHo. Walking distance to major attractions.",
    business_name: "Urban Retreats",
    business_rating: 4.6,
  },
]

const CATEGORY_TABS = [
  { value: "all", label: "All Deals" },
  { value: "hotel", label: "Hotels" },
  { value: "restaurant", label: "Restaurants" },
  { value: "activity", label: "Activities" },
]

export function SpecialDeals() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDeals() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("promotions")
          .select(`
            id, title, type, category, image, location,
            price, original_price, discount,
            start_date, end_date, description,
            businesses (name, rating)
          `)
          .eq("status", "active")
          .order("rank_score", { ascending: false })

        if (error) throw error

        if (data && data.length > 0) {
          setDeals(
            data.map((p: any) => ({
              id: p.id,
              title: p.title,
              type: p.type,
              category: p.category,
              image: p.image,
              location: p.location,
              price: p.price,
              original_price: p.original_price,
              discount: p.discount,
              start_date: p.start_date,
              end_date: p.end_date,
              description: p.description,
              business_name: p.businesses?.name || null,
              business_rating: p.businesses?.rating || null,
            }))
          )
        } else {
          setDeals(DEMO_DEALS)
        }
      } catch {
        setDeals(DEMO_DEALS)
      } finally {
        setLoading(false)
      }
    }

    loadDeals()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Special Deals</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden animate-pulse">
              <div className="h-48 bg-muted" />
              <CardContent className="p-4">
                <div className="h-5 w-3/4 bg-muted rounded mb-2" />
                <div className="h-4 w-1/2 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Special Deals</h2>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-4 bg-white/70 dark:bg-card/70 backdrop-blur-sm">
          {CATEGORY_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {CATEGORY_TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(tab.value === "all"
                ? deals
                : deals.filter((d) => d.category === tab.value)
              ).map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

function DealCard({ deal }: { deal: Deal }) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "hotel":
        return <Hotel className="h-4 w-4" />
      case "restaurant":
        return <Utensils className="h-4 w-4" />
      case "activity":
        return <Ticket className="h-4 w-4" />
      case "transport":
        return <Plane className="h-4 w-4" />
      default:
        return <Tag className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "hotel":
        return "from-blue-400 to-cyan-300"
      case "restaurant":
        return "from-pink-400 to-rose-300"
      case "activity":
        return "from-green-400 to-emerald-300"
      case "transport":
        return "from-violet-400 to-indigo-300"
      default:
        return "from-gray-400 to-gray-300"
    }
  }

  const priceLabel = (() => {
    switch (deal.category) {
      case "hotel":
        return "per night"
      case "restaurant":
        return "per person"
      default:
        return "per ticket"
    }
  })()

  const isDemo = deal.id.startsWith("demo-")
  const href = isDemo ? "#" : `/promotion/${deal.id}`

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-lg">
      <div className="relative h-48 w-full">
        <img
          src={deal.image || "/placeholder.svg?height=200&width=400"}
          alt={deal.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute top-3 left-3">
          <Badge className={`bg-gradient-to-r ${getCategoryColor(deal.category)} border-0 flex items-center gap-1`}>
            {getCategoryIcon(deal.category)}
            {deal.category.charAt(0).toUpperCase() + deal.category.slice(1)}
          </Badge>
        </div>
        {deal.discount != null && deal.discount > 0 && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-gradient-to-r from-orange-400 to-red-400 border-0">
              {deal.discount}% OFF
            </Badge>
          </div>
        )}
      </div>

      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-lg">{deal.title}</CardTitle>
        <CardDescription className="flex items-center mt-1">
          <MapPin className="mr-1 h-4 w-4" />
          {deal.location}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4">
        {deal.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{deal.description}</p>
        )}

        <div className="flex items-center justify-between">
          <div>
            {deal.price != null && (
              <>
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-orange-600">${deal.price}</span>
                  {deal.original_price != null && (
                    <span className="ml-2 text-sm line-through text-muted-foreground">
                      ${deal.original_price}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{priceLabel}</p>
              </>
            )}
          </div>

          {(deal.business_name || deal.business_rating != null) && (
            <div className="flex flex-col items-end">
              {deal.business_rating != null && (
                <div className="flex items-center">
                  <Star className="h-3 w-3 text-yellow-400 fill-yellow-400 mr-1" />
                  <span className="text-sm font-medium">{deal.business_rating}</span>
                </div>
              )}
              {deal.business_name && (
                <p className="text-xs text-muted-foreground">By {deal.business_name}</p>
              )}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <div className="flex items-center text-xs text-muted-foreground">
          <Clock className="mr-1 h-3 w-3" />
          Until {new Date(deal.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </div>

        <div className="flex gap-2">
          <Link href={href}>
            <Button variant="outline" size="sm">
              Details
            </Button>
          </Link>
          <Button size="sm" className="btn-sunset">
            Add to Trip
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
