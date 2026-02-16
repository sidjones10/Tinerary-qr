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
    subject: "Welcome to Tinerary — the world is waiting for you",
    html: postcardEmail(`
      <!-- Logo header -->
      <div style="background:#F8F3EF;padding:36px 36px 20px;text-align:center;">
        <img src="${APP_URL}/email/tinerary-logo.png" alt="Tinerary" style="width:220px;height:auto;" width="220">
      </div>

      <!-- Welcome heading -->
      <div style="padding:40px 36px 0;text-align:center;">
        <h1 style="font-family:'Nohemi','Nunito Sans',sans-serif;font-weight:700;font-size:36px;color:#D4792C;margin:0 0 10px;line-height:1.2;">Welcome to Tinerary</h1>
        <p style="font-family:'Nohemi','Nunito Sans',sans-serif;font-size:14px;color:#D4792C;letter-spacing:3px;text-transform:uppercase;margin:0 0 28px;font-weight:600;">The world is waiting for you</p>
      </div>

      <!-- Body -->
      <div class="body-content" style="padding-top:0;">
        <p style="font-size:16px;line-height:1.7;text-align:center;">Hi ${SAMPLE.name}, we're so glad you're here. Tinerary is your home for planning trips, sharing adventures, and making every journey unforgettable.</p>

        <!-- Hero travel image -->
        <div style="text-align:center;margin:24px 0;">
          <img src="${APP_URL}/email/welcome-hero.jpg" alt="Your next adventure awaits" style="display:inline-block;width:80%;max-width:480px;height:auto;border-radius:12px;" width="480">
        </div>

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
        <div style="background:#FCFAF8;border:2px solid #E8DDD4;border-radius:8px;padding:20px 24px;margin:20px 0;text-align:center;">
          <div style="font-family:'Nohemi','Nunito Sans',sans-serif;font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#9B8E7E;margin-bottom:10px;">Admit One</div>
          <div style="font-family:'Nohemi','Nunito Sans',sans-serif;font-size:22px;font-weight:700;color:#D4792C;margin-bottom:14px;">${SAMPLE.eventTitle}</div>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="text-align:center;padding:8px 0;border-top:1px solid #E8DDD4;">
              <span class="detail-label">When:</span> ${SAMPLE.eventDate}
            </td></tr>
            <tr><td style="text-align:center;padding:8px 0;border-top:1px solid #E8DDD4;">
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
          <div style="display:inline-block;background:#F8F3EF;border:2px solid #D4792C;border-radius:8px;padding:16px 32px;">
            <div style="font-family:'Nohemi','Nunito Sans',sans-serif;font-size:28px;font-weight:700;color:#D4792C;line-height:1;">tomorrow</div>
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
      <div class="masthead" style="background: linear-gradient(135deg, #D4792C 0%, #E09A5C 100%);">
        <div class="stamp">New Travel Buddy</div>
        <h1>You've got a new follower!</h1>
      </div>
      <div class="body-content" style="text-align:center;">
        <p style="text-align:left;">Hi ${SAMPLE.name},</p>
        <div style="width:72px;height:72px;border-radius:50%;background:#F8F3EF;border:3px solid #E8DDD4;margin:16px auto;display:flex;align-items:center;justify-content:center;font-family:'Nohemi','Nunito Sans',sans-serif;font-size:28px;color:#D4792C;font-weight:700;">J</div>
        <h2 style="margin-bottom:4px;">${SAMPLE.followerName}</h2>
        <p style="margin-top:0;color:#9B8E7E;">@${SAMPLE.followerUsername}</p>
        <div style="display:inline-block;background:#FEF0E6;border-radius:20px;padding:8px 24px;margin:8px 0 16px;">
          <span style="color:#D4792C;font-weight:600;font-size:14px;">is now following your adventures</span>
        </div>
        <hr class="divider">
        <a href="${APP_URL}/user/${SAMPLE.followerUsername}" class="cta-btn">Say Hello</a>
      </div>
    `),
  },

  newComment: {
    subject: `${SAMPLE.followerName} commented on ${SAMPLE.eventTitle}`,
    html: postcardEmail(`
      <div class="masthead" style="background: linear-gradient(135deg, #D4792C 0%, #E09A5C 100%);">
        <div class="stamp">New Comment</div>
        <h1>${SAMPLE.eventTitle}</h1>
        <p class="subtitle">${SAMPLE.followerName} has something to say!</p>
      </div>
      <div class="body-content">
        <p>Hi ${SAMPLE.name},</p>
        <p><strong>${SAMPLE.followerName}</strong> dropped a comment on your event:</p>
        <div style="background:#FEF6EE;border-radius:12px;padding:20px 24px;margin:20px 0;position:relative;">
          <div style="font-family:'Nohemi','Nunito Sans',sans-serif;font-size:32px;color:#D4792C;line-height:1;margin-bottom:4px;">&ldquo;</div>
          <div style="font-style:italic;font-size:16px;color:#1A1A1A;line-height:1.6;padding:0 8px;">${SAMPLE.commentText}</div>
          <div style="text-align:right;font-size:14px;color:#9B8E7E;margin-top:8px;">&mdash; ${SAMPLE.followerName}</div>
        </div>
        <hr class="divider">
        <p style="text-align:center;">
          <a href="${APP_URL}/event/${SAMPLE.eventId}" class="cta-btn" style="background:#D4792C;">Join the Conversation</a>
        </p>
      </div>
    `),
  },

  passwordReset: {
    subject: "Reset your Tinerary password",
    html: postcardEmail(`
      <div class="masthead" style="background:#1A1A1A;">
        <div class="stamp">Password Reset</div>
        <h1>No worries, let's fix this</h1>
      </div>
      <div class="body-content">
        <p>We got your request to reset your password. It happens to the best of us! Click below to pick a new one:</p>
        <p style="text-align:center;margin:28px 0;">
          <a href="${APP_URL}/auth/reset-password?token=${SAMPLE.resetToken}" class="cta-btn" style="background:#1A1A1A;border-radius:28px;">Reset Password</a>
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
      <div class="masthead" style="background: linear-gradient(135deg, #D4792C 0%, #E09A5C 100%);">
        <div class="stamp">Countdown</div>
        <h1>${SAMPLE.eventTitle}</h1>
        <p class="subtitle">The countdown is on!</p>
      </div>
      <div class="body-content">
        <p>Hi ${SAMPLE.name},</p>
        <div style="text-align:center;margin:28px 0;">
          <div style="display:inline-block;background:#F8F3EF;border:3px solid #D4792C;border-radius:12px;padding:24px 40px;">
            <div style="font-family:'Nohemi','Nunito Sans',sans-serif;font-size:48px;font-weight:700;color:#D4792C;line-height:1;">${SAMPLE.timeRemaining}</div>
            <div style="font-size:12px;color:#9B8E7E;margin-top:8px;text-transform:uppercase;letter-spacing:2px;">until your event</div>
          </div>
        </div>
        <div class="info-card" style="border-radius:8px;border-left:4px solid #D4792C;">
          <div class="detail-row"><span class="detail-label">When:</span> ${SAMPLE.eventDate}</div>
          <div class="detail-row"><span class="detail-label">Where:</span> ${SAMPLE.eventLocation}</div>
        </div>
        <p style="text-align:center;font-family:'Nohemi','Nunito Sans',sans-serif;font-style:italic;color:#D4792C;">The adventure is almost here &mdash; make sure you're ready!</p>
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
      <div class="masthead" style="background: linear-gradient(135deg, #D4792C 0%, #E09A5C 100%);">
        <div class="stamp">It's Go Time</div>
        <h1>${SAMPLE.eventTitle}</h1>
        <p class="subtitle">is officially underway!</p>
      </div>
      <div class="body-content" style="text-align:center;">
        <p style="text-align:left;">Hi ${SAMPLE.name},</p>
        <div style="margin:20px 0;">
          <div style="display:inline-block;background:#FEF0E6;border:3px solid #D4792C;border-radius:12px;padding:16px 32px;">
            <div style="font-family:'Nohemi','Nunito Sans',sans-serif;font-weight:700;font-size:24px;color:#D4792C;letter-spacing:1px;text-transform:uppercase;">Happening Now</div>
          </div>
        </div>
        <h2 style="color:#D4792C;font-size:24px;">${SAMPLE.eventTitle}</h2>
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
      <div class="masthead" style="background:#1A1A1A;">
        <h1 style="font-size:36px;line-height:1.1;">Your Tinerary<br><span style="font-style:italic;font-weight:400;">in Motion</span></h1>
        <p class="subtitle">What's new &amp; what's next for your travels</p>
      </div>
      <div class="body-content">
        <p>Hi ${SAMPLE.name},</p>
        <p>Here's your latest dispatch from Tinerary HQ &mdash; new features, improvements, and a few things we think you'll love.</p>
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
        <div style="margin:28px 0;">
          <div style="border:2px solid #1A1A1A;border-radius:16px;overflow:hidden;margin-bottom:16px;">
            <div style="background:#D4792C;padding:12px 20px;"><span style="color:#FCFAF8;font-weight:700;font-size:14px;letter-spacing:0.5px;">Enhanced Event Planning</span></div>
            <div style="padding:16px 20px;"><p style="margin:0;color:#1A1A1A;font-size:15px;line-height:1.6;">Create beautiful itineraries with interactive maps, photo galleries, and detailed day-by-day schedules.</p></div>
          </div>
          <div style="border:2px solid #1A1A1A;border-radius:16px;overflow:hidden;margin-bottom:16px;">
            <div style="background:#D4792C;padding:12px 20px;"><span style="color:#FCFAF8;font-weight:700;font-size:14px;letter-spacing:0.5px;">Smart Reminders</span></div>
            <div style="padding:16px 20px;"><p style="margin:0;color:#1A1A1A;font-size:15px;line-height:1.6;">Countdown reminders at 5 days, 2 days, 1 day, and 2 hours before departure so you're never caught off guard.</p></div>
          </div>
          <div style="border:2px solid #1A1A1A;border-radius:16px;overflow:hidden;margin-bottom:16px;">
            <div style="background:#D4792C;padding:12px 20px;"><span style="color:#FCFAF8;font-weight:700;font-size:14px;letter-spacing:0.5px;">Travel Together</span></div>
            <div style="padding:16px 20px;"><p style="margin:0;color:#1A1A1A;font-size:15px;line-height:1.6;">Follow friends, share events, and collaborate on trip planning in real time.</p></div>
          </div>
          <div style="border:2px solid #1A1A1A;border-radius:16px;overflow:hidden;">
            <div style="background:#D4792C;padding:12px 20px;"><span style="color:#FCFAF8;font-weight:700;font-size:14px;letter-spacing:0.5px;">Expense Tracking</span></div>
            <div style="padding:16px 20px;"><p style="margin:0;color:#1A1A1A;font-size:15px;line-height:1.6;">Log costs on the go and split expenses with your travel companions &mdash; no awkward math required.</p></div>
          </div>
        </div>
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
        <div style="background:#F8F3EF;border:2px solid #1A1A1A;border-radius:16px;padding:24px;text-align:center;margin:28px 0;">
          <div style="font-family:'Nohemi','Nunito Sans',sans-serif;font-size:20px;font-weight:700;color:#1A1A1A;margin-bottom:8px;">Spread the wanderlust</div>
          <p style="margin:0 0 16px;font-size:15px;color:#5C4F42;">Know someone planning a trip? Share Tinerary and plan together.</p>
          <a href="${APP_URL}/" class="cta-btn">Explore Tinerary</a>
        </div>
      </div>
    `, "You received this because you signed up for Tinerary."),
  },

  accountDeletion: {
    subject: `Your Tinerary account will be deleted in ${SAMPLE.daysRemaining} days`,
    html: postcardEmail(`
      <div class="masthead" style="background:#1A1A1A;">
        <div class="stamp">Important Notice</div>
        <h1>We'd hate to see you go</h1>
      </div>
      <div class="body-content">
        <p>Hi ${SAMPLE.name},</p>
        <div style="text-align:center;margin:24px 0;">
          <div style="display:inline-block;background:#FEF0EC;border:2px solid #D4792C;border-radius:8px;padding:20px 36px;">
            <div style="font-family:'Nohemi','Nunito Sans',sans-serif;font-size:42px;font-weight:700;color:#D4792C;line-height:1;">${SAMPLE.daysRemaining} days</div>
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
          <a href="${APP_URL}/settings/account" class="cta-btn" style="background:#D4792C;">Keep My Account</a>
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
