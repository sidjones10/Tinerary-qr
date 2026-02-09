"use server"

import { createClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

const PackingItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  packed: z.boolean().default(false),
})

// Helper function to get the current user
async function getCurrentUser() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    return null
  }

  return data.user
}

export async function createPackingItem(tripId: string, formData: FormData) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect("/auth/sign-in")
    }

    const validatedFields = PackingItemSchema.safeParse({
      name: formData.get("name"),
      packed: formData.get("packed") === "on",
    })

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
      }
    }

    const { name, packed } = validatedFields.data

    // Use Supabase client directly for better error handling
    const supabase = await createClient()
    const { error } = await supabase.from("packing_items").insert({
      name,
      is_packed: packed,
      itinerary_id: tripId,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error creating packing item:", error)
      return {
        success: false,
        error: "Failed to create packing item. Please try again.",
      }
    }

    revalidatePath(`/trip/${tripId}`)
    revalidatePath(`/trip/${tripId}/packing`)
    revalidatePath(`/event/${tripId}`)

    return { success: true }
  } catch (error) {
    console.error("Error creating packing item:", error)
    return {
      success: false,
      error: "Failed to create packing item. Please try again.",
    }
  }
}

export async function updatePackingItem(itemId: string, tripId: string, formData: FormData) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect("/auth/sign-in")
    }

    const validatedFields = PackingItemSchema.safeParse({
      name: formData.get("name"),
      packed: formData.get("packed") === "on",
    })

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
      }
    }

    const { name, packed } = validatedFields.data

    // Use Supabase client directly for better error handling
    const supabase = await createClient()
    const { error } = await supabase
      .from("packing_items")
      .update({
        name,
        is_packed: packed,
        updated_at: new Date().toISOString(),
      })
      .eq("id", itemId)
      .eq("itinerary_id", tripId)

    if (error) {
      console.error("Error updating packing item:", error)
      return {
        success: false,
        error: "Failed to update packing item. Please try again.",
      }
    }

    revalidatePath(`/trip/${tripId}`)
    revalidatePath(`/trip/${tripId}/packing`)
    revalidatePath(`/event/${tripId}`)

    return { success: true }
  } catch (error) {
    console.error("Error updating packing item:", error)
    return {
      success: false,
      error: "Failed to update packing item. Please try again.",
    }
  }
}

export async function togglePackingItem(itemId: string, tripId: string, packed: boolean) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect("/auth/sign-in")
    }

    // Use Supabase client directly for better error handling
    const supabase = await createClient()
    const { error } = await supabase
      .from("packing_items")
      .update({
        is_packed: packed,
        updated_at: new Date().toISOString(),
      })
      .eq("id", itemId)
      .eq("itinerary_id", tripId)

    if (error) {
      console.error("Error toggling packing item:", error)
      return {
        success: false,
        error: "Failed to update packing item status. Please try again.",
      }
    }

    revalidatePath(`/trip/${tripId}`)
    revalidatePath(`/trip/${tripId}/packing`)
    revalidatePath(`/event/${tripId}`)

    return { success: true }
  } catch (error) {
    console.error("Error toggling packing item:", error)
    return {
      success: false,
      error: "Failed to update packing item status. Please try again.",
    }
  }
}

export async function deletePackingItem(itemId: string, tripId: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect("/auth/sign-in")
    }

    // Use Supabase client directly for better error handling
    const supabase = await createClient()
    const { error } = await supabase.from("packing_items").delete().eq("id", itemId).eq("itinerary_id", tripId)

    if (error) {
      console.error("Error deleting packing item:", error)
      return {
        success: false,
        error: "Failed to delete packing item. Please try again.",
      }
    }

    revalidatePath(`/trip/${tripId}`)
    revalidatePath(`/trip/${tripId}/packing`)
    revalidatePath(`/event/${tripId}`)

    return { success: true }
  } catch (error) {
    console.error("Error deleting packing item:", error)
    return {
      success: false,
      error: "Failed to delete packing item. Please try again.",
    }
  }
}

export async function getPackingItems(tripId: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect("/auth/sign-in")
    }

    // Use Supabase client directly for better error handling
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("packing_items")
      .select("*")
      .eq("itinerary_id", tripId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching packing items:", error)
      return []
    }

    return data
  } catch (error) {
    console.error("Error fetching packing items:", error)
    return []
  }
}
