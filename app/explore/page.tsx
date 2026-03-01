"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ArrowRight,
  Clock,
  Compass,
  ExternalLink,
  Flame,
  Hotel,
  MapPin,
  Plane,
  Search,
  Sparkles,
  Star,
  Tag,
  Ticket,
  TrendingUp,
  Utensils,
  Zap,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppHeader } from "@/components/app-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { getTrendingItineraries } from "@/lib/feed-service"
import { useAuth } from "@/providers/auth-provider"

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
  business_website: string | null
  business_logo: string | null
}

interface TrendingItem {
  id: string
  title: string
  description: string | null
  location: string | null
  image_url: string | null
  owner?: { name: string | null; avatar_url: string | null; username: string | null }
  metrics?: { like_count: number; view_count: number; save_count: number } | Array<{ like_count: number; view_count: number; save_count: number }>
}

const DEAL_CATEGORIES = [
  { value: "all", label: "All Deals", icon: <Tag className="h-4 w-4" /> },
  { value: "hotel", label: "Hotels", icon: <Hotel className="h-4 w-4" /> },
  { value: "restaurant", label: "Restaurants", icon: <Utensils className="h-4 w-4" /> },
  { value: "activity", label: "Activities", icon: <Ticket className="h-4 w-4" /> },
  { value: "transport", label: "Transport", icon: <Plane className="h-4 w-4" /> },
]

const EXPLORE_CATEGORIES = [
  { name: "Outdoor & Adventure", icon: "🏞️", gradient: "from-green-400 to-emerald-500" },
  { name: "Food & Drink", icon: "🍹", gradient: "from-pink-400 to-rose-500" },
  { name: "Music & Nightlife", icon: "🎵", gradient: "from-purple-400 to-violet-500" },
  { name: "Arts & Culture", icon: "🎨", gradient: "from-amber-400 to-orange-500" },
  { name: "Sports & Fitness", icon: "⚽", gradient: "from-blue-400 to-cyan-500" },
  { name: "Wellness & Spa", icon: "🧘", gradient: "from-teal-400 to-green-500" },
]

const POPULAR_DESTINATIONS = [
  { name: "New York", emoji: "🗽", count: 45 },
  { name: "Los Angeles", emoji: "🌴", count: 38 },
  { name: "Tokyo", emoji: "🗼", count: 33 },
  { name: "Paris", emoji: "🗼", count: 29 },
  { name: "London", emoji: "🎡", count: 27 },
  { name: "Miami", emoji: "🏖️", count: 23 },
]

