import Link from "next/link"
import { Calendar, Clock, MapPin, Users } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function PersonalFeed() {
  // Sample data - in a real app, this would come from a database
  const upcomingEvents = [
    {
      id: "1",
      title: "Weekend in NYC",
      type: "trip",
      date: "Mar 15-17, 2025",
      image: "/placeholder.svg?height=200&width=400",
      location: "New York, NY",
      attendees: 6,
      organizer: {
        name: "Alex Rodriguez",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      height: "medium", // For masonry layout
    },
    {
      id: "2",
      title: "Coachella Music Festival",
      type: "event",
      date: "Apr 10, 2025",
      time: "12:00 PM - 11:00 PM",
      image: "/placeholder.svg?height=200&width=400",
      location: "Indio, CA",
      attendees: 12,
      organizer: {
        name: "Taylor Moore",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      height: "tall", // For masonry layout
    },
    {
      id: "3",
      title: "Rooftop Birthday Party",
      type: "event",
      date: "Mar 22, 2025",
      time: "8:00 PM - 1:00 AM",
      image: "/placeholder.svg?height=200&width=400",
      location: "Downtown LA",
      attendees: 25,
      organizer: {
        name: "You",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      height: "short", // For masonry layout
    },
    {
      id: "4",
      title: "Wine Tasting Tour",
      type: "event",
      date: "Mar 28, 2025",
      time: "2:00 PM - 6:00 PM",
      image: "/placeholder.svg?height=200&width=400",
      location: "Napa Valley, CA",
      attendees: 8,
      organizer: {
        name: "Jordan Davis",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      height: "medium", // For masonry layout
    },
  ]

  const pastEvents = [
    {
      id: "5",
      title: "Beach Day",
      type: "event",
      date: "Feb 15, 2025",
      image: "/placeholder.svg?height=200&width=400",
      location: "Santa Monica, CA",
      attendees: 8,
      organizer: {
        name: "Jordan Davis",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      height: "medium", // For masonry layout
    },
    {
      id: "6",
      title: "Weekend in Vegas",
      type: "trip",
      date: "Jan 20-22, 2025",
      image: "/placeholder.svg?height=200&width=400",
      location: "Las Vegas, NV",
      attendees: 5,
      organizer: {
        name: "You",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      height: "tall", // For masonry layout
    },
    {
      id: "7",
      title: "Art Gallery Opening",
      type: "event",
      date: "Jan 15, 2025",
      image: "/placeholder.svg?height=200&width=400",
      location: "Arts District, LA",
      attendees: 12,
      organizer: {
        name: "Casey Kim",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      height: "short", // For masonry layout
    },
  ]

  const getImageHeight = (height: string) => {
    switch (height) {
      case "tall":
        return "h-64"
      case "medium":
        return "h-48"
      case "short":
        return "h-40"
      default:
        return "h-48"
    }
  }

  return (
    <Tabs defaultValue="upcoming">
      <TabsList className="w-full max-w-xs bg-white/70 backdrop-blur-sm">
        <TabsTrigger value="upcoming" className="flex-1">
          Upcoming
        </TabsTrigger>
        <TabsTrigger value="past" className="flex-1">
          Past
        </TabsTrigger>
      </TabsList>

      <TabsContent value="upcoming" className="mt-6">
        <div className="masonry-grid">
          {upcomingEvents.map((event) => (
            <Link href={`/${event.type}/${event.id}`} key={event.id} className="block mb-4">
              <div className="pinterest-card">
                <div className={`relative w-full ${getImageHeight(event.height)}`}>
                  <img
                    src={event.image || "/placeholder.svg"}
                    alt={event.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <Badge
                      className={
                        event.type === "trip"
                          ? "bg-gradient-to-r from-blue-400 to-cyan-300 hover:from-blue-500 hover:to-cyan-400 border-0"
                          : "bg-gradient-to-r from-purple-400 to-pink-300 hover:from-purple-500 hover:to-pink-400 border-0"
                      }
                    >
                      {event.type === "trip" ? "Trip" : "Event"}
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-xl font-bold text-white">{event.title}</h3>
                  </div>
                </div>

                <div className="p-4 pb-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={event.organizer.avatar} alt={event.organizer.name} />
                        <AvatarFallback>{event.organizer.name[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">
                        {event.organizer.name === "You" ? "You" : `By ${event.organizer.name}`}
                      </span>
                    </div>
                    {event.organizer.name === "You" && (
                      <Badge variant="outline" className="text-green-500 border-green-200 bg-green-50">
                        Organizer
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  <div className="grid gap-2">
                    <div className="flex items-center text-sm">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      {event.date}
                      {event.time && (
                        <>
                          <span className="mx-1">•</span>
                          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                          {event.time}
                        </>
                      )}
                    </div>
                    <div className="flex items-center text-sm">
                      <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                      {event.location}
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{event.attendees} attending</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 p-0"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="past" className="mt-6">
        <div className="masonry-grid">
          {pastEvents.map((event) => (
            <Link href={`/${event.type}/${event.id}`} key={event.id} className="block mb-4">
              <div className="pinterest-card">
                <div className={`relative w-full ${getImageHeight(event.height)}`}>
                  <img
                    src={event.image || "/placeholder.svg"}
                    alt={event.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <Badge
                      className={
                        event.type === "trip"
                          ? "bg-gradient-to-r from-blue-400 to-cyan-300 hover:from-blue-500 hover:to-cyan-400 border-0"
                          : "bg-gradient-to-r from-purple-400 to-pink-300 hover:from-purple-500 hover:to-pink-400 border-0"
                      }
                    >
                      {event.type === "trip" ? "Trip" : "Event"}
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-xl font-bold text-white">{event.title}</h3>
                  </div>
                </div>

                <div className="p-4 pb-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={event.organizer.avatar} alt={event.organizer.name} />
                        <AvatarFallback>{event.organizer.name[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">
                        {event.organizer.name === "You" ? "You" : `By ${event.organizer.name}`}
                      </span>
                    </div>
                    {event.organizer.name === "You" && (
                      <Badge variant="outline" className="text-green-500 border-green-200 bg-green-50">
                        Organizer
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  <div className="grid gap-2">
                    <div className="flex items-center text-sm">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      {event.date}
                      {event.time && (
                        <>
                          <span className="mx-1">•</span>
                          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                          {event.time}
                        </>
                      )}
                    </div>
                    <div className="flex items-center text-sm">
                      <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                      {event.location}
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{event.attendees} attended</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 p-0"
                    >
                      View Memories
                    </Button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  )
}
