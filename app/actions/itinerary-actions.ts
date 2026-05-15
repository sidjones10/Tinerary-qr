"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import type { Database } from "@/lib/database.types"

type Itinerary = Database["public"]["Tables"]["itineraries"]["Row"]
type NewItinerary = Omit<Itinerary, "id" | "created_at" | "user_id">

type Activity = Database["public"]["Tables"]["activities"]["Row"]
type NewActivity = Omit<Activity, "id" | "created_at" | "user_id">

// Returns true if the user is the original creator OR a co-host (admin)
async function canEditItinerary(
  supabase: ReturnType<typeof createClient>,
  itineraryId: string,
  userId: string,
): Promise<{ allowed: boolean; isOwner: boolean }> {
  const { data: itinerary } = await supabase
    .from("itineraries")
    .select("user_id")
    .eq("id", itineraryId)
    .single()

  if (!itinerary) return { allowed: false, isOwner: false }
  if (itinerary.user_id === userId) return { allowed: true, isOwner: true }

  const { data: attendee } = await supabase
    .from("itinerary_attendees")
    .select("role")
    .eq("itinerary_id", itineraryId)
    .eq("user_id", userId)
    .maybeSingle()

  const isCohost = attendee?.role === "admin" || attendee?.role === "owner"
  return { allowed: isCohost, isOwner: false }
}

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
      image_url: (formData.get("image_url") as string) || null,
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
    if (formData.has("image_url")) updates.image_url = formData.get("image_url") as string
    if (formData.has("is_public")) updates.is_public = formData.get("is_public") === "true"
    if (formData.has("is_template")) updates.is_template = formData.get("is_template") === "true"

    // Owner or co-host can update
    const { allowed } = await canEditItinerary(supabase, id, session.user.id)
    if (!allowed) {
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

    // Owner or co-host can add activities
    const { allowed } = await canEditItinerary(supabase, itineraryId, session.user.id)
    if (!allowed) {
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

    const { data: activity, error: fetchError } = await supabase
      .from("activities")
      .select("user_id, itinerary_id")
      .eq("id", id)
      .single()

    if (fetchError) throw fetchError

    // Owner or co-host of the itinerary can update activities (even ones added by another co-host)
    const { allowed } = await canEditItinerary(supabase, activity.itinerary_id, session.user.id)
    if (!allowed) {
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
    const { data: activity, error: fetchError } = await supabase
      .from("activities")
      .select("user_id, itinerary_id")
      .eq("id", id)
      .single()

    if (fetchError) throw fetchError

    // Owner or co-host can delete activities (but not the itinerary itself)
    const { allowed } = await canEditItinerary(supabase, activity.itinerary_id, session.user.id)
    if (!allowed) {
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

// =====================================================================
// Co-host management
// Co-hosts can do everything an owner can EXCEPT delete the itinerary.
// Only the original creator (itineraries.user_id) can add or remove co-hosts.
// =====================================================================

export type Cohost = {
  user_id: string
  role: "owner" | "admin" | "member"
  joined_at: string
  profile: {
    id: string
    username: string | null
    name: string | null
    avatar_url: string | null
  } | null
}

export type ProfileSuggestion = {
  id: string
  username: string | null
  name: string | null
  avatar_url: string | null
}

export async function listCohosts(itineraryId: string) {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { success: false, error: "Not authenticated", data: [] as Cohost[] }
  }

  try {
    const { data: attendees, error } = await supabase
      .from("itinerary_attendees")
      .select("user_id, role, joined_at")
      .eq("itinerary_id", itineraryId)
      .in("role", ["owner", "admin"])
      .order("joined_at", { ascending: true })

    if (error) throw error

    const userIds = (attendees || []).map((a) => a.user_id)
    let profilesById = new Map<string, Cohost["profile"]>()
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, name, avatar_url")
        .in("id", userIds)
      profilesById = new Map((profiles || []).map((p) => [p.id, p as Cohost["profile"]]))
    }

    const result: Cohost[] = (attendees || []).map((a) => ({
      user_id: a.user_id,
      role: a.role as Cohost["role"],
      joined_at: a.joined_at,
      profile: profilesById.get(a.user_id) ?? null,
    }))

    return { success: true, data: result }
  } catch (error) {
    console.error("Error listing co-hosts:", error)
    return { success: false, error: (error as Error).message, data: [] as Cohost[] }
  }
}

export async function addCohost(itineraryId: string, cohostUserId: string) {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { success: false, error: "You must be logged in" }
  }

  try {
    // Only the original creator can add co-hosts
    const { data: itinerary, error: fetchError } = await supabase
      .from("itineraries")
      .select("user_id")
      .eq("id", itineraryId)
      .single()

    if (fetchError) throw fetchError

    if (itinerary.user_id !== session.user.id) {
      return { success: false, error: "Only the itinerary creator can add co-hosts" }
    }

    if (cohostUserId === itinerary.user_id) {
      return { success: false, error: "The creator is already the owner" }
    }

    // Upsert: if already an attendee (member), promote to admin
    const { error } = await supabase
      .from("itinerary_attendees")
      .upsert(
        { itinerary_id: itineraryId, user_id: cohostUserId, role: "admin" },
        { onConflict: "itinerary_id,user_id" },
      )

    if (error) throw error

    revalidatePath(`/itinerary/${itineraryId}`)
    return { success: true }
  } catch (error) {
    console.error("Error adding co-host:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function removeCohost(itineraryId: string, cohostUserId: string) {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { success: false, error: "You must be logged in" }
  }

  try {
    // Only the original creator can remove co-hosts
    const { data: itinerary, error: fetchError } = await supabase
      .from("itineraries")
      .select("user_id")
      .eq("id", itineraryId)
      .single()

    if (fetchError) throw fetchError

    if (itinerary.user_id !== session.user.id) {
      return { success: false, error: "Only the itinerary creator can remove co-hosts" }
    }

    if (cohostUserId === itinerary.user_id) {
      return { success: false, error: "Cannot remove the original creator" }
    }

    // Demote co-host back to 'member' rather than deleting attendance entirely,
    // so they remain part of the itinerary if they were invited.
    const { error } = await supabase
      .from("itinerary_attendees")
      .update({ role: "member" })
      .eq("itinerary_id", itineraryId)
      .eq("user_id", cohostUserId)
      .eq("role", "admin")

    if (error) throw error

    revalidatePath(`/itinerary/${itineraryId}`)
    return { success: true }
  } catch (error) {
    console.error("Error removing co-host:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function searchUsersForCohost(query: string, itineraryId: string) {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { success: false, error: "Not authenticated", data: [] }
  }

  // Strip characters that could break the PostgREST .or() filter syntax.
  const trimmed = query.trim().replace(/[,()*%]/g, "")
  if (trimmed.length < 2) {
    return { success: true, data: [] }
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, name, avatar_url")
      .or(`username.ilike.%${trimmed}%,name.ilike.%${trimmed}%`)
      .neq("id", session.user.id)
      .limit(10)

    if (error) throw error

    // Filter out users who are already co-hosts/owners
    const { data: existing } = await supabase
      .from("itinerary_attendees")
      .select("user_id")
      .eq("itinerary_id", itineraryId)
      .in("role", ["owner", "admin"])

    const existingIds = new Set((existing || []).map((a) => a.user_id))
    const filtered = (data || []).filter((u) => !existingIds.has(u.id))

    return { success: true, data: filtered }
  } catch (error) {
    console.error("Error searching users:", error)
    return { success: false, error: (error as Error).message, data: [] }
  }
}
