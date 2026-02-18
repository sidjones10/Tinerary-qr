// Import twilio only on the server side
let twilio: any
if (typeof window === "undefined") {
  try {
    twilio = require("twilio")
  } catch (e) {
    console.error("Failed to import twilio:", e)
  }
}

// Twilio client setup
const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

// Initialize Twilio client
let twilioClient: any = null

// Only initialize on the server and if credentials are available
if (typeof window === "undefined" && twilio && accountSid && authToken) {
  try {
    twilioClient = twilio(accountSid, authToken)
  } catch (e) {
    console.error("Failed to initialize Twilio client:", e)
  }
}

/**
 * Format a phone number to E.164 format (required by Twilio)
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Remove any non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, "")

  // Check if the number already has a country code
  if (phoneNumber.startsWith("+")) {
    return phoneNumber
  }

  // Check if the number already has a country code without +
  if (digitsOnly.startsWith("1") && digitsOnly.length === 11) {
    return `+${digitsOnly}`
  }

  // Assume US number if no country code (add +1)
  if (digitsOnly.length === 10) {
    return `+1${digitsOnly}`
  }

  // If it's already in international format but missing the +
  if (digitsOnly.length > 10) {
    return `+${digitsOnly}`
  }

  // Return as-is if we can't determine the format
  return phoneNumber
}

/**
 * Generate a random 6-digit verification code
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Send an SMS with a verification code
 */
export async function sendVerificationSMS(phoneNumber: string, code: string): Promise<boolean> {
  // For development/testing, log the code and return success
  if (process.env.NODE_ENV !== "production" || !twilioClient) {
    console.log(`[DEV MODE] Would send verification code ${code} to ${phoneNumber}`)
    return true
  }

  try {
    if (!twilioPhoneNumber) {
      console.error("Twilio phone number not configured")
      return false
    }

    await twilioClient.messages.create({
      body: `Your Tinerary verification code is: ${code}`,
      from: twilioPhoneNumber,
      to: phoneNumber,
    })

    return true
  } catch (error) {
    console.error(`Failed to send verification SMS to ${phoneNumber}:`, error)
    return false
  }
}

/**
 * Send an SMS invitation to join an itinerary
 */
export async function sendInvitationSMS(params: {
  phoneNumber: string
  inviterName: string
  itineraryTitle: string
  inviteUrl: string
}): Promise<boolean> {
  const { phoneNumber, inviterName, itineraryTitle, inviteUrl } = params
  const formattedPhone = formatPhoneNumber(phoneNumber)

  const message =
    `${inviterName} invited you to "${itineraryTitle}" on Tinerary! ` +
    `View the itinerary and RSVP: ${inviteUrl}`

  // For development/testing, log the message and return success
  if (process.env.NODE_ENV !== "production" || !twilioClient) {
    console.log(`[DEV MODE] Would send invitation SMS to ${formattedPhone}: ${message}`)
    return true
  }

  try {
    if (!twilioPhoneNumber) {
      console.error("Twilio phone number not configured")
      return false
    }

    await twilioClient.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: formattedPhone,
    })

    return true
  } catch (error) {
    console.error(`Failed to send invitation SMS to ${formattedPhone}:`, error)
    return false
  }
}

export { twilioClient }
