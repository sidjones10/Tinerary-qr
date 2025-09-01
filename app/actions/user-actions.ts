"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateUserProfile(formData: FormData) {
  try {
    const supabase = createClient()

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        error: userError?.message || "User not authenticated",
      }
    }

    // Extract form data
    const name = formData.get("name") as string
    const bio = formData.get("bio") as string
    const location = formData.get("location") as string

    // Validate inputs
    if (name && name.length > 50) {
      return { success: false, error: "Name must be less than 50 characters" }
    }

    if (bio && bio.length > 500) {
      return { success: false, error: "Bio must be less than 500 characters" }
    }

    // Update the user profile in the profiles table
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        name,
        bio,
        location,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("Error updating profile:", updateError)
      return {
        success: false,
        error: updateError.message || "Failed to update profile",
      }
    }

    // Revalidate the profile page to show updated data
    revalidatePath("/profile")

    return { success: true }
  } catch (error) {
    console.error("Unexpected error updating profile:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}
