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
  | "first_post"
  | "view_milestone"

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
      const errorMessage = error.message || error.code || error.hint || "Unknown database error"
      console.error("Error creating notification:", errorMessage, error)
      return { success: false, error: errorMessage }
    }

    return { success: true, notification }
  } catch (error: any) {
    const errorMessage = error.message || "Unknown error in notification service"
    console.error("Error in notification service:", errorMessage, error)
    return { success: false, error: errorMessage }
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

// ============================================================================
// Dopamine Hit Notifications - Milestone & Achievement Helpers
// ============================================================================

/**
 * Send notification for user's first post
 */
export async function notifyFirstPost(userId: string, itineraryId: string, itineraryTitle: string) {
  return createNotification({
    userId,
    type: "first_post",
    title: "🎉 Congratulations on your first post!",
    message: `Your itinerary "${itineraryTitle}" is now live! Share it with friends and start building your travel community.`,
    linkUrl: `/event/${itineraryId}`,
  })
}

/**
 * Send notification for new comment on user's itinerary
 */
export async function notifyNewComment(
  itineraryOwnerId: string,
  commenterName: string,
  commenterAvatar: string | null,
  itineraryId: string,
  itineraryTitle: string,
  commentPreview: string
) {
  return createNotification({
    userId: itineraryOwnerId,
    type: "new_comment",
    title: `💬 ${commenterName} commented on your itinerary`,
    message: commentPreview.length > 100 ? commentPreview.substring(0, 100) + "..." : commentPreview,
    linkUrl: `/event/${itineraryId}`,
    imageUrl: commenterAvatar || undefined,
    metadata: { itineraryTitle },
  })
}

/**
 * Send notification for new follower
 */
export async function notifyNewFollower(
  userId: string,
  followerName: string,
  followerUsername: string | null,
  followerAvatar: string | null,
  followerId: string
) {
  return createNotification({
    userId,
    type: "follower",
    title: `🎊 ${followerName} started following you!`,
    message: followerUsername ? `@${followerUsername} is now following your journey` : `${followerName} is now following your journey`,
    linkUrl: `/user/${followerId}`,
    imageUrl: followerAvatar || undefined,
  })
}

/**
 * Send notification for new like on user's itinerary
 */
export async function notifyNewLike(
  itineraryOwnerId: string,
  likerName: string,
  likerAvatar: string | null,
  itineraryId: string,
  itineraryTitle: string,
  likerId: string
) {
  // Don't notify if the user is liking their own itinerary
  if (itineraryOwnerId === likerId) {
    return { success: true, skipped: true }
  }

  return createNotification({
    userId: itineraryOwnerId,
    type: "like",
    title: `❤️ ${likerName} liked your itinerary`,
    message: `"${itineraryTitle}" is getting love!`,
    linkUrl: `/event/${itineraryId}`,
    imageUrl: likerAvatar || undefined,
    metadata: { itineraryId, itineraryTitle, likerId },
  })
}

/**
 * View milestone thresholds
 */
export const VIEW_MILESTONES = [500, 1000, 5000] as const

/**
 * Send notification for view milestone (500, 1000, 5000 views)
 */
export async function notifyViewMilestone(
  userId: string,
  itineraryId: string,
  itineraryTitle: string,
  viewCount: number
) {
  // Only notify for specific milestones
  if (!VIEW_MILESTONES.includes(viewCount as 500 | 1000 | 5000)) {
    return { success: false, error: "Not a milestone view count" }
  }

  const emoji = viewCount >= 5000 ? "🔥" : viewCount >= 1000 ? "🚀" : "⭐"
  const celebration = viewCount >= 5000 ? "incredible" : viewCount >= 1000 ? "amazing" : "awesome"

  return createNotification({
    userId,
    type: "view_milestone",
    title: `${emoji} ${viewCount.toLocaleString()} views!`,
    message: `Your itinerary "${itineraryTitle}" has reached ${viewCount.toLocaleString()} views! That's ${celebration}!`,
    linkUrl: `/event/${itineraryId}`,
    metadata: { viewCount, itineraryTitle },
  })
}

/**
 * Check if a view milestone notification should be sent
 * Returns the milestone number if it should be sent, null otherwise
 */
export function checkViewMilestone(currentViews: number, previousViews: number): number | null {
  for (const milestone of VIEW_MILESTONES) {
    if (currentViews >= milestone && previousViews < milestone) {
      return milestone
    }
  }
  return null
}
