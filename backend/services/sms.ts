// Simple SMS service without Twilio
// For development: logs codes to console
// For production: swap this with your preferred SMS provider

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

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function sendVerificationSMS(phoneNumber: string, code: string): Promise<boolean> {
  const formattedPhone = formatPhoneNumber(phoneNumber)

  // For development/testing, log the code
  if (process.env.NODE_ENV !== "production") {
    console.log("\n" + "=".repeat(60))
    console.log("📱 VERIFICATION CODE")
    console.log("=".repeat(60))
    console.log(`Phone: ${formattedPhone}`)
    console.log(`Code:  ${code}`)
    console.log("=".repeat(60) + "\n")
    return true
  }

  // TODO: In production, integrate with your SMS provider
  console.warn(
    `[PRODUCTION MODE] SMS sending not configured! Would send code ${code} to ${formattedPhone}`,
  )
  return true
}