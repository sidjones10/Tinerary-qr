"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"

export async function createDeal(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return redirect("/auth?message=You must be logged in to create a deal")
  }

  try {
    // Find the business owned by this user
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id")
      .eq("user_id", session.user.id)
      .single()

    if (bizError || !business) {
      return { success: false, error: "No business profile found. Please create a business profile first." }
    }

    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const type = formData.get("type") as string
    const category = formData.get("category") as string
    const location = formData.get("location") as string
    const startDate = formData.get("start_date") as string
    const endDate = formData.get("end_date") as string
    const price = formData.get("price") ? Number.parseFloat(formData.get("price") as string) : null
    const originalPrice = formData.get("original_price") ? Number.parseFloat(formData.get("original_price") as string) : null
    const discount = formData.get("discount") ? Number.parseInt(formData.get("discount") as string) : null
    const currency = (formData.get("currency") as string) || "USD"
    const imageUrl = (formData.get("image_url") as string) || null
    const tagsRaw = formData.get("tags") as string
    const tags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : null

    if (!title || !type || !category || !location || !startDate || !endDate) {
      return { success: false, error: "Please fill in all required fields." }
    }

    const { data, error } = await supabase
      .from("promotions")
      .insert([
        {
          title,
          description,
          type,
          category,
          location,
          start_date: startDate,
          end_date: endDate,
          price,
          original_price: originalPrice,
          discount,
          currency,
          image: imageUrl,
          tags,
          business_id: business.id,
          status: "active",
          is_featured: false,
          rank_score: 0,
        },
      ])
      .select()
      .single()

    if (error) throw error

    revalidatePath("/business-profile")
    revalidatePath("/deals")
    return { success: true, data }
  } catch (error) {
    console.error("Error creating deal:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function updateDeal(id: string, formData: FormData) {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return redirect("/auth?message=You must be logged in to update a deal")
  }

  try {
    // Verify ownership: promotion -> business -> user
    const { data: promotion, error: fetchError } = await supabase
      .from("promotions")
      .select("business_id, businesses!inner(user_id)")
      .eq("id", id)
      .single()

    if (fetchError) throw fetchError

    const businessUserId = (promotion as any).businesses?.user_id
    if (businessUserId !== session.user.id) {
      return { success: false, error: "You don't have permission to update this deal." }
    }

    const updates: Record<string, any> = {}

    if (formData.has("title")) updates.title = formData.get("title") as string
    if (formData.has("description")) updates.description = formData.get("description") as string
    if (formData.has("type")) updates.type = formData.get("type") as string
    if (formData.has("category")) updates.category = formData.get("category") as string
    if (formData.has("location")) updates.location = formData.get("location") as string
    if (formData.has("start_date")) updates.start_date = formData.get("start_date") as string
    if (formData.has("end_date")) updates.end_date = formData.get("end_date") as string
    if (formData.has("price")) updates.price = Number.parseFloat(formData.get("price") as string) || null
    if (formData.has("original_price")) updates.original_price = Number.parseFloat(formData.get("original_price") as string) || null
    if (formData.has("discount")) updates.discount = Number.parseInt(formData.get("discount") as string) || null
    if (formData.has("currency")) updates.currency = formData.get("currency") as string
    if (formData.has("status")) updates.status = formData.get("status") as string
    if (formData.has("image_url")) updates.image = formData.get("image_url") as string

    const { data, error } = await supabase
      .from("promotions")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    revalidatePath("/business-profile")
    revalidatePath("/deals")
    revalidatePath(`/promotion/${id}`)
    return { success: true, data }
  } catch (error) {
    console.error("Error updating deal:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function deleteDeal(id: string) {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return redirect("/auth?message=You must be logged in to delete a deal")
  }

  try {
    // Verify ownership
    const { data: promotion, error: fetchError } = await supabase
      .from("promotions")
      .select("business_id, businesses!inner(user_id)")
      .eq("id", id)
      .single()

    if (fetchError) throw fetchError

    const businessUserId = (promotion as any).businesses?.user_id
    if (businessUserId !== session.user.id) {
      return { success: false, error: "You don't have permission to delete this deal." }
    }

    const { error } = await supabase.from("promotions").delete().eq("id", id)

    if (error) throw error

    revalidatePath("/business-profile")
    revalidatePath("/deals")
    return { success: true }
  } catch (error) {
    console.error("Error deleting deal:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function getBusinessDeals() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { success: true, data: [] }
  }

  try {
    // Find the business owned by this user
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("user_id", session.user.id)
      .single()

    if (!business) {
      return { success: true, data: [] }
    }

    const { data, error } = await supabase
      .from("promotions")
      .select("*, promotion_metrics(*)")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Error fetching business deals:", error)
    return { success: false, error: (error as Error).message, data: [] }
  }
}

export async function getPublicDeals() {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from("promotions")
      .select(`
        *,
        businesses (
          id,
          name,
          logo,
          website,
          rating,
          review_count
        ),
        promotion_metrics (*)
      `)
      .eq("status", "active")
      .order("rank_score", { ascending: false })

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Error fetching public deals:", error)
    return { success: false, error: (error as Error).message, data: [] }
  }
}

export async function getPromotionById(id: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from("promotions")
      .select(`
        *,
        businesses (
          id,
          name,
          logo,
          website,
          rating,
          review_count
        ),
        promotion_metrics (*)
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

export async function trackAffiliateLinkClick(code: string, ip: string, userAgent: string) {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from("affiliate_clicks")
      .insert([
        {
          affiliate_code: code,
          ip_address: ip,
          user_agent: userAgent,
          clicked_at: new Date().toISOString(),
        },
      ])

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error("Error tracking affiliate click:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function getUserBusiness() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { success: false, data: null }
  }

  try {
    const { data, error } = await supabase
      .from("businesses")
      .select("*")
      .eq("user_id", session.user.id)
      .single()

    if (error && error.code !== "PGRST116") throw error // PGRST116 = no rows

    return { success: true, data }
  } catch (error) {
    console.error("Error fetching user business:", error)
    return { success: false, error: (error as Error).message, data: null }
  }
}
