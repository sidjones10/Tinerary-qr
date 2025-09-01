import Link from "next/link"
import { Calendar, Users } from "lucide-react"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface ItineraryCardProps {
  itinerary: {
    id: string
    title: string
    date: string
    image: string
    collaborators: number
    pending: number
  }
}

export function ItineraryCard({ itinerary }: ItineraryCardProps) {
  const initials = ["JD", "AR", "TM", "KL", "BW", "SN"]

  return (
    <Link href={`/event/${itinerary.id}`}>
      <Card className="overflow-hidden transition-all duration-200 hover:shadow-lg">
        <div className="relative h-48 w-full">
          <img
            src={itinerary.image || "/placeholder.svg"}
            alt={itinerary.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4">
            <h3 className="text-xl font-bold text-white">{itinerary.title}</h3>
          </div>
        </div>
        <CardHeader className="p-4 pb-0">
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="mr-2 h-4 w-4" />
            {itinerary.date}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              {initials.slice(0, Math.min(4, itinerary.collaborators)).map((initial, i) => (
                <Avatar key={i} className="border-2 border-background h-8 w-8">
                  <AvatarFallback className="text-xs bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white">
                    {initial}
                  </AvatarFallback>
                </Avatar>
              ))}
              {itinerary.collaborators > 4 && (
                <Avatar className="border-2 border-background h-8 w-8">
                  <AvatarFallback className="text-xs bg-muted">+{itinerary.collaborators - 4}</AvatarFallback>
                </Avatar>
              )}
            </div>
            {itinerary.pending > 0 && (
              <Badge variant="outline" className="text-amber-500 border-amber-200 bg-amber-50">
                {itinerary.pending} pending RSVP
              </Badge>
            )}
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            {itinerary.collaborators} collaborators
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