export default function ExplorePage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [trending, setTrending] = useState<TrendingItem[]>([])
  const [dealsLoading, setDealsLoading] = useState(true)
  const [trendingLoading, setTrendingLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [dealCategory, setDealCategory] = useState("all")
  const router = useRouter()
  const { user } = useAuth()

  // Load deals from promotions table
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
            businesses (name, rating, website, logo)
          `)
          .eq("status", "active")
          .order("rank_score", { ascending: false })
          .limit(12)

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
              business_website: p.businesses?.website || null,
              business_logo: p.businesses?.logo || null,
            }))
          )
        } else {
          // Demo deals when no real data exists
          setDeals(DEMO_DEALS)
        }
      } catch {
        setDeals(DEMO_DEALS)
      } finally {
        setDealsLoading(false)
      }
    }

    loadDeals()
  }, [])

  // Load trending itineraries
  useEffect(() => {
    async function loadTrending() {
      try {
        const result = await getTrendingItineraries(user?.id || null, 6)
        if (result.success && result.items) {
          setTrending(result.items)
        }
      } catch {
        // Silently fail - trending section just won't show
      } finally {
        setTrendingLoading(false)
      }
    }

    loadTrending()
  }, [user?.id])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const filteredDeals = dealCategory === "all"
    ? deals
    : deals.filter((d) => d.category === dealCategory)

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "hotel": return <Hotel className="h-4 w-4" />
      case "restaurant": return <Utensils className="h-4 w-4" />
      case "activity": return <Ticket className="h-4 w-4" />
      case "transport": return <Plane className="h-4 w-4" />
      default: return <Tag className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "hotel": return "from-blue-400 to-cyan-300"
      case "restaurant": return "from-pink-400 to-rose-300"
      case "activity": return "from-green-400 to-emerald-300"
      case "transport": return "from-violet-400 to-indigo-300"
      default: return "from-gray-400 to-gray-300"
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-orange-50/50 to-white dark:from-background dark:to-background">
      <AppHeader />

      <main className="flex-1 pb-12">
        <div className="container px-4 py-6">
          {/* Hero Section */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 p-8 md:p-12 mb-8 text-white">
            <div className="absolute inset-0 bg-[url('/placeholder.svg')] opacity-10 bg-cover bg-center" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Compass className="h-6 w-6" />
                <Badge className="bg-white/20 border-0 text-white backdrop-blur-sm">
                  <Sparkles className="h-3 w-3 mr-1" /> Explore
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3">
                Discover Amazing Deals & Experiences
              </h1>
              <p className="text-white/80 text-lg mb-6 max-w-2xl">
                Find the best travel deals, trending itineraries, and local experiences curated just for you.
              </p>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="flex gap-2 max-w-lg">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Search deals, destinations, experiences..."
                    className="pl-10 bg-white/90 text-gray-900 border-0 h-12 rounded-xl placeholder:text-gray-400"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button type="submit" className="h-12 px-6 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30">
                  Search
                </Button>
              </form>
            </div>
          </div>

          <div className="space-y-12">
            {/* Hot Deals Section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500">
                    <Flame className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Hot Deals</h2>
                    <p className="text-sm text-muted-foreground">Exclusive offers from local businesses</p>
                  </div>
                </div>
              </div>

              {/* Deal Category Filter */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {DEAL_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setDealCategory(cat.value)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      dealCategory === cat.value
                        ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md"
                        : "bg-white dark:bg-card border border-border text-muted-foreground hover:border-orange-300 hover:text-foreground"
                    }`}
                  >
                    {cat.icon}
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Deal Cards */}
              {dealsLoading ? (
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
              ) : filteredDeals.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-card rounded-xl border">
                  <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No deals found in this category yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredDeals.map((deal) => (
                    <ExploreDealCard key={deal.id} deal={deal} getCategoryIcon={getCategoryIcon} getCategoryColor={getCategoryColor} />
                  ))}
                </div>
              )}
            </section>

            {/* Trending Itineraries Section */}
            {trending.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Trending Now</h2>
                      <p className="text-sm text-muted-foreground">Popular trips and events from the community</p>
                    </div>
                  </div>
                  <Link href="/">
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      View all <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                {trendingLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="animate-pulse">
                        <div className="h-40 bg-muted rounded-t-lg" />
                        <CardContent className="p-4">
                          <div className="h-5 w-3/4 bg-muted rounded mb-2" />
                          <div className="h-4 w-1/2 bg-muted rounded" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trending.slice(0, 6).map((item) => {
                      const metrics = Array.isArray(item.metrics) && item.metrics.length > 0
                        ? item.metrics[0]
                        : (item.metrics && !Array.isArray(item.metrics)) ? item.metrics : null

                      const gradients = [
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                        "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                        "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
                        "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                        "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
                      ]
                      const hash = item.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
                      const bg = gradients[hash % gradients.length]

                      return (
                        <Link key={item.id} href={`/event/${item.id}`}>
                          <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 group cursor-pointer">
                            <div className="relative h-40">
                              {item.image_url ? (
                                <img src={item.image_url} alt={item.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center" style={{ background: bg }}>
                                  <span className="text-5xl font-bold text-white/30">
                                    {item.title.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                              <div className="absolute bottom-3 left-3 right-3">
                                <h3 className="text-white font-bold text-lg line-clamp-1">{item.title}</h3>
                              </div>
                            </div>
                            <CardContent className="p-4">
                              <div className="flex items-center text-sm text-muted-foreground mb-2">
                                {item.location && (
                                  <span className="flex items-center">
                                    <MapPin className="h-3 w-3 mr-1" /> {item.location}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                {metrics && (
                                  <>
                                    <span>{metrics.like_count || 0} likes</span>
                                    <span>{metrics.view_count || 0} views</span>
                                    <span>{metrics.save_count || 0} saves</span>
                                  </>
                                )}
                              </div>
                              {item.owner?.name && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  by {item.owner.name}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </section>
            )}

            {/* Browse by Category */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500">
                  <Compass className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Browse by Category</h2>
                  <p className="text-sm text-muted-foreground">Find events and trips that match your interests</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {EXPLORE_CATEGORIES.map((category) => (
                  <Link
                    href={`/search?q=${encodeURIComponent(category.name)}`}
                    key={category.name}
                    className="group relative overflow-hidden rounded-xl p-6 transition-all hover:shadow-lg"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />
                    <div className="relative flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${category.gradient} flex items-center justify-center text-2xl shadow-md`}>
                        {category.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{category.name}</h3>
                        <p className="text-xs text-muted-foreground">Explore events</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Popular Destinations */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Popular Destinations</h2>
                  <p className="text-sm text-muted-foreground">Trending places travelers love</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {POPULAR_DESTINATIONS.map((dest) => (
                  <Link
                    href={`/search?q=${encodeURIComponent(dest.name)}`}
                    key={dest.name}
                    className="group bg-white dark:bg-card rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-all border border-transparent hover:border-orange-200"
                  >
                    <div className="text-4xl mb-2">{dest.emoji}</div>
                    <h3 className="font-semibold text-sm">{dest.name}</h3>
                    <p className="text-xs text-muted-foreground">{dest.count} trips</p>
                  </Link>
                ))}
              </div>
            </section>

            {/* CTA Section */}
            <section className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl p-8 md:p-12 text-white text-center">
              <Zap className="h-10 w-10 mx-auto mb-4" />
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                Got a business? List your deals here
              </h2>
              <p className="text-white/80 mb-6 max-w-xl mx-auto">
                Reach thousands of travelers looking for the best experiences. Create deals, track performance, and grow your business.
              </p>
              <div className="flex gap-3 justify-center">
                <Button asChild className="bg-white text-orange-600 hover:bg-white/90 font-semibold">
                  <Link href="/business">Get Started</Link>
                </Button>
                <Button asChild variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  <Link href="/pricing">View Plans</Link>
                </Button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

/** Individual deal card for the explore page */
function ExploreDealCard({
  deal,
  getCategoryIcon,
  getCategoryColor,
}: {
  deal: Deal
  getCategoryIcon: (cat: string) => React.ReactNode
  getCategoryColor: (cat: string) => string
}) {
  const isDemo = deal.id.startsWith("demo-")
  // If the business has a website, clicking "View Deal" goes to the external listing via affiliate tracking
  const hasExternalLink = !!deal.business_website && !isDemo
  const detailHref = isDemo ? "#" : `/promotion/${deal.id}`

  const handleViewDeal = () => {
    if (hasExternalLink) {
      // Track click and redirect to the business's external listing
      window.open(
        `/api/affiliate/track?code=explore-${deal.id.substring(0, 8)}&url=${encodeURIComponent(deal.business_website!)}`,
        "_blank",
        "noopener,noreferrer"
      )
    }
  }

  const priceLabel = (() => {
    switch (deal.category) {
      case "hotel": return "per night"
      case "restaurant": return "per person"
      default: return "per ticket"
    }
  })()

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-lg group">
      <div className="relative h-48 w-full overflow-hidden">
        <img
          src={deal.image || "/placeholder.svg?height=200&width=400"}
          alt={deal.title}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3">
          <Badge className={`bg-gradient-to-r ${getCategoryColor(deal.category)} border-0 flex items-center gap-1 text-white`}>
            {getCategoryIcon(deal.category)}
            {deal.category.charAt(0).toUpperCase() + deal.category.slice(1)}
          </Badge>
        </div>
        {deal.discount != null && deal.discount > 0 && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-gradient-to-r from-orange-500 to-red-500 border-0 text-white font-bold">
              {deal.discount}% OFF
            </Badge>
          </div>
        )}
      </div>

      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-lg line-clamp-1">{deal.title}</CardTitle>
        <CardDescription className="flex items-center mt-1">
          <MapPin className="mr-1 h-4 w-4 flex-shrink-0" />
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
          <Link href={detailHref}>
            <Button variant="outline" size="sm">
              Details
            </Button>
          </Link>
          {hasExternalLink ? (
            <Button size="sm" className="btn-sunset" onClick={handleViewDeal}>
              <ExternalLink className="h-3 w-3 mr-1" />
              View Deal
            </Button>
          ) : (
            <Link href={detailHref}>
              <Button size="sm" className="btn-sunset">
                View Deal
              </Button>
            </Link>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}

// Demo deals as fallback when no real data exists
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
    start_date: "2026-06-01",
    end_date: "2026-08-31",
    description: "Ocean view rooms with private balconies. Includes breakfast and spa access.",
    business_name: "Coastal Luxury Hotels",
    business_rating: 4.8,
    business_website: null,
    business_logo: null,
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
    start_date: "2026-04-01",
    end_date: "2026-10-31",
    description: "Full-day tour of 4 premium wineries with tastings and lunch included.",
    business_name: "Wine Country Explorers",
    business_rating: 4.9,
    business_website: null,
    business_logo: null,
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
    start_date: "2026-03-01",
    end_date: "2026-06-30",
    description: "5-course tasting menu with wine pairing option at award-winning restaurant.",
    business_name: "Stellar Dining Group",
    business_rating: 4.7,
    business_website: null,
    business_logo: null,
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
    start_date: "2026-05-01",
    end_date: "2026-09-30",
    description: "Stylish rooms in the heart of SoHo. Walking distance to major attractions.",
    business_name: "Urban Retreats",
    business_rating: 4.6,
    business_website: null,
    business_logo: null,
  },
  {
    id: "demo-5",
    title: "Sunset Sailing Cruise",
    type: "experience",
    category: "activity",
    image: "/placeholder.svg?height=200&width=400",
    location: "San Francisco Bay",
    price: 89,
    original_price: 120,
    discount: 26,
    start_date: "2026-04-01",
    end_date: "2026-10-31",
    description: "2-hour sunset cruise with drinks and appetizers. Golden Gate Bridge views.",
    business_name: "Bay Adventures",
    business_rating: 4.8,
    business_website: null,
    business_logo: null,
  },
  {
    id: "demo-6",
    title: "Private Airport Transfer",
    type: "deal",
    category: "transport",
    image: "/placeholder.svg?height=200&width=400",
    location: "Los Angeles, CA",
    price: 45,
    original_price: 75,
    discount: 40,
    start_date: "2026-03-01",
    end_date: "2026-12-31",
    description: "Luxury sedan airport pickup. Available 24/7 with flight tracking.",
    business_name: "LA Limo Service",
    business_rating: 4.5,
    business_website: null,
    business_logo: null,
  },
]
