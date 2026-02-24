"use server"

import { createClient } from "@/lib/supabase/server"

export interface EventDraft {
  id: string
  title: string
  description: string
  location: string
  start_date: string
  end_date: string
  time: string
  type: string
  is_public: boolean
  is_published: boolean
  countdown_reminders_enabled: boolean
  cover_image_url: string
  activities: any
  packing_items: any
  expenses: any
  content: any
  user_id: string
  created_at: string
  updated_at: string
  [key: string]: any
}

export async function getUserDrafts() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        error: "User not authenticated",
      }
    }

    const userId = user.id

    const { data, error } = await supabase
      .from("drafts")
      .select("*")
      .eq("user_id", userId)
      .eq("is_published", false)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Error fetching drafts:", error)
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      drafts: data as EventDraft[],
    }
  } catch (err) {
    console.error("Exception in getUserDrafts:", err)
    return {
      success: false,
      error: "Failed to fetch drafts",
    }
  }
}

export async function saveDraft(draftData: Partial<EventDraft>) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        error: "User not authenticated",
      }
    }

    const userId = user.id

    // If draft has an ID, update it
    if (draftData.id) {
      const { data, error } = await supabase
        .from("drafts")
        .update({
          ...draftData,
          updated_at: new Date().toISOString(),
          user_id: userId,
        })
        .eq("id", draftData.id)
        .eq("user_id", userId) // Ensure user owns this draft
        .select()
        .single()

      if (error) {
        console.error("Error updating draft:", error)
        return {
          success: false,
          error: error.message,
        }
      }

      return {
        success: true,
        draft: data as EventDraft,
        draftId: data.id,
      }
    }
    // Otherwise create a new draft
    else {
      const { data, error } = await supabase
        .from("drafts")
        .insert({
          ...draftData,
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_published: false,
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating draft:", error)
        return {
          success: false,
          error: error.message,
        }
      }

      return {
        success: true,
        draft: data as EventDraft,
        draftId: data.id,
      }
    }
  } catch (err) {
    console.error("Exception in saveDraft:", err)
    return {
      success: false,
      error: "Failed to save draft",
    }
  }
}

export async function getDraftById(draftId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        error: "User not authenticated",
      }
    }

    const userId = user.id

    const { data, error } = await supabase
      .from("drafts")
      .select("*")
      .eq("id", draftId)
      .eq("user_id", userId) // Ensure user owns this draft
      .single()

    if (error) {
      console.error("Error fetching draft:", error)
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      draft: data as EventDraft,
    }
  } catch (err) {
    console.error("Exception in getDraftById:", err)
    return {
      success: false,
      error: "Failed to fetch draft",
    }
  }
}

export async function getDraft(draftId: string) {
  return getDraftById(draftId)
}

export async function publishDraft(draftId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        error: "User not authenticated",
      }
    }

    const userId = user.id

    // First, get the draft
    const { data: draft, error: fetchError } = await supabase
      .from("drafts")
      .select("*")
      .eq("id", draftId)
      .eq("user_id", userId)
      .single()

    if (fetchError) {
      console.error("Error fetching draft for publishing:", fetchError)
      return {
        success: false,
        error: fetchError.message,
      }
    }

    // Create a new itinerary from the draft
    const contentData = draft.content || {}
    const { data: itinerary, error: insertError } = await supabase
      .from("itineraries")
      .insert({
        title: draft.title || "Untitled Event",
        description: draft.description,
        location: draft.location,
        start_date: draft.start_date,
        end_date: draft.end_date,
        image_url: draft.cover_image_url,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_public: draft.is_public ?? true,
        currency: (contentData.currency || 'USD').toUpperCase(),
        theme: contentData.theme || 'default',
        font: contentData.font || 'default',
        packing_list_public: contentData.packing_list_public ?? false,
        expenses_public: contentData.expenses_public ?? false,
      })
      .select()
      .single()

    if (insertError) {
      console.error("Error creating itinerary from draft:", insertError)
      return {
        success: false,
        error: insertError.message,
      }
    }

    // Mark the draft as published
    const { error: updateError } = await supabase
      .from("drafts")
      .update({
        is_published: true,
        published_at: new Date().toISOString(),
      })
      .eq("id", draftId)
      .eq("user_id", userId)

    if (updateError) {
      console.error("Error marking draft as published:", updateError)
      // We still return success since the itinerary was created
    }

    return {
      success: true,
      itinerary,
    }
  } catch (err) {
    console.error("Exception in publishDraft:", err)
    return {
      success: false,
      error: "Failed to publish draft",
    }
  }
}

export async function deleteDraft(draftId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        error: "User not authenticated",
      }
    }

    const userId = user.id

    const { error } = await supabase.from("drafts").delete().eq("id", draftId).eq("user_id", userId)

    if (error) {
      console.error("Error deleting draft:", error)
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
    }
  } catch (err) {
    console.error("Exception in deleteDraft:", err)
    return {
      success: false,
      error: "Failed to delete draft",
    }
  }
}
