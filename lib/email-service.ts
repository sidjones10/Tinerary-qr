// This is a mock email service for development/preview
// In production, replace with actual email sending logic

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
  console.log("Email would be sent with the following details:")
  console.log(`To: ${options.to}`)
  console.log(`Subject: ${options.subject}`)
  console.log(`Content length: ${options.html.length} characters`)

  if (options.attachments) {
    console.log(`Attachments: ${options.attachments.length}`)
    options.attachments.forEach((attachment, index) => {
      console.log(`- Attachment ${index + 1}: ${attachment.filename}`)
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
