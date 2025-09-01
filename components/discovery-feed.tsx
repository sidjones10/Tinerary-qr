"use client"

import { useState, useRef } from "react"
import { Bookmark, Calendar, Heart, MapPin, MessageCircle, Share2, Star } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

export function DiscoveryFeed() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  // Sample data - in a real app, this would come from a database
  const discoveryItems = [
    {
      id: "1",
      title: "Weekend in NYC",
      type: "trip",
      date: "Mar 15-17, 2025",
      image: "/placeholder.svg?height=600&width=400",
      location: "New York, NY",
      likes: 2453,
      comments: 128,
      saves: 342,
      description:
        "The perfect 3-day NYC itinerary! Includes all the must-see spots, best restaurants, and hidden gems.",
      user: {
        name: "Alex Rodriguez",
        username: "@alexr",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      highlights: ["The Met Museum", "Central Park", "Broadway Show", "Brooklyn Bridge"],
      promoted: false,
    },
    {
      id: "2",
      title: "Sunset Rooftop Bar",
      type: "business",
      date: "Open Daily 4PM-2AM",
      image: "/placeholder.svg?height=600&width=400",
      location: "Downtown LA",
      likes: 3842,
      comments: 215,
      saves: 567,
      description:
        "Experience breathtaking views and craft cocktails at our rooftop oasis. Happy hour specials daily 4-7PM!",
      user: {
        name: "Skyline Lounge",
        username: "@skylinelounge",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      highlights: ["Craft Cocktails", "Live DJ Weekends", "Small Plates", "Sunset Views"],
      promoted: true,
    },
    {
      id: "3",
      title: "Tokyo Adventure",
      type: "trip",
      date: "May 5-15, 2025",
      image: "/placeholder.svg?height=600&width=400",
      location: "Tokyo, Japan",
      likes: 8932,
      comments: 456,
      saves: 1203,
      description: "10 days in Tokyo! From traditional temples to futuristic neighborhoods, this itinerary has it all.",
      user: {
        name: "Jordan Davis",
        username: "@jordand",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      highlights: ["Shibuya Crossing", "Meiji Shrine", "Robot Restaurant", "Mt. Fuji Day Trip"],
      promoted: false,
    },
    {
      id: "4",
      title: "Coastal Luxury Resort",
      type: "business",
      date: "Booking available now",
      image: "/placeholder.svg?height=600&width=400",
      location: "Malibu, CA",
      likes: 5621,
      comments: 342,
      saves: 891,
      description:
        "Escape to our beachfront paradise with private cabanas, spa services, and ocean-view dining. Special weekend packages available!",
      user: {
        name: "Malibu Shores Resort",
        username: "@malibushores",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      highlights: ["Beachfront Access", "Full-Service Spa", "Ocean View Dining", "Luxury Suites"],
      promoted: true,
    },
  ]

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
      const itemHeight = scrollHeight / discoveryItems.length
      const newIndex = Math.floor((scrollTop + clientHeight / 2) / itemHeight)

      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < discoveryItems.length) {
        setCurrentIndex(newIndex)
      }
    }
  }

  return (
    <div className="relative h-[calc(100vh-12rem)] max-h-[800px] overflow-hidden rounded-xl bg-white shadow-lg">
      <ScrollArea ref={scrollRef} className="h-full snap-y snap-mandatory" onScrollCapture={handleScroll}>
        {discoveryItems.map((item, index) => (
          <div key={item.id} className="relative h-full w-full snap-start snap-always">
            <div className="relative h-full w-full">
              <img src={item.image || "/placeholder.svg"} alt={item.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

              {/* Promoted badge */}
              {item.promoted && (
                <div className="absolute top-4 right-4 z-10">
                  <Badge className="bg-gradient-to-r from-amber-400 to-orange-400 border-0 flex items-center gap-1">
                    <Star className="h-3 w-3 fill-white" />
                    Promoted
                  </Badge>
                </div>
              )}

              {/* Content overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <Badge
                      className={
                        item.type === "trip"
                          ? "bg-gradient-to-r from-blue-400 to-cyan-300 hover:from-blue-500 hover:to-cyan-400 border-0"
                          : item.type === "business"
                            ? "bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 border-0"
                            : "bg-gradient-to-r from-purple-400 to-pink-300 hover:from-purple-500 hover:to-pink-400 border-0"
                      }
                    >
                      {item.type === "trip" ? "Trip" : item.type === "business" ? "Business" : "Event"}
                    </Badge>
                    <h2 className="text-2xl font-bold mt-2">{item.title}</h2>
                    <div className="flex items-center text-sm mt-1">
                      <MapPin className="mr-1 h-4 w-4" />
                      {item.location}
                      <span className="mx-1">•</span>
                      <Calendar className="mr-1 h-4 w-4" />
                      {item.date}
                    </div>
                  </div>
                </div>

                <p className="text-sm mb-4">{item.description}</p>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  {item.highlights.map((highlight, i) => (
                    <div
                      key={i}
                      className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 text-xs"
                    >
                      {highlight}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 border-2 border-white">
                      <AvatarImage src={item.user.avatar} alt={item.user.name} />
                      <AvatarFallback>{item.user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{item.user.name}</p>
                      <p className="text-xs opacity-80">{item.user.username}</p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-sm border-white/20 text-white hover:from-white/30 hover:to-white/20"
                  >
                    {item.type === "business" ? "Learn More" : "View Full Itinerary"}
                  </Button>
                </div>
              </div>

              {/* Side action buttons */}
              <div className="absolute right-4 bottom-1/3 flex flex-col gap-4">
                <div className="flex flex-col items-center">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-full bg-black/30 backdrop-blur-sm border-white/20 text-white hover:bg-black/50"
                  >
                    <Heart className="h-5 w-5" />
                  </Button>
                  <span className="text-xs text-white mt-1">{item.likes}</span>
                </div>
                <div className="flex flex-col items-center">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-full bg-black/30 backdrop-blur-sm border-white/20 text-white hover:bg-black/50"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </Button>
                  <span className="text-xs text-white mt-1">{item.comments}</span>
                </div>
                <div className="flex flex-col items-center">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-full bg-black/30 backdrop-blur-sm border-white/20 text-white hover:bg-black/50"
                  >
                    <Bookmark className="h-5 w-5" />
                  </Button>
                  <span className="text-xs text-white mt-1">{item.saves}</span>
                </div>
                <div className="flex flex-col items-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-full bg-black/30 backdrop-blur-sm border-white/20 text-white hover:bg-black/50"
                      >
                        <Share2 className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Copy Link</DropdownMenuItem>
                      <DropdownMenuItem>Share to Instagram</DropdownMenuItem>
                      <DropdownMenuItem>Share to Twitter</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        ))}
      </ScrollArea>

      {/* Scroll indicator */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1">
        {discoveryItems.map((_, index) => (
          <div
            key={index}
            className={`h-1 w-1 rounded-full ${index === currentIndex ? "bg-white w-2" : "bg-white/50"} transition-all`}
          />
        ))}
      </div>
    </div>
  )
}
