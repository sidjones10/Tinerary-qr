import { createClient } from "@/lib/supabase/client"
import { createNotification } from "@/lib/notification-service"

/**
 * Ensure user profile exists in the profiles table
 * This is needed because of foreign key constraints
 */
async function ensureUserProfile(userId: string, supabase: any) {
  try {
    // Check if profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle()

    // Only create if doesn't exist and no error
    if (!existingProfile && !checkError) {
      // Get user data from auth to populate profile
      const { data: { user } } = await supabase.auth.getUser()

      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          email: user?.email || null,
          name: user?.user_metadata?.name || user?.user_metadata?.full_name || null,
          username: user?.user_metadata?.username || user?.email?.split('@')[0] || null,
          avatar_url: user?.user_metadata?.avatar_url || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

      if (profileError) {
        console.warn("Profile creation warning (may already exist):", profileError.message)
        // Don't throw - the profile might have been created by a trigger or in parallel
      }
    }
  } catch (error: any) {
    console.warn("Profile check warning (non-critical):", error.message)
    // Don't throw - this is a safety check
  }
}

export interface Activity {
  title: string
  location?: string
  time?: string
  description?: string
  requireRsvp?: boolean
  day?: string
}

export interface PackingItem {
  name: string
  checked?: boolean
}

export interface Expense {
  category: string
  amount: number
}

export interface CreateItineraryData {
  title: string
  description?: string
  location?: string
  startDate: string
  endDate?: string
  type?: "event" | "trip"
  isPublic?: boolean
  activities?: Activity[]
  packingItems?: PackingItem[]
  expenses?: Expense[]
  categories?: string[]
  travelStyle?: string
  budget?: string
  imageUrl?: string
}

export interface ItineraryResult {
  success: boolean
  itinerary?: any
  error?: string
}

/**
 * Create a new itinerary with all related data
 */
