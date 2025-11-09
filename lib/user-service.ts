import { createClient } from "@/lib/supabase/client"

/**
 * Follow a user
 */
export async function followUser(userId: string, targetUserId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    // Check if already following
    const { data: existing } = await supabase
      .from("user_follows")
      .select("id")
      .eq("follower_id", userId)
      .eq("following_id", targetUserId)
      .single()

    if (existing) {
      return { success: false, error: "Already following this user" }
    }

    // Create follow relationship
    const { error } = await supabase.from("user_follows").insert({
      follower_id: userId,
      following_id: targetUserId,
      created_at: new Date().toISOString(),
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Follow user error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}

/**
 * Unfollow a user
 */
export async function unfollowUser(userId: string, targetUserId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from("user_follows")
      .delete()
      .eq("follower_id", userId)
      .eq("following_id", targetUserId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Unfollow user error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}

/**
 * Check if user is following another user
 */
export async function isFollowing(userId: string, targetUserId: string): Promise<boolean> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("user_follows")
      .select("id")
      .eq("follower_id", userId)
      .eq("following_id", targetUserId)
      .single()

    if (error) return false
    return !!data
  } catch (error) {
    console.error("Check following error:", error)
    return false
  }
}

/**
 * Get user followers
 */
export async function getUserFollowers(userId: string) {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("user_follows")
      .select("follower_id, profiles!user_follows_follower_id_fkey(id, name, username, avatar_url)")
      .eq("following_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching followers:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error fetching followers:", error)
    return []
  }
}

/**
 * Get users that a user is following
 */
export async function getUserFollowing(userId: string) {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("user_follows")
      .select("following_id, profiles!user_follows_following_id_fkey(id, name, username, avatar_url)")
      .eq("follower_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching following:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error fetching following:", error)
    return []
  }
}

/**
 * Get user profile by ID or username
 */
export async function getUserProfile(identifier: string) {
  try {
    const supabase = createClient()

    // Try to fetch by ID first, then by username
    let query = supabase
      .from("profiles")
      .select("*")

    // Check if identifier is a UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier)

    if (isUUID) {
      query = query.eq("id", identifier)
    } else {
      query = query.eq("username", identifier)
    }

    const { data, error } = await query.single()

    if (error) {
      console.error("Error fetching user profile:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return null
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId: string, updates: any): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from("profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Update profile error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}
