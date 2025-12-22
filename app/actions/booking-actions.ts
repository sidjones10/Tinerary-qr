"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import type { Database } from "@/lib/database.types"

type Booking = Database["public"]["Tables"]["bookings"]["Row"]
type NewBooking = Omit<Booking, "id" | "created_at" | "user_id" | "status">

export async function createBooking(formData: FormData) {
  const supabase = createClient()

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If not authenticated, redirect to login page
  if (!session) {
    const promotionId = formData.get("promotion_id") as string
    return redirect(`/login?message=You must be logged in to book tickets&redirect=/promotion/${promotionId}`)
  }

  try {
    const promotionId = formData.get("promotion_id") as string
    const quantity = Number.parseInt(formData.get("quantity") as string) || 1
    const attendeeNames = (formData.get("attendee_names") as string) || ""
    const attendeeEmails = (formData.get("attendee_emails") as string) || ""
    const specialRequests = (formData.get("special_requests") as string) || ""

    // Get the promotion details to calculate total price
    const { data: promotion, error: promotionError } = await supabase
      .from("promotions")
      .select("price, currency")
      .eq("id", promotionId)
      .single()

    if (promotionError) throw promotionError

    const totalPrice = promotion.price * quantity

    const data: NewBooking = {
      promotion_id: promotionId,
      quantity,
      total_price: totalPrice,
      currency: promotion.currency,
      attendee_names: attendeeNames,
      attendee_emails: attendeeEmails,
      special_requests: specialRequests,
    }

    const { data: booking, error } = await supabase
      .from("bookings")
      .insert([
        {
          ...data,
          user_id: session.user.id,
          status: "confirmed", // Since we removed Stripe, bookings are confirmed immediately
        },
      ])
      .select()
      .single()

    if (error) throw error

    // Update the promotion's available capacity
    await supabase.rpc("decrease_promotion_capacity", {
      p_promotion_id: promotionId,
      p_quantity: quantity,
    })

    revalidatePath(`/promotion/${promotionId}`)
    return { success: true, data: booking }
  } catch (error) {
    console.error("Error creating booking:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function getUserBookings() {
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
      .from("bookings")
      .select(`
        *,
        promotion:promotion_id (
          id,
          title,
          description,
          location,
          start_date,
          end_date,
          image_url
        )
      `)
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error("Error fetching user bookings:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function cancelBooking(id: string) {
  const supabase = createClient()

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If not authenticated, redirect to login page
  if (!session) {
    return redirect("/login?message=You must be logged in to cancel a booking&redirect=/app/tickets")
  }

  try {
    // First check if the user owns this booking
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("user_id, promotion_id, quantity, status")
      .eq("id", id)
      .single()

    if (fetchError) throw fetchError

    // If the user doesn't own this booking, return an error
    if (booking.user_id !== session.user.id) {
      return { success: false, error: "You don't have permission to cancel this booking" }
    }

    // If the booking is already cancelled, return an error
    if (booking.status === "cancelled") {
      return { success: false, error: "This booking is already cancelled" }
    }

    const { error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id)

    if (error) throw error

    // Restore the promotion's capacity
    await supabase.rpc("increase_promotion_capacity", {
      p_promotion_id: booking.promotion_id,
      p_quantity: booking.quantity,
    })

    revalidatePath("/app/tickets")
    return { success: true }
  } catch (error) {
    console.error("Error cancelling booking:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function getBookingById(id: string) {
  const supabase = createClient()

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  try {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        promotion:promotion_id (
          id,
          title,
          description,
          location,
          start_date,
          end_date,
          image_url,
          user_id
        )
      `)
      .eq("id", id)
      .single()

    if (error) throw error

    // If not authenticated or not the owner of the booking or the promotion
    if (!session || (session.user.id !== data.user_id && session.user.id !== data.promotion.user_id)) {
      return { success: false, error: "You don't have permission to view this booking" }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error fetching booking:", error)
    return { success: false, error: (error as Error).message }
  }
}
