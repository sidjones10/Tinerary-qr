"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Clock, Globe, MapPin, Star, Users } from "lucide-react"
import { getPromotionById, recordPromotionView } from "@/lib/supabase-client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { PromotionBookingPanel } from "@/components/promotion-booking-panel"

interface PromotionData {
  id: string
  title: string
  type: string
  category: string
  subcategory?: string
  description: string
  location: string
  price?: number
  currency?: string
  discount?: number
  original_price?: number
  start_date: string
  end_date: string
  image?: string
  images?: string[]
  tags?: string[]
  features?: any
  business: {
    id: string
    name: string
    logo?: string
    website?: string
    rating?: number
    review_count?: number
  }
  engagement_metrics: {
    views: number
    clicks: number
    saves: number
    shares: number
  }
  reviews?: Array<{
    id: string
    rating: number
    content?: string
    created_at: string
    users: {
      name: string
      avatar?: string
    }
  }>
}

// Fallback data in case the API call fails
const fallbackData: PromotionData = {
  id: "promo-123",
  title: "Exclusive Santorini Sunset Tour",
  type: "tour",
  category: "tours",
  description:
    "Experience the world-famous Santorini sunset from the best vantage points on the island. This exclusive tour takes you to three premium locations to witness the spectacular sunset views while enjoying local wine and appetizers. Perfect for couples and photography enthusiasts.",
  location: "Santorini, Greece",
  price: 89,
  currency: "USD",
  start_date: "2025-04-01",
  end_date: "2025-05-31",
  image: "/placeholder.svg?height=600&width=800",
  images: [
    "/placeholder.svg?height=600&width=800",
    "/placeholder.svg?height=600&width=800",
    "/placeholder.svg?height=600&width=800",
    "/placeholder.svg?height=600&width=800",
  ],
  tags: ["Sunset", "Tour", "Wine", "Photography", "Couples"],
  features: {
    duration: "3 hours",
    groupSize: "Small group (max 8)",
    languages: ["English", "Greek"],
    included: [
      "Professional local guide",
      "Hotel pickup and drop-off",
      "Wine tasting (3 varieties)",
      "Greek appetizers",
      "Bottled water",
      "All fees and taxes",
    ],
    notIncluded: ["Gratuities", "Additional food and drinks", "Personal expenses"],
    availableDates: [
      { date: "2025-04-15", spots: 4 },
      { date: "2025-04-16", spots: 6 },
      { date: "2025-04-17", spots: 2 },
      { date: "2025-04-18", spots: 8 },
      { date: "2025-04-19", spots: 5 },
    ],
    highlights: [
      "Witness the famous Santorini sunset from three premium locations",
      "Enjoy local wine tasting and traditional Greek appetizers",
      "Small group experience with expert local guide",
      "Convenient hotel pickup and drop-off included",
      "Perfect photo opportunities at iconic blue domes",
    ],
  },
  business: {
    id: "business-1",
    name: "Aegean Adventures",
    logo: "/placeholder.svg?height=100&width=100",
    website: "https://aegean-adventures.example.com",
    rating: 4.8,
    review_count: 124,
  },
  engagement_metrics: {
    views: 1250,
    clicks: 320,
    saves: 85,
    shares: 42,
  },
}

