import { createClient } from "@/utils/supabase/server"
import logger from "../utils/logger"

export type Notification = {
  id: string
  user_id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  read: boolean
  created_at: string
}

export async function sendNotification(
  userId: string,
  notification: Omit<Notification, "id" | "user_id" | "read" | "created_at">,
) {
  const supabase = createClient()

  logger.info(`Sending notification to user: ${userId}`, "notifications", {
    title: notification.title,
    type: notification.type,
  })

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      read: false,
    })
    .select()
    .single()

  if (error) {
    logger.error(`Error sending notification: ${error.message}`, "notifications", error)
    return { error: error.message }
  }

  logger.info(`Notification sent successfully to user: ${userId}`, "notifications", {
    notificationId: data.id,
  })
  return { success: true, notification: data }
}

export async function getUserNotifications(userId: string) {
  const supabase = createClient()

  logger.info(`Fetching notifications for user: ${userId}`, "notifications")

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    logger.error(`Error fetching notifications: ${error.message}`, "notifications", error)
    return []
  }

  logger.info(`Retrieved ${data?.length || 0} notifications for user: ${userId}`, "notifications")
  return data || []
}

export async function markNotificationAsRead(notificationId: string) {
  const supabase = createClient()

  logger.info(`Marking notification as read: ${notificationId}`, "notifications")

  const { error } = await supabase.from("notifications").update({ read: true }).eq("id", notificationId)

  if (error) {
    logger.error(`Error marking notification as read: ${error.message}`, "notifications", error)
    return { error: error.message }
  }

  logger.info(`Notification marked as read: ${notificationId}`, "notifications")
  return { success: true }
}

export async function markAllNotificationsAsRead(userId: string) {
  const supabase = createClient()

  logger.info(`Marking all notifications as read for user: ${userId}`, "notifications")

  const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false)

  if (error) {
    logger.error(`Error marking all notifications as read: ${error.message}`, "notifications", error)
    return { error: error.message }
  }

  logger.info(`All notifications marked as read for user: ${userId}`, "notifications")
  return { success: true }
}

export async function deleteNotification(notificationId: string) {
  const supabase = createClient()

  logger.info(`Deleting notification: ${notificationId}`, "notifications")

  const { error } = await supabase.from("notifications").delete().eq("id", notificationId)

  if (error) {
    logger.error(`Error deleting notification: ${error.message}`, "notifications", error)
    return { error: error.message }
  }

  logger.info(`Notification deleted: ${notificationId}`, "notifications")
  return { success: true }
}

export async function getUnreadNotificationCount(userId: string) {
  const supabase = createClient()

  logger.info(`Getting unread notification count for user: ${userId}`, "notifications")

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false)

  if (error) {
    logger.error(`Error getting unread notification count: ${error.message}`, "notifications", error)
    return 0
  }

  logger.info(`User ${userId} has ${count} unread notifications`, "notifications")
  return count || 0
}