export async function createItinerary(userId: string, data: CreateItineraryData): Promise<ItineraryResult> {
  try {
    const supabase = createClient()

    // Validate required fields
    if (!data.title) {
      return { success: false, error: "Title is required" }
    }

    // Ensure user profile exists (for foreign key constraint)
    await ensureUserProfile(userId, supabase)

    // 1. Create the main itinerary
    const { data: itinerary, error: itineraryError } = await supabase
      .from("itineraries")
      .insert({
        title: data.title,
        description: data.description || "",
        location: data.location || "",
        start_date: data.startDate,
        end_date: data.endDate || data.startDate,
        is_public: data.isPublic !== undefined ? data.isPublic : true,
        is_template: false,
        user_id: userId,
        cover_image_url: data.imageUrl || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (itineraryError || !itinerary) {
      console.error("Itinerary creation error:", itineraryError)
      return { success: false, error: itineraryError?.message || "Failed to create itinerary" }
    }

    const itineraryId = itinerary.id

    // 2. Create activities
    if (data.activities && data.activities.length > 0) {
      const activitiesToInsert = data.activities
        .filter((a) => a.title)
        .map((activity, index) => {
          // Convert time string to proper timestamp
          let startTime = new Date().toISOString()
          if (activity.time) {
            try {
              // Try to parse the time and combine with start date
              const baseDate = new Date(data.startDate)

              // Check if it's in HTML5 time format (HH:MM in 24-hour)
              if (/^\d{2}:\d{2}$/.test(activity.time)) {
                const [hours, minutes] = activity.time.split(':').map(Number)
                baseDate.setHours(hours, minutes, 0, 0)
                startTime = baseDate.toISOString()
              } else {
                // Try to parse text format like "7:00 PM"
                const timeMatch = activity.time.match(/(\d+):(\d+)\s*(AM|PM)?/i)
                if (timeMatch) {
                  let hours = parseInt(timeMatch[1])
                  const minutes = parseInt(timeMatch[2])
                  const meridiem = timeMatch[3]?.toUpperCase()

                  // Convert to 24-hour format
                  if (meridiem === 'PM' && hours !== 12) hours += 12
                  if (meridiem === 'AM' && hours === 12) hours = 0

                  baseDate.setHours(hours, minutes, 0, 0)
                  startTime = baseDate.toISOString()
                }
              }
            } catch (e) {
              console.error("Error parsing activity time:", e)
            }
          }

          return {
            itinerary_id: itineraryId,
            title: activity.title,
            description: activity.description || null,
            location: activity.location || null,
            start_time: startTime,
            day: activity.day || null,
            user_id: userId,
            require_rsvp: activity.requireRsvp || false,
            order_index: index,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        })

      if (activitiesToInsert.length > 0) {
        const { error: activitiesError } = await supabase.from("activities").insert(activitiesToInsert)

        if (activitiesError) {
          console.error("Activities creation error:", activitiesError)
        }
      }
    }

    // 3. Create packing items
    if (data.packingItems && data.packingItems.length > 0) {
      const packingItemsToInsert = data.packingItems
        .filter((item) => item.name)
        .map((item) => ({
          itinerary_id: itineraryId,
          name: item.name,
          is_packed: item.checked || false,
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))

      if (packingItemsToInsert.length > 0) {
        const { error: packingError } = await supabase.from("packing_items").insert(packingItemsToInsert)

        if (packingError) {
          console.error("Packing items creation error:", packingError)
        }
      }
    }

    // 4. Create expenses
    if (data.expenses && data.expenses.length > 0) {
      const expensesToInsert = data.expenses
        .filter((e) => e.amount > 0)
        .map((expense) => ({
          itinerary_id: itineraryId,
          category: expense.category,
          amount: expense.amount,
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))

      if (expensesToInsert.length > 0) {
        const { error: expensesError } = await supabase.from("expenses").insert(expensesToInsert)

        if (expensesError) {
          console.error("Expenses creation error:", expensesError)
        }
      }
    }

    // 5. Create categories
    if (data.categories && data.categories.length > 0) {
      const categoriesToInsert = data.categories.map((category) => ({
        itinerary_id: itineraryId,
        category: category,
      }))

      const { error: categoriesError } = await supabase.from("itinerary_categories").insert(categoriesToInsert)

      if (categoriesError) {
        console.error("Categories creation error:", categoriesError)
      }
    }

    // 6. Initialize itinerary metrics (optional - don't fail if this errors)
    try {
      const { error: metricsError } = await supabase.from("itinerary_metrics").insert({
        itinerary_id: itineraryId,
        view_count: 0,
        save_count: 0,
        share_count: 0,
        like_count: 0,
        comment_count: 0,
        average_rating: 0,
        trending_score: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (metricsError) {
        console.warn("Metrics initialization skipped:", metricsError.message || metricsError.code || "Unknown error")
        console.warn("This is non-critical - the itinerary was created successfully")
      }
    } catch (error: any) {
      console.warn("Metrics initialization skipped:", error.message || "Unknown error")
    }

    // 7. Create success notification (optional - don't fail if this errors)
    try {
      const notificationResult = await createNotification({
        userId: userId,
        type: "system_message",
        title: "Itinerary Published!",
        message: `Your ${data.type || "itinerary"} "${data.title}" has been successfully published.`,
        linkUrl: `/event/${itineraryId}`,
      })

      if (!notificationResult.success) {
        console.warn("Notification creation skipped:", notificationResult.error || "Unknown error")
        console.warn("This is non-critical - the itinerary was created successfully")
      }
    } catch (error: any) {
      console.warn("Notification creation skipped:", error.message || "Unknown error")
    }

    return {
      success: true,
      itinerary: itinerary,
    }
  } catch (error) {
    console.error("Create itinerary error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}

/**
 * Update an existing itinerary
 */
export async function updateItinerary(
  itineraryId: string,
  userId: string,
  data: Partial<CreateItineraryData>,
): Promise<ItineraryResult> {
  try {
    const supabase = createClient()

    // Verify ownership
    const { data: existing, error: checkError } = await supabase
      .from("itineraries")
      .select("user_id")
      .eq("id", itineraryId)
      .single()

    if (checkError || !existing) {
      return { success: false, error: "Itinerary not found" }
    }

    if (existing.user_id !== userId) {
      return { success: false, error: "Unauthorized" }
    }

    // Update the itinerary
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (data.title) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.location !== undefined) updateData.location = data.location
    if (data.startDate) updateData.start_date = data.startDate
    if (data.endDate) updateData.end_date = data.endDate
    if (data.isPublic !== undefined) updateData.is_public = data.isPublic
    if (data.imageUrl !== undefined) updateData.cover_image_url = data.imageUrl

    const { data: itinerary, error: updateError } = await supabase
      .from("itineraries")
      .update(updateData)
      .eq("id", itineraryId)
      .select()
      .single()

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    return {
      success: true,
      itinerary: itinerary,
    }
  } catch (error) {
    console.error("Update itinerary error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}

/**
 * Delete an itinerary
 */
export async function deleteItinerary(itineraryId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    // Verify ownership
    const { data: existing, error: checkError } = await supabase
      .from("itineraries")
      .select("user_id")
      .eq("id", itineraryId)
      .single()

    if (checkError || !existing) {
      return { success: false, error: "Itinerary not found" }
    }

    if (existing.user_id !== userId) {
      return { success: false, error: "Unauthorized" }
    }

    // Delete related data (cascading should handle this, but we'll do it explicitly)
    await Promise.all([
      supabase.from("activities").delete().eq("itinerary_id", itineraryId),
      supabase.from("packing_items").delete().eq("itinerary_id", itineraryId),
      supabase.from("expenses").delete().eq("itinerary_id", itineraryId),
      supabase.from("itinerary_categories").delete().eq("itinerary_id", itineraryId),
      supabase.from("itinerary_metrics").delete().eq("itinerary_id", itineraryId),
    ])

    // Delete the itinerary
    const { error: deleteError } = await supabase.from("itineraries").delete().eq("id", itineraryId)

    if (deleteError) {
      return { success: false, error: deleteError.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Delete itinerary error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}

/**
 * Get itinerary by ID with all related data
 */
export async function getItineraryById(itineraryId: string) {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("itineraries")
      .select(
        `
        *,
        profiles:user_id(name, avatar_url, username),
        activities(*),
        packing_items(*),
        expenses(*),
        itinerary_categories(category),
        itinerary_metrics(*)
      `,
      )
      .eq("id", itineraryId)
      .single()

    if (error) {
      console.error("Error fetching itinerary:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error fetching itinerary:", error)
    return null
  }
}

/**
 * Get user's itineraries
 */
export async function getUserItineraries(userId: string, includePrivate: boolean = false) {
  try {
    const supabase = createClient()

    let query = supabase
      .from("itineraries")
      .select(
        `
        *,
        itinerary_metrics(*),
        itinerary_categories(category)
      `,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (!includePrivate) {
      query = query.eq("is_public", true)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching user itineraries:", error)
      return []
    }

    return data
  } catch (error) {
    console.error("Error fetching user itineraries:", error)
    return []
  }
}

/**
 * Save/bookmark an itinerary
 */
export async function saveItinerary(userId: string, itineraryId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    // Check if already saved
    const { data: existing } = await supabase
      .from("saved_itineraries")
      .select("id")
      .eq("user_id", userId)
      .eq("itinerary_id", itineraryId)
      .single()

    if (existing) {
      return { success: false, error: "Already saved" }
    }

    // Save the itinerary
    const { error } = await supabase.from("saved_itineraries").insert({
      user_id: userId,
      itinerary_id: itineraryId,
      created_at: new Date().toISOString(),
    })

    if (error) {
      return { success: false, error: error.message }
    }

    // Increment save count
    await supabase.rpc("increment_save_count", { itinerary_id: itineraryId })

    return { success: true }
  } catch (error) {
    console.error("Save itinerary error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}

/**
 * Unsave/unbookmark an itinerary
 */
export async function unsaveItinerary(userId: string, itineraryId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from("saved_itineraries")
      .delete()
      .eq("user_id", userId)
      .eq("itinerary_id", itineraryId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Unsave itinerary error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}
