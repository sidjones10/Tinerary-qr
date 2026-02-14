import { createClient } from "@/lib/supabase/client"
import { notifyNewComment } from "@/lib/notification-service"
import { sendNewCommentEmail } from "@/lib/email-notifications"

export interface Comment {
  id: string
  itinerary_id: string
  user_id: string
  parent_comment_id: string | null
  content: string
  is_edited: boolean
  edited_at: string | null
  created_at: string
  updated_at: string
  user?: {
    id: string
    name: string | null
    username: string | null
    avatar_url: string | null
  }
  replies?: Comment[]
}

/**
 * Fetch comments for an itinerary
 */
export async function getComments(itineraryId: string): Promise<Comment[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("comments")
      .select(`
        *,
        profiles:user_id (
          id,
          name,
          username,
          avatar_url
        )
      `)
      .eq("itinerary_id", itineraryId)
      .is("parent_comment_id", null)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching comments:", error)
      return []
    }

    // Transform the data to match our interface
    const comments: Comment[] = (data || []).map((comment: any) => ({
      ...comment,
      user: Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles,
    }))

    return comments
  } catch (error) {
    console.error("Error in getComments:", error)
    return []
  }
}

/**
 * Fetch replies for a comment
 */
export async function getReplies(commentId: string): Promise<Comment[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("comments")
      .select(`
        *,
        profiles:user_id (
          id,
          name,
          username,
          avatar_url
        )
      `)
      .eq("parent_comment_id", commentId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching replies:", error)
      return []
    }

    const replies: Comment[] = (data || []).map((reply: any) => ({
      ...reply,
      user: Array.isArray(reply.profiles) ? reply.profiles[0] : reply.profiles,
    }))

    return replies
  } catch (error) {
    console.error("Error in getReplies:", error)
    return []
  }
}

/**
 * Create a new comment
 */
export async function createComment(
  itineraryId: string,
  userId: string,
  content: string,
  parentCommentId?: string | null
): Promise<{ success: boolean; comment?: Comment; error?: string }> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("comments")
      .insert({
        itinerary_id: itineraryId,
        user_id: userId,
        content: content,
        parent_comment_id: parentCommentId || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select(`
        *,
        profiles:user_id (
          id,
          name,
          username,
          avatar_url
        )
      `)
      .single()

    if (error) {
      console.error("Error creating comment:", error)
      return { success: false, error: error.message }
    }

    const comment: Comment = {
      ...data,
      user: Array.isArray(data.profiles) ? data.profiles[0] : data.profiles,
    }

    // Send notification to itinerary owner (if not commenting on own post)
    try {
      const { data: itinerary } = await supabase
        .from("itineraries")
        .select("user_id, title")
        .eq("id", itineraryId)
        .single()

      if (itinerary && itinerary.user_id !== userId) {
        const commenterProfile = comment.user

        // Send in-app notification
        await notifyNewComment(
          itinerary.user_id,
          commenterProfile?.name || "Someone",
          commenterProfile?.avatar_url || null,
          itineraryId,
          itinerary.title,
          content
        )

        // Send email notification (async, don't block)
        const { data: ownerProfile } = await supabase
          .from("profiles")
          .select("email, name, email_notifications")
          .eq("id", itinerary.user_id)
          .single()

        if (ownerProfile?.email && ownerProfile?.email_notifications !== false) {
          sendNewCommentEmail(
            ownerProfile.email,
            ownerProfile.name || "there",
            commenterProfile?.name || "Someone",
            content,
            itinerary.title,
            itineraryId
          ).catch(err => console.error("Failed to send comment email:", err))
        }
      }
    } catch (notifyError) {
      // Don't fail the comment if notification fails
      console.error("Failed to send comment notification:", notifyError)
    }

    return { success: true, comment }
  } catch (error: any) {
    console.error("Error in createComment:", error)
    return { success: false, error: error.message || "Failed to create comment" }
  }
}

/**
 * Update a comment
 */
export async function updateComment(
  commentId: string,
  userId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from("comments")
      .update({
        content: content,
        is_edited: true,
        edited_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", commentId)
      .eq("user_id", userId)

    if (error) {
      console.error("Error updating comment:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error in updateComment:", error)
    return { success: false, error: error.message || "Failed to update comment" }
  }
}

/**
 * Delete a comment
 */
export async function deleteComment(
  commentId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", userId)

    if (error) {
      console.error("Error deleting comment:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error in deleteComment:", error)
    return { success: false, error: error.message || "Failed to delete comment" }
  }
}

/**
 * Get comment count for an itinerary
 */
export async function getCommentCount(itineraryId: string): Promise<number> {
  try {
    const supabase = createClient()

    const { count, error } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("itinerary_id", itineraryId)

    if (error) {
      console.error("Error getting comment count:", error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error("Error in getCommentCount:", error)
    return 0
  }
}
