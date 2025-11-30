"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, Calendar, CreditCard, Tag, Users, ExternalLink } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getUserNotifications, markNotificationAsRead, type NotificationType } from "@/lib/notification-service"
import { useAuth } from "@/providers/auth-provider"

interface NotificationsListProps {
  type?: NotificationType | NotificationType[]
  limit?: number
}

export function NotificationsList({ type, limit = 20 }: NotificationsListProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchNotifications() {
      try {
        setLoading(true)

        // Check if user is logged in
        if (!user?.id) {
          setError("You must be logged in to view notifications")
          setLoading(false)
          return
        }

        const result = await getUserNotifications(user.id, {
          limit,
          type,
        })

        if (result.success && result.notifications) {
          setNotifications(result.notifications)
        } else {
          setError("Failed to load notifications")
        }
      } catch (err) {
        setError("An error occurred while loading notifications")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [type, limit, user?.id])

  const handleNotificationClick = async (notification: any) => {
    // Mark as read
    if (!notification.is_read) {
      await markNotificationAsRead(notification.id)

      // Update local state
      setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)))
    }

    // Navigate if there's a link
    if (notification.link_url) {
      router.push(notification.link_url)
    }
  }

  const getNotificationIcon = (notificationType: string) => {
    switch (notificationType) {
      case "booking_confirmation":
        return <CreditCard className="h-5 w-5 text-blue-500" />
      case "ticket_issued":
        return <Tag className="h-5 w-5 text-green-500" />
      case "itinerary_rsvp":
        return <Calendar className="h-5 w-5 text-purple-500" />
      case "promotion_approved":
        return <ExternalLink className="h-5 w-5 text-orange-500" />
      case "affiliate_conversion":
        return <Users className="h-5 w-5 text-pink-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-start p-4 gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-10">
        <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No notifications yet</h3>
        <p className="text-muted-foreground">When you receive notifications, they'll appear here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <Card
          key={notification.id}
          className={`overflow-hidden cursor-pointer transition-colors hover:bg-muted/50 ${!notification.is_read ? "border-l-4 border-l-primary" : ""}`}
          onClick={() => handleNotificationClick(notification)}
        >
          <CardContent className="p-0">
            <div className="flex items-start p-4 gap-4">
              <div className="flex-shrink-0 mt-1">
                {notification.image_url ? (
                  <Avatar>
                    <AvatarImage src={notification.image_url} alt="" />
                    <AvatarFallback>{getNotificationIcon(notification.type)}</AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    {getNotificationIcon(notification.type)}
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-sm">{notification.title}</h4>
                  <div className="flex items-center gap-2">
                    {!notification.is_read && (
                      <Badge variant="default" className="text-xs">
                        New
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>

                {notification.link_url && (
                  <div className="mt-2">
                    <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                      View Details
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
