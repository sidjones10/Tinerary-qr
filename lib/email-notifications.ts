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

// ─── Email logging ─────────────────────────────────────────────────
// Logs every outbound email to the email_logs table for the admin
// communications dashboard. Uses dynamic import to avoid circular deps.

async function logEmail(params: {
  recipientEmail: string
  emailType: string
  subject: string
  status: "sent" | "failed"
  errorMessage?: string
  userId?: string
  metadata?: Record<string, unknown>
}) {
  try {
    const { createClient } = await import("@supabase/supabase-js")
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) return

    const admin = createClient(supabaseUrl, serviceKey)
    await admin.from("email_logs").insert({
      recipient_email: params.recipientEmail,
      email_type: params.emailType,
      subject: params.subject,
      status: params.status,
      error_message: params.errorMessage || null,
      user_id: params.userId || null,
      metadata: params.metadata || {},
    })
  } catch (err) {
    // Never let logging failures break email delivery
    console.error("Failed to log email:", err)
  }
}

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
        /* ── airmail stripe ── */
        .airmail-stripe {
          height: 8px;
          background: repeating-linear-gradient(
            90deg,
            #C75B3A 0px, #C75B3A 20px,
            #FFFDF9 20px, #FFFDF9 28px,
            #1A7B7E 28px, #1A7B7E 48px,
            #FFFDF9 48px, #FFFDF9 56px
          );
        }
        /* ── postcard frame ── */
        .postcard {
          background: #FFFDF9;
          border: 2px solid #D6C9B6;
          border-radius: 6px;
          box-shadow: 0 6px 28px rgba(61,50,41,0.10);
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
          margin: 8px 0 0;
          font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
          font-style: italic;
          font-size: 15px;
          color: rgba(255,253,249,0.88);
        }
        /* ── stamp decoration ── */
        .stamp {
          display: inline-block;
          border: 2px dashed rgba(255,253,249,0.6);
          border-radius: 3px;
          padding: 6px 16px;
          margin-bottom: 12px;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 2.5px;
          color: rgba(255,253,249,0.9);
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
        /* ── fun divider ── */
        .divider {
          border: none;
          border-top: 2px dashed #D6C9B6;
          margin: 28px 0;
          position: relative;
        }
        /* ── CTA button ── */
        .cta-btn {
          display: inline-block;
          background: #1A7B7E;
          color: #FFFDF9 !important;
          padding: 14px 36px;
          text-decoration: none;
          border-radius: 28px;
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
          border-left: 4px solid #1A7B7E;
          padding: 16px 20px;
          border-radius: 0 8px 8px 0;
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
          font-size: 18px;
          color: #C75B3A;
          margin-bottom: 6px;
        }
      </style>
    </head>
    <body>
      <div class="outer-wrap">
        <div class="postcard">
          <div class="airmail-stripe"></div>
          ${body}
          <div class="airmail-stripe"></div>
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
    const subject = "Welcome aboard, traveler!"
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      subject: "You're in! Let the adventures begin",
      html: postcardEmail(`
        <div class="masthead" style="padding:40px 36px 36px;">
          <div class="stamp">Welcome Aboard</div>
          <h1 style="font-size:34px;line-height:1.15;">Hi ${name}!<br><span style="font-style:italic;font-weight:400;">So glad you're here.</span></h1>
        </div>
        <div class="body-content">
          <p style="font-size:16px;line-height:1.7;">We built Tinerary because we believe every trip deserves to feel like a story &mdash; and every event should be easy to plan, fun to share, and impossible to forget. Welcome to the crew.</p>

          <!-- Showcase feature cards with colored headers -->
          <div style="margin:28px 0;">
            <div style="border:2px solid #3D3229;border-radius:16px;overflow:hidden;margin-bottom:16px;">
              <div style="background:#1A7B7E;padding:14px 20px;">
                <span style="color:#FFFDF9;font-weight:700;font-size:16px;">Plan &amp; Share</span>
              </div>
              <div style="padding:16px 20px;">
                <p style="margin:0;font-size:15px;line-height:1.6;color:#3D3229;">Create stunning itineraries with maps, photos, and schedules &mdash; then share with a single link.</p>
              </div>
            </div>

            <div style="border:2px solid #3D3229;border-radius:16px;overflow:hidden;margin-bottom:16px;">
              <div style="background:#C75B3A;padding:14px 20px;">
                <span style="color:#FFFDF9;font-weight:700;font-size:16px;">Travel Together</span>
              </div>
              <div style="padding:16px 20px;">
                <p style="margin:0;font-size:15px;line-height:1.6;color:#3D3229;">Follow friends, see what they're planning, and collaborate on trips in real time.</p>
              </div>
            </div>

            <div style="border:2px solid #3D3229;border-radius:16px;overflow:hidden;">
              <div style="background:#3D3229;padding:14px 20px;">
                <span style="color:#FFFDF9;font-weight:700;font-size:16px;">Stay On Track</span>
              </div>
              <div style="padding:16px 20px;">
                <p style="margin:0;font-size:15px;line-height:1.6;color:#3D3229;">Smart countdown reminders, calendar exports, and expense splitting keep everything on course.</p>
              </div>
            </div>
          </div>

          <!-- Welcome CTA card -->
          <div style="background:#FAF3E8;border:2px solid #3D3229;border-radius:16px;padding:28px;text-align:center;margin:28px 0;">
            <div style="font-family:'Playfair Display',Georgia,serif;font-size:20px;font-weight:700;color:#3D3229;margin-bottom:6px;">Ready to plan your first adventure?</div>
            <p style="margin:0 0 18px;font-size:15px;color:#5C4F42;font-style:italic;">Your next story starts here.</p>
            <a href="${APP_URL}/" class="cta-btn">Start Exploring</a>
          </div>
        </div>
      `, 'Happy travels from the Tinerary crew.'),
    })
    await logEmail({ recipientEmail: email, emailType: "welcome", subject, status: "sent" })
    return { success: true }
  } catch (error: any) {
    console.error("Error sending welcome email:", error)
    await logEmail({ recipientEmail: email, emailType: "welcome", subject: "Welcome aboard, traveler!", status: "failed", errorMessage: error.message })
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

    const subject = `You're invited to ${eventTitle}`
    const resend = getResendClient()
    await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject,
      subject: `You're invited: ${eventTitle}`,
      html: postcardEmail(`
        <div class="masthead">
          <div class="stamp">You're Invited</div>
          <h1>${eventTitle}</h1>
          <p class="subtitle">${inviterName} wants you there!</p>
        </div>
        <div class="body-content">
          <p>Hi ${recipientName},</p>
          <p>Great news &mdash; <strong>${inviterName}</strong> has saved you a spot and your presence is officially requested!</p>

          <div style="background:#FFFDF9;border:2px dashed #D6C9B6;border-radius:8px;padding:20px 24px;margin:20px 0;text-align:center;">
            <div style="font-family:'Playfair Display',Georgia,serif;font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#9B8E7E;margin-bottom:10px;">Admit One</div>
            <div style="font-family:'Playfair Display',Georgia,serif;font-size:22px;font-weight:700;color:#C75B3A;margin-bottom:14px;">${eventTitle}</div>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="text-align:center;padding:8px 0;border-top:1px solid #D6C9B6;">
                  <span class="detail-label">When:</span> ${eventDate}
                </td>
              </tr>
              <tr>
                <td style="text-align:center;padding:8px 0;border-top:1px solid #D6C9B6;">
                  <span class="detail-label">Where:</span> ${eventLocation}
                </td>
              </tr>
            </table>
          </div>

          <hr class="divider">
          <p style="text-align:center;">
            <a href="${eventUrl}" class="cta-btn">View Event &amp; RSVP</a>
          </p>
        </div>
      `, 'See you there!'),
    })
    await logEmail({ recipientEmail, emailType: "event_invite", subject, status: "sent", metadata: { eventId } })
    return { success: true }
  } catch (error: any) {
    console.error("Error sending event invite email:", error)
    await logEmail({ recipientEmail, emailType: "event_invite", subject: `You're invited to ${eventTitle}`, status: "failed", errorMessage: error.message })
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

    const subject = `Reminder: ${eventTitle} is ${timeText}`
    const resend = getResendClient()
    await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject,
      subject: `Heads up! ${eventTitle} is ${timeText}`,
      html: postcardEmail(`
        <div class="masthead">
          <div class="stamp">Heads Up</div>
          <h1>${eventTitle}</h1>
          <p class="subtitle">is coming up ${timeText} &mdash; get excited!</p>
        </div>
        <div class="body-content">
          <p>Hi ${recipientName},</p>
          <p>Friendly nudge &mdash; the fun is almost here!</p>

          <div style="text-align:center;margin:22px 0;">
            <div style="display:inline-block;background:#FAF3E8;border:2px solid #C75B3A;border-radius:8px;padding:16px 32px;">
              <div style="font-family:'Playfair Display',Georgia,serif;font-size:28px;font-weight:700;color:#C75B3A;line-height:1;">${timeText}</div>
              <div style="font-size:12px;color:#9B8E7E;margin-top:4px;text-transform:uppercase;letter-spacing:1px;">and counting</div>
            </div>
          </div>

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
    await logEmail({ recipientEmail, emailType: "event_reminder", subject, status: "sent", metadata: { eventId } })
    return { success: true }
  } catch (error: any) {
    console.error("Error sending reminder email:", error)
    await logEmail({ recipientEmail, emailType: "event_reminder", subject: `Reminder: ${eventTitle}`, status: "failed", errorMessage: error.message })
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

    const subject = `${followerName} is now following your travels`
    const resend = getResendClient()
    await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject,
      subject: `${followerName} just joined your travel crew!`,
      html: postcardEmail(`
        <div class="masthead" style="background: linear-gradient(135deg, #C75B3A 0%, #D4764E 100%);">
          <div class="stamp">New Travel Buddy</div>
          <h1>You've got a new follower!</h1>
        </div>
        <div class="body-content" style="text-align:center;">
          <p style="text-align:left;">Hi ${recipientName},</p>

          ${avatarHtml}
          <h2 style="margin-bottom:4px;">${followerName}</h2>
          <p style="margin-top:0;color:#9B8E7E;">@${followerUsername}</p>

          <div style="display:inline-block;background:#E8F5F0;border-radius:20px;padding:8px 24px;margin:8px 0 16px;">
            <span style="color:#1A7B7E;font-weight:600;font-size:14px;">is now following your adventures</span>
          </div>

          <hr class="divider">
          <a href="${profileUrl}" class="cta-btn">Say Hello</a>
        </div>
      `),
    })
    await logEmail({ recipientEmail, emailType: "new_follower", subject, status: "sent" })
    return { success: true }
  } catch (error: any) {
    console.error("Error sending new follower email:", error)
    await logEmail({ recipientEmail, emailType: "new_follower", subject: `${followerName} is now following your travels`, status: "failed", errorMessage: error.message })
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

    const subject = `${commenterName} left a note on ${eventTitle}`
    const resend = getResendClient()
    await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject,
      subject: `${commenterName} commented on ${eventTitle}`,
      html: postcardEmail(`
        <div class="masthead" style="background: linear-gradient(135deg, #1A7B7E 0%, #238E91 100%);">
          <div class="stamp">New Comment</div>
          <h1>${eventTitle}</h1>
          <p class="subtitle">${commenterName} has something to say!</p>
        </div>
        <div class="body-content">
          <p>Hi ${recipientName},</p>
          <p><strong>${commenterName}</strong> dropped a comment on your event:</p>

          <div style="background:#F5FAFA;border-radius:12px;padding:20px 24px;margin:20px 0;position:relative;">
            <div style="font-family:'Playfair Display',Georgia,serif;font-size:32px;color:#1A7B7E;line-height:1;margin-bottom:4px;">&ldquo;</div>
            <div style="font-style:italic;font-size:16px;color:#3D3229;line-height:1.6;padding:0 8px;">${commentText}</div>
            <div style="text-align:right;font-size:14px;color:#9B8E7E;margin-top:8px;">&mdash; ${commenterName}</div>
          </div>

          <hr class="divider">
          <p style="text-align:center;">
            <a href="${eventUrl}" class="cta-btn" style="background:#1A7B7E;">Join the Conversation</a>
          </p>
        </div>
      `),
    })
    await logEmail({ recipientEmail, emailType: "new_comment", subject, status: "sent", metadata: { eventId } })
    return { success: true }
  } catch (error: any) {
    console.error("Error sending comment notification email:", error)
    await logEmail({ recipientEmail, emailType: "new_comment", subject: `${commenterName} left a note on ${eventTitle}`, status: "failed", errorMessage: error.message })
    return { success: false, error: error.message }
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, resetToken: string) {
  try {
    const resetUrl = `${APP_URL}/auth/reset-password?token=${resetToken}`

    const subject = "Reset your Tinerary password"
    const resend = getResendClient()
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      html: postcardEmail(`
        <div class="masthead" style="background:#3D3229;">
          <div class="stamp">Password Reset</div>
          <h1>No worries, let's fix this</h1>
        </div>
        <div class="body-content">
          <p>We got your request to reset your password. It happens to the best of us! Click below to pick a new one:</p>

          <p style="text-align:center;margin:28px 0;">
            <a href="${resetUrl}" class="cta-btn" style="background:#3D3229;border-radius:28px;">Reset Password</a>
          </p>

          <div class="info-card info-card-alert" style="border-radius:0 8px 8px 0;">
            <strong>This link expires in 1 hour.</strong><br>
            If you didn't request this, you can safely ignore this email &mdash; your password won't change.
          </div>
        </div>
      `),
    })
    await logEmail({ recipientEmail: email, emailType: "password_reset", subject, status: "sent" })
    return { success: true }
  } catch (error: any) {
    console.error("Error sending password reset email:", error)
    await logEmail({ recipientEmail: email, emailType: "password_reset", subject: "Reset your Tinerary password", status: "failed", errorMessage: error.message })
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

    const subject = `${timeRemaining} until ${itineraryTitle}!`
    const resend = getResendClient()
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      html: postcardEmail(`
        <div class="masthead" style="background: linear-gradient(135deg, #C75B3A 0%, #D4764E 100%);">
          <div class="stamp">Countdown</div>
          <h1>${itineraryTitle}</h1>
          <p class="subtitle">The countdown is on!</p>
        </div>
        <div class="body-content">
          <p>Hi ${name || "there"},</p>

          <div style="text-align:center;margin:28px 0;">
            <div style="display:inline-block;background:#FAF3E8;border:3px solid #C75B3A;border-radius:12px;padding:24px 40px;">
              <div style="font-family:'Playfair Display',Georgia,serif;font-size:48px;font-weight:700;color:#C75B3A;line-height:1;">${timeRemaining}</div>
              <div style="font-size:12px;color:#9B8E7E;margin-top:8px;text-transform:uppercase;letter-spacing:2px;">until your ${typeLabel}</div>
            </div>
          </div>

          <div class="info-card" style="border-radius:8px;border-left:4px solid #1A7B7E;">
            <div class="detail-row">
              <span class="detail-label">When:</span> ${new Date(eventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            ${location ? `<div class="detail-row"><span class="detail-label">Where:</span> ${location}</div>` : ''}
          </div>

          <p style="text-align:center;font-family:'Playfair Display',Georgia,serif;font-style:italic;color:#1A7B7E;">The adventure is almost here &mdash; make sure you're ready!</p>

          <hr class="divider">
          <p style="text-align:center;">
            <a href="${eventUrl}" class="cta-btn cta-btn-warm">View ${eventType === "trip" ? "Trip" : "Event"} Details</a>
          </p>
        </div>
      `),
    })
    await logEmail({ recipientEmail: email, emailType: "countdown_reminder", subject, status: "sent", metadata: { itineraryId } })
    return { success: true }
  } catch (error: any) {
    console.error("Error sending countdown reminder email:", error)
    await logEmail({ recipientEmail: email, emailType: "countdown_reminder", subject: `${timeRemaining} until ${itineraryTitle}!`, status: "failed", errorMessage: error.message })
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

    const subject = `${itineraryTitle} is happening now!`
    const resend = getResendClient()
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      subject: `It's go time! ${itineraryTitle} is live`,
      html: postcardEmail(`
        <div class="masthead" style="background: linear-gradient(135deg, #1A7B7E 0%, #238E91 100%);">
          <div class="stamp">It's Go Time</div>
          <h1>${itineraryTitle}</h1>
          <p class="subtitle">is officially underway!</p>
        </div>
        <div class="body-content" style="text-align:center;">
          <p style="text-align:left;">Hi ${name || "there"},</p>

          <div style="margin:20px 0;">
            <div style="display:inline-block;background:#E8F5F0;border:3px solid #1A7B7E;border-radius:12px;padding:16px 32px;">
              <div style="font-family:'Playfair Display',Georgia,serif;font-weight:700;font-size:24px;color:#1A7B7E;letter-spacing:1px;text-transform:uppercase;">Happening Now</div>
            </div>
          </div>

          <h2 style="color:#1A7B7E;font-size:24px;">${itineraryTitle}</h2>
          ${location ? `<p style="color:#9B8E7E;font-style:italic;">at ${location}</p>` : ''}

          <p style="font-size:16px;">Your ${eventType} has begun &mdash; soak it all in!</p>

          <hr class="divider">
          <a href="${eventUrl}" class="cta-btn">View ${eventType === "trip" ? "Trip" : "Event"}</a>
        </div>
      `),
    })
    await logEmail({ recipientEmail: email, emailType: "event_started", subject, status: "sent", metadata: { itineraryId } })
    return { success: true }
  } catch (error: any) {
    console.error("Error sending event started email:", error)
    await logEmail({ recipientEmail: email, emailType: "event_started", subject: `${itineraryTitle} is happening now!`, status: "failed", errorMessage: error.message })
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

    const subject = "Postcards from the team: what's new on Tinerary"
    const resend = getResendClient()
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      subject: "Fresh off the press: what's new on Tinerary",
      html: postcardEmail(`
        <div class="masthead" style="background:#3D3229;">
          <h1 style="font-size:36px;line-height:1.1;">Your Tinerary<br><span style="font-style:italic;font-weight:400;">in Motion</span></h1>
          <p class="subtitle">What's new &amp; what's next for your travels</p>
        </div>
        <div class="body-content">
          <p>Hi ${name || "there"},</p>
          <p>Here's your latest dispatch from Tinerary HQ &mdash; new features, improvements, and a few things we think you'll love.</p>

          <!-- Stat-style highlight cards -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
            <tr>
              <td style="width:50%;padding-right:8px;vertical-align:top;">
                <div style="border:2px solid #3D3229;border-radius:16px;padding:24px;text-align:center;">
                  <div style="font-family:'Playfair Display',Georgia,serif;font-size:32px;font-weight:700;color:#C75B3A;line-height:1;">4</div>
                  <div style="font-size:15px;font-weight:700;color:#3D3229;margin:12px 0 8px;">New features this month</div>
                  <div style="display:inline-block;background:#3D3229;border-radius:8px;padding:4px 10px;">
                    <span style="color:#FFFDF9;font-size:12px;font-weight:700;">Just shipped</span>
                  </div>
                </div>
              </td>
              <td style="width:50%;padding-left:8px;vertical-align:top;">
                <div style="border:2px solid #3D3229;border-radius:16px;padding:24px;text-align:center;">
                  <div style="font-family:'Playfair Display',Georgia,serif;font-size:32px;font-weight:700;color:#1A7B7E;line-height:1;">3x</div>
                  <div style="font-size:15px;font-weight:700;color:#3D3229;margin:12px 0 8px;">Faster trip planning</div>
                  <div style="display:inline-block;background:#3D3229;border-radius:8px;padding:4px 10px;">
                    <span style="color:#FFFDF9;font-size:12px;font-weight:700;">&#8593; Improved</span>
                  </div>
                </div>
              </td>
            </tr>
          </table>

          <!-- Feature cards with dark header bar -->
          <div style="margin:28px 0;">
            <div style="border:2px solid #3D3229;border-radius:16px;overflow:hidden;margin-bottom:16px;">
              <div style="background:#1A7B7E;padding:12px 20px;">
                <span style="color:#FFFDF9;font-weight:700;font-size:14px;letter-spacing:0.5px;">Enhanced Event Planning</span>
              </div>
              <div style="padding:16px 20px;">
                <p style="margin:0;color:#3D3229;font-size:15px;line-height:1.6;">Create beautiful itineraries with interactive maps, photo galleries, and detailed day-by-day schedules.</p>
              </div>
            </div>

            <div style="border:2px solid #3D3229;border-radius:16px;overflow:hidden;margin-bottom:16px;">
              <div style="background:#C75B3A;padding:12px 20px;">
                <span style="color:#FFFDF9;font-weight:700;font-size:14px;letter-spacing:0.5px;">Smart Reminders</span>
              </div>
              <div style="padding:16px 20px;">
                <p style="margin:0;color:#3D3229;font-size:15px;line-height:1.6;">Countdown reminders at 5 days, 2 days, 1 day, and 2 hours before departure so you're never caught off guard.</p>
              </div>
            </div>

            <div style="border:2px solid #3D3229;border-radius:16px;overflow:hidden;margin-bottom:16px;">
              <div style="background:#1A7B7E;padding:12px 20px;">
                <span style="color:#FFFDF9;font-weight:700;font-size:14px;letter-spacing:0.5px;">Travel Together</span>
              </div>
              <div style="padding:16px 20px;">
                <p style="margin:0;color:#3D3229;font-size:15px;line-height:1.6;">Follow friends, share events, and collaborate on trip planning in real time.</p>
              </div>
            </div>

            <div style="border:2px solid #3D3229;border-radius:16px;overflow:hidden;">
              <div style="background:#C75B3A;padding:12px 20px;">
                <span style="color:#FFFDF9;font-weight:700;font-size:14px;letter-spacing:0.5px;">Expense Tracking</span>
              </div>
              <div style="padding:16px 20px;">
                <p style="margin:0;color:#3D3229;font-size:15px;line-height:1.6;">Log costs on the go and split expenses with your travel companions &mdash; no awkward math required.</p>
              </div>
            </div>
          </div>

          <!-- Travel tip card -->
          <div style="border:2px solid #3D3229;border-radius:16px;overflow:hidden;margin:28px 0;">
            <div style="padding:16px 20px 0 20px;">
              <div style="display:inline-block;background:#3D3229;border-radius:8px;padding:5px 12px;">
                <span style="color:#FFFDF9;font-size:14px;font-weight:700;">&#10003; Travel tip</span>
              </div>
            </div>
            <div style="padding:12px 20px 20px;">
              <p style="margin:0;font-size:15px;line-height:1.6;">Share your itinerary link with friends before a trip &mdash; they can RSVP, add suggestions, and follow along without needing an account.</p>
            </div>
          </div>

          <!-- Referral-style CTA card -->
          <div style="background:#FAF3E8;border:2px solid #3D3229;border-radius:16px;padding:24px;text-align:center;margin:28px 0;">
            <div style="font-family:'Playfair Display',Georgia,serif;font-size:20px;font-weight:700;color:#3D3229;margin-bottom:8px;">Spread the wanderlust</div>
            <p style="margin:0 0 16px;font-size:15px;color:#5C4F42;">Know someone planning a trip? Share Tinerary and plan together.</p>
            <a href="${APP_URL}/" class="cta-btn">Explore Tinerary</a>
          </div>
        </div>
      `, 'You received this because you signed up for Tinerary.'),
    })
    await logEmail({ recipientEmail: email, emailType: "whats_new", subject, status: "sent" })
    return { success: true }
  } catch (error: any) {
    console.error("Error sending what's new email:", error)
    await logEmail({ recipientEmail: email, emailType: "whats_new", subject: "Postcards from the team: what's new on Tinerary", status: "failed", errorMessage: error.message })
    return { success: false, error: error.message }
  }
}

