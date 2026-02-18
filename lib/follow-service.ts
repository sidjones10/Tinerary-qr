import { createClient } from "@/lib/supabase/client"
import { notifyNewFollower, getUserNotificationPreferences } from "@/lib/notification-service"
import { sendNewFollowerEmail } from "@/lib/email-notifications"

export interface FollowUser {
  id: string
  name: string | null
  username: string | null
  avatar_url: string | null
  bio?: string | null
  followed_at?: string
  is_following?: boolean
}

/**
 * Follow a user
 */
export async function followUser(
  userId: string,
  targetUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    // Prevent self-follow
    if (userId === targetUserId) {
      return { success: false, error: "You cannot follow yourself" }
    }

    const { error } = await supabase.from("user_follows").insert({
      follower_id: userId,
      following_id: targetUserId,
    })

    if (error) {
      console.error("Follow error:", error)
      // Check if already following
      if (error.code === "23505") {
        return { success: false, error: "Already following this user" }
      }
      // Check if table doesn't exist
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        return { success: false, error: "Follow feature not available - please contact support" }
      }
      throw error
    }

    // Send notification to the user being followed
    try {
      // Get follower's profile info for the notification
      const { data: followerProfile } = await supabase
        .from("profiles")
        .select("name, username, avatar_url")
        .eq("id", userId)
        .single()

      if (followerProfile) {
        // Send in-app notification
        await notifyNewFollower(
          targetUserId,
          followerProfile.name || "Someone",
          followerProfile.username,
          followerProfile.avatar_url,
          userId
        )

        // Send email notification if user has email notifications enabled
        const targetPrefs = await getUserNotificationPreferences(targetUserId)
        if (targetPrefs.email) {
          const { data: targetProfile } = await supabase
            .from("profiles")
            .select("email, name")
            .eq("id", targetUserId)
            .single()

          if (targetProfile?.email) {
            sendNewFollowerEmail(
              targetProfile.email,
              targetProfile.name || "there",
              followerProfile.name || "Someone",
              followerProfile.username || userId,
              followerProfile.avatar_url
            ).catch(err => console.error("Failed to send follower email:", err))
          }
        }
      }
    } catch (notifyError) {
      // Don't fail the follow if notification fails
      console.error("Failed to send follow notification:", notifyError)
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error following user:", error)
    return { success: false, error: error.message || "Failed to follow user" }
  }
}

/**
 * Unfollow a user
 */
export async function unfollowUser(
  userId: string,
  targetUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from("user_follows")
      .delete()
      .eq("follower_id", userId)
      .eq("following_id", targetUserId)

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    console.error("Error unfollowing user:", error)
    return { success: false, error: error.message || "Failed to unfollow user" }
  }
}

/**
 * Check if a user is following another user
 */
export async function isFollowing(
  userId: string,
  targetUserId: string
): Promise<{ success: boolean; isFollowing?: boolean; error?: string }> {
  try {
    const supabase = createClient()

    // Use direct query (more reliable than RPC if RPC doesn't exist)
    const { data, error } = await supabase
      .from("user_follows")
      .select("id")
      .eq("follower_id", userId)
      .eq("following_id", targetUserId)
      .maybeSingle()

    if (error) {
      console.error("Error checking follow status:", error)
      // If table doesn't exist, return not following
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        console.warn("user_follows table may not exist - run migration 017_add_follows_system.sql")
        return { success: true, isFollowing: false }
      }
      throw error
    }

    return { success: true, isFollowing: !!data }
  } catch (error: any) {
    console.error("Error checking follow status:", error)
    // Default to not following on error to allow UI to function
    return { success: true, isFollowing: false }
  }
}

/**
 * Get followers list
 */
export async function getFollowers(
  userId: string,
  limit = 50,
  offset = 0
): Promise<{ success: boolean; followers?: FollowUser[]; error?: string }> {
  try {
    const supabase = createClient()

    // Use direct query with join (more reliable than RPC)
    const { data, error } = await supabase
      .from("user_follows")
      .select(`
        created_at,
        follower:profiles!user_follows_follower_id_fkey(
          id,
          name,
          username,
          avatar_url,
          bio
        )
      `)
      .eq("following_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error getting followers:", error)
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        return { success: true, followers: [] }
      }
      throw error
    }

    // Transform the data to match FollowUser interface
    const followers: FollowUser[] = (data || []).map((item: any) => ({
      id: item.follower?.id,
      name: item.follower?.name,
      username: item.follower?.username,
      avatar_url: item.follower?.avatar_url,
      bio: item.follower?.bio,
      followed_at: item.created_at,
    })).filter((f: FollowUser) => f.id) // Filter out any null followers

    return { success: true, followers }
  } catch (error: any) {
    console.error("Error getting followers:", error)
    return { success: true, followers: [] } // Return empty array on error
  }
}

