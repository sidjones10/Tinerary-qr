// ⚠️ MOCK EMAIL SERVICE - FOR DEVELOPMENT ONLY
// TODO: Replace with actual email service before production (SendGrid, AWS SES, Resend, etc.)
// This mock service does NOT send actual emails

interface EmailOptions {
  to: string
  subject: string
  html: string
  attachments?: Array<{
    filename: string
    path?: string
    content?: string
    cid?: string
  }>
}

// Mock function that simulates sending an email
// This won't actually send emails in preview mode
export async function sendEmail(options: EmailOptions) {
  // In preview mode, just log the email details
//   console.log("Email would be sent with the following details:")
//   console.log(`To: ${options.to}`)
//   console.log(`Subject: ${options.subject}`)
//   console.log(`Content length: ${options.html.length} characters`)

  if (options.attachments) {
//     console.log(`Attachments: ${options.attachments.length}`)
    options.attachments.forEach((attachment, index) => {
//       console.log(`- Attachment ${index + 1}: ${attachment.filename}`)
    })
  }

  // In production, you would use a real email service here
  // For example, with SendGrid, AWS SES, or a similar service

  // For now, return a success response
  return {
    success: true,
    messageId: `mock-email-${Date.now()}`,
    preview: true,
  }
}

// Function to send a ticket email
export async function sendTicketEmail(data: {
  email: string
  name: string
  ticketId: string
  qrCodeUrl: string
  bookingDetails: {
    title: string
    date: string
    quantity: number
    location: string
    businessName?: string
    totalAmount: number
    currency: string
  }
}) {
  const { email, name, ticketId, qrCodeUrl, bookingDetails } = data

  // Format date
  const formattedDate = new Date(bookingDetails.date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Format currency
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: bookingDetails.currency,
  }).format(bookingDetails.totalAmount)

  // Create email HTML
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #4f46e5;">Your Tinerary Ticket</h1>
        <p style="color: #666;">Thank you for your purchase!</p>
      </div>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <h2 style="margin-top: 0; color: #333;">${bookingDetails.title}</h2>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Location:</strong> ${bookingDetails.location}</p>
        <p><strong>Quantity:</strong> ${bookingDetails.quantity} ticket(s)</p>
        <p><strong>Total Amount:</strong> ${formattedAmount}</p>
        ${bookingDetails.businessName ? `<p><strong>Provider:</strong> ${bookingDetails.businessName}</p>` : ""}
      </div>
      
      <div style="text-align: center; margin-bottom: 20px;">
        <p style="margin-bottom: 10px; font-weight: bold;">Your Ticket QR Code</p>
        <img src="${qrCodeUrl}" alt="Ticket QR Code" style="max-width: 250px; height: auto;" />
        <p style="font-size: 12px; color: #666; margin-top: 10px;">Ticket ID: ${ticketId}</p>
      </div>
      
      <div style="border-top: 1px solid #e0e0e0; padding-top: 15px; font-size: 14px; color: #666;">
        <p>Please present this QR code at the venue for entry. This ticket is valid only for the date shown above.</p>
        <p>For any questions or assistance, please contact our support team at support@tinerary.app</p>
      </div>
      
      <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
        <p>&copy; ${new Date().getFullYear()} Tinerary. All rights reserved.</p>
      </div>
    </div>
  `

  // Send the email
  return sendEmail({
    to: email,
    subject: `Your Ticket for ${bookingDetails.title}`,
    html,
    attachments: [
      {
        filename: "ticket-qr.png",
        path: qrCodeUrl,
        cid: "ticket-qr",
      },
    ],
  })
}

// Function to send a booking confirmation email
export async function sendBookingConfirmationEmail(
  email: string,
  name: string,
  bookingId: string,
  bookingDetails: any,
) {
  // Format date
  const formattedDate = new Date(bookingDetails.date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Format currency
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: bookingDetails.currency || "USD",
  }).format(bookingDetails.totalAmount)

  // Create email HTML
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #4f46e5;">Booking Confirmation</h1>
        <p style="color: #666;">Thank you for your booking!</p>
      </div>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <h2 style="margin-top: 0; color: #333;">${bookingDetails.title}</h2>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Location:</strong> ${bookingDetails.location}</p>
        <p><strong>Quantity:</strong> ${bookingDetails.quantity} ticket(s)</p>
        <p><strong>Total Amount:</strong> ${formattedAmount}</p>
        <p><strong>Booking Reference:</strong> ${bookingId}</p>
      </div>
      
      <div style="border-top: 1px solid #e0e0e0; padding-top: 15px; font-size: 14px; color: #666;">
        <p>Your tickets will be sent in a separate email shortly.</p>
        <p>For any questions or assistance, please contact our support team at support@tinerary.app</p>
      </div>
      
      <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
        <p>&copy; ${new Date().getFullYear()} Tinerary. All rights reserved.</p>
      </div>
    </div>
  `

  // Send the email
  return sendEmail({
    to: email,
    subject: `Booking Confirmation: ${bookingDetails.title}`,
    html,
  })
}

