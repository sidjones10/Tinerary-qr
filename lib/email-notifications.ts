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
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://tinerary-app.com"

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(email: string, name: string) {
  try {
    const resend = getResendClient()
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Welcome to Tinerary! 🎉",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #F97316 0%, #EC4899 100%); padding: 40px 20px; text-align: center; border-radius: 12px; }
            .header h1 { color: white; margin: 0; font-size: 32px; }
            .content { padding: 30px 20px; background: #f9fafb; border-radius: 12px; margin-top: 20px; }
            .button { display: inline-block; background: #F97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
            .footer { text-align: center; color: #6b7280; margin-top: 30px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Tinerary!</h1>
            </div>
            <div class="content">
              <h2>Hi ${name}! 👋</h2>
              <p>Thanks for joining Tinerary - your new home for planning amazing trips and events!</p>
              <p><strong>Here's what you can do:</strong></p>
              <ul>
                <li>🗓️ Create and share events & trips</li>
                <li>📸 Upload photos to your adventures</li>
                <li>🗺️ Add interactive maps to your events</li>
                <li>👥 Follow friends and see what they're planning</li>
                <li>📅 Export events to your calendar</li>
                <li>💰 Track expenses and split costs</li>
              </ul>
              <a href="${APP_URL}/" class="button">Start Exploring</a>
            </div>
            <div class="footer">
              <p>Happy travels! ✈️<br>The Tinerary Team</p>
            </div>
          </div>
        </body>
        </html>
      `,
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
      subject: `You're invited: ${eventTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); padding: 40px 20px; text-align: center; border-radius: 12px; color: white; }
            .content { padding: 30px 20px; background: #f9fafb; border-radius: 12px; margin-top: 20px; }
            .event-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; margin: 10px 0; }
            .detail-label { font-weight: 600; width: 100px; }
            .button { display: inline-block; background: #8B5CF6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
            .footer { text-align: center; color: #6b7280; margin-top: 30px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 You're Invited!</h1>
            </div>
            <div class="content">
              <p>Hi ${recipientName}!</p>
              <p><strong>${inviterName}</strong> has invited you to:</p>

              <div class="event-details">
                <h2>${eventTitle}</h2>
                <div class="detail-row">
                  <span class="detail-label">📅 When:</span>
                  <span>${eventDate}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">📍 Where:</span>
                  <span>${eventLocation}</span>
                </div>
              </div>

              <p>Click below to view full details and RSVP:</p>
              <a href="${eventUrl}" class="button">View Event</a>
            </div>
            <div class="footer">
              <p>See you there! 🎊</p>
            </div>
          </div>
        </body>
        </html>
      `,
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
      subject: `Reminder: ${eventTitle} is ${timeText}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #F97316 0%, #F59E0B 100%); padding: 40px 20px; text-align: center; border-radius: 12px; color: white; }
            .content { padding: 30px 20px; background: #f9fafb; border-radius: 12px; margin-top: 20px; }
            .reminder-box { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .button { display: inline-block; background: #F97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Event Reminder</h1>
            </div>
            <div class="content">
              <p>Hi ${recipientName}!</p>

              <div class="reminder-box">
                <strong>${eventTitle}</strong> is coming up ${timeText}!
              </div>

              <p><strong>📅 When:</strong> ${eventDate}</p>
              <p><strong>📍 Where:</strong> ${eventLocation}</p>

              <a href="${eventUrl}" class="button">View Event Details</a>
            </div>
          </div>
        </body>
        </html>
      `,
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

    const resend = getResendClient()
    await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: `${followerName} started following you on Tinerary`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%); padding: 40px 20px; text-align: center; border-radius: 12px; color: white; }
            .content { padding: 30px 20px; background: #f9fafb; border-radius: 12px; margin-top: 20px; text-align: center; }
            .avatar { width: 80px; height: 80px; border-radius: 50%; margin: 20px auto; }
            .button { display: inline-block; background: #EC4899; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>👥 New Follower!</h1>
            </div>
            <div class="content">
              <p>Hi ${recipientName}!</p>
              ${
                followerAvatarUrl
                  ? `<img src="${followerAvatarUrl}" alt="${followerName}" class="avatar">`
                  : '<div style="width: 80px; height: 80px; border-radius: 50%; background: #E5E7EB; margin: 20px auto; display: flex; align-items: center; justify-content: center; font-size: 32px;">👤</div>'
              }
              <h2>${followerName} (@${followerUsername})</h2>
              <p>started following you on Tinerary!</p>
              <a href="${profileUrl}" class="button">View Profile</a>
            </div>
          </div>
        </body>
        </html>
      `,
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
      subject: `${commenterName} commented on ${eventTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); padding: 40px 20px; text-align: center; border-radius: 12px; color: white; }
            .content { padding: 30px 20px; background: #f9fafb; border-radius: 12px; margin-top: 20px; }
            .comment-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3B82F6; }
            .button { display: inline-block; background: #3B82F6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💬 New Comment</h1>
            </div>
            <div class="content">
              <p>Hi ${recipientName}!</p>
              <p><strong>${commenterName}</strong> commented on <strong>${eventTitle}</strong>:</p>

              <div class="comment-box">
                "${commentText}"
              </div>

              <a href="${eventUrl}" class="button">View Event</a>
            </div>
          </div>
        </body>
        </html>
      `,
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
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1F2937; padding: 40px 20px; text-align: center; border-radius: 12px; color: white; }
            .content { padding: 30px 20px; background: #f9fafb; border-radius: 12px; margin-top: 20px; }
            .warning-box { background: #FEE2E2; border: 1px solid #DC2626; padding: 15px; margin: 20px 0; border-radius: 4px; color: #991B1B; }
            .button { display: inline-block; background: #1F2937; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset</h1>
            </div>
            <div class="content">
              <p>We received a request to reset your Tinerary password.</p>
              <p>Click the button below to set a new password:</p>

              <a href="${resetUrl}" class="button">Reset Password</a>

              <div class="warning-box">
                <strong>⚠️ This link expires in 1 hour.</strong><br>
                If you didn't request this, please ignore this email.
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
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
    const emoji = eventType === "trip" ? "✈️" : "🎉"

    const resend = getResendClient()
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `${emoji} ${timeRemaining} until ${itineraryTitle}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #F97316 0%, #EC4899 100%); padding: 40px 20px; text-align: center; border-radius: 12px; color: white; }
            .content { padding: 30px 20px; background: #f9fafb; border-radius: 12px; margin-top: 20px; }
            .countdown-box { background: white; padding: 25px; border-radius: 12px; text-align: center; margin: 20px 0; border: 2px solid #F97316; }
            .countdown-number { font-size: 48px; font-weight: bold; color: #F97316; }
            .event-details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .button { display: inline-block; background: #F97316; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; margin-top: 20px; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${emoji} Get Ready!</h1>
            </div>
            <div class="content">
              <p>Hi ${name || "there"}!</p>

              <div class="countdown-box">
                <div class="countdown-number">${timeRemaining}</div>
                <p style="margin: 0; color: #6b7280;">until your ${eventType} begins!</p>
              </div>

              <h2 style="margin-bottom: 10px;">${itineraryTitle}</h2>

              <div class="event-details">
                <p style="margin: 5px 0;"><strong>📅 When:</strong> ${new Date(eventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                ${location ? `<p style="margin: 5px 0;"><strong>📍 Where:</strong> ${location}</p>` : ''}
              </div>

              <p>Make sure you're all set and ready to go!</p>

              <center>
                <a href="${eventUrl}" class="button">View ${eventType === "trip" ? "Trip" : "Event"} Details</a>
              </center>
            </div>
          </div>
        </body>
        </html>
      `,
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
    const emoji = eventType === "trip" ? "✈️" : "🎉"

    const resend = getResendClient()
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `${emoji} ${itineraryTitle} is happening NOW!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10B981 0%, #3B82F6 100%); padding: 40px 20px; text-align: center; border-radius: 12px; color: white; }
            .content { padding: 30px 20px; background: #f9fafb; border-radius: 12px; margin-top: 20px; text-align: center; }
            .started-badge { display: inline-block; background: #10B981; color: white; padding: 8px 20px; border-radius: 20px; font-weight: 600; margin: 15px 0; }
            .button { display: inline-block; background: #3B82F6; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; margin-top: 20px; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${emoji} It's Time!</h1>
            </div>
            <div class="content">
              <p>Hi ${name || "there"}!</p>

              <div class="started-badge">🟢 HAPPENING NOW</div>

              <h2>${itineraryTitle}</h2>
              ${location ? `<p style="color: #6b7280;">📍 ${location}</p>` : ''}

              <p>Your ${eventType} has started! Have an amazing time! 🎊</p>

              <a href="${eventUrl}" class="button">View ${eventType === "trip" ? "Trip" : "Event"}</a>
            </div>
          </div>
        </body>
        </html>
      `,
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
      subject: "See what's new on Tinerary!",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #F97316 0%, #EC4899 100%); padding: 40px 20px; text-align: center; border-radius: 12px; color: white; }
            .content { padding: 30px 20px; background: #f9fafb; border-radius: 12px; margin-top: 20px; }
            .feature-box { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #F97316; }
            .button { display: inline-block; background: #F97316; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; margin-top: 20px; font-weight: 600; }
            .footer { text-align: center; color: #6b7280; margin-top: 30px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>What's New on Tinerary</h1>
            </div>
            <div class="content">
              <p>Hi ${name || "there"}!</p>

              <p>We've been busy making Tinerary even better for you. Here's what's new:</p>

              <div class="feature-box">
                <h3 style="margin-top: 0;">Enhanced Event Planning</h3>
                <p style="margin-bottom: 0;">Create beautiful itineraries with interactive maps, photo galleries, and detailed schedules.</p>
              </div>

              <div class="feature-box">
                <h3 style="margin-top: 0;">Smart Reminders</h3>
                <p style="margin-bottom: 0;">Never miss an event with countdown reminders at 5 days, 2 days, 1 day, and 2 hours before your events.</p>
              </div>

              <div class="feature-box">
                <h3 style="margin-top: 0;">Social Features</h3>
                <p style="margin-bottom: 0;">Follow friends, share events, and collaborate on trip planning together.</p>
              </div>

              <div class="feature-box">
                <h3 style="margin-top: 0;">Expense Tracking</h3>
                <p style="margin-bottom: 0;">Keep track of costs and split expenses with your travel companions.</p>
              </div>

              <p>Come check out what's waiting for you!</p>

              <center>
                <a href="${APP_URL}/" class="button">Explore Tinerary</a>
              </center>
            </div>
            <div class="footer">
              <p>Happy planning!<br>The Tinerary Team</p>
              <p style="font-size: 12px; color: #9ca3af;">You received this email because you signed up for Tinerary.</p>
            </div>
          </div>
        </body>
        </html>
      `,
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
      subject: `⚠️ Your Tinerary account will be deleted in ${daysRemaining} days`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #DC2626; padding: 40px 20px; text-align: center; border-radius: 12px; color: white; }
            .content { padding: 30px 20px; background: #f9fafb; border-radius: 12px; margin-top: 20px; }
            .warning-box { background: #FEE2E2; border: 2px solid #DC2626; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .countdown { font-size: 36px; font-weight: bold; color: #DC2626; }
            .button { display: inline-block; background: #10B981; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; margin-top: 20px; font-weight: 600; }
            .data-list { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Account Deletion Warning</h1>
            </div>
            <div class="content">
              <p>Hi ${name || username || "there"},</p>

              <div class="warning-box">
                <div class="countdown">${daysRemaining} days</div>
                <p style="margin: 5px 0 0 0;">until your account is permanently deleted</p>
              </div>

              <p>Your Tinerary account is scheduled for deletion on <strong>${new Date(deletionDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>.</p>

              <div class="data-list">
                <p style="margin: 0 0 10px 0;"><strong>What will be deleted:</strong></p>
                <ul style="margin: 0; padding-left: 20px;">
                  <li>All your itineraries and trips</li>
                  <li>Photos and media uploads</li>
                  <li>Comments and interactions</li>
                  <li>Follower connections</li>
                  <li>All account data</li>
                </ul>
              </div>

              <p><strong>Want to keep your account?</strong> Simply log in to cancel the deletion request.</p>

              <center>
                <a href="${reactivateUrl}" class="button">Keep My Account</a>
              </center>

              <p style="color: #6b7280; font-size: 14px; margin-top: 25px;">If you requested this deletion, no action is needed. Your account will be permanently removed on the scheduled date.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    })
    return { success: true }
  } catch (error: any) {
    console.error("Error sending account deletion warning email:", error)
    return { success: false, error: error.message }
  }
}
