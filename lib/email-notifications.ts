import { Resend } from "resend"

// Lazy-load Resend client to avoid build-time API key requirement
let resendClient: Resend | null = null

function getResendClient(): Resend {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set")
    }
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }
  return resendClient
}

const FROM_EMAIL = "Tinerary <noreply@tinerary-app.com>"
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://tinerary-app.com"

// ─── Shared postcard-style email shell ────────────────────────────────
// Warm cream + terracotta + teal palette inspired by vintage travel postcards.
// Uses Google Fonts @import for the editorial serif "Playfair Display".
// Every email wraps its unique body content with postcardEmail().

export function postcardEmail(body: string, footerNote?: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&display=swap');

        body {
          margin: 0;
          padding: 0;
          background-color: #F5EDE3;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #3D3229;
          -webkit-font-smoothing: antialiased;
        }
        .outer-wrap {
          max-width: 640px;
          margin: 30px auto;
          padding: 0 16px;
        }
        /* ── postcard frame ── */
        .postcard {
          background: #FFFDF9;
          border: 2px solid #D6C9B6;
          border-radius: 4px;
          box-shadow: 0 4px 24px rgba(61,50,41,0.08);
          overflow: hidden;
        }
        /* ── masthead ── */
        .masthead {
          background: #C75B3A;
          padding: 32px 36px 28px;
          text-align: center;
        }
        .masthead h1 {
          margin: 0;
          font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
          font-weight: 700;
          font-size: 30px;
          color: #FFFDF9;
          letter-spacing: 0.5px;
        }
        .masthead .subtitle {
          margin: 6px 0 0;
          font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
          font-style: italic;
          font-size: 15px;
          color: rgba(255,253,249,0.85);
        }
        /* ── stamp decoration ── */
        .stamp {
          display: inline-block;
          border: 2px dashed rgba(255,253,249,0.5);
          border-radius: 2px;
          padding: 6px 14px;
          margin-bottom: 12px;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: rgba(255,253,249,0.8);
        }
        /* ── body content ── */
        .body-content {
          padding: 32px 36px;
          font-size: 15px;
          line-height: 1.7;
          color: #3D3229;
        }
        .body-content h2 {
          font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
          font-weight: 700;
          font-size: 22px;
          color: #C75B3A;
          margin: 0 0 12px;
        }
        .body-content h3 {
          font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
          font-weight: 700;
          font-size: 18px;
          color: #1A7B7E;
          margin: 0 0 6px;
        }
        .body-content p {
          margin: 0 0 14px;
        }
        .body-content a {
          color: #1A7B7E;
        }
        /* ── divider ── */
        .divider {
          border: none;
          border-top: 1px solid #D6C9B6;
          margin: 24px 0;
        }
        /* ── CTA button ── */
        .cta-btn {
          display: inline-block;
          background: #1A7B7E;
          color: #FFFDF9 !important;
          padding: 13px 34px;
          text-decoration: none;
          border-radius: 4px;
          font-weight: 600;
          font-size: 15px;
          letter-spacing: 0.3px;
        }
        .cta-btn-warm {
          background: #C75B3A;
        }
        /* ── info card ── */
        .info-card {
          background: #FAF3E8;
          border-left: 3px solid #1A7B7E;
          padding: 16px 20px;
          border-radius: 0 4px 4px 0;
          margin: 18px 0;
        }
        .info-card-warm {
          border-left-color: #C75B3A;
        }
        .info-card-alert {
          background: #FEF0EC;
          border-left-color: #C75B3A;
        }
        /* ── detail row ── */
        .detail-row {
          margin: 8px 0;
          font-size: 15px;
        }
        .detail-label {
          font-weight: 600;
          color: #1A7B7E;
        }
        /* ── postmark / footer ── */
        .postmark {
          border-top: 1px solid #D6C9B6;
          padding: 24px 36px;
          text-align: center;
          font-size: 13px;
          color: #9B8E7E;
        }
        .postmark .brand {
          font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
          font-style: italic;
          font-size: 16px;
          color: #C75B3A;
          margin-bottom: 6px;
        }
      </style>
    </head>
    <body>
      <div class="outer-wrap">
        <div class="postcard">
          ${body}
          <div class="postmark">
            <div class="brand">Tinerary</div>
            <p style="margin: 4px 0 0;">Stories worth planning, moments worth sharing.</p>
            ${footerNote ? `<p style="margin: 10px 0 0; font-size: 12px; color: #B8A99A;">${footerNote}</p>` : ''}
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(email: string, name: string) {
  try {
    const resend = getResendClient()
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Welcome aboard, traveler!",
      html: postcardEmail(`
        <div class="masthead">
          <div class="stamp">Welcome Aboard</div>
          <h1>Your journey starts here</h1>
          <p class="subtitle">A new chapter in travel planning</p>
        </div>
        <div class="body-content">
          <h2>Hi ${name}!</h2>
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
      `, 'Happy travels from the Tinerary crew.'),
    })
    return { success: true }
  } catch (error: any) {
    console.error("Error sending welcome email:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Send event invitation email
 */
export async function sendEventInviteEmail(
  recipientEmail: string,
  recipientName: string,
  eventTitle: string,
  eventDate: string,
  eventLocation: string,
  inviterName: string,
  eventId: string
) {
  try {
    const eventUrl = `${APP_URL}/event/${eventId}`

    const resend = getResendClient()
    await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: `You're invited to ${eventTitle}`,
      html: postcardEmail(`
        <div class="masthead">
          <div class="stamp">You're Invited</div>
          <h1>${eventTitle}</h1>
          <p class="subtitle">A personal invitation from ${inviterName}</p>
        </div>
        <div class="body-content">
          <p>Hi ${recipientName},</p>
          <p><strong>${inviterName}</strong> has saved you a spot. Here are the details:</p>

          <div class="info-card" style="background:#FFFDF9; border: 1px solid #D6C9B6; border-left: 3px solid #1A7B7E;">
            <div class="detail-row">
              <span class="detail-label">When:</span> ${eventDate}
            </div>
            <div class="detail-row">
              <span class="detail-label">Where:</span> ${eventLocation}
            </div>
          </div>

          <hr class="divider">
          <p style="text-align:center;">
            <a href="${eventUrl}" class="cta-btn">View Event &amp; RSVP</a>
          </p>
        </div>
      `, 'See you there!'),
    })
    return { success: true }
  } catch (error: any) {
    console.error("Error sending event invite email:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Send event reminder email
 */
export async function sendEventReminderEmail(
  recipientEmail: string,
  recipientName: string,
  eventTitle: string,
  eventDate: string,
  eventLocation: string,
  eventId: string,
  hoursUntil: number
) {
  try {
    const eventUrl = `${APP_URL}/event/${eventId}`
    const timeText = hoursUntil < 24 ? `in ${hoursUntil} hours` : `tomorrow`

    const resend = getResendClient()
    await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: `Reminder: ${eventTitle} is ${timeText}`,
      html: postcardEmail(`
        <div class="masthead">
          <div class="stamp">Gentle Reminder</div>
          <h1>${eventTitle}</h1>
          <p class="subtitle">is coming up ${timeText}</p>
        </div>
        <div class="body-content">
          <p>Hi ${recipientName},</p>
          <p>Just a friendly nudge &mdash; your upcoming plans are right around the corner.</p>

          <div class="info-card info-card-warm">
            <div class="detail-row">
              <span class="detail-label">When:</span> ${eventDate}
            </div>
            <div class="detail-row">
              <span class="detail-label">Where:</span> ${eventLocation}
            </div>
          </div>

          <p>Make sure everything's packed, planned, and ready to go!</p>

          <hr class="divider">
          <p style="text-align:center;">
            <a href="${eventUrl}" class="cta-btn cta-btn-warm">View Event Details</a>
          </p>
        </div>
      `),
    })
    return { success: true }
  } catch (error: any) {
    console.error("Error sending reminder email:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Send new follower notification email
 */
export async function sendNewFollowerEmail(
  recipientEmail: string,
  recipientName: string,
  followerName: string,
  followerUsername: string,
  followerAvatarUrl: string | null
) {
  try {
    const profileUrl = `${APP_URL}/user/${followerUsername}`

    const avatarHtml = followerAvatarUrl
      ? `<img src="${followerAvatarUrl}" alt="${followerName}" style="width:72px;height:72px;border-radius:50%;border:3px solid #D6C9B6;margin:16px auto;display:block;">`
      : `<div style="width:72px;height:72px;border-radius:50%;background:#FAF3E8;border:3px solid #D6C9B6;margin:16px auto;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',Georgia,serif;font-size:28px;color:#C75B3A;font-weight:700;">${(followerName || '?')[0].toUpperCase()}</div>`

    const resend = getResendClient()
    await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: `${followerName} is now following your travels`,
      html: postcardEmail(`
        <div class="masthead">
          <div class="stamp">New Follower</div>
          <h1>Someone new is along for the ride</h1>
        </div>
        <div class="body-content" style="text-align:center;">
          <p style="text-align:left;">Hi ${recipientName},</p>

          ${avatarHtml}
          <h2 style="margin-bottom:4px;">${followerName}</h2>
          <p style="margin-top:0;color:#9B8E7E;">@${followerUsername}</p>
          <p>just started following your adventures on Tinerary.</p>

          <hr class="divider">
          <a href="${profileUrl}" class="cta-btn">View Their Profile</a>
        </div>
      `),
    })
    return { success: true }
  } catch (error: any) {
    console.error("Error sending new follower email:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Send new comment notification email
 */
export async function sendNewCommentEmail(
  recipientEmail: string,
  recipientName: string,
  commenterName: string,
  commentText: string,
  eventTitle: string,
  eventId: string
) {
  try {
    const eventUrl = `${APP_URL}/event/${eventId}`

    const resend = getResendClient()
    await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: `${commenterName} left a note on ${eventTitle}`,
      html: postcardEmail(`
        <div class="masthead" style="background:#1A7B7E;">
          <div class="stamp">New Comment</div>
          <h1>${eventTitle}</h1>
          <p class="subtitle">A note from ${commenterName}</p>
        </div>
        <div class="body-content">
          <p>Hi ${recipientName},</p>
          <p><strong>${commenterName}</strong> commented on your event:</p>

          <div class="info-card" style="font-style:italic;">
            &ldquo;${commentText}&rdquo;
          </div>

          <hr class="divider">
          <p style="text-align:center;">
            <a href="${eventUrl}" class="cta-btn">View Conversation</a>
          </p>
        </div>
      `),
    })
    return { success: true }
  } catch (error: any) {
    console.error("Error sending comment notification email:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, resetToken: string) {
  try {
    const resetUrl = `${APP_URL}/auth/reset-password?token=${resetToken}`

    const resend = getResendClient()
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Reset your Tinerary password",
      html: postcardEmail(`
        <div class="masthead" style="background:#3D3229;">
          <div class="stamp">Password Reset</div>
          <h1>Let's get you back in</h1>
        </div>
        <div class="body-content">
          <p>We received a request to reset your Tinerary password. Click below to choose a new one:</p>

          <p style="text-align:center;margin:28px 0;">
            <a href="${resetUrl}" class="cta-btn" style="background:#3D3229;">Reset Password</a>
          </p>

          <div class="info-card info-card-alert">
            <strong>This link expires in 1 hour.</strong><br>
            If you didn't request this, you can safely ignore this email &mdash; your password won't change.
          </div>
        </div>
      `),
    })
    return { success: true }
  } catch (error: any) {
    console.error("Error sending password reset email:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Send countdown reminder email
 */
export async function sendCountdownReminderEmail(params: {
  email: string
  name?: string
  itineraryTitle: string
  itineraryId: string
  timeRemaining: string
  eventDate: string
  location?: string
  eventType?: "event" | "trip"
}) {
  try {
    const { email, name, itineraryTitle, itineraryId, timeRemaining, eventDate, location, eventType = "event" } = params
    const eventUrl = `${APP_URL}/event/${itineraryId}`
    const typeLabel = eventType === "trip" ? "trip" : "event"

    const resend = getResendClient()
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `${timeRemaining} until ${itineraryTitle}!`,
      html: postcardEmail(`
        <div class="masthead">
          <div class="stamp">Countdown</div>
          <h1>${itineraryTitle}</h1>
          <p class="subtitle">is just around the corner</p>
        </div>
        <div class="body-content">
          <p>Hi ${name || "there"},</p>

          <div style="text-align:center;margin:24px 0;">
            <div style="display:inline-block;background:#FAF3E8;border:2px solid #C75B3A;border-radius:4px;padding:20px 36px;">
              <div style="font-family:'Playfair Display',Georgia,serif;font-size:42px;font-weight:700;color:#C75B3A;line-height:1;">${timeRemaining}</div>
              <div style="font-size:13px;color:#9B8E7E;margin-top:6px;text-transform:uppercase;letter-spacing:1px;">until your ${typeLabel}</div>
            </div>
          </div>

          <div class="info-card">
            <div class="detail-row">
              <span class="detail-label">When:</span> ${new Date(eventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            ${location ? `<div class="detail-row"><span class="detail-label">Where:</span> ${location}</div>` : ''}
          </div>

          <p>Make sure everything's sorted &mdash; the adventure is almost here!</p>

          <hr class="divider">
          <p style="text-align:center;">
            <a href="${eventUrl}" class="cta-btn cta-btn-warm">View ${eventType === "trip" ? "Trip" : "Event"} Details</a>
          </p>
        </div>
      `),
    })
    return { success: true }
  } catch (error: any) {
    console.error("Error sending countdown reminder email:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Send event started notification email
 */
export async function sendEventStartedEmail(params: {
  email: string
  name?: string
  itineraryTitle: string
  itineraryId: string
  location?: string
  eventType?: "event" | "trip"
}) {
  try {
    const { email, name, itineraryTitle, itineraryId, location, eventType = "event" } = params
    const eventUrl = `${APP_URL}/event/${itineraryId}`

    const resend = getResendClient()
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `${itineraryTitle} is happening now!`,
      html: postcardEmail(`
        <div class="masthead" style="background:#1A7B7E;">
          <div class="stamp">Right Now</div>
          <h1>${itineraryTitle}</h1>
          <p class="subtitle">is officially underway</p>
        </div>
        <div class="body-content" style="text-align:center;">
          <p style="text-align:left;">Hi ${name || "there"},</p>

          <div style="display:inline-block;background:#E8F5F0;border:2px solid #1A7B7E;border-radius:4px;padding:10px 24px;margin:16px 0;">
            <span style="font-family:'Playfair Display',Georgia,serif;font-weight:700;font-size:15px;color:#1A7B7E;letter-spacing:1px;text-transform:uppercase;">Happening Now</span>
          </div>

          <h2 style="color:#1A7B7E;">${itineraryTitle}</h2>
          ${location ? `<p style="color:#9B8E7E;">at ${location}</p>` : ''}

          <p>Your ${eventType} has begun &mdash; enjoy every moment!</p>

          <hr class="divider">
          <a href="${eventUrl}" class="cta-btn">View ${eventType === "trip" ? "Trip" : "Event"}</a>
        </div>
      `),
    })
    return { success: true }
  } catch (error: any) {
    console.error("Error sending event started email:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Send "What's New" marketing email to users
 */
export async function sendWhatsNewEmail(params: {
  email: string
  name?: string
}) {
  try {
    const { email, name } = params

    const resend = getResendClient()
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Postcards from the team: what's new on Tinerary",
      html: postcardEmail(`
        <div class="masthead">
          <div class="stamp">Dispatches</div>
          <h1>What's New on Tinerary</h1>
          <p class="subtitle">Fresh features for your next adventure</p>
        </div>
        <div class="body-content">
          <p>Hi ${name || "there"},</p>
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
      `, 'You received this because you signed up for Tinerary.'),
    })
    return { success: true }
  } catch (error: any) {
    console.error("Error sending what's new email:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Send account deletion warning email
 */
export async function sendAccountDeletionWarningEmail(params: {
  email: string
  name?: string
  username?: string
  deletionDate: string
  daysRemaining: number
}) {
  try {
    const { email, name, username, deletionDate, daysRemaining } = params
    const reactivateUrl = `${APP_URL}/settings/account`

    const resend = getResendClient()
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Your Tinerary account will be deleted in ${daysRemaining} days`,
      html: postcardEmail(`
        <div class="masthead" style="background:#3D3229;">
          <div class="stamp">Important Notice</div>
          <h1>Account Deletion Scheduled</h1>
        </div>
        <div class="body-content">
          <p>Hi ${name || username || "there"},</p>

          <div style="text-align:center;margin:24px 0;">
            <div style="display:inline-block;background:#FEF0EC;border:2px solid #C75B3A;border-radius:4px;padding:20px 36px;">
              <div style="font-family:'Playfair Display',Georgia,serif;font-size:42px;font-weight:700;color:#C75B3A;line-height:1;">${daysRemaining} days</div>
              <div style="font-size:13px;color:#9B8E7E;margin-top:6px;">until permanent deletion</div>
            </div>
          </div>

          <p>Your account is scheduled for deletion on <strong>${new Date(deletionDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>.</p>

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
            <a href="${reactivateUrl}" class="cta-btn" style="background:#1A7B7E;">Keep My Account</a>
          </p>

          <p style="color:#9B8E7E;font-size:13px;margin-top:24px;">If you intended to delete your account, no action is needed. Your data will be permanently removed on the date above.</p>
        </div>
      `),
    })
    return { success: true }
  } catch (error: any) {
    console.error("Error sending account deletion warning email:", error)
    return { success: false, error: error.message }
  }
}