// Function to send a promotion approval email
export async function sendPromotionApprovalEmail(
  email: string,
  businessName: string,
  promotionTitle: string,
  promotionId: string,
) {
  // Create email HTML
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #4f46e5;">Promotion Approved</h1>
      </div>

      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <p>Dear ${businessName},</p>
        <p>We're pleased to inform you that your promotion "${promotionTitle}" has been approved and is now live on Tinerary!</p>
        <p>You can now start receiving bookings and promoting your offering to our users.</p>
      </div>

      <div style="text-align: center; margin-top: 20px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/promotion/${promotionId}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Your Promotion</a>
      </div>

      <div style="border-top: 1px solid #e0e0e0; padding-top: 15px; margin-top: 20px; font-size: 14px; color: #666;">
        <p>For any questions or assistance, please contact our support team at support@tinerary.app</p>
      </div>

      <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
        <p>&copy; ${new Date().getFullYear()} Tinerary. All rights reserved.</p>
      </div>
    </div>
  `

  // Send the email
  return sendEmail({
    to: email,
    subject: `Your Promotion "${promotionTitle}" Has Been Approved`,
    html,
  })
}

// Function to send a countdown reminder email
export async function sendCountdownReminderEmail(data: {
  email: string
  name?: string
  itineraryTitle: string
  itineraryId: string
  timeRemaining: string
  eventDate: string
  location?: string
  eventType: "event" | "trip"
}) {
  const { email, name, itineraryTitle, itineraryId, timeRemaining, eventDate, location, eventType } = data

  const displayName = name || "there"
  const emoji = eventType === "trip" ? "✈️" : "🎉"

  // Format the event date
  const formattedDate = new Date(eventDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })

  // Create email HTML
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px; padding: 20px; background: linear-gradient(135deg, #f97316 0%, #ec4899 100%); border-radius: 5px;">
        <h1 style="color: white; margin: 0; font-size: 28px;">${emoji} ${timeRemaining} to go!</h1>
      </div>

      <div style="padding: 20px; background-color: #f9f9f9; border-radius: 5px; margin-bottom: 20px;">
        <p style="font-size: 16px; margin-bottom: 15px;">Hi ${displayName},</p>

        <p style="font-size: 16px; margin-bottom: 15px;">
          Your ${eventType} <strong>"${itineraryTitle}"</strong> is coming up in <strong>${timeRemaining}</strong>!
        </p>

        <div style="background-color: #fff; border-left: 4px solid #f97316; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; font-size: 18px; font-weight: bold; color: #333;">
            📅 ${formattedDate}
          </p>
          ${location ? `<p style="margin: 10px 0 0 0; font-size: 16px; color: #666;">📍 ${location}</p>` : ""}
        </div>

        <p style="font-size: 14px; color: #666;">
          Make sure you're all set and ready for an amazing experience!
        </p>
      </div>

      <div style="text-align: center; margin-bottom: 20px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://tinerary.app"}/event/${itineraryId}"
           style="background: linear-gradient(135deg, #f97316 0%, #ec4899 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
          View Your ${eventType === "trip" ? "Trip" : "Event"}
        </a>
      </div>

      <div style="border-top: 1px solid #e0e0e0; padding-top: 15px; font-size: 14px; color: #666;">
        <p>Have a wonderful time! 🎊</p>
      </div>

      <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
        <p>You received this email because you enabled countdown reminders for this ${eventType}.</p>
        <p>&copy; ${new Date().getFullYear()} Tinerary. All rights reserved.</p>
      </div>
    </div>
  `

  // Send the email
  return sendEmail({
    to: email,
    subject: `${emoji} ${timeRemaining} until "${itineraryTitle}"!`,
    html,
  })
}

