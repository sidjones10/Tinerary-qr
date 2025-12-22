"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/notification-service"
import type { RealtimeChannel } from "@supabase/supabase-js"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link_url?: string
  image_url?: string
  is_read: boolean
  created_at: string
}

interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  refresh: () => Promise<void>
}

/**
 * Custom hook for managing notifications with real-time updates
 * Uses Supabase Realtime for instant notification delivery
 */
export function useNotifications(userId: string | undefined): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const [notificationsResult, countResult] = await Promise.all([
        getUserNotifications(userId, { limit: 20 }),
        getUnreadNotificationCount(userId),
      ])

      if (notificationsResult.success) {
        setNotifications(notificationsResult.notifications as Notification[])
      } else {
        setError(notificationsResult.error || "Failed to fetch notifications")
        setNotifications([])
      }

      if (countResult.success) {
        setUnreadCount(countResult.count)
      } else {
        setUnreadCount(0)
      }
    } catch (err: any) {
      console.error("Error fetching notifications:", err)
      setError(err.message || "Failed to fetch notifications")
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Initial fetch
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Set up real-time subscription
  useEffect(() => {
    if (!userId) return

    const supabase = createClient()
    let channel: RealtimeChannel

    const setupRealtimeSubscription = async () => {
      try {
        // Subscribe to notifications table changes
        channel = supabase
          .channel(`notifications:${userId}`)
          .on(
            "postgres_changes",
            {
              event: "*", // Listen to all events (INSERT, UPDATE, DELETE)
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
//               console.log("Notification update received:", payload)

              if (payload.eventType === "INSERT") {
                // New notification
                const newNotification = payload.new as Notification
                setNotifications((prev) => [newNotification, ...prev])
                setUnreadCount((prev) => prev + 1)

                // Optional: Show browser notification
                if ("Notification" in window && Notification.permission === "granted") {
                  new Notification(newNotification.title, {
                    body: newNotification.message,
                    icon: "/logo.png",
                    tag: newNotification.id,
                  })
                }
              } else if (payload.eventType === "UPDATE") {
                // Notification updated (e.g., marked as read)
                const updatedNotification = payload.new as Notification
                setNotifications((prev) =>
                  prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n)),
                )

                // Update unread count
                if (updatedNotification.is_read) {
                  setUnreadCount((prev) => Math.max(0, prev - 1))
                }
              } else if (payload.eventType === "DELETE") {
                // Notification deleted
                const deletedId = payload.old.id
                setNotifications((prev) => prev.filter((n) => n.id !== deletedId))
              }
            },
          )
          .subscribe((status) => {
//             console.log("Realtime subscription status:", status)
          })
      } catch (err) {
        console.error("Error setting up realtime subscription:", err)
      }
    }

    setupRealtimeSubscription()

    // Cleanup subscription on unmount
    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [userId])

  // Mark notification as read
  const markAsRead = useCallback(
    async (notificationId: string) => {
      const result = await markNotificationAsRead(notificationId)

      if (result.success) {
        setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)))
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    },
    [],
  )

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!userId) return

    const result = await markAllNotificationsAsRead(userId)

    if (result.success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    }
  }, [userId])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  }
}

/**
 * Request browser notification permission
 */
export function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission().then((permission) => {
//       console.log("Notification permission:", permission)
    })
  }
}
