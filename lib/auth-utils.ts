import { createClient } from "@/lib/supabase/client"

/**
 * Checks if the user is authenticated
 * @returns {Promise<boolean>} True if authenticated, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const supabase = createClient()
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error("Auth check error:", error)
      return false
    }

    return !!session
  } catch (err) {
    console.error("Exception during auth check:", err)
    return false
  }
}

/**
 * Attempts to refresh the session
 * @returns {Promise<boolean>} True if refresh was successful, false otherwise
 */
export async function refreshSession(): Promise<boolean> {
  try {
    const supabase = createClient()
    const {
      data: { session },
      error,
    } = await supabase.auth.refreshSession()

    if (error) {
      console.error("Session refresh error:", error)
      return false
    }

    return !!session
  } catch (err) {
    console.error("Exception during session refresh:", err)
    return false
  }
}

/**
 * Gets the current user if authenticated
 * @returns {Promise<any>} The user object or null
 */
export async function getCurrentUser(): Promise<any> {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error("Get user error:", error)
      return null
    }

    return user
  } catch (err) {
    console.error("Exception during get user:", err)
    return null
  }
}

/**
 * Signs out the current user
 * @returns {Promise<boolean>} True if sign out was successful, false otherwise
 */
export async function signOut(): Promise<boolean> {
  try {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("Sign out error:", error)
      return false
    }

    return true
  } catch (err) {
    console.error("Exception during sign out:", err)
    return false
  }
}
