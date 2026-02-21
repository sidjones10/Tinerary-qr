"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Bell, Search, Check } from "lucide-react"

import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useNotifications, requestNotificationPermission } from "@/hooks/use-notifications"

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [userId, setUserId] = useState<string | undefined>(undefined)

  // Get user ID
  useEffect(() => {
    async function getUserId() {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUserId(session?.user?.id)
    }
    getUserId()
  }, [])

  // Request browser notification permission on mount
  useEffect(() => {
    requestNotificationPermission()
  }, [])

  // Use the notifications hook with realtime updates
  const {
    notifications: allNotifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead: markAllAsReadHook,
  } = useNotifications(userId)

  // Filter notifications by active tab
  const notifications =
    activeTab === "all"
      ? allNotifications
      : allNotifications.filter((n) => n.type === activeTab)

  const getFilteredNotifications = () => {
    if (!searchQuery) return notifications

    const query = searchQuery.toLowerCase()
    return notifications.filter(
      (notification) =>
        notification.title.toLowerCase().includes(query) || notification.message.toLowerCase().includes(query),
    )
  }

  const filteredNotifications = getFilteredNotifications()

  const handleMarkAllAsRead = async () => {
    await markAllAsReadHook()
  }

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    if (diffSec < 60) return "just now"
    if (diffMin < 60) return `${diffMin}m ago`
    if (diffHour < 24) return `${diffHour}h ago`
    if (diffDay < 7) return `${diffDay}d ago`

    return date.toLocaleDateString()
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex-1">
        <div className="container px-4 py-6 md:py-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
              <h1 className="text-2xl font-bold">Notifications</h1>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Badge variant="default" className="bg-primary">
                  {unreadCount} unread
                </Badge>
              )}
              <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
                <Check className="mr-2 h-4 w-4" />
                Mark all as read
              </Button>
            </div>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search notifications..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full max-w-md mx-auto grid grid-cols-4 mb-6">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="booking_confirmation">Bookings</TabsTrigger>
              <TabsTrigger value="itinerary_rsvp">RSVPs</TabsTrigger>
              <TabsTrigger value="system_message">System</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">Loading notifications...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                  <h3 className="mt-4 text-lg font-medium">No notifications</h3>
                  <p className="text-muted-foreground">
                    {searchQuery ? "No notifications match your search" : "You don't have any notifications yet"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredNotifications.map((notification) => (
                    <Card
                      key={notification.id}
                      className={`overflow-hidden transition-all cursor-pointer hover:shadow-md ${!notification.is_read ? "border-l-4 border-l-primary" : ""}`}
                      onClick={() => {
                        if (!notification.is_read) {
                          handleMarkAsRead(notification.id)
                        }
                        if (notification.link_url) {
                          window.location.href = notification.link_url
                        }
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium">{notification.title}</h3>
                              {!notification.is_read && (
                                <Badge variant="default" className="bg-primary text-primary-foreground">
                                  New
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                {formatDate(notification.created_at)}
                              </span>
                              {notification.link_url && (
                                <Link
                                  href={notification.link_url}
                                  className="text-xs font-medium text-primary hover:underline"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (!notification.is_read) {
                                      handleMarkAsRead(notification.id)
                                    }
                                  }}
                                >
                                  View details
                                </Link>
                              )}
                            </div>
                          </div>

                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMarkAsRead(notification.id)
                              }}
                            >
                              <Check className="h-4 w-4" />
                              <span className="sr-only">Mark as read</span>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