// Function to send event started email
export async function sendEventStartedEmail(data: {
  email: string
  name?: string
  itineraryTitle: string
  itineraryId: string
  location?: string
  eventType: "event" | "trip"
}) {
  const { email, name, itineraryTitle, itineraryId, location, eventType } = data

  const displayName = name || "there"
  const emoji = eventType === "trip" ? "✈️" : "🎉"

  // Create email HTML
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px; padding: 30px; background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); border-radius: 5px;">
        <h1 style="color: white; margin: 0; font-size: 32px;">${emoji} It's Time!</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 18px;">Your ${eventType} has started!</p>
      </div>

      <div style="padding: 20px; background-color: #f9f9f9; border-radius: 5px; margin-bottom: 20px;">
        <p style="font-size: 16px; margin-bottom: 15px;">Hi ${displayName},</p>

        <p style="font-size: 18px; margin-bottom: 15px;">
          <strong>"${itineraryTitle}"</strong> is happening <strong>NOW</strong>!
        </p>

        ${location ? `<p style="font-size: 16px; color: #666;">📍 ${location}</p>` : ""}

        <p style="font-size: 16px; margin-top: 20px;">
          Have an amazing time and make wonderful memories! 🌟
        </p>
      </div>

      <div style="text-align: center; margin-bottom: 20px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://tinerary.app"}/event/${itineraryId}"
           style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
          View Details
        </a>
      </div>

      <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
        <p>&copy; ${new Date().getFullYear()} Tinerary. All rights reserved.</p>
      </div>
    </div>
  `

  // Send the email
  return sendEmail({
    to: email,
    subject: `${emoji} "${itineraryTitle}" is happening NOW!`,
    html,
  })
}
export async function sendAccountDeletionWarningEmail(data: {
  email: string
  name?: string
  username?: string
  deletionDate: string
  daysRemaining: number
}) {
  const { email, name, username, deletionDate, daysRemaining } = data

  const displayName = name || username || "there"

  // Format the deletion date
  const formattedDeletionDate = new Date(deletionDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Create email HTML
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px; padding: 20px; background-color: #fee2e2; border-radius: 5px;">
        <h1 style="color: #dc2626; margin: 0;">⚠️ Account Deletion Warning</h1>
      </div>

      <div style="padding: 20px; background-color: #f9f9f9; border-radius: 5px; margin-bottom: 20px;">
        <p style="font-size: 16px; margin-bottom: 15px;">Hi ${displayName},</p>

        <p style="font-size: 16px; margin-bottom: 15px;">
          This is a reminder that your Tinerary account is scheduled for <strong>permanent deletion</strong>.
        </p>

        <div style="background-color: #fff; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; font-size: 18px; font-weight: bold; color: #dc2626;">
            Deletion Date: ${formattedDeletionDate}
          </p>
          <p style="margin: 10px 0 0 0; font-size: 16px; color: #666;">
            Time remaining: <strong>${daysRemaining} day${daysRemaining === 1 ? "" : "s"}</strong>
          </p>
        </div>

        <p style="font-size: 16px; margin-bottom: 15px;">
          <strong>What will be deleted:</strong>
        </p>
        <ul style="font-size: 14px; color: #666; line-height: 1.8;">
          <li>All your itineraries (public and private)</li>
          <li>All activities, packing lists, and expenses</li>
          <li>Comments and interactions</li>
          <li>Profile information and settings</li>
          <li>All associated data</li>
        </ul>
      </div>

      <div style="background-color: #dcfce7; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
        <h2 style="margin-top: 0; color: #15803d; font-size: 18px;">Want to keep your account?</h2>
        <p style="margin-bottom: 15px; font-size: 14px; color: #166534;">
          Simply log in to your Tinerary account within the next ${daysRemaining} day${daysRemaining === 1 ? "" : "s"} to cancel the deletion.
        </p>
        <div style="text-align: center; margin-top: 20px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://tinerary.app"}/auth"
             style="background-color: #15803d; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Cancel Deletion & Keep My Account
          </a>
        </div>
      </div>

      <div style="border-top: 1px solid #e0e0e0; padding-top: 15px; font-size: 14px; color: #666;">
        <p><strong>Note:</strong> If you do nothing, your account will be permanently deleted on ${formattedDeletionDate}. This action cannot be undone after that date.</p>
        <p>If you have any questions or need help, please contact our support team at support@tinerary.app</p>
      </div>

      <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
        <p>You received this email because your Tinerary account was scheduled for deletion.</p>
        <p>&copy; ${new Date().getFullYear()} Tinerary. All rights reserved.</p>
      </div>
    </div>
  `

  // Send the email
  return sendEmail({
    to: email,
    subject: `⚠️ Your Tinerary Account Will Be Deleted in ${daysRemaining} Day${daysRemaining === 1 ? "" : "s"}`,
    html,
  })
}
