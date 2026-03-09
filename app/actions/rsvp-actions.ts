"use server"

import { createClient, createServiceRoleClient } from "@/lib/supabase/server"
import { createNotification } from "@/lib/notification-service"
import { sendRsvpNotificationEmail } from "@/lib/email-notifications"

const STATUS_MAP: Record<string, string> = {
  accept: "accepted",
  decline: "declined",
  tentative: "tentative",
}

const STATUS_EMOJI: Record<string, string> = {
  accepted: "🎉",
  declined: "😔",
  tentative: "🤔",
}

/**
 * Link-based RSVP — Partiful-style.
 * Any authenticated user can RSVP to an event by visiting the link.
 * Creates an invitation record on-the-fly if one doesn't exist.
 */
export async function rsvpToEvent(
  itineraryId: string,
  response: string
): Promise<{ success: boolean; invitationId?: string; status?: string; error?: string }> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Unauthorized" }
    }

    if (!itineraryId || !response || !STATUS_MAP[response]) {
      return { success: false, error: "Missing itineraryId or invalid response." }
    }

    const newStatus = STATUS_MAP[response]

    let admin: ReturnType<typeof createServiceRoleClient>
    try {
      admin = createServiceRoleClient()
    } catch {
      return { success: false, error: "Server configuration error" }
    }

    // Fetch itinerary (only columns guaranteed to exist)
    const { data: itinerary, error: itineraryError } = await supabase
      .from("itineraries")
      .select("id, user_id, title, start_date")
      .eq("id", itineraryId)
      .single()

    if (itineraryError || !itinerary) {
      return { success: false, error: "Event not found" }
    }

    if (itinerary.user_id === user.id) {
      return { success: false, error: "You are the host of this event" }
    }

    // Use admin client for the "check existing" query — the regular client
    // goes through RLS which may fail with 500 if migration 068's
    // self-referencing policy is active.
    const { data: existing } = await admin
      .from("itinerary_invitations")
      .select("id, status")
      .eq("itinerary_id", itineraryId)
      .eq("invitee_id", user.id)
      .limit(1)
      .maybeSingle()

    let invitationId: string

    if (existing) {
      if (existing.status === newStatus) {
        return { success: true, invitationId: existing.id, status: newStatus }
      }

      const { error: updateError } = await admin
        .from("itinerary_invitations")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", existing.id)

      if (updateError) {
        console.error("Error updating invitation:", updateError)
        return { success: false, error: "Failed to update RSVP" }
      }

      invitationId = existing.id

      if (newStatus === "accepted") {
        await admin
          .from("itinerary_attendees")
          .upsert(
            { itinerary_id: itineraryId, user_id: user.id, role: "member", joined_at: new Date().toISOString() },
            { onConflict: "itinerary_id,user_id" }
          )
      } else if (existing.status === "accepted") {
        await admin
          .from("itinerary_attendees")
          .delete()
          .eq("itinerary_id", itineraryId)
          .eq("user_id", user.id)
      }
    } else {
      // Upsert invitation (prevents duplicates if unique constraint exists)
      const { data: newInvite, error: insertError } = await admin
        .from("itinerary_invitations")
        .upsert(
          {
            itinerary_id: itineraryId,
            inviter_id: itinerary.user_id,
            invitee_id: user.id,
            status: newStatus,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "itinerary_id,invitee_id" }
        )
        .select("id")
        .single()

      if (insertError) {
        console.error("Error creating invitation:", insertError)
        return { success: false, error: "Failed to RSVP" }
      }

      invitationId = newInvite.id

      if (newStatus === "accepted") {
        await admin
          .from("itinerary_attendees")
          .upsert(
            { itinerary_id: itineraryId, user_id: user.id, role: "member", joined_at: new Date().toISOString() },
            { onConflict: "itinerary_id,user_id" }
          )
      }
    }

    // Notify the host
    const { data: rsvpProfile } = await supabase
      .from("profiles")
      .select("name, avatar_url")
      .eq("id", user.id)
      .single()

    const rsvpName = rsvpProfile?.name || "Someone"
    const emoji = STATUS_EMOJI[newStatus] || ""

    await createNotification(
      {
        userId: itinerary.user_id,
        type: "itinerary_rsvp",
        title: `${emoji} RSVP: ${rsvpName} ${newStatus}`,
        message: `${rsvpName} has ${newStatus === "tentative" ? "marked tentative for" : newStatus} "${itinerary.title}"`,
        linkUrl: `/event/${itineraryId}`,
        imageUrl: rsvpProfile?.avatar_url || undefined,
      },
      admin,
    )

    // Send email to host
    const { data: hostProfile } = await admin
      .from("profiles")
      .select("email, name")
      .eq("id", itinerary.user_id)
      .single()

    if (hostProfile?.email) {
      sendRsvpNotificationEmail(
        hostProfile.email,
        hostProfile.name || "there",
        rsvpName,
        newStatus,
        itinerary.title,
        itineraryId,
      ).catch((err: any) => console.error("Failed to send RSVP email:", err))
    }

    return { success: true, invitationId, status: newStatus }
  } catch (error: any) {
    console.error("Error in link RSVP:", error)
    return { success: false, error: error.message || "Failed to RSVP" }
  }
}
