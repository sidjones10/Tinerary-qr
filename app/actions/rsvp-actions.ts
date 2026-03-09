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
 * RSVP to an event — Partiful-style.
 * Uses the rsvp_to_event RPC (SECURITY DEFINER) so it bypasses RLS
 * without needing the service role key.
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

    // Call the SECURITY DEFINER RPC — bypasses RLS without service role key
    const { data: rpcResult, error: rpcError } = await supabase.rpc("rsvp_to_event", {
      p_itinerary_id: itineraryId,
      p_response: newStatus,
    })

    if (rpcError) {
      console.error("RPC rsvp_to_event error:", rpcError)
      return { success: false, error: rpcError.message || "Failed to RSVP" }
    }

    if (!rpcResult?.success) {
      return { success: false, error: rpcResult?.error || "Failed to RSVP" }
    }

    const invitationId = rpcResult.invitationId

    // Send notifications (best-effort, don't block the response)
    try {
      const { data: itinerary } = await supabase
        .from("itineraries")
        .select("user_id, title")
        .eq("id", itineraryId)
        .single()

      if (itinerary) {
        const { data: rsvpProfile } = await supabase
          .from("profiles")
          .select("name, avatar_url")
          .eq("id", user.id)
          .single()

        const rsvpName = rsvpProfile?.name || "Someone"
        const emoji = STATUS_EMOJI[newStatus] || ""

        // Try admin client for notifications, fall back to regular client
        let notifClient: any
        try {
          notifClient = createServiceRoleClient()
        } catch {
          notifClient = supabase
        }

        await createNotification(
          {
            userId: itinerary.user_id,
            type: "itinerary_rsvp",
            title: `${emoji} RSVP: ${rsvpName} ${newStatus}`,
            message: `${rsvpName} has ${newStatus === "tentative" ? "marked tentative for" : newStatus} "${itinerary.title}"`,
            linkUrl: `/event/${itineraryId}`,
            imageUrl: rsvpProfile?.avatar_url || undefined,
          },
          notifClient,
        )

        // Send email to host (best-effort)
        const { data: hostProfile } = await (notifClient || supabase)
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
      }
    } catch (notifErr) {
      // Notifications are best-effort — don't fail the RSVP
      console.error("Error sending RSVP notifications:", notifErr)
    }

    return { success: true, invitationId, status: newStatus }
  } catch (error: any) {
    console.error("Error in RSVP:", error)
    return { success: false, error: error.message || "Failed to RSVP" }
  }
}
