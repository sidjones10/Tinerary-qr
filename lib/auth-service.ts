import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

export interface SignUpData {
  email: string
  password: string
  username?: string
  fullName?: string
  phoneNumber?: string
}

export interface SignUpResult {
  success: boolean
  user?: User
  error?: string
}

/**
 * Enhanced signup function with automatic profile creation
 * Creates user account and initializes all necessary database records
 */
export async function signUpWithProfile(data: SignUpData): Promise<SignUpResult> {
  try {
    const supabase = createClient()

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          username: data.username || data.email.split("@")[0],
          full_name: data.fullName,
        },
      },
    })

    if (authError) {
      console.error("Auth error:", authError)
      return { success: false, error: authError.message }
    }

    if (!authData.user) {
      return { success: false, error: "Failed to create user account" }
    }

    const userId = authData.user.id

    // 2. Create profile record
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: userId,
        email: data.email,
        name: data.fullName || data.username || data.email.split("@")[0],
        username: data.username || data.email.split("@")[0],
        phone: data.phoneNumber,
        avatar_url: null,
        bio: null,
        location: null,
        website: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
      },
    )

    if (profileError) {
      console.error("Profile creation error:", profileError)
      // Don't fail the signup if profile creation fails, but log it
    }

    // 3. Initialize user preferences
    const { error: preferencesError } = await supabase.from("user_preferences").insert({
      user_id: userId,
      preferred_destinations: [],
      preferred_activities: [],
      preferred_categories: [],
      travel_style: "balanced",
      budget_preference: "moderate",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (preferencesError) {
      console.error("Preferences creation error:", preferencesError)
    }

    // 4. Initialize user behavior tracking
    const { error: behaviorError } = await supabase.from("user_behavior").insert({
      user_id: userId,
      viewed_itineraries: [],
      saved_itineraries: [],
      liked_itineraries: [],
      search_history: [],
      last_active_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (behaviorError) {
      console.error("Behavior tracking creation error:", behaviorError)
    }

    // 5. Create welcome notification
    const { error: notificationError } = await supabase.from("notifications").insert({
      user_id: userId,
      type: "system_message",
      title: "Welcome to Tinerary!",
      message: "Start exploring amazing travel itineraries and create your own.",
      link_url: "/discover",
      is_read: false,
      created_at: new Date().toISOString(),
    })

    if (notificationError) {
      console.error("Welcome notification error:", notificationError)
    }

    return {
      success: true,
      user: authData.user,
    }
  } catch (error) {
    console.error("Signup error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}

/**
 * Enhanced sign in with profile check
 */
export async function signInWithEmail(email: string, password: string): Promise<SignUpResult> {
  try {
    const supabase = createClient()

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      return { success: false, error: authError.message }
    }

    if (!authData.user) {
      return { success: false, error: "Failed to sign in" }
    }

    // Ensure profile exists (in case of legacy users)
    await ensureProfileExists(authData.user.id, email)

    return {
      success: true,
      user: authData.user,
    }
  } catch (error) {
    console.error("Sign in error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}

/**
 * Ensure profile exists for a user (for legacy users or after auth)
 */
export async function ensureProfileExists(userId: string, email: string): Promise<void> {
  try {
    const supabase = createClient()

    // Check if profile exists
    const { data: existingProfile } = await supabase.from("profiles").select("id").eq("id", userId).single()

    if (!existingProfile) {
      // Create profile if it doesn't exist
      await supabase.from("profiles").insert({
        id: userId,
        email: email,
        name: email.split("@")[0],
        username: email.split("@")[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      // Initialize preferences if they don't exist
      const { data: existingPreferences } = await supabase
        .from("user_preferences")
        .select("id")
        .eq("user_id", userId)
        .single()

      if (!existingPreferences) {
        await supabase.from("user_preferences").insert({
          user_id: userId,
          preferred_destinations: [],
          preferred_activities: [],
          preferred_categories: [],
          travel_style: "balanced",
          budget_preference: "moderate",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }

      // Initialize behavior tracking if it doesn't exist
      const { data: existingBehavior } = await supabase
        .from("user_behavior")
        .select("id")
        .eq("user_id", userId)
        .single()

      if (!existingBehavior) {
        await supabase.from("user_behavior").insert({
          user_id: userId,
          viewed_itineraries: [],
          saved_itineraries: [],
          liked_itineraries: [],
          search_history: [],
          last_active_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }
    }
  } catch (error) {
    console.error("Error ensuring profile exists:", error)
  }
}

/**
 * Update user profile
 */
export async function updateProfile(
  userId: string,
  updates: {
    name?: string
    username?: string
    bio?: string
    location?: string
    website?: string
    avatar_url?: string
    phone?: string
  },
): Promise<{ success: boolean; error?: string }> {
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
    console.error("Error updating profile:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}

/**
 * Get user profile
 */
export async function getUserProfile(userId: string) {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (error) {
      console.error("Error fetching profile:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error fetching profile:", error)
    return null
  }
}

/**
 * Sign out
 */
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Sign out error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}
