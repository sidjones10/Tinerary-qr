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
    subject: "You're in! Let the adventures begin",
    html: postcardEmail(`
      <div class="masthead">
        <div class="stamp">Welcome Aboard</div>
        <h1>Your journey starts here</h1>
        <p class="subtitle">Pack your bags, ${SAMPLE.name} &mdash; this is going to be good</p>
      </div>
      <div class="body-content">
        <p style="font-size:18px;text-align:center;font-family:'Playfair Display',Georgia,serif;color:#C75B3A;margin-bottom:20px;">Welcome to the crew, ${SAMPLE.name}!</p>
        <p>Tinerary is where trips become stories and every event feels like an adventure. Here's your boarding pass to the good stuff:</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
          <tr><td style="padding:12px 0;">
            <div class="info-card" style="margin:0;">
              <strong style="color:#1A7B7E;font-size:16px;">Plan &amp; Share</strong><br>
              Create stunning itineraries with maps, photos, and schedules &mdash; then share with a single link.
            </div>
          </td></tr>
          <tr><td style="padding:12px 0;">
            <div class="info-card info-card-warm" style="margin:0;">
              <strong style="color:#C75B3A;font-size:16px;">Travel Together</strong><br>
              Follow friends, see what they're planning, and collaborate on trips in real time.
            </div>
          </td></tr>
          <tr><td style="padding:12px 0;">
            <div class="info-card" style="margin:0;">
              <strong style="color:#1A7B7E;font-size:16px;">Stay On Track</strong><br>
              Smart countdown reminders, calendar exports, and expense splitting keep everything on course.
            </div>
          </td></tr>
        </table>
        <hr class="divider">
        <p style="text-align:center;font-family:'Playfair Display',Georgia,serif;font-style:italic;font-size:17px;color:#1A7B7E;margin-bottom:16px;">Your first adventure is just a tap away.</p>
        <p style="text-align:center;">
          <a href="${APP_URL}/" class="cta-btn">Start Exploring</a>
        </p>
      </div>
    `, "Happy travels from the Tinerary crew."),
  },

  eventInvite: {
    subject: `You're invited: ${SAMPLE.eventTitle}`,
    html: postcardEmail(`
      <div class="masthead">
        <div class="stamp">You're Invited</div>
        <h1>${SAMPLE.eventTitle}</h1>
        <p class="subtitle">${SAMPLE.followerName} wants you there!</p>
      </div>
      <div class="body-content">
        <p>Hi ${SAMPLE.name},</p>
        <p>Great news &mdash; <strong>${SAMPLE.followerName}</strong> has saved you a spot and your presence is officially requested!</p>
        <div style="background:#FFFDF9;border:2px dashed #D6C9B6;border-radius:8px;padding:20px 24px;margin:20px 0;text-align:center;">
          <div style="font-family:'Playfair Display',Georgia,serif;font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#9B8E7E;margin-bottom:10px;">Admit One</div>
          <div style="font-family:'Playfair Display',Georgia,serif;font-size:22px;font-weight:700;color:#C75B3A;margin-bottom:14px;">${SAMPLE.eventTitle}</div>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="text-align:center;padding:8px 0;border-top:1px solid #D6C9B6;">
              <span class="detail-label">When:</span> ${SAMPLE.eventDate}
            </td></tr>
            <tr><td style="text-align:center;padding:8px 0;border-top:1px solid #D6C9B6;">
              <span class="detail-label">Where:</span> ${SAMPLE.eventLocation}
            </td></tr>
          </table>
        </div>
        <hr class="divider">
        <p style="text-align:center;">
          <a href="${APP_URL}/event/${SAMPLE.eventId}" class="cta-btn">View Event &amp; RSVP</a>
        </p>
      </div>
    `, "See you there!"),
  },

  eventReminder: {
    subject: `Heads up! ${SAMPLE.eventTitle} is tomorrow`,
    html: postcardEmail(`
      <div class="masthead">
        <div class="stamp">Heads Up</div>
        <h1>${SAMPLE.eventTitle}</h1>
        <p class="subtitle">is coming up tomorrow &mdash; get excited!</p>
      </div>
      <div class="body-content">
        <p>Hi ${SAMPLE.name},</p>
        <p>Friendly nudge &mdash; the fun is almost here!</p>
        <div style="text-align:center;margin:22px 0;">
          <div style="display:inline-block;background:#FAF3E8;border:2px solid #C75B3A;border-radius:8px;padding:16px 32px;">
            <div style="font-family:'Playfair Display',Georgia,serif;font-size:28px;font-weight:700;color:#C75B3A;line-height:1;">tomorrow</div>
            <div style="font-size:12px;color:#9B8E7E;margin-top:4px;text-transform:uppercase;letter-spacing:1px;">and counting</div>
          </div>
        </div>
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
    subject: `${SAMPLE.followerName} just joined your travel crew!`,
    html: postcardEmail(`
      <div class="masthead" style="background: linear-gradient(135deg, #C75B3A 0%, #D4764E 100%);">
        <div class="stamp">New Travel Buddy</div>
        <h1>You've got a new follower!</h1>
      </div>
      <div class="body-content" style="text-align:center;">
        <p style="text-align:left;">Hi ${SAMPLE.name},</p>
        <div style="width:72px;height:72px;border-radius:50%;background:#FAF3E8;border:3px solid #D6C9B6;margin:16px auto;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',Georgia,serif;font-size:28px;color:#C75B3A;font-weight:700;">J</div>
        <h2 style="margin-bottom:4px;">${SAMPLE.followerName}</h2>
        <p style="margin-top:0;color:#9B8E7E;">@${SAMPLE.followerUsername}</p>
        <div style="display:inline-block;background:#E8F5F0;border-radius:20px;padding:8px 24px;margin:8px 0 16px;">
          <span style="color:#1A7B7E;font-weight:600;font-size:14px;">is now following your adventures</span>
        </div>
        <hr class="divider">
        <a href="${APP_URL}/user/${SAMPLE.followerUsername}" class="cta-btn">Say Hello</a>
      </div>
    `),
  },

  newComment: {
    subject: `${SAMPLE.followerName} commented on ${SAMPLE.eventTitle}`,
    html: postcardEmail(`
      <div class="masthead" style="background: linear-gradient(135deg, #1A7B7E 0%, #238E91 100%);">
        <div class="stamp">New Comment</div>
        <h1>${SAMPLE.eventTitle}</h1>
        <p class="subtitle">${SAMPLE.followerName} has something to say!</p>
      </div>
      <div class="body-content">
        <p>Hi ${SAMPLE.name},</p>
        <p><strong>${SAMPLE.followerName}</strong> dropped a comment on your event:</p>
        <div style="background:#F5FAFA;border-radius:12px;padding:20px 24px;margin:20px 0;position:relative;">
          <div style="font-family:'Playfair Display',Georgia,serif;font-size:32px;color:#1A7B7E;line-height:1;margin-bottom:4px;">&ldquo;</div>
          <div style="font-style:italic;font-size:16px;color:#3D3229;line-height:1.6;padding:0 8px;">${SAMPLE.commentText}</div>
          <div style="text-align:right;font-size:14px;color:#9B8E7E;margin-top:8px;">&mdash; ${SAMPLE.followerName}</div>
        </div>
        <hr class="divider">
        <p style="text-align:center;">
          <a href="${APP_URL}/event/${SAMPLE.eventId}" class="cta-btn" style="background:#1A7B7E;">Join the Conversation</a>
        </p>
      </div>
    `),
  },

  passwordReset: {
    subject: "Reset your Tinerary password",
    html: postcardEmail(`
      <div class="masthead" style="background:#3D3229;">
        <div class="stamp">Password Reset</div>
        <h1>No worries, let's fix this</h1>
      </div>
      <div class="body-content">
        <p>We got your request to reset your password. It happens to the best of us! Click below to pick a new one:</p>
        <p style="text-align:center;margin:28px 0;">
          <a href="${APP_URL}/auth/reset-password?token=${SAMPLE.resetToken}" class="cta-btn" style="background:#3D3229;border-radius:28px;">Reset Password</a>
        </p>
        <div class="info-card info-card-alert" style="border-radius:0 8px 8px 0;">
          <strong>This link expires in 1 hour.</strong><br>
          If you didn't request this, you can safely ignore this email &mdash; your password won't change.
        </div>
      </div>
    `),
  },

  countdownReminder: {
    subject: `${SAMPLE.timeRemaining} until ${SAMPLE.eventTitle}!`,
    html: postcardEmail(`
      <div class="masthead" style="background: linear-gradient(135deg, #C75B3A 0%, #D4764E 100%);">
        <div class="stamp">Countdown</div>
        <h1>${SAMPLE.eventTitle}</h1>
        <p class="subtitle">The countdown is on!</p>
      </div>
      <div class="body-content">
        <p>Hi ${SAMPLE.name},</p>
        <div style="text-align:center;margin:28px 0;">
          <div style="display:inline-block;background:#FAF3E8;border:3px solid #C75B3A;border-radius:12px;padding:24px 40px;">
            <div style="font-family:'Playfair Display',Georgia,serif;font-size:48px;font-weight:700;color:#C75B3A;line-height:1;">${SAMPLE.timeRemaining}</div>
            <div style="font-size:12px;color:#9B8E7E;margin-top:8px;text-transform:uppercase;letter-spacing:2px;">until your event</div>
          </div>
        </div>
        <div class="info-card" style="border-radius:8px;border-left:4px solid #1A7B7E;">
          <div class="detail-row"><span class="detail-label">When:</span> ${SAMPLE.eventDate}</div>
          <div class="detail-row"><span class="detail-label">Where:</span> ${SAMPLE.eventLocation}</div>
        </div>
        <p style="text-align:center;font-family:'Playfair Display',Georgia,serif;font-style:italic;color:#1A7B7E;">The adventure is almost here &mdash; make sure you're ready!</p>
        <hr class="divider">
        <p style="text-align:center;">
          <a href="${APP_URL}/event/${SAMPLE.eventId}" class="cta-btn cta-btn-warm">View Event Details</a>
        </p>
      </div>
    `),
  },

  eventStarted: {
    subject: `It's go time! ${SAMPLE.eventTitle} is live`,
    html: postcardEmail(`
      <div class="masthead" style="background: linear-gradient(135deg, #1A7B7E 0%, #238E91 100%);">
        <div class="stamp">It's Go Time</div>
        <h1>${SAMPLE.eventTitle}</h1>
        <p class="subtitle">is officially underway!</p>
      </div>
      <div class="body-content" style="text-align:center;">
        <p style="text-align:left;">Hi ${SAMPLE.name},</p>
        <div style="margin:20px 0;">
          <div style="display:inline-block;background:#E8F5F0;border:3px solid #1A7B7E;border-radius:12px;padding:16px 32px;">
            <div style="font-family:'Playfair Display',Georgia,serif;font-weight:700;font-size:24px;color:#1A7B7E;letter-spacing:1px;text-transform:uppercase;">Happening Now</div>
          </div>
        </div>
        <h2 style="color:#1A7B7E;font-size:24px;">${SAMPLE.eventTitle}</h2>
        <p style="color:#9B8E7E;font-style:italic;">at ${SAMPLE.eventLocation}</p>
        <p style="font-size:16px;">Your event has begun &mdash; soak it all in!</p>
        <hr class="divider">
        <a href="${APP_URL}/event/${SAMPLE.eventId}" class="cta-btn">View Event</a>
      </div>
    `),
  },

  whatsNew: {
    subject: "Fresh off the press: what's new on Tinerary",
    html: postcardEmail(`
      <div class="masthead" style="background: linear-gradient(135deg, #C75B3A 0%, #D4764E 50%, #1A7B7E 100%);">
        <div class="stamp">Fresh Off The Press</div>
        <h1>What's New on Tinerary</h1>
        <p class="subtitle">New goodies for your next adventure</p>
      </div>
      <div class="body-content">
        <p>Hi ${SAMPLE.name},</p>
        <p>We've been cooking up some exciting stuff behind the scenes. Here's what just dropped:</p>
        <div style="margin:24px 0;">
          <div style="background:#FAF3E8;border-radius:12px;padding:20px 24px;margin-bottom:16px;border:1px solid #E8DDD0;">
            <div style="display:inline-block;background:#1A7B7E;color:#FFFDF9;font-size:11px;font-weight:700;padding:3px 10px;border-radius:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">New</div>
            <h3 style="margin-top:8px;">Enhanced Event Planning</h3>
            <p style="margin-bottom:0;color:#5C4F42;">Create beautiful itineraries with interactive maps, photo galleries, and detailed day-by-day schedules.</p>
          </div>
          <div style="background:#FAF3E8;border-radius:12px;padding:20px 24px;margin-bottom:16px;border:1px solid #E8DDD0;">
            <div style="display:inline-block;background:#C75B3A;color:#FFFDF9;font-size:11px;font-weight:700;padding:3px 10px;border-radius:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Upgraded</div>
            <h3 style="margin-top:8px;">Smart Reminders</h3>
            <p style="margin-bottom:0;color:#5C4F42;">Countdown reminders at 5 days, 2 days, 1 day, and 2 hours before departure so you're never caught off guard.</p>
          </div>
          <div style="background:#FAF3E8;border-radius:12px;padding:20px 24px;margin-bottom:16px;border:1px solid #E8DDD0;">
            <div style="display:inline-block;background:#1A7B7E;color:#FFFDF9;font-size:11px;font-weight:700;padding:3px 10px;border-radius:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Social</div>
            <h3 style="margin-top:8px;">Travel Together</h3>
            <p style="margin-bottom:0;color:#5C4F42;">Follow friends, share events, and collaborate on trip planning in real time.</p>
          </div>
          <div style="background:#FAF3E8;border-radius:12px;padding:20px 24px;border:1px solid #E8DDD0;">
            <div style="display:inline-block;background:#C75B3A;color:#FFFDF9;font-size:11px;font-weight:700;padding:3px 10px;border-radius:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Fan Favorite</div>
            <h3 style="margin-top:8px;">Expense Tracking</h3>
            <p style="margin-bottom:0;color:#5C4F42;">Log costs on the go and split expenses with your travel companions &mdash; no awkward math required.</p>
          </div>
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
        <h1>We'd hate to see you go</h1>
      </div>
      <div class="body-content">
        <p>Hi ${SAMPLE.name},</p>
        <div style="text-align:center;margin:24px 0;">
          <div style="display:inline-block;background:#FEF0EC;border:2px solid #C75B3A;border-radius:8px;padding:20px 36px;">
            <div style="font-family:'Playfair Display',Georgia,serif;font-size:42px;font-weight:700;color:#C75B3A;line-height:1;">${SAMPLE.daysRemaining} days</div>
            <div style="font-size:13px;color:#9B8E7E;margin-top:6px;">until permanent deletion</div>
          </div>
        </div>
        <p>Your account is scheduled for deletion on <strong>Monday, March 23, 2026</strong>.</p>
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
          <a href="${APP_URL}/settings/account" class="cta-btn" style="background:#1A7B7E;">Keep My Account</a>
        </p>
        <p style="color:#9B8E7E;font-size:13px;margin-top:24px;">If you intended to delete your account, no action is needed. Your data will be permanently removed on the date above.</p>
      </div>
    `),
  },
}

export async function GET(request: NextRequest) {
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
