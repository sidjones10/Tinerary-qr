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

// ─── Shared email shell ───────────────────────────────────────────────
// Clean modern layout with Nohemi headings and warm cream + orange + black brand palette.
// ─── Email logging ─────────────────────────────────────────────────
// Logs every outbound email to the email_logs table for the admin
// communications dashboard. Uses dynamic import to avoid circular deps.

async function logEmail(params: {
  recipientEmail: string
  emailType: string
  subject: string
  status: "sent" | "failed"
  resendId?: string
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
      resend_id: params.resendId || null,
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
// Warm cream + orange + black palette matching the Tinerary brand logo.
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
        @import url('https://db.onlinewebfonts.com/c/29ddb4605533a38e086b48fa105e0d12?family=Nohemi');
        @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700&display=swap');

        body {
          margin: 0;
          padding: 0;
          background-color: #F8F3EF;
          font-family: 'Nunito Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #2B2B2B;
          -webkit-font-smoothing: antialiased;
        }
        .outer-wrap {
          max-width: 600px;
          margin: 0 auto;
          padding: 0;
        }
        .email-body {
          background: #FCFAF8;
          overflow: hidden;
        }
        /* ── masthead ── */
        .masthead {
          background: #D4792C;
          padding: 32px 36px 28px;
          text-align: center;
        }
        .masthead h1 {
          margin: 0;
          font-family: 'Nohemi', 'Nunito Sans', 'Trebuchet MS', sans-serif;
          font-weight: 700;
          font-size: 30px;
          color: #FCFAF8;
          letter-spacing: 0.5px;
        }
        .masthead .subtitle {
          margin: 8px 0 0;
          font-size: 15px;
          color: rgba(252,250,248,0.85);
          letter-spacing: 0.5px;
        }
        /* ── tag pill (replaces old stamp) ── */
        .stamp {
          display: inline-block;
          background: rgba(252,250,248,0.2);
          border-radius: 20px;
          padding: 5px 16px;
          margin-bottom: 12px;
          font-family: 'Nohemi', 'Nunito Sans', sans-serif;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: rgba(252,250,248,0.9);
        }
        /* ── body content ── */
        .body-content {
          padding: 32px 36px;
          font-size: 15px;
          line-height: 1.7;
          color: #2B2B2B;
        }
        .body-content h2 {
          font-family: 'Nohemi', 'Nunito Sans', 'Trebuchet MS', sans-serif;
          font-weight: 700;
          font-size: 22px;
          color: #D4792C;
          margin: 0 0 12px;
        }
        .body-content h3 {
          font-family: 'Nohemi', 'Nunito Sans', 'Trebuchet MS', sans-serif;
          font-weight: 700;
          font-size: 18px;
          color: #D4792C;
          margin: 0 0 6px;
        }
        .body-content p {
          margin: 0 0 14px;
        }
        .body-content a {
          color: #D4792C;
        }
        /* ── divider ── */
        .divider {
          border: none;
          border-top: 1px solid #E8DDD4;
          margin: 28px 0;
        }
        /* ── CTA button ── */
        .cta-btn {
          display: inline-block;
          background: #D4792C;
          color: #FCFAF8 !important;
          padding: 14px 36px;
          text-decoration: none;
          border-radius: 28px;
          font-family: 'Nohemi', 'Nunito Sans', sans-serif;
          font-weight: 600;
          font-size: 15px;
          letter-spacing: 0.3px;
        }
        .cta-btn-warm {
          background: #D4792C;
        }
        .cta-btn-dark {
          background: #1A1A1A;
        }
        /* ── info card ── */
        .info-card {
          background: #F8F3EF;
          border-left: 4px solid #D4792C;
          padding: 16px 20px;
          border-radius: 0 8px 8px 0;
          margin: 18px 0;
        }
        .info-card-warm {
          border-left-color: #D4792C;
        }
        .info-card-alert {
          background: #FEF0EC;
          border-left-color: #D4792C;
        }
        /* ── detail row ── */
        .detail-row {
          margin: 8px 0;
          font-size: 15px;
        }
        .detail-label {
          font-weight: 600;
          color: #D4792C;
        }
        /* ── footer ── */
        .email-footer {
          border-top: 1px solid #E8DDD4;
          padding: 24px 36px;
          text-align: center;
          font-size: 13px;
          color: #9B8E7E;
        }
        .email-footer .brand {
          font-family: 'Nohemi', 'Nunito Sans', sans-serif;
          font-weight: 700;
          font-size: 20px;
          color: #D4792C;
          margin-bottom: 4px;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
      </style>
    </head>
    <body>
      <div class="outer-wrap">
        <div class="email-body">
          ${body}
          <div class="email-footer">
            <div class="brand">Tinerary</div>
            <p style="margin: 4px 0 0;">The world is waiting for you.</p>
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
    const { data: resendData } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Welcome to Tinerary — the world is waiting for you",
      subject,
      subject: "You're in! Let the adventures begin",
      html: postcardEmail(`
        <!-- Logo header -->
        <div style="background:#F8F3EF;padding:36px 36px 20px;text-align:center;">
          <img src="${APP_URL}/email/tinerary-logo.png" alt="Tinerary" style="width:220px;height:auto;" width="220">
        </div>

        <!-- Hero travel image -->
        <div style="padding:0;">
          <img src="${APP_URL}/email/welcome-hero.jpg" alt="Your next adventure awaits" style="display:block;width:100%;height:auto;" width="600">
        </div>

        <!-- Welcome heading -->
        <div style="padding:40px 36px 0;text-align:center;">
          <h1 style="font-family:'Nohemi','Nunito Sans',sans-serif;font-weight:700;font-size:36px;color:#D4792C;margin:0 0 10px;line-height:1.2;">Welcome to Tinerary</h1>
          <p style="font-family:'Nohemi','Nunito Sans',sans-serif;font-size:14px;color:#D4792C;letter-spacing:3px;text-transform:uppercase;margin:0 0 28px;font-weight:600;">The world is waiting for you</p>
        </div>

        <!-- Body -->
        <div class="body-content" style="padding-top:0;">
          <p style="font-size:16px;line-height:1.7;text-align:center;">Hi ${name}, we're so glad you're here. Tinerary is your home for planning trips, sharing adventures, and making every journey unforgettable.</p>

          <hr class="divider">

          <!-- Feature highlights -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
            <tr>
              <td style="padding:12px 0;vertical-align:top;">
                <h3 style="font-family:'Nohemi','Nunito Sans',sans-serif;font-weight:700;font-size:16px;color:#D4792C;margin:0 0 4px;">Plan &amp; Share</h3>
                <p style="margin:0;font-size:14px;line-height:1.6;color:#2B2B2B;">Create stunning itineraries with maps, photos, and schedules &mdash; then share with a single link.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 0;border-top:1px solid #E8DDD4;vertical-align:top;">
                <h3 style="font-family:'Nohemi','Nunito Sans',sans-serif;font-weight:700;font-size:16px;color:#D4792C;margin:0 0 4px;">Travel Together</h3>
                <p style="margin:0;font-size:14px;line-height:1.6;color:#2B2B2B;">Follow friends, collaborate on trips in real time, and keep everyone on the same page.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 0;border-top:1px solid #E8DDD4;vertical-align:top;">
                <h3 style="font-family:'Nohemi','Nunito Sans',sans-serif;font-weight:700;font-size:16px;color:#D4792C;margin:0 0 4px;">Stay On Track</h3>
                <p style="margin:0;font-size:14px;line-height:1.6;color:#2B2B2B;">Smart countdown reminders, calendar exports, and expense splitting keep everything on course.</p>
              </td>
            </tr>
          </table>

          <div style="text-align:center;padding:8px 0 12px;">
            <a href="${APP_URL}/" class="cta-btn" style="display:inline-block;background:#D4792C;color:#FCFAF8;padding:14px 44px;text-decoration:none;border-radius:28px;font-family:'Nohemi','Nunito Sans',sans-serif;font-weight:600;font-size:16px;">Start Exploring</a>
          </div>
        </div>
      `, 'Happy travels from the Tinerary crew.'),
    })
    await logEmail({ recipientEmail: email, emailType: "welcome", subject, status: "sent", resendId: resendData?.id })
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
    const { data: resendData } = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject,
      subject: `You're invited: ${eventTitle}`,
      html: postcardEmail(`
        <!-- Logo banner -->
        <div style="background:#F8F3EF;padding:28px 36px;text-align:center;">
          <img src="${APP_URL}/email/tinerary-logo.png" alt="Tinerary" style="width:180px;height:auto;" width="180">
        </div>

        <!-- Divider -->
        <div style="border-top:3px solid #2c2420;margin:0;"></div>

        <!-- Hero block -->
        <div style="background:#D4792C;padding:48px 36px;text-align:center;">
          <div style="font-family:'Nohemi','Nunito Sans',sans-serif;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:3px;color:rgba(252,250,248,0.7);margin-bottom:16px;">Guess What</div>
          <h1 style="margin:0;font-family:'Nohemi','Nunito Sans',sans-serif;font-weight:700;font-size:40px;color:#FCFAF8;line-height:1.1;">You're Invited!</h1>
        </div>

        <!-- Event details block -->
        <div style="background:#2c2420;padding:36px;text-align:center;">
          <div style="font-family:'Nohemi','Nunito Sans',sans-serif;font-size:11px;text-transform:uppercase;letter-spacing:3px;color:#D4792C;margin-bottom:16px;">The Event</div>
          <h2 style="margin:0 0 20px;font-family:'Nohemi','Nunito Sans',sans-serif;font-weight:700;font-size:28px;color:#FCFAF8;line-height:1.2;">${eventTitle}</h2>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:50%;padding:12px 8px;text-align:center;border:2px solid rgba(252,250,248,0.15);border-radius:12px 0 0 12px;">
                <div style="font-family:'Nohemi','Nunito Sans',sans-serif;font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#D4792C;margin-bottom:6px;">When</div>
                <div style="font-family:'Nunito Sans',sans-serif;font-size:14px;font-weight:600;color:#FCFAF8;">${eventDate}</div>
              </td>
              <td style="width:50%;padding:12px 8px;text-align:center;border:2px solid rgba(252,250,248,0.15);border-left:none;border-radius:0 12px 12px 0;">
                <div style="font-family:'Nohemi','Nunito Sans',sans-serif;font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#D4792C;margin-bottom:6px;">Where</div>
                <div style="font-family:'Nunito Sans',sans-serif;font-size:14px;font-weight:600;color:#FCFAF8;">${eventLocation}</div>
              </td>
            </tr>
          </table>
        </div>

        <!-- Divider -->
        <div style="border-top:3px solid #2c2420;margin:0;"></div>

        <!-- Invited by block -->
        <div style="background:#F8F3EF;padding:32px 36px;text-align:center;">
          <div style="font-family:'Nunito Sans',sans-serif;font-size:15px;color:#5C4F42;margin-bottom:4px;">Invited by</div>
          <div style="font-family:'Nohemi','Nunito Sans',sans-serif;font-weight:700;font-size:22px;color:#2c2420;">${inviterName}</div>
        </div>

        <!-- Divider -->
        <div style="border-top:3px solid #2c2420;margin:0;"></div>

        <!-- CTA block -->
        <div style="background:#D4792C;padding:40px 36px;text-align:center;">
          <p style="margin:0 0 24px;font-family:'Nunito Sans',sans-serif;font-size:17px;font-weight:600;color:#FCFAF8;line-height:1.5;">Click the link to be part of the itinerary</p>
          <a href="${eventUrl}" style="display:inline-block;background:#FCFAF8;color:#D4792C;padding:16px 48px;text-decoration:none;border-radius:28px;font-family:'Nohemi','Nunito Sans',sans-serif;font-weight:700;font-size:16px;letter-spacing:0.5px;">View Event &amp; RSVP</a>
        </div>

        <!-- Divider -->
        <div style="border-top:3px solid #2c2420;margin:0;"></div>
      `, 'See you there!'),
    })
    await logEmail({ recipientEmail, emailType: "event_invite", subject, status: "sent", resendId: resendData?.id, metadata: { eventId } })
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
    const { data: resendData } = await resend.emails.send({
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
            <div style="display:inline-block;background:#F8F3EF;border:2px solid #D4792C;border-radius:8px;padding:16px 32px;">
              <div style="font-family:'Nohemi','Nunito Sans',sans-serif;font-size:28px;font-weight:700;color:#D4792C;line-height:1;">${timeText}</div>
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
    await logEmail({ recipientEmail, emailType: "event_reminder", subject, status: "sent", resendId: resendData?.id, metadata: { eventId } })
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
      ? `<img src="${followerAvatarUrl}" alt="${followerName}" style="width:72px;height:72px;border-radius:50%;border:3px solid #E8DDD4;margin:16px auto;display:block;">`
      : `<div style="width:72px;height:72px;border-radius:50%;background:#F8F3EF;border:3px solid #E8DDD4;margin:16px auto;display:flex;align-items:center;justify-content:center;font-family:'Nohemi','Nunito Sans',sans-serif;font-size:28px;color:#D4792C;font-weight:700;">${(followerName || '?')[0].toUpperCase()}</div>`

    const subject = `${followerName} is now following your travels`
    const resend = getResendClient()
    const { data: resendData } = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject,
      subject: `${followerName} just joined your travel crew!`,
      html: postcardEmail(`
        <div class="masthead" style="background: linear-gradient(135deg, #D4792C 0%, #E09A5C 100%);">
          <div class="stamp">New Travel Buddy</div>
          <h1>You've got a new follower!</h1>
        </div>
        <div class="body-content" style="text-align:center;">
          <p style="text-align:left;">Hi ${recipientName},</p>

          ${avatarHtml}
          <h2 style="margin-bottom:4px;">${followerName}</h2>
          <p style="margin-top:0;color:#9B8E7E;">@${followerUsername}</p>

          <div style="display:inline-block;background:#FEF0E6;border-radius:20px;padding:8px 24px;margin:8px 0 16px;">
            <span style="color:#D4792C;font-weight:600;font-size:14px;">is now following your adventures</span>
          </div>

          <hr class="divider">
          <a href="${profileUrl}" class="cta-btn">Say Hello</a>
        </div>
      `),
    })
    await logEmail({ recipientEmail, emailType: "new_follower", subject, status: "sent", resendId: resendData?.id })
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
    const { data: resendData } = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject,
      subject: `${commenterName} commented on ${eventTitle}`,
      html: postcardEmail(`
        <div class="masthead" style="background: linear-gradient(135deg, #D4792C 0%, #E09A5C 100%);">
          <div class="stamp">New Comment</div>
          <h1>${eventTitle}</h1>
          <p class="subtitle">${commenterName} has something to say!</p>
        </div>
        <div class="body-content">
          <p>Hi ${recipientName},</p>
          <p><strong>${commenterName}</strong> dropped a comment on your event:</p>

          <div style="background:#FEF6EE;border-radius:12px;padding:20px 24px;margin:20px 0;position:relative;">
            <div style="font-family:'Nohemi','Nunito Sans',sans-serif;font-size:32px;color:#D4792C;line-height:1;margin-bottom:4px;">&ldquo;</div>
            <div style="font-style:italic;font-size:16px;color:#1A1A1A;line-height:1.6;padding:0 8px;">${commentText}</div>
            <div style="text-align:right;font-size:14px;color:#9B8E7E;margin-top:8px;">&mdash; ${commenterName}</div>
          </div>

          <hr class="divider">
          <p style="text-align:center;">
            <a href="${eventUrl}" class="cta-btn" style="background:#D4792C;">Join the Conversation</a>
          </p>
        </div>
      `),
    })
    await logEmail({ recipientEmail, emailType: "new_comment", subject, status: "sent", resendId: resendData?.id, metadata: { eventId } })
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
    const { data: resendData } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      html: postcardEmail(`
        <div class="masthead" style="background:#1A1A1A;">
          <div class="stamp">Password Reset</div>
          <h1>No worries, let's fix this</h1>
        </div>
        <div class="body-content">
          <p>We got your request to reset your password. It happens to the best of us! Click below to pick a new one:</p>

          <p style="text-align:center;margin:28px 0;">
            <a href="${resetUrl}" class="cta-btn" style="background:#1A1A1A;border-radius:28px;">Reset Password</a>
          </p>

          <div class="info-card info-card-alert" style="border-radius:0 8px 8px 0;">
            <strong>This link expires in 1 hour.</strong><br>
            If you didn't request this, you can safely ignore this email &mdash; your password won't change.
          </div>
        </div>
      `),
    })
    await logEmail({ recipientEmail: email, emailType: "password_reset", subject, status: "sent", resendId: resendData?.id })
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
    const { data: resendData } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      html: postcardEmail(`
        <div class="masthead" style="background: linear-gradient(135deg, #D4792C 0%, #E09A5C 100%);">
          <div class="stamp">Countdown</div>
          <h1>${itineraryTitle}</h1>
          <p class="subtitle">The countdown is on!</p>
        </div>
        <div class="body-content">
          <p>Hi ${name || "there"},</p>

          <div style="text-align:center;margin:28px 0;">
            <div style="display:inline-block;background:#F8F3EF;border:3px solid #D4792C;border-radius:12px;padding:24px 40px;">
              <div style="font-family:'Nohemi','Nunito Sans',sans-serif;font-size:48px;font-weight:700;color:#D4792C;line-height:1;">${timeRemaining}</div>
              <div style="font-size:12px;color:#9B8E7E;margin-top:8px;text-transform:uppercase;letter-spacing:2px;">until your ${typeLabel}</div>
            </div>
          </div>

          <div class="info-card" style="border-radius:8px;border-left:4px solid #D4792C;">
            <div class="detail-row">
              <span class="detail-label">When:</span> ${new Date(eventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            ${location ? `<div class="detail-row"><span class="detail-label">Where:</span> ${location}</div>` : ''}
          </div>

          <p style="text-align:center;font-family:'Nohemi','Nunito Sans',sans-serif;font-style:italic;color:#D4792C;">The adventure is almost here &mdash; make sure you're ready!</p>

          <hr class="divider">
          <p style="text-align:center;">
            <a href="${eventUrl}" class="cta-btn cta-btn-warm">View ${eventType === "trip" ? "Trip" : "Event"} Details</a>
          </p>
        </div>
      `),
    })
    await logEmail({ recipientEmail: email, emailType: "countdown_reminder", subject, status: "sent", resendId: resendData?.id, metadata: { itineraryId } })
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
    const { data: resendData } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      subject: `It's go time! ${itineraryTitle} is live`,
      html: postcardEmail(`
        <div class="masthead" style="background: linear-gradient(135deg, #D4792C 0%, #E09A5C 100%);">
          <div class="stamp">It's Go Time</div>
          <h1>${itineraryTitle}</h1>
          <p class="subtitle">is officially underway!</p>
        </div>
        <div class="body-content" style="text-align:center;">
          <p style="text-align:left;">Hi ${name || "there"},</p>

          <div style="margin:20px 0;">
            <div style="display:inline-block;background:#FEF0E6;border:3px solid #D4792C;border-radius:12px;padding:16px 32px;">
              <div style="font-family:'Nohemi','Nunito Sans',sans-serif;font-weight:700;font-size:24px;color:#D4792C;letter-spacing:1px;text-transform:uppercase;">Happening Now</div>
            </div>
          </div>

          <h2 style="color:#D4792C;font-size:24px;">${itineraryTitle}</h2>
          ${location ? `<p style="color:#9B8E7E;font-style:italic;">at ${location}</p>` : ''}

          <p style="font-size:16px;">Your ${eventType} has begun &mdash; soak it all in!</p>

          <hr class="divider">
          <a href="${eventUrl}" class="cta-btn">View ${eventType === "trip" ? "Trip" : "Event"}</a>
        </div>
      `),
    })
    await logEmail({ recipientEmail: email, emailType: "event_started", subject, status: "sent", resendId: resendData?.id, metadata: { itineraryId } })
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
    const { data: resendData } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      subject: "Fresh off the press: what's new on Tinerary",
      html: postcardEmail(`
        <div class="masthead" style="background:#1A1A1A;">
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
                <div style="border:2px solid #1A1A1A;border-radius:16px;padding:24px;text-align:center;">
                  <div style="font-family:'Nohemi','Nunito Sans',sans-serif;font-size:32px;font-weight:700;color:#D4792C;line-height:1;">4</div>
                  <div style="font-size:15px;font-weight:700;color:#1A1A1A;margin:12px 0 8px;">New features this month</div>
                  <div style="display:inline-block;background:#1A1A1A;border-radius:8px;padding:4px 10px;">
                    <span style="color:#FCFAF8;font-size:12px;font-weight:700;">Just shipped</span>
                  </div>
                </div>
              </td>
              <td style="width:50%;padding-left:8px;vertical-align:top;">
                <div style="border:2px solid #1A1A1A;border-radius:16px;padding:24px;text-align:center;">
                  <div style="font-family:'Nohemi','Nunito Sans',sans-serif;font-size:32px;font-weight:700;color:#D4792C;line-height:1;">3x</div>
                  <div style="font-size:15px;font-weight:700;color:#1A1A1A;margin:12px 0 8px;">Faster trip planning</div>
                  <div style="display:inline-block;background:#1A1A1A;border-radius:8px;padding:4px 10px;">
                    <span style="color:#FCFAF8;font-size:12px;font-weight:700;">&#8593; Improved</span>
                  </div>
                </div>
              </td>
            </tr>
          </table>

          <!-- Feature cards with dark header bar -->
          <div style="margin:28px 0;">
            <div style="border:2px solid #1A1A1A;border-radius:16px;overflow:hidden;margin-bottom:16px;">
              <div style="background:#D4792C;padding:12px 20px;">
                <span style="color:#FCFAF8;font-weight:700;font-size:14px;letter-spacing:0.5px;">Enhanced Event Planning</span>
              </div>
              <div style="padding:16px 20px;">
                <p style="margin:0;color:#1A1A1A;font-size:15px;line-height:1.6;">Create beautiful itineraries with interactive maps, photo galleries, and detailed day-by-day schedules.</p>
              </div>
            </div>

            <div style="border:2px solid #1A1A1A;border-radius:16px;overflow:hidden;margin-bottom:16px;">
              <div style="background:#D4792C;padding:12px 20px;">
                <span style="color:#FCFAF8;font-weight:700;font-size:14px;letter-spacing:0.5px;">Smart Reminders</span>
              </div>
              <div style="padding:16px 20px;">
                <p style="margin:0;color:#1A1A1A;font-size:15px;line-height:1.6;">Countdown reminders at 5 days, 2 days, 1 day, and 2 hours before departure so you're never caught off guard.</p>
              </div>
            </div>

            <div style="border:2px solid #1A1A1A;border-radius:16px;overflow:hidden;margin-bottom:16px;">
              <div style="background:#D4792C;padding:12px 20px;">
                <span style="color:#FCFAF8;font-weight:700;font-size:14px;letter-spacing:0.5px;">Travel Together</span>
              </div>
              <div style="padding:16px 20px;">
                <p style="margin:0;color:#1A1A1A;font-size:15px;line-height:1.6;">Follow friends, share events, and collaborate on trip planning in real time.</p>
              </div>
            </div>

            <div style="border:2px solid #1A1A1A;border-radius:16px;overflow:hidden;">
              <div style="background:#D4792C;padding:12px 20px;">
                <span style="color:#FCFAF8;font-weight:700;font-size:14px;letter-spacing:0.5px;">Expense Tracking</span>
              </div>
              <div style="padding:16px 20px;">
                <p style="margin:0;color:#1A1A1A;font-size:15px;line-height:1.6;">Log costs on the go and split expenses with your travel companions &mdash; no awkward math required.</p>
              </div>
            </div>
          </div>

          <!-- Travel tip card -->
          <div style="border:2px solid #1A1A1A;border-radius:16px;overflow:hidden;margin:28px 0;">
            <div style="padding:16px 20px 0 20px;">
              <div style="display:inline-block;background:#1A1A1A;border-radius:8px;padding:5px 12px;">
                <span style="color:#FCFAF8;font-size:14px;font-weight:700;">&#10003; Travel tip</span>
              </div>
            </div>
            <div style="padding:12px 20px 20px;">
              <p style="margin:0;font-size:15px;line-height:1.6;">Share your itinerary link with friends before a trip &mdash; they can RSVP, add suggestions, and follow along without needing an account.</p>
            </div>
          </div>

          <!-- Referral-style CTA card -->
          <div style="background:#F8F3EF;border:2px solid #1A1A1A;border-radius:16px;padding:24px;text-align:center;margin:28px 0;">
            <div style="font-family:'Nohemi','Nunito Sans',sans-serif;font-size:20px;font-weight:700;color:#1A1A1A;margin-bottom:8px;">Spread the wanderlust</div>
            <p style="margin:0 0 16px;font-size:15px;color:#5C4F42;">Know someone planning a trip? Share Tinerary and plan together.</p>
            <a href="${APP_URL}/" class="cta-btn">Explore Tinerary</a>
          </div>
        </div>
      `, 'You received this because you signed up for Tinerary.'),
    })
    await logEmail({ recipientEmail: email, emailType: "whats_new", subject, status: "sent", resendId: resendData?.id })
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
    const { data: resendData } = await resend.emails.send({
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
    await logEmail({ recipientEmail: email, emailType: "signin_alert", subject, status: "sent", resendId: resendData?.id })
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
    const { data: resendData } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      html: postcardEmail(`
        <div class="masthead" style="background:#1A1A1A;">
          <div class="stamp">Important Notice</div>
          <h1>We'd hate to see you go</h1>
        </div>
        <div class="body-content">
          <p>Hi ${name || username || "there"},</p>

          <div style="text-align:center;margin:24px 0;">
            <div style="display:inline-block;background:#FEF0EC;border:2px solid #D4792C;border-radius:8px;padding:20px 36px;">
              <div style="font-family:'Nohemi','Nunito Sans',sans-serif;font-size:42px;font-weight:700;color:#D4792C;line-height:1;">${daysRemaining} days</div>
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
            <a href="${reactivateUrl}" class="cta-btn" style="background:#D4792C;">Keep My Account</a>
          </p>

          <p style="color:#9B8E7E;font-size:13px;margin-top:24px;">If you intended to delete your account, no action is needed. Your data will be permanently removed on the date above.</p>
        </div>
      `),
    })
    await logEmail({ recipientEmail: email, emailType: "account_deletion_warning", subject, status: "sent", resendId: resendData?.id })
    return { success: true }
  } catch (error: any) {
    console.error("Error sending account deletion warning email:", error)
    await logEmail({ recipientEmail: email, emailType: "account_deletion_warning", subject: `Account deletion in ${daysRemaining} days`, status: "failed", errorMessage: error.message })
    return { success: false, error: error.message }
  }
}
