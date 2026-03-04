import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceRoleClient } from "@/lib/supabase/server"
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

    // Use service role client for creating notifications for other users
    // This bypasses RLS so the inviter can insert notifications for the invitee
    let serviceClient: ReturnType<typeof createServiceRoleClient> | null = null
    try {
      serviceClient = createServiceRoleClient()
    } catch (err) {
      console.error("Service role client unavailable — notifications may not be delivered:", err)
    }

    const results = []

    for (const contact of contacts) {
      const contactIsPhone = isPhoneNumber(contact)

      if (contactIsPhone) {
        // Phone number invitation — check if an existing user has this phone
        try {
          const formattedPhone = formatPhoneNumber(contact)

          // Look up existing user by phone number
          const { data: existingUser } = await supabase
            .from("profiles")
            .select("id, email, name, phone")
            .or(`phone.eq.${formattedPhone},phone.eq.${contact}`)
            .limit(1)
            .maybeSingle()

          if (existingUser) {
            // Existing user found — create invitation record + in-app notification + SMS
            const { error: inviteError } = await supabase.from("itinerary_invitations").insert({
              itinerary_id: itineraryId,
              inviter_id: user.id,
              invitee_id: existingUser.id,
              status: "pending",
              created_at: new Date().toISOString(),
            })

            if (!inviteError) {
              // In-app notification — use service role client to bypass RLS
              const notifResult = await createNotification(
                {
                  userId: existingUser.id,
                  type: "invitation",
                  title: "Trip Invitation",
                  message: `${senderName || "Someone"} invited you to join "${itineraryTitle}"`,
                  linkUrl: `/event/${itineraryId}`,
                },
                serviceClient || supabase,
              )
              if (!notifResult.success) {
                console.error("Failed to create in-app notification for phone user:", notifResult.error)
              }

              // Also send SMS
              const inviteUrl = `${APP_URL}/event/${itineraryId}`
              const smsSent = await sendInvitationSMS({
                phoneNumber: formattedPhone,
                inviterName: senderName || "Someone",
                itineraryTitle,
                inviteUrl,
              })

              results.push({
                contact: formattedPhone,
                status: "invited",
                type: "user",
                smsSent,
              })
            } else {
              results.push({ contact: formattedPhone, status: "error", error: inviteError.message })
            }
          } else {
            // No existing user — store pending invitation and send SMS
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
            // In-app notification — use service role client to bypass RLS
            const notifResult = await createNotification(
              {
                userId: existingUser.id,
                type: "invitation",
                title: "Trip Invitation",
                message: `${senderName || "Someone"} invited you to join "${itineraryTitle}"`,
                linkUrl: `/event/${itineraryId}`,
              },
              serviceClient || supabase,
            )
            if (!notifResult.success) {
              console.error("Failed to create in-app notification for email user:", notifResult.error)
            }

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
