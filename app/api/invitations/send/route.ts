import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { createNotification } from "@/lib/notification-service"
import { sendInvitationEmail, sendEventInviteEmail } from "@/lib/email-notifications"
import { sendInvitationSMS, formatPhoneNumber } from "@/backend/services/twilio"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://tinerary-app.com"

/**
 * Determine whether a contact string is a phone number or email.
 * Phone numbers start with '+' or are purely digits (with optional dashes/spaces/parens).
 */
function isPhoneNumber(contact: string): boolean {
  if (contact.startsWith("+")) return true
  const digitsOnly = contact.replace(/[\s\-().]/g, "")
  return /^\d{7,15}$/.test(digitsOnly)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { itineraryId, emails, phoneNumbers, itineraryTitle, senderName, eventDate, eventLocation } = body

    // Support both separate arrays and a combined "emails" array that may contain phone numbers
    const contacts: string[] = []
    if (emails && Array.isArray(emails)) contacts.push(...emails)
    if (phoneNumbers && Array.isArray(phoneNumbers)) contacts.push(...phoneNumbers)

    if (!itineraryId || contacts.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const results = []

    for (const contact of contacts) {
      const contactIsPhone = isPhoneNumber(contact)

      if (contactIsPhone) {
        // Phone number invitation — always treated as non-user
        try {
          const formattedPhone = formatPhoneNumber(contact)

          // Store pending invitation
          const { error: pendingError } = await supabase.from("pending_invitations").insert({
            itinerary_id: itineraryId,
            inviter_id: user.id,
            email: formattedPhone, // store phone in the email column
            status: "pending",
            created_at: new Date().toISOString(),
          })

          if (!pendingError) {
            const inviteUrl = `${APP_URL}/auth?invite=${itineraryId}&phone=${encodeURIComponent(formattedPhone)}`

            const smsSent = await sendInvitationSMS({
              phoneNumber: formattedPhone,
              inviterName: senderName || "Someone",
              itineraryTitle,
              inviteUrl,
            })

            results.push({
              contact: formattedPhone,
              status: smsSent ? "sms_sent" : "sms_failed",
              type: "phone",
            })
          } else {
            results.push({ contact: formattedPhone, status: "error", error: pendingError.message })
          }
        } catch (error: any) {
          results.push({ contact, status: "error", error: error.message })
        }
      } else {
        // Email invitation
        const email = contact

        // Check if user exists with this email
        const { data: existingUser } = await supabase
          .from("profiles")
          .select("id, email, name")
          .eq("email", email)
          .single()

        if (existingUser) {
          // User exists - create invitation record + in-app notification + email
          const { error: inviteError } = await supabase.from("itinerary_invitations").insert({
            itinerary_id: itineraryId,
            inviter_id: user.id,
            invitee_id: existingUser.id,
            status: "pending",
            created_at: new Date().toISOString(),
          })

          if (!inviteError) {
            // In-app notification
            await createNotification({
              userId: existingUser.id,
              type: "invitation",
              title: "Trip Invitation",
              message: `${senderName} invited you to join "${itineraryTitle}"`,
              linkUrl: `/event/${itineraryId}`,
            })

            // Send email notification to existing user
            sendEventInviteEmail(
              email,
              existingUser.name || "there",
              itineraryTitle,
              eventDate || "TBD",
              eventLocation || "TBD",
              senderName || "Someone",
              itineraryId,
            ).catch((err) => console.error("Failed to send invite email to existing user:", err))

            results.push({ contact: email, status: "invited", type: "user" })
          } else {
            results.push({ contact: email, status: "error", error: inviteError.message })
          }
        } else {
          // Non-user — store pending invitation and send email
          try {
            const { error: pendingError } = await supabase.from("pending_invitations").insert({
              itinerary_id: itineraryId,
              inviter_id: user.id,
              email: email,
              status: "pending",
              created_at: new Date().toISOString(),
            })

            if (!pendingError) {
              const emailResult = await sendInvitationEmail({
                recipientEmail: email,
                inviterName: senderName || "Someone",
                itineraryTitle,
                itineraryId,
                eventDate,
                eventLocation,
              })

              results.push({
                contact: email,
                status: emailResult.success ? "email_sent" : "email_failed",
                type: "non_user",
              })
            } else {
              results.push({ contact: email, status: "error", error: pendingError.message })
            }
          } catch (error: any) {
            results.push({ contact: email, status: "error", error: error.message })
          }
        }
      }
    }

    const successCount = results.filter((r) => !r.status.includes("error") && !r.status.includes("failed")).length

    return NextResponse.json({
      success: true,
      results,
      message: `Invitations sent to ${successCount} out of ${contacts.length} recipients`,
    })
  } catch (error: any) {
    console.error("Error sending invitations:", error)
    return NextResponse.json({ error: error.message || "Failed to send invitations" }, { status: 500 })
  }
}