/**
 * Send sign-in alert email with "That wasn't me" revoke link
 */
export async function sendSignInAlertEmail(params: {
  email: string
  name?: string
  ipAddress?: string
  userAgent?: string
  deviceInfo?: string
  revokeToken: string
  signInTime: string
}) {
  try {
    const { email, name, ipAddress, userAgent, deviceInfo, revokeToken, signInTime } = params
    const revokeUrl = `${APP_URL}/api/auth/revoke-sessions?token=${revokeToken}`
    const formattedTime = new Date(signInTime).toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    })

    // Parse a friendly device name from the user agent
    let deviceDisplay = deviceInfo || "Unknown device"
    if (!deviceInfo && userAgent) {
      if (userAgent.includes("iPhone")) deviceDisplay = "iPhone"
      else if (userAgent.includes("iPad")) deviceDisplay = "iPad"
      else if (userAgent.includes("Android")) deviceDisplay = "Android device"
      else if (userAgent.includes("Mac")) deviceDisplay = "Mac"
      else if (userAgent.includes("Windows")) deviceDisplay = "Windows PC"
      else if (userAgent.includes("Linux")) deviceDisplay = "Linux computer"
      else deviceDisplay = "Web browser"
    }

    const subject = "New sign-in to your Tinerary account"
    const resend = getResendClient()
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      html: postcardEmail(`
        <div class="masthead" style="background:#3D3229;">
          <div class="stamp">Security Alert</div>
          <h1>New Sign-In Detected</h1>
          <p class="subtitle">Your account was just accessed</p>
        </div>
        <div class="body-content">
          <p>Hi ${name || "there"},</p>
          <p>We noticed a new sign-in to your Tinerary account. Here are the details:</p>

          <div class="info-card" style="background:#FFFDF9; border: 1px solid #D6C9B6; border-left: 3px solid #1A7B7E;">
            <div class="detail-row">
              <span class="detail-label">When:</span> ${formattedTime}
            </div>
            <div class="detail-row">
              <span class="detail-label">Device:</span> ${deviceDisplay}
            </div>
            ${ipAddress ? `<div class="detail-row"><span class="detail-label">IP Address:</span> ${ipAddress}</div>` : ""}
          </div>

          <p>If this was you, no action is needed.</p>

          <div class="info-card info-card-alert">
            <strong>Wasn't you?</strong><br>
            If you didn't sign in, someone else may have access to your account. Click below to immediately sign out all devices and secure your account.
          </div>

          <p style="text-align:center;margin:28px 0;">
            <a href="${revokeUrl}" class="cta-btn" style="background:#C75B3A;">That Wasn't Me &mdash; Sign Out All Devices</a>
          </p>

          <p style="color:#9B8E7E;font-size:13px;">After signing out all devices, we recommend changing your password right away.</p>
        </div>
      `),
    })
    await logEmail({ recipientEmail: email, emailType: "signin_alert", subject, status: "sent" })
    return { success: true }
  } catch (error: any) {
    console.error("Error sending sign-in alert email:", error)
    await logEmail({ recipientEmail: email, emailType: "signin_alert", subject: "New sign-in to your Tinerary account", status: "failed", errorMessage: error.message })
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

    const subject = `Your Tinerary account will be deleted in ${daysRemaining} days`
    const resend = getResendClient()
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      html: postcardEmail(`
        <div class="masthead" style="background:#3D3229;">
          <div class="stamp">Important Notice</div>
          <h1>We'd hate to see you go</h1>
        </div>
        <div class="body-content">
          <p>Hi ${name || username || "there"},</p>

          <div style="text-align:center;margin:24px 0;">
            <div style="display:inline-block;background:#FEF0EC;border:2px solid #C75B3A;border-radius:8px;padding:20px 36px;">
              <div style="font-family:'Playfair Display',Georgia,serif;font-size:42px;font-weight:700;color:#C75B3A;line-height:1;">${daysRemaining} days</div>
              <div style="font-size:13px;color:#9B8E7E;margin-top:6px;">until permanent deletion</div>
            </div>
          </div>

          <p>Your account is scheduled for deletion on <strong>${new Date(deletionDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>.</p>

          <div class="info-card info-card-alert" style="border-radius:0 8px 8px 0;">
            <p style="margin:0 0 10px;"><strong>What will be removed:</strong></p>
            <ul style="margin:0;padding-left:20px;line-height:1.8;">
              <li>All itineraries and trip plans</li>
              <li>Photos and media uploads</li>
              <li>Comments and interactions</li>
              <li>Follower connections</li>
              <li>All account data</li>
            </ul>
          </div>

          <p><strong>Changed your mind?</strong> Just log in and we'll cancel the deletion &mdash; easy as that.</p>

          <hr class="divider">
          <p style="text-align:center;">
            <a href="${reactivateUrl}" class="cta-btn" style="background:#1A7B7E;">Keep My Account</a>
          </p>

          <p style="color:#9B8E7E;font-size:13px;margin-top:24px;">If you intended to delete your account, no action is needed. Your data will be permanently removed on the date above.</p>
        </div>
      `),
    })
    await logEmail({ recipientEmail: email, emailType: "account_deletion_warning", subject, status: "sent" })
    return { success: true }
  } catch (error: any) {
    console.error("Error sending account deletion warning email:", error)
    await logEmail({ recipientEmail: email, emailType: "account_deletion_warning", subject: `Account deletion in ${daysRemaining} days`, status: "failed", errorMessage: error.message })
    return { success: false, error: error.message }
  }
}
