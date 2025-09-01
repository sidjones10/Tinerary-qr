"use client"

import { useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { ArrowLeft, Calendar, MapPin, Clock, Share2, Heart, Users, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/providers/auth-provider"

interface EventDetailProps {
  event: any
  activities: any[]
}

export function EventDetail({ event, activities }: EventDetailProps) {
  const { user } = useAuth()
  const [liked, setLiked] = useState(false)
  const isOwner = user && user.id === event.user_id

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMMM d, yyyy")
    } catch (e) {
      return dateString
    }
  }

  return (
    <div className="container px-4 py-6 md:py-10">
      <Link href="/app" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Link>

      <div className="max-w-4xl mx-auto">
        <div className="relative rounded-xl overflow-hidden mb-6">
          {event.cover_image_url ? (
            <img
              src={event.cover_image_url || "/placeholder.svg"}
              alt={event.title}
              className="w-full h-64 md:h-80 object-cover"
            />
          ) : (
            <div className="w-full h-64 md:h-80 bg-gradient-to-r from-orange-100 to-pink-100 flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-700">{event.title}</span>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{event.title}</h1>
                <div className="flex items-center text-white/90 text-sm">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>
                    {formatDate(event.start_date)}
                    {event.end_date && event.end_date !== event.start_date && <> - {formatDate(event.end_date)}</>}
                  </span>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/20 backdrop-blur-sm border-white/40 text-white hover:bg-white/30"
                  onClick={() => setLiked(!liked)}
                >
                  <Heart className={`h-4 w-4 mr-2 ${liked ? "fill-red-500 text-red-500" : ""}`} />
                  {liked ? "Saved" : "Save"}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/20 backdrop-blur-sm border-white/40 text-white hover:bg-white/30"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>

                {isOwner && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/20 backdrop-blur-sm border-white/40 text-white hover:bg-white/30"
                    asChild
                  >
                    <Link href={`/create?draftId=${event.id}`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-start mb-4">
            {event.location && (
              <div className="flex items-center text-sm text-muted-foreground mr-4">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{event.location}</span>
              </div>
            )}

            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="h-4 w-4 mr-1" />
              <span>Hosted by {event.host_name || "Anonymous"}</span>
            </div>
          </div>

          {event.description && <p className="text-gray-700 mb-6">{event.description}</p>}
        </div>

        <Tabs defaultValue="schedule" className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="attendees">Attendees</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule">
            {activities.length > 0 ? (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <Card key={activity.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{activity.title}</h3>
                          {activity.location && (
                            <div className="flex items-center text-sm text-muted-foreground mt-1">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span>{activity.location}</span>
                            </div>
                          )}
                          {activity.start_time && (
                            <div className="flex items-center text-sm text-muted-foreground mt-1">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>
                                {new Date(activity.start_time).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                        {activity.description && <p className="text-sm mt-2">{activity.description}</p>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No activities have been added to this event yet.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="details">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-1">Date & Time</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(event.start_date)}
                      {event.end_date && event.end_date !== event.start_date && <> - {formatDate(event.end_date)}</>}
                    </p>
                  </div>

                  {event.location && (
                    <div>
                      <h3 className="font-medium mb-1">Location</h3>
                      <p className="text-sm text-muted-foreground">{event.location}</p>
                    </div>
                  )}

                  <div>
                    <h3 className="font-medium mb-1">Visibility</h3>
                    <p className="text-sm text-muted-foreground">
                      {event.is_public
                        ? "Public - Anyone can see this event"
                        : "Private - Only invited people can see this event"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendees">
            <div className="text-center py-8">
              <p className="text-muted-foreground">No attendees yet.</p>
              <Button className="mt-4">Invite Friends</Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
