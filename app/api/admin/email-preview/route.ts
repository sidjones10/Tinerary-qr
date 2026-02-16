import { NextRequest, NextResponse } from "next/server"
import { postcardEmail, APP_URL } from "@/lib/email-notifications"

// Sample data used across previews
const SAMPLE = {
  name: "Alex Rivera",
  email: "alex@example.com",
  username: "alexrivera",
  followerName: "Jordan Lee",
  followerUsername: "jordanlee",
  eventTitle: "Weekend in Barcelona",
  eventDate: "Saturday, March 14, 2026",
  eventLocation: "Barcelona, Spain",
  eventId: "abc-123",
  commentText: "This itinerary looks amazing! I'd love to join for the Sagrada Familia visit.",
  resetToken: "sample-token",
  timeRemaining: "2 days",
  daysRemaining: 7,
  deletionDate: "2026-03-23",
}

const templates: Record<string, { subject: string; html: string }> = {
  welcome: {
    subject: "Welcome aboard, traveler!",
    html: postcardEmail(`
      <div class="masthead">
        <div class="stamp">Welcome Aboard</div>
        <h1>Your journey starts here</h1>
        <p class="subtitle">A new chapter in travel planning</p>
      </div>
      <div class="body-content">
        <h2>Hi ${SAMPLE.name}!</h2>
        <p>We're thrilled you've joined Tinerary &mdash; a place where every trip becomes a story and every event deserves to feel like an adventure.</p>
        <p>Here's what awaits you:</p>
        <div class="info-card">
          <strong>Plan &amp; Share</strong><br>
          Create stunning itineraries with maps, photos, and schedules &mdash; then share them with a single link.
        </div>
        <div class="info-card">
          <strong>Travel Together</strong><br>
          Follow friends, see what they're planning, and collaborate on trips in real time.
        </div>
        <div class="info-card">
          <strong>Never Miss a Beat</strong><br>
          Smart countdown reminders, calendar exports, and expense tracking keep everything on course.
        </div>
        <hr class="divider">
        <p style="text-align:center;">Ready to plan your first adventure?</p>
        <p style="text-align:center;">
          <a href="${APP_URL}/" class="cta-btn">Start Exploring</a>
        </p>
      </div>
    `, "Happy travels from the Tinerary crew."),
  },

  eventInvite: {
    subject: `You're invited to ${SAMPLE.eventTitle}`,
    html: postcardEmail(`
      <div class="masthead">
        <div class="stamp">You're Invited</div>
        <h1>${SAMPLE.eventTitle}</h1>
        <p class="subtitle">A personal invitation from ${SAMPLE.followerName}</p>
      </div>
      <div class="body-content">
        <p>Hi ${SAMPLE.name},</p>
        <p><strong>${SAMPLE.followerName}</strong> has saved you a spot. Here are the details:</p>
        <div class="info-card" style="background:#FFFDF9; border: 1px solid #D6C9B6; border-left: 3px solid #1A7B7E;">
          <div class="detail-row"><span class="detail-label">When:</span> ${SAMPLE.eventDate}</div>
          <div class="detail-row"><span class="detail-label">Where:</span> ${SAMPLE.eventLocation}</div>
        </div>
        <hr class="divider">
        <p style="text-align:center;">
          <a href="${APP_URL}/event/${SAMPLE.eventId}" class="cta-btn">View Event &amp; RSVP</a>
        </p>
      </div>
    `, "See you there!"),
  },

  eventReminder: {
    subject: `Reminder: ${SAMPLE.eventTitle} is tomorrow`,
    html: postcardEmail(`
      <div class="masthead">
        <div class="stamp">Gentle Reminder</div>
        <h1>${SAMPLE.eventTitle}</h1>
        <p class="subtitle">is coming up tomorrow</p>
      </div>
      <div class="body-content">
        <p>Hi ${SAMPLE.name},</p>
        <p>Just a friendly nudge &mdash; your upcoming plans are right around the corner.</p>
        <div class="info-card info-card-warm">
          <div class="detail-row"><span class="detail-label">When:</span> ${SAMPLE.eventDate}</div>
          <div class="detail-row"><span class="detail-label">Where:</span> ${SAMPLE.eventLocation}</div>
        </div>
        <p>Make sure everything's packed, planned, and ready to go!</p>
        <hr class="divider">
        <p style="text-align:center;">
          <a href="${APP_URL}/event/${SAMPLE.eventId}" class="cta-btn cta-btn-warm">View Event Details</a>
        </p>
      </div>
    `),
  },

  newFollower: {
    subject: `${SAMPLE.followerName} is now following your travels`,
    html: postcardEmail(`
      <div class="masthead">
        <div class="stamp">New Follower</div>
        <h1>Someone new is along for the ride</h1>
      </div>
      <div class="body-content" style="text-align:center;">
        <p style="text-align:left;">Hi ${SAMPLE.name},</p>
        <div style="width:72px;height:72px;border-radius:50%;background:#FAF3E8;border:3px solid #D6C9B6;margin:16px auto;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',Georgia,serif;font-size:28px;color:#C75B3A;font-weight:700;">J</div>
        <h2 style="margin-bottom:4px;">${SAMPLE.followerName}</h2>
        <p style="margin-top:0;color:#9B8E7E;">@${SAMPLE.followerUsername}</p>
        <p>just started following your adventures on Tinerary.</p>
        <hr class="divider">
        <a href="${APP_URL}/user/${SAMPLE.followerUsername}" class="cta-btn">View Their Profile</a>
      </div>
    `),
  },

  newComment: {
    subject: `${SAMPLE.followerName} left a note on ${SAMPLE.eventTitle}`,
    html: postcardEmail(`
      <div class="masthead" style="background:#1A7B7E;">
        <div class="stamp">New Comment</div>
        <h1>${SAMPLE.eventTitle}</h1>
        <p class="subtitle">A note from ${SAMPLE.followerName}</p>
      </div>
      <div class="body-content">
        <p>Hi ${SAMPLE.name},</p>
        <p><strong>${SAMPLE.followerName}</strong> commented on your event:</p>
        <div class="info-card" style="font-style:italic;">
          &ldquo;${SAMPLE.commentText}&rdquo;
        </div>
        <hr class="divider">
        <p style="text-align:center;">
          <a href="${APP_URL}/event/${SAMPLE.eventId}" class="cta-btn">View Conversation</a>
        </p>
      </div>
    `),
  },

  passwordReset: {
    subject: "Reset your Tinerary password",
    html: postcardEmail(`
      <div class="masthead" style="background:#3D3229;">
        <div class="stamp">Password Reset</div>
        <h1>Let's get you back in</h1>
      </div>
      <div class="body-content">
        <p>We received a request to reset your Tinerary password. Click below to choose a new one:</p>
        <p style="text-align:center;margin:28px 0;">
          <a href="${APP_URL}/auth/reset-password?token=${SAMPLE.resetToken}" class="cta-btn" style="background:#3D3229;">Reset Password</a>
        </p>
        <div class="info-card info-card-alert">
          <strong>This link expires in 1 hour.</strong><br>
          If you didn't request this, you can safely ignore this email &mdash; your password won't change.
        </div>
      </div>
    `),
  },

  countdownReminder: {
    subject: `${SAMPLE.timeRemaining} until ${SAMPLE.eventTitle}!`,
    html: postcardEmail(`
      <div class="masthead">
        <div class="stamp">Countdown</div>
        <h1>${SAMPLE.eventTitle}</h1>
        <p class="subtitle">is just around the corner</p>
      </div>
      <div class="body-content">
        <p>Hi ${SAMPLE.name},</p>
        <div style="text-align:center;margin:24px 0;">
          <div style="display:inline-block;background:#FAF3E8;border:2px solid #C75B3A;border-radius:4px;padding:20px 36px;">
            <div style="font-family:'Playfair Display',Georgia,serif;font-size:42px;font-weight:700;color:#C75B3A;line-height:1;">${SAMPLE.timeRemaining}</div>
            <div style="font-size:13px;color:#9B8E7E;margin-top:6px;text-transform:uppercase;letter-spacing:1px;">until your event</div>
          </div>
        </div>
        <div class="info-card">
          <div class="detail-row"><span class="detail-label">When:</span> ${SAMPLE.eventDate}</div>
          <div class="detail-row"><span class="detail-label">Where:</span> ${SAMPLE.eventLocation}</div>
        </div>
        <p>Make sure everything's sorted &mdash; the adventure is almost here!</p>
        <hr class="divider">
        <p style="text-align:center;">
          <a href="${APP_URL}/event/${SAMPLE.eventId}" class="cta-btn cta-btn-warm">View Event Details</a>
        </p>
      </div>
    `),
  },

  eventStarted: {
    subject: `${SAMPLE.eventTitle} is happening now!`,
    html: postcardEmail(`
      <div class="masthead" style="background:#1A7B7E;">
        <div class="stamp">Right Now</div>
        <h1>${SAMPLE.eventTitle}</h1>
        <p class="subtitle">is officially underway</p>
      </div>
      <div class="body-content" style="text-align:center;">
        <p style="text-align:left;">Hi ${SAMPLE.name},</p>
        <div style="display:inline-block;background:#E8F5F0;border:2px solid #1A7B7E;border-radius:4px;padding:10px 24px;margin:16px 0;">
          <span style="font-family:'Playfair Display',Georgia,serif;font-weight:700;font-size:15px;color:#1A7B7E;letter-spacing:1px;text-transform:uppercase;">Happening Now</span>
        </div>
        <h2 style="color:#1A7B7E;">${SAMPLE.eventTitle}</h2>
        <p style="color:#9B8E7E;">at ${SAMPLE.eventLocation}</p>
        <p>Your event has begun &mdash; enjoy every moment!</p>
        <hr class="divider">
        <a href="${APP_URL}/event/${SAMPLE.eventId}" class="cta-btn">View Event</a>
      </div>
    `),
  },

  whatsNew: {
    subject: "Postcards from the team: what's new on Tinerary",
    html: postcardEmail(`
      <div class="masthead">
        <div class="stamp">Dispatches</div>
        <h1>What's New on Tinerary</h1>
        <p class="subtitle">Fresh features for your next adventure</p>
      </div>
      <div class="body-content">
        <p>Hi ${SAMPLE.name},</p>
        <p>We've been busy behind the scenes making Tinerary even better for planning your next getaway. Here's the latest:</p>
        <div class="info-card">
          <h3 style="margin-top:0;">Enhanced Event Planning</h3>
          <p style="margin-bottom:0;">Create beautiful itineraries with interactive maps, photo galleries, and detailed day-by-day schedules.</p>
        </div>
        <div class="info-card info-card-warm">
          <h3 style="margin-top:0;">Smart Reminders</h3>
          <p style="margin-bottom:0;">Countdown reminders at 5 days, 2 days, 1 day, and 2 hours before departure so you're never caught off guard.</p>
        </div>
        <div class="info-card">
          <h3 style="margin-top:0;">Travel Together</h3>
          <p style="margin-bottom:0;">Follow friends, share events, and collaborate on trip planning in real time.</p>
        </div>
        <div class="info-card info-card-warm">
          <h3 style="margin-top:0;">Expense Tracking</h3>
          <p style="margin-bottom:0;">Log costs on the go and split expenses with your travel companions &mdash; no awkward math required.</p>
        </div>
        <hr class="divider">
        <p style="text-align:center;font-family:'Playfair Display',Georgia,serif;font-style:italic;font-size:17px;color:#C75B3A;">Your next adventure is just a tap away.</p>
        <p style="text-align:center;">
          <a href="${APP_URL}/" class="cta-btn">Explore Tinerary</a>
        </p>
      </div>
    `, "You received this because you signed up for Tinerary."),
  },

  accountDeletion: {
    subject: `Your Tinerary account will be deleted in ${SAMPLE.daysRemaining} days`,
    html: postcardEmail(`
      <div class="masthead" style="background:#3D3229;">
        <div class="stamp">Important Notice</div>
        <h1>Account Deletion Scheduled</h1>
      </div>
      <div class="body-content">
        <p>Hi ${SAMPLE.name},</p>
        <div style="text-align:center;margin:24px 0;">
          <div style="display:inline-block;background:#FEF0EC;border:2px solid #C75B3A;border-radius:4px;padding:20px 36px;">
            <div style="font-family:'Playfair Display',Georgia,serif;font-size:42px;font-weight:700;color:#C75B3A;line-height:1;">${SAMPLE.daysRemaining} days</div>
            <div style="font-size:13px;color:#9B8E7E;margin-top:6px;">until permanent deletion</div>
          </div>
        </div>
        <p>Your account is scheduled for deletion on <strong>Monday, March 23, 2026</strong>.</p>
        <div class="info-card info-card-alert">
          <p style="margin:0 0 10px;"><strong>What will be removed:</strong></p>
          <ul style="margin:0;padding-left:20px;line-height:1.8;">
            <li>All itineraries and trip plans</li>
            <li>Photos and media uploads</li>
            <li>Comments and interactions</li>
            <li>Follower connections</li>
            <li>All account data</li>
          </ul>
        </div>
        <p><strong>Changed your mind?</strong> Simply log in to cancel the deletion.</p>
        <hr class="divider">
        <p style="text-align:center;">
          <a href="${APP_URL}/settings/account" class="cta-btn" style="background:#1A7B7E;">Keep My Account</a>
        </p>
        <p style="color:#9B8E7E;font-size:13px;margin-top:24px;">If you intended to delete your account, no action is needed. Your data will be permanently removed on the date above.</p>
      </div>
    `),
  },
}

export async function GET(request: NextRequest) {
  // Require authentication and admin role
  const { createClient } = await import("@/utils/supabase/server")
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  const template = request.nextUrl.searchParams.get("template")

  // If no template specified, return the list
  if (!template) {
    return NextResponse.json({
      templates: Object.keys(templates).map((key) => ({
        id: key,
        subject: templates[key].subject,
      })),
    })
  }

  const entry = templates[template]
  if (!entry) {
    return NextResponse.json({ error: `Unknown template: ${template}` }, { status: 404 })
  }

  // Return raw HTML so it can be rendered in an iframe
  return new NextResponse(entry.html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}