export default function PromotionPage({ params }: { params: { id: string } }) {
  const [promotion, setPromotion] = useState<PromotionData | null>(null)
  const [liked, setLiked] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    async function loadPromotion() {
      try {
        setIsLoading(true)
        const data = await getPromotionById(params.id)

        if (data) {
          setPromotion(data)
          // Record view for analytics
          recordPromotionView(params.id)
        } else {
          // If no data is returned, use fallback data
          setPromotion(fallbackData)
          toast({
            title: "Using demo data",
            description: "Could not load promotion data from the server. Showing example data instead.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error loading promotion:", error)
        setPromotion(fallbackData)
        toast({
          title: "Error loading data",
          description: "There was a problem loading the promotion. Showing example data instead.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadPromotion()
  }, [params.id, toast])

  if (isLoading) {
    return (
      <div className="container max-w-5xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-6 w-24 bg-gray-200 rounded mb-8"></div>
        <div className="h-80 bg-gray-200 rounded-lg mb-6"></div>
        <div className="h-8 w-3/4 bg-gray-200 rounded mb-4"></div>
        <div className="h-4 w-1/4 bg-gray-200 rounded mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-2/3 bg-gray-200 rounded mb-6"></div>
          </div>
          <div>
            <div className="h-40 bg-gray-200 rounded mb-4"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!promotion) {
    return (
      <div className="container max-w-5xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Promotion Not Found</h1>
        <p className="mb-6">The promotion you're looking for doesn't exist or has been removed.</p>
        <Link href="/">
          <Button>Back to Home</Button>
        </Link>
      </div>
    )
  }

  const images = promotion.images || [promotion.image || "/placeholder.svg?height=600&width=800"]
  const features = promotion.features || {}

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8">
      <Link
        href="/"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Link>

      {/* Promotion Badge */}
      <div className="mb-4">
        <Badge className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600">
          Promoted
        </Badge>
      </div>

      {/* Image Gallery */}
      <div className="mb-8">
        <div className="relative h-[400px] w-full overflow-hidden rounded-lg mb-2">
          <img
            src={images[selectedImage] || "/placeholder.svg"}
            alt={promotion.title}
            className="object-cover w-full h-full"
          />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, index) => (
            <div
              key={index}
              className={`relative h-20 overflow-hidden rounded-md cursor-pointer ${selectedImage === index ? "ring-2 ring-blue-500" : ""}`}
              onClick={() => setSelectedImage(index)}
            >
              <img
                src={image || "/placeholder.svg"}
                alt={`Gallery image ${index + 1}`}
                className="object-cover w-full h-full"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Title and Basic Info */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{promotion.title}</h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mb-2">
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-1" />
            {promotion.location}
          </div>
          {features.duration && (
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {features.duration}
            </div>
          )}
          {features.groupSize && (
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              {features.groupSize}
            </div>
          )}
          {promotion.business?.rating && (
            <div className="flex items-center">
              <Star className="h-4 w-4 mr-1 text-yellow-500" />
              <span>{promotion.business.rating}</span>
              <span className="ml-1">({promotion.business.review_count || 0} reviews)</span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {promotion.tags?.map((tag, index) => (
            <Badge key={index} variant="outline" className="bg-gray-100">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex items-center text-sm">
          <span className="text-muted-foreground">Offered by</span>
          <span className="font-medium ml-1">{promotion.business?.name}</span>
          {promotion.business?.website && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Link
                href={promotion.business.website}
                className="text-blue-600 hover:underline flex items-center"
                target="_blank"
              >
                <Globe className="h-3 w-3 mr-1" />
                Website
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="md:col-span-2">
          <Tabs defaultValue="overview">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-3">Description</h2>
                <p className="text-gray-700 whitespace-pre-line">{promotion.description}</p>
              </div>

              {features.highlights && (
                <div>
                  <h2 className="text-xl font-semibold mb-3">Highlights</h2>
                  <ul className="space-y-2">
                    {features.highlights.map((highlight: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <Star className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>

            <TabsContent value="details">
              <div className="space-y-6">
                {features.included && (
                  <div>
                    <h2 className="text-xl font-semibold mb-3">What's Included</h2>
                    <ul className="space-y-2">
                      {features.included.map((item: string, index: number) => (
                        <li key={index} className="flex items-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-green-500 mr-2"></div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {features.notIncluded && (
                  <div>
                    <h2 className="text-xl font-semibold mb-3">Not Included</h2>
                    <ul className="space-y-2">
                      {features.notIncluded.map((item: string, index: number) => (
                        <li key={index} className="flex items-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-red-500 mr-2"></div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <h2 className="text-xl font-semibold mb-3">Additional Information</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {features.languages && (
                      <div>
                        <h3 className="font-medium text-gray-700">Languages</h3>
                        <p>{Array.isArray(features.languages) ? features.languages.join(", ") : features.languages}</p>
                      </div>
                    )}
                    {features.groupSize && (
                      <div>
                        <h3 className="font-medium text-gray-700">Group Size</h3>
                        <p>{features.groupSize}</p>
                      </div>
                    )}
                    {features.duration && (
                      <div>
                        <h3 className="font-medium text-gray-700">Duration</h3>
                        <p>{features.duration}</p>
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium text-gray-700">Promotion Period</h3>
                      <p>
                        {new Date(promotion.start_date).toLocaleDateString()} -{" "}
                        {new Date(promotion.end_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reviews">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Customer Reviews</h2>
                    <div className="flex items-center mt-1">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${i < Math.floor(promotion.business?.rating || 0) ? "text-yellow-500" : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                      <span className="ml-2 font-medium">{promotion.business?.rating}</span>
                      <span className="ml-1 text-muted-foreground">
                        ({promotion.business?.review_count || 0} reviews)
                      </span>
                    </div>
                  </div>
                  <Button variant="outline">Write a Review</Button>
                </div>

                {/* Reviews */}
                <div className="space-y-4">
                  {promotion.reviews && promotion.reviews.length > 0
                    ? promotion.reviews.map((review) => (
                        <Card key={review.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between mb-2">
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-gray-200 mr-3 overflow-hidden">
                                  {review.users.avatar && (
                                    <img
                                      src={review.users.avatar || "/placeholder.svg"}
                                      alt={review.users.name}
                                      className="w-full h-full object-cover"
                                    />
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium">{review.users.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(review.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex">
                                {[...Array(5)].map((_, j) => (
                                  <Star
                                    key={j}
                                    className={`h-4 w-4 ${j < review.rating ? "text-yellow-500" : "text-gray-300"}`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm">{review.content}</p>
                          </CardContent>
                        </Card>
                      ))
                    : // Sample reviews if none exist
                      [...Array(3)].map((_, i) => (
                        <Card key={i}>
                          <CardContent className="p-4">
                            <div className="flex justify-between mb-2">
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-gray-200 mr-3"></div>
                                <div>
                                  <p className="font-medium">John Doe</p>
                                  <p className="text-xs text-muted-foreground">April 10, 2025</p>
                                </div>
                              </div>
                              <div className="flex">
                                {[...Array(5)].map((_, j) => (
                                  <Star
                                    key={j}
                                    className={`h-4 w-4 ${j < 5 - (i % 2) ? "text-yellow-500" : "text-gray-300"}`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm">
                              {i === 0
                                ? "Amazing experience! The sunset views were breathtaking and our guide was incredibly knowledgeable. The wine and appetizers were delicious too. Highly recommend!"
                                : i === 1
                                  ? "Great tour overall. The views were spectacular as promised. Only giving 4 stars because it was a bit crowded at one of the locations."
                                  : "One of the highlights of our trip to Santorini. The secret spot the guide took us to was perfect for photos. Would do this again!"}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                </div>

                <Button variant="outline" className="w-full">
                  Load More Reviews
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Booking Card */}
        <div>
          <PromotionBookingPanel
            promotion={promotion || fallbackData}
            userId="current-user-id" // In a real app, this would be the actual user ID
          />
        </div>
      </div>

      {/* Similar Promotions */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">You Might Also Like</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="relative h-48">
                <img
                  src="/placeholder.svg?height=400&width=600"
                  alt="Similar promotion"
                  className="object-cover w-full h-full"
                />
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-1 line-clamp-1">
                  {i === 0
                    ? "Santorini Wine Tasting Tour"
                    : i === 1
                      ? "Caldera Sailing Cruise"
                      : "Akrotiri Archaeological Site Tour"}
                </h3>
                <div className="flex items-center text-sm mb-2">
                  <Star className="h-4 w-4 text-yellow-500 mr-1" />
                  <span>{4.5 + i * 0.1}</span>
                  <span className="ml-1 text-muted-foreground">({80 + i * 20} reviews)</span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">${70 + i * 10}</span>
                    <span className="text-sm text-muted-foreground ml-1">per person</span>
                  </div>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
