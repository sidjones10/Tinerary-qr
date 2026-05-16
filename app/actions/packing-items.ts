"use server"

import { createClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

const PackingItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  packed: z.boolean().default(false),
  url: z.string().optional(),
  category: z.string().optional(),
  quantity: z.number().int().min(1).default(1),
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

    const rawQuantity = formData.get("quantity")
    const validatedFields = PackingItemSchema.safeParse({
      name: formData.get("name"),
      packed: formData.get("packed") === "on",
      url: formData.get("url") || undefined,
      category: formData.get("category") || undefined,
      quantity: rawQuantity ? Number.parseInt(rawQuantity as string) || 1 : 1,
    })

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
      }
    }

    const { name, packed, url, category, quantity } = validatedFields.data

    // Use Supabase client directly for better error handling
    const supabase = await createClient()
    const { error } = await supabase.from("packing_items").insert({
      name,
      is_packed: packed,
      itinerary_id: tripId,
      user_id: user.id,
      url: url || null,
      category: category || null,
      quantity: quantity || 1,
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

    const rawQuantity = formData.get("quantity")
    const validatedFields = PackingItemSchema.safeParse({
      name: formData.get("name"),
      packed: formData.get("packed") === "on",
      url: formData.get("url") || undefined,
      category: formData.get("category") || undefined,
      quantity: rawQuantity ? Number.parseInt(rawQuantity as string) || 1 : 1,
    })

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
      }
    }

    const { name, packed, url, category, quantity } = validatedFields.data

    // Use Supabase client directly for better error handling
    const supabase = await createClient()
    const { error } = await supabase
      .from("packing_items")
      .update({
        name,
        is_packed: packed,
        url: url || null,
        category: category || null,
        quantity: quantity || 1,
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
    const { data, error } = await supabase
      .from("packing_items")
      .update({
        is_packed: packed,
        updated_at: new Date().toISOString(),
      })
      .eq("id", itemId)
      .eq("itinerary_id", tripId)
      .select("id")

    if (error) {
      console.error("Error toggling packing item:", error)
      return {
        success: false,
        error: "Failed to update packing item status. Please try again.",
      }
    }

    // An RLS policy can filter out the row without raising an error, leaving
    // the update affecting zero rows. Treat that as a failure so the UI does
    // not falsely show the change as persisted.
    if (!data || data.length === 0) {
      console.error("Toggle packing item updated no rows", { itemId, tripId })
      return {
        success: false,
        error: "You don't have permission to update this item, or it no longer exists.",
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
