import Link from "next/link"
import { Calendar, MapPin, Users, Heart, MessageCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ThemeIcon, getThemeColor } from "@/components/theme-selector"
import { getFontFamily } from "@/components/font-selector"

interface EventCardProps {
  event: {
    id: string
    title: string
    type: "Trip" | "Event"
    image: string
    date: string
    location: string
    organizer: {
      name: string
      avatar?: string
    }
    isOrganizer?: boolean
    attendees: number
    like_count?: number
    comment_count?: number
    theme?: string
    font?: string
  }
}

export function EventCard({ event }: EventCardProps) {
  const themeColor = event.theme ? getThemeColor(event.theme) : null
  const fontFamily = event.font ? getFontFamily(event.font) : "inherit"

  // Create themed border style with subtle glow
  const themedStyle = themeColor ? {
    boxShadow: `0 0 0 2px ${themeColor}40, 0 0 12px 2px ${themeColor}20`,
    border: `1px solid ${themeColor}60`,
  } : {}

  return (
    <Link href={`/event/${event.id}`} className="block">
      <div
        className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 card-soft relative"
        style={themedStyle}
      >
        {/* Theme icon cluster decoration */}
        {themeColor && event.theme && event.theme !== "none" && event.theme !== "default" && (
          <div className="absolute -top-1 -right-1 z-20 flex items-center gap-0.5 opacity-80">
            <ThemeIcon theme={event.theme} className="h-4 w-4" />
            <ThemeIcon theme={event.theme} className="h-3 w-3 opacity-60" />
            <ThemeIcon theme={event.theme} className="h-2 w-2 opacity-40" />
          </div>
        )}

        <div className="relative h-48">
          <Badge
            className={`absolute top-4 left-4 z-10 ${
              event.type === "Trip" ? "bg-blue-500 hover:bg-blue-600" : "bg-purple-500 hover:bg-purple-600"
            } text-white border-0`}
          >
            {event.type}
          </Badge>
          <img src={event.image || "/placeholder.svg"} alt={event.title} className="w-full h-full object-cover" />
        </div>

        <div className="p-4">
          <h3
            className="text-xl font-bold mb-3"
            style={{ fontFamily }}
          >
            {event.title}
          </h3>

          <div className="flex items-center mb-2">
            <Avatar className="h-6 w-6 mr-2">
              <AvatarImage src={event.organizer.avatar} alt={event.organizer.name} />
              <AvatarFallback>{event.organizer.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex items-center">
              <span className="text-sm text-gray-700">By {event.organizer.name}</span>
              {event.isOrganizer && (
                <Badge className="ml-2 bg-green-500 text-white hover:bg-green-600 border-0 text-xs">Organizer</Badge>
              )}
            </div>
          </div>

          <div className="flex items-center text-sm text-gray-500 mb-2">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{event.date}</span>
          </div>

          <div className="flex items-center text-sm text-gray-500 mb-3">
            <MapPin className="h-4 w-4 mr-2" />
            <span>{event.location}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm text-gray-500">
              {event.like_count !== undefined && event.like_count > 0 && (
                <div className="flex items-center">
                  <Heart className="h-4 w-4 mr-1" />
                  <span>{event.like_count}</span>
                </div>
              )}
              {event.comment_count !== undefined && event.comment_count > 0 && (
                <div className="flex items-center">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  <span>{event.comment_count}</span>
                </div>
              )}
              {event.attendees > 0 && (
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{event.attendees}</span>
                </div>
              )}
            </div>
            <span className="text-sm font-medium text-[#FF9B7D] hover:text-[#FF8A6A]">View Details</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