/**
 * Get following list
 */
export async function getFollowing(
  userId: string,
  limit = 50,
  offset = 0
): Promise<{ success: boolean; following?: FollowUser[]; error?: string }> {
  try {
    const supabase = createClient()

    // Use direct query with join (more reliable than RPC)
    const { data, error } = await supabase
      .from("user_follows")
      .select(`
        created_at,
        following:profiles!user_follows_following_id_fkey(
          id,
          name,
          username,
          avatar_url,
          bio
        )
      `)
      .eq("follower_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error getting following:", error)
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        return { success: true, following: [] }
      }
      throw error
    }

    // Transform the data to match FollowUser interface
    const following: FollowUser[] = (data || []).map((item: any) => ({
      id: item.following?.id,
      name: item.following?.name,
      username: item.following?.username,
      avatar_url: item.following?.avatar_url,
      bio: item.following?.bio,
      followed_at: item.created_at,
    })).filter((f: FollowUser) => f.id) // Filter out any null following

    return { success: true, following }
  } catch (error: any) {
    console.error("Error getting following:", error)
    return { success: true, following: [] } // Return empty array on error
  }
}

/**
 * Get mutual followers (people you both follow)
 */
export async function getMutualFollowers(
  userId: string,
  targetUserId: string
): Promise<{ success: boolean; mutuals?: FollowUser[]; error?: string }> {
  try {
    const supabase = createClient()

    // Get users that both users follow
    const [userFollowing, targetFollowing] = await Promise.all([
      supabase
        .from("user_follows")
        .select("following_id")
        .eq("follower_id", userId),
      supabase
        .from("user_follows")
        .select("following_id")
        .eq("follower_id", targetUserId),
    ])

    if (userFollowing.error || targetFollowing.error) {
      return { success: true, mutuals: [] }
    }

    // Find intersection
    const userFollowingIds = new Set((userFollowing.data || []).map(f => f.following_id))
    const mutualIds = (targetFollowing.data || [])
      .filter(f => userFollowingIds.has(f.following_id))
      .map(f => f.following_id)

    if (mutualIds.length === 0) {
      return { success: true, mutuals: [] }
    }

    // Get profile info for mutual followers
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, username, avatar_url")
      .in("id", mutualIds)

    return { success: true, mutuals: (profiles || []) as FollowUser[] }
  } catch (error: any) {
    console.error("Error getting mutual followers:", error)
    return { success: true, mutuals: [] }
  }
}

/**
 * Get follower/following counts
 */
export async function getFollowCounts(
  userId: string
): Promise<{ success: boolean; counts?: { followers: number; following: number }; error?: string }> {
  try {
    const supabase = createClient()

    // First try to get cached counts from profiles
    const { data, error } = await supabase
      .from("profiles")
      .select("followers_count, following_count")
      .eq("id", userId)
      .single()

    if (!error && data && (data.followers_count !== null || data.following_count !== null)) {
      return {
        success: true,
        counts: {
          followers: data.followers_count || 0,
          following: data.following_count || 0,
        },
      }
    }

    // Fallback: count directly from user_follows table
    const [followersResult, followingResult] = await Promise.all([
      supabase
        .from("user_follows")
        .select("id", { count: "exact", head: true })
        .eq("following_id", userId),
      supabase
        .from("user_follows")
        .select("id", { count: "exact", head: true })
        .eq("follower_id", userId),
    ])

    return {
      success: true,
      counts: {
        followers: followersResult.count || 0,
        following: followingResult.count || 0,
      },
    }
  } catch (error: any) {
    console.error("Error getting follow counts:", error)
    // Return zeros on error so UI still works
    return { success: true, counts: { followers: 0, following: 0 } }
  }
}

/**
 * Toggle follow/unfollow
 */
export async function toggleFollow(
  userId: string,
  targetUserId: string
): Promise<{ success: boolean; isFollowing?: boolean; error?: string }> {
  try {
    // Check current status
    const statusResult = await isFollowing(userId, targetUserId)

    if (!statusResult.success) {
      return statusResult
    }

    // Toggle based on current status
    if (statusResult.isFollowing) {
      const result = await unfollowUser(userId, targetUserId)
      return { ...result, isFollowing: false }
    } else {
      const result = await followUser(userId, targetUserId)
      return { ...result, isFollowing: true }
    }
  } catch (error: any) {
    console.error("Error toggling follow:", error)
    return { success: false, error: error.message }
  }
}
