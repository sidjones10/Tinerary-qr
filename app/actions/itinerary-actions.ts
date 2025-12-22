"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import type { Database } from "@/lib/database.types"

type Itinerary = Database["public"]["Tables"]["itineraries"]["Row"]
type NewItinerary = Omit<Itinerary, "id" | "created_at" | "user_id">

type Activity = Database["public"]["Tables"]["activities"]["Row"]
type NewActivity = Omit<Activity, "id" | "created_at" | "user_id">

// Itinerary actions
export async function createItinerary(formData: FormData) {
  const supabase = createClient()

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If not authenticated, redirect to login page
  if (!session) {
    return redirect("/login?message=You must be logged in to create an itinerary&redirect=/app/create")
  }

  try {
    const data: NewItinerary = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      start_date: formData.get("start_date") as string,
      end_date: formData.get("end_date") as string,
      location: formData.get("location") as string,
      cover_image_url: (formData.get("cover_image_url") as string) || null,
      is_public: formData.get("is_public") === "true",
      is_template: formData.get("is_template") === "true",
    }

    const { data: itinerary, error } = await supabase
      .from("itineraries")
      .insert([{ ...data, user_id: session.user.id }])
      .select()
      .single()

    if (error) throw error

    revalidatePath("/app/itineraries")
    return { success: true, data: itinerary }
  } catch (error) {
    console.error("Error creating itinerary:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function updateItinerary(id: string, formData: FormData) {
  const supabase = createClient()

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If not authenticated, redirect to login page
  if (!session) {
    return redirect("/login?message=You must be logged in to update an itinerary&redirect=/app/itineraries")
  }

  try {
    const updates: Partial<NewItinerary> = {}

    // Only add fields that are present in the form data
    if (formData.has("title")) updates.title = formData.get("title") as string
    if (formData.has("description")) updates.description = formData.get("description") as string
    if (formData.has("start_date")) updates.start_date = formData.get("start_date") as string
    if (formData.has("end_date")) updates.end_date = formData.get("end_date") as string
    if (formData.has("location")) updates.location = formData.get("location") as string
    if (formData.has("cover_image_url")) updates.cover_image_url = formData.get("cover_image_url") as string
    if (formData.has("is_public")) updates.is_public = formData.get("is_public") === "true"
    if (formData.has("is_template")) updates.is_template = formData.get("is_template") === "true"

    // First check if the user owns this itinerary
    const { data: itinerary, error: fetchError } = await supabase
      .from("itineraries")
      .select("user_id")
      .eq("id", id)
      .single()

    if (fetchError) throw fetchError

    // If the user doesn't own this itinerary, return an error
    if (itinerary.user_id !== session.user.id) {
      return { success: false, error: "You don't have permission to update this itinerary" }
    }

    const { data, error } = await supabase.from("itineraries").update(updates).eq("id", id).select().single()

    if (error) throw error

    revalidatePath(`/itinerary/${id}`)
    revalidatePath("/app/itineraries")
    return { success: true, data }
  } catch (error) {
    console.error("Error updating itinerary:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function deleteItinerary(id: string) {
  const supabase = createClient()

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If not authenticated, redirect to login page
  if (!session) {
    return redirect("/login?message=You must be logged in to delete an itinerary&redirect=/app/itineraries")
  }

  try {
    // First check if the user owns this itinerary
    const { data: itinerary, error: fetchError } = await supabase
      .from("itineraries")
      .select("user_id")
      .eq("id", id)
      .single()

    if (fetchError) throw fetchError

    // If the user doesn't own this itinerary, return an error
    if (itinerary.user_id !== session.user.id) {
      return { success: false, error: "You don't have permission to delete this itinerary" }
    }

    const { error } = await supabase.from("itineraries").delete().eq("id", id)

    if (error) throw error

    revalidatePath("/app/itineraries")
    return { success: true }
  } catch (error) {
    console.error("Error deleting itinerary:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function rsvpToItinerary(itineraryId: string, response: "yes" | "no" | "maybe") {
  const supabase = createClient()

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If not authenticated, redirect to login page
  if (!session) {
    return redirect(`/login?message=You must be logged in to RSVP&redirect=/itinerary/${itineraryId}`)
  }

  try {
    const { data, error } = await supabase
      .from("itinerary_rsvps")
      .upsert({
        itinerary_id: itineraryId,
        user_id: session.user.id,
        response,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath(`/itinerary/${itineraryId}`)
    return { success: true, data }
  } catch (error) {
    console.error("Error RSVPing to itinerary:", error)
    return { success: false, error: (error as Error).message }
  }
}

// Activity actions
export async function createActivity(formData: FormData) {
  const supabase = createClient()

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If not authenticated, redirect to login page
  if (!session) {
    const itineraryId = formData.get("itinerary_id") as string
    return redirect(`/login?message=You must be logged in to add activities&redirect=/itinerary/${itineraryId}`)
  }

  try {
    const itineraryId = formData.get("itinerary_id") as string

    // First check if the user owns this itinerary
    const { data: itinerary, error: fetchError } = await supabase
      .from("itineraries")
      .select("user_id")
      .eq("id", itineraryId)
      .single()

    if (fetchError) throw fetchError

    // If the user doesn't own this itinerary, return an error
    if (itinerary.user_id !== session.user.id) {
      return { success: false, error: "You don't have permission to add activities to this itinerary" }
    }

    const data: NewActivity = {
      itinerary_id: itineraryId,
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      location: (formData.get("location") as string) || null,
      start_time: formData.get("start_time") as string,
      end_time: formData.get("end_time") as string,
      category: (formData.get("category") as string) || null,
      cost: formData.get("cost") ? Number.parseFloat(formData.get("cost") as string) : null,
      currency: (formData.get("currency") as string) || null,
      booking_url: (formData.get("booking_url") as string) || null,
      image_url: (formData.get("image_url") as string) || null,
    }

    const { data: activity, error } = await supabase
      .from("activities")
      .insert([{ ...data, user_id: session.user.id }])
      .select()
      .single()

    if (error) throw error

    revalidatePath(`/itinerary/${itineraryId}`)
    return { success: true, data: activity }
  } catch (error) {
    console.error("Error creating activity:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function updateActivity(id: string, formData: FormData) {
  const supabase = createClient()

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If not authenticated, redirect to login page
  if (!session) {
    return redirect("/login?message=You must be logged in to update activities&redirect=/app/itineraries")
  }

  try {
    const itineraryId = formData.get("itinerary_id") as string

    // First check if the user owns this activity
    const { data: activity, error: fetchError } = await supabase
      .from("activities")
      .select("user_id, itinerary_id")
      .eq("id", id)
      .single()

    if (fetchError) throw fetchError

    // If the user doesn't own this activity, return an error
    if (activity.user_id !== session.user.id) {
      return { success: false, error: "You don't have permission to update this activity" }
    }

    const updates: Partial<NewActivity> = {}

    // Only add fields that are present in the form data
    if (formData.has("title")) updates.title = formData.get("title") as string
    if (formData.has("description")) updates.description = formData.get("description") as string
    if (formData.has("location")) updates.location = formData.get("location") as string
    if (formData.has("start_time")) updates.start_time = formData.get("start_time") as string
    if (formData.has("end_time")) updates.end_time = formData.get("end_time") as string
    if (formData.has("category")) updates.category = formData.get("category") as string
    if (formData.has("cost")) updates.cost = Number.parseFloat(formData.get("cost") as string)
    if (formData.has("currency")) updates.currency = formData.get("currency") as string
    if (formData.has("booking_url")) updates.booking_url = formData.get("booking_url") as string
    if (formData.has("image_url")) updates.image_url = formData.get("image_url") as string

    const { data, error } = await supabase.from("activities").update(updates).eq("id", id).select().single()

    if (error) throw error

    revalidatePath(`/itinerary/${activity.itinerary_id}`)
    return { success: true, data }
  } catch (error) {
    console.error("Error updating activity:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function deleteActivity(id: string, itineraryId: string) {
  const supabase = createClient()

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If not authenticated, redirect to login page
  if (!session) {
    return redirect(`/login?message=You must be logged in to delete activities&redirect=/itinerary/${itineraryId}`)
  }

  try {
    // First check if the user owns this activity
    const { data: activity, error: fetchError } = await supabase
      .from("activities")
      .select("user_id")
      .eq("id", id)
      .single()

    if (fetchError) throw fetchError

    // If the user doesn't own this activity, return an error
    if (activity.user_id !== session.user.id) {
      return { success: false, error: "You don't have permission to delete this activity" }
    }

    const { error } = await supabase.from("activities").delete().eq("id", id)

    if (error) throw error

    revalidatePath(`/itinerary/${itineraryId}`)
    return { success: true }
  } catch (error) {
    console.error("Error deleting activity:", error)
    return { success: false, error: (error as Error).message }
  }
}
