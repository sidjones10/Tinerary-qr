import { createClient } from "@/lib/supabase/client"

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

    const { error } = await supabase.from("follows").insert({
      follower_id: userId,
      following_id: targetUserId,
    })

    if (error) {
      // Check if already following
      if (error.code === "23505") {
        return { success: false, error: "Already following this user" }
      }
      throw error
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
      .from("follows")
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

    const { data, error } = await supabase.rpc("is_following", {
      p_follower_id: userId,
      p_following_id: targetUserId,
    })

    if (error) throw error

    return { success: true, isFollowing: data as boolean }
  } catch (error: any) {
    console.error("Error checking follow status:", error)
    return { success: false, error: error.message }
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

    const { data, error } = await supabase.rpc("get_followers", {
      p_user_id: userId,
      p_limit: limit,
      p_offset: offset,
    })

    if (error) throw error

    return { success: true, followers: data as FollowUser[] }
  } catch (error: any) {
    console.error("Error getting followers:", error)
    return { success: false, error: error.message }
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

    const { data, error } = await supabase.rpc("get_following", {
      p_user_id: userId,
      p_limit: limit,
      p_offset: offset,
    })

    if (error) throw error

    return { success: true, following: data as FollowUser[] }
  } catch (error: any) {
    console.error("Error getting following:", error)
    return { success: false, error: error.message }
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

    const { data, error } = await supabase.rpc("get_mutual_followers", {
      p_user_id: userId,
      p_other_user_id: targetUserId,
    })

    if (error) throw error

    return { success: true, mutuals: data as FollowUser[] }
  } catch (error: any) {
    console.error("Error getting mutual followers:", error)
    return { success: false, error: error.message }
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

    const { data, error } = await supabase
      .from("profiles")
      .select("followers_count, following_count")
      .eq("id", userId)
      .single()

    if (error) throw error

    return {
      success: true,
      counts: {
        followers: data.followers_count || 0,
        following: data.following_count || 0,
      },
    }
  } catch (error: any) {
    console.error("Error getting follow counts:", error)
    return { success: false, error: error.message }
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
