import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = "Tinerary <onboarding@resend.dev>" // Change to your verified domain
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(email: string, name: string) {
  try {
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
              <a href="${APP_URL}/discover" class="button">Start Exploring</a>
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
