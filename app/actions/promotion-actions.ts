"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import type { Database } from "@/lib/database.types"

type Promotion = Database["public"]["Tables"]["promotions"]["Row"]
type NewPromotion = Omit<Promotion, "id" | "created_at" | "user_id">

export async function createPromotion(formData: FormData) {
  const supabase = createClient()

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If not authenticated, redirect to login page
  if (!session) {
    return redirect("/login?message=You must be logged in to publish an event&redirect=/app/create")
  }

  try {
    const data: NewPromotion = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      location: formData.get("location") as string,
      start_date: formData.get("start_date") as string,
      end_date: formData.get("end_date") as string,
      price: Number.parseFloat(formData.get("price") as string) || 0,
      currency: (formData.get("currency") as string) || "USD",
      capacity: Number.parseInt(formData.get("capacity") as string) || 0,
      image_url: (formData.get("image_url") as string) || null,
      itinerary_id: (formData.get("itinerary_id") as string) || null,
      is_published: true,
    }

    const { data: promotion, error } = await supabase
      .from("promotions")
      .insert([{ ...data, user_id: session.user.id }])
      .select()
      .single()

    if (error) throw error

    revalidatePath("/app/promotions")
    return { success: true, data: promotion }
  } catch (error) {
    console.error("Error creating promotion:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function updatePromotion(id: string, formData: FormData) {
  const supabase = createClient()

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If not authenticated, redirect to login page
  if (!session) {
    return redirect("/login?message=You must be logged in to update an event&redirect=/app/promotions")
  }

  try {
    const updates: Partial<NewPromotion> = {}

    // Only add fields that are present in the form data
    if (formData.has("title")) updates.title = formData.get("title") as string
    if (formData.has("description")) updates.description = formData.get("description") as string
    if (formData.has("location")) updates.location = formData.get("location") as string
    if (formData.has("start_date")) updates.start_date = formData.get("start_date") as string
    if (formData.has("end_date")) updates.end_date = formData.get("end_date") as string
    if (formData.has("price")) updates.price = Number.parseFloat(formData.get("price") as string) || 0
    if (formData.has("currency")) updates.currency = formData.get("currency") as string
    if (formData.has("capacity")) updates.capacity = Number.parseInt(formData.get("capacity") as string) || 0
    if (formData.has("image_url")) updates.image_url = formData.get("image_url") as string
    if (formData.has("is_published")) updates.is_published = formData.get("is_published") === "true"

    // First check if the user owns this promotion
    const { data: promotion, error: fetchError } = await supabase
      .from("promotions")
      .select("user_id")
      .eq("id", id)
      .single()

    if (fetchError) throw fetchError

    // If the user doesn't own this promotion, return an error
    if (promotion.user_id !== session.user.id) {
      return { success: false, error: "You don't have permission to update this promotion" }
    }

    const { data, error } = await supabase.from("promotions").update(updates).eq("id", id).select().single()

    if (error) throw error

    revalidatePath(`/promotion/${id}`)
    revalidatePath("/app/promotions")
    return { success: true, data }
  } catch (error) {
    console.error("Error updating promotion:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function deletePromotion(id: string) {
  const supabase = createClient()

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If not authenticated, redirect to login page
  if (!session) {
    return redirect("/login?message=You must be logged in to delete an event&redirect=/app/promotions")
  }

  try {
    // First check if the user owns this promotion
    const { data: promotion, error: fetchError } = await supabase
      .from("promotions")
      .select("user_id")
      .eq("id", id)
      .single()

    if (fetchError) throw fetchError

    // If the user doesn't own this promotion, return an error
    if (promotion.user_id !== session.user.id) {
      return { success: false, error: "You don't have permission to delete this promotion" }
    }

    const { error } = await supabase.from("promotions").delete().eq("id", id)

    if (error) throw error

    revalidatePath("/app/promotions")
    return { success: true }
  } catch (error) {
    console.error("Error deleting promotion:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function getPromotionById(id: string) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("promotions")
      .select(`
        *,
        user:user_id (
          id,
          email,
          full_name,
          avatar_url
        ),
        itinerary:itinerary_id (
          id,
          title,
          description,
          location,
          start_date,
          end_date,
          image_url
        )
      `)
      .eq("id", id)
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error("Error fetching promotion:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function getUserPromotions() {
  const supabase = createClient()

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If not authenticated, return empty array
  if (!session) {
    return { success: true, data: [] }
  }

  try {
    const { data, error } = await supabase
      .from("promotions")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error("Error fetching user promotions:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function getPublicPromotions() {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("promotions")
      .select(`
        *,
        user:user_id (
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .eq("is_published", true)
      .order("start_date", { ascending: true })

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error("Error fetching public promotions:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function rsvpToItinerary(formData: FormData) {
  const supabase = createClient()

  try {
    const itineraryId = formData.get("itineraryId") as string
    const userId = formData.get("userId") as string
    const response = formData.get("response") as "yes" | "no" | "maybe"
    const note = formData.get("note") as string

    // Validate inputs
    if (!itineraryId || !userId || !response) {
      return { success: false, error: "Missing required fields" }
    }

    // Insert or update the RSVP in the database
    const { data, error } = await supabase
      .from("itinerary_rsvps")
      .upsert({
        itinerary_id: itineraryId,
        user_id: userId,
        response: response,
        note: note || null,
        updated_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      console.error("Error submitting RSVP:", error)
      return { success: false, error: error.message }
    }

    // Revalidate the itinerary page to show updated RSVP status
    revalidatePath(`/trip/${itineraryId}`)
    revalidatePath(`/itinerary/${itineraryId}`)

    return { success: true, data }
  } catch (error) {
    console.error("Error in rsvpToItinerary:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function generateAffiliateLink(promotionId: string) {
  const supabase = createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { success: false, error: "Authentication required" }
  }

  try {
    // Generate a unique affiliate code
    const affiliateCode = `${session.user.id.slice(0, 8)}-${promotionId.slice(0, 8)}-${Date.now()}`

    return {
      success: true,
      affiliateLink: `${process.env.NEXT_PUBLIC_SITE_URL}/promotion/${promotionId}?ref=${affiliateCode}`,
      affiliateCode,
    }
  } catch (error) {
    console.error("Error generating affiliate link:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function promoteUserItinerary(itineraryId: string, promotionData: any) {
  const supabase = createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { success: false, error: "Authentication required" }
  }

  try {
    const { data, error } = await supabase
      .from("promotions")
      .insert([
        {
          ...promotionData,
          itinerary_id: itineraryId,
          user_id: session.user.id,
          is_published: true,
        },
      ])
      .select()
      .single()

    if (error) throw error

    revalidatePath("/app/promotions")
    return { success: true, data }
  } catch (error) {
    console.error("Error promoting itinerary:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function processBooking(bookingData: any) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.from("bookings").insert([bookingData]).select().single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error("Error processing booking:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function trackAffiliateLinkClick(affiliateCode: string, promotionId: string) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("affiliate_clicks")
      .insert([
        {
          affiliate_code: affiliateCode,
          promotion_id: promotionId,
          clicked_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error("Error tracking affiliate click:", error)
    return { success: false, error: (error as Error).message }
  }
}
