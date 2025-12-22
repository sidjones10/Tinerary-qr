import { createClient } from "@/lib/supabase/client"

export type NotificationType =
  | "booking_confirmation"
  | "ticket_issued"
  | "itinerary_rsvp"
  | "promotion_approved"
  | "affiliate_conversion"
  | "system_message"
  | "new_comment"
  | "comment_reply"
  | "like"
  | "follower"
  | "share"
  | "invitation"

interface NotificationData {
  userId: string
  type: NotificationType
  title: string
  message: string
  linkUrl?: string
  imageUrl?: string
  metadata?: Record<string, any>
}

export async function createNotification(data: NotificationData) {
  try {
    const supabase = createClient()
    const { data: notification, error } = await supabase
      .from("notifications")
      .insert({
        user_id: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        link_url: data.linkUrl,
        image_url: data.imageUrl,
        metadata: data.metadata,
        is_read: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating notification:", error)
      return { success: false, error }
    }

    return { success: true, notification }
  } catch (error) {
    console.error("Error in notification service:", error)
    return { success: false, error }
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)

    if (error) {
      console.error("Error marking notification as read:", error.message || error)
      return { success: false, error: error.message || "Failed to mark notification as read" }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error in notification service:", error)
    return { success: false, error: error.message || "Failed to mark notification as read" }
  }
}

export async function markAllNotificationsAsRead(userId: string) {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false)

    if (error) {
      console.error("Error marking all notifications as read:", error.message || error)
      return { success: false, error: error.message || "Failed to mark all notifications as read" }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error in notification service:", error)
    return { success: false, error: error.message || "Failed to mark all notifications as read" }
  }
}

export async function getUserNotifications(
  userId: string,
  options: {
    limit?: number
    offset?: number
    type?: NotificationType | NotificationType[]
    unreadOnly?: boolean
  } = {},
) {
  try {
    const supabase = createClient()
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (options.unreadOnly) {
      query = query.eq("is_read", false)
    }

    if (options.type) {
      if (Array.isArray(options.type)) {
        query = query.in("type", options.type)
      } else {
        query = query.eq("type", options.type)
      }
    }

    if (options.limit) {
      query = query.limit(options.limit)
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error, count } = await query

    if (error) {
      console.error("Error fetching notifications:", error)
      return { success: false, notifications: [], count: 0, error: error.message }
    }

    return { success: true, notifications: data || [], count: count || 0 }
  } catch (error: any) {
    console.error("Error in notification service:", error)
    return { success: false, notifications: [], count: 0, error: error.message || "Failed to fetch notifications" }
  }
}

export async function getUnreadNotificationCount(userId: string) {
  try {
    const supabase = createClient()
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false)

    if (error) {
      console.error("Error counting unread notifications:", error)
      return { success: false, count: 0, error: error.message }
    }

    return { success: true, count: count || 0 }
  } catch (error: any) {
    console.error("Error in notification service:", error)
    return { success: false, count: 0, error: error.message || "Failed to count notifications" }
  }
}
