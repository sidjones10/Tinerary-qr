import { type NextRequest, NextResponse } from "next/server"
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "@/backend/services/notifications"
import { createClient } from "@/utils/supabase/server"
import logger from "@/backend/utils/logger"

export async function GET(req: NextRequest) {
  try {
    logger.info("Fetching notifications", "api")

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      logger.warn("Unauthorized notifications access attempt", "api")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const notifications = await getUserNotifications(user.id)

    logger.info(`Retrieved ${notifications.length} notifications for user`, "api", { userId: user.id })
    return NextResponse.json({ notifications })
  } catch (error: any) {
    logger.error("Error fetching notifications", "api", { error: error.message })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, notificationId } = await req.json()

    logger.info("Notification action request", "api", { action, notificationId })

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      logger.warn("Unauthorized notification action attempt", "api")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    switch (action) {
      case "markAsRead":
        if (!notificationId) {
          logger.warn("Missing notification ID for markAsRead action", "api")
          return NextResponse.json({ error: "Notification ID is required" }, { status: 400 })
        }
        const markResult = await markNotificationAsRead(notificationId)
        logger.info("Notification marked as read", "api", { notificationId, success: markResult.success })
        return NextResponse.json(markResult)

      case "markAllAsRead":
        const markAllResult = await markAllNotificationsAsRead(user.id)
        logger.info("All notifications marked as read", "api", { userId: user.id })
        return NextResponse.json(markAllResult)

      case "delete":
        if (!notificationId) {
          logger.warn("Missing notification ID for delete action", "api")
          return NextResponse.json({ error: "Notification ID is required" }, { status: 400 })
        }
        const deleteResult = await deleteNotification(notificationId)
        logger.info("Notification deleted", "api", { notificationId, success: deleteResult.success })
        return NextResponse.json(deleteResult)

      default:
        logger.warn("Invalid notification action requested", "api", { action })
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error: any) {
    logger.error("Error processing notification action", "api", { error: error.message })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
