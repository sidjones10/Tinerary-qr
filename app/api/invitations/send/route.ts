import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { createNotification } from "@/lib/notification-service"

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
    const { itineraryId, emails, itineraryTitle, senderName } = body

    if (!itineraryId || !emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const results = []

    for (const email of emails) {
      // Check if user exists with this email
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", email)
        .single()

      if (existingUser) {
        // User exists - create notification and invitation
        const { error: inviteError } = await supabase.from("itinerary_invitations").insert({
          itinerary_id: itineraryId,
          inviter_id: user.id,
          invitee_id: existingUser.id,
          status: "pending",
          created_at: new Date().toISOString(),
        })

        if (!inviteError) {
          // Create notification for existing user
          await createNotification({
            userId: existingUser.id,
            type: "invitation",
            title: "Trip Invitation",
            message: `${senderName} invited you to join "${itineraryTitle}"`,
            linkUrl: `/event/${itineraryId}`,
          })

          results.push({ email, status: "invited", type: "user" })
        } else {
          results.push({ email, status: "error", error: inviteError.message })
        }
      } else {
        // User doesn't exist - send email invitation
        try {
          // Store pending invitation
          const { error: pendingError } = await supabase.from("pending_invitations").insert({
            itinerary_id: itineraryId,
            inviter_id: user.id,
            email: email,
            status: "pending",
            created_at: new Date().toISOString(),
          })

          if (!pendingError) {
            // In a real app, you would send an email here using a service like SendGrid, Resend, etc.
            // For now, we'll just log it
            console.log(`Email invitation would be sent to: ${email}`)
            console.log(`Invite link: ${process.env.NEXT_PUBLIC_SITE_URL}/auth?invite=${itineraryId}&email=${encodeURIComponent(email)}`)

            results.push({ email, status: "email_sent", type: "non_user" })
          } else {
            results.push({ email, status: "error", error: pendingError.message })
          }
        } catch (error: any) {
          results.push({ email, status: "error", error: error.message })
        }
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Invitations sent to ${results.filter((r) => r.status !== "error").length} out of ${emails.length} recipients`,
    })
  } catch (error: any) {
    console.error("Error sending invitations:", error)
    return NextResponse.json({ error: error.message || "Failed to send invitations" }, { status: 500 })
  }
}
