import { createClient } from "@/utils/supabase/server"
import { twilioClient } from "./twilio"

// In-memory store for verification codes (in a real app, use Redis or similar)
const verificationCodes: Record<string, { code: string; expires: number }> = {}

// Generate a random verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Format phone number to E.164 format
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "")

  // If it doesn't start with +, add it
  if (!phone.startsWith("+")) {
    // Assume US number if no country code
    if (digits.length === 10) {
      return `+1${digits}`
    }
    return `+${digits}`
  }

  return phone
}

// Send verification code via SMS
export async function startPhoneVerification(phone: string) {
  try {
    // Format the phone number
    const formattedPhone = formatPhoneNumber(phone)

    // Generate a verification code
    const code = generateVerificationCode()

    // Store the code with expiration (15 minutes)
    verificationCodes[formattedPhone] = {
      code,
      expires: Date.now() + 15 * 60 * 1000,
    }

    // In development, just log the code instead of sending SMS
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV MODE] Verification code for ${formattedPhone}: ${code}`)
      return { success: true, phoneNumber: formattedPhone }
    }

    // Send the code via SMS
    await twilioClient.messages.create({
      body: `Your Tinerary verification code is: ${code}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    })

    return { success: true, phoneNumber: formattedPhone }
  } catch (error: any) {
    console.error("Error sending verification code:", error)
    return {
      success: false,
      error: error.message || "Failed to send verification code",
    }
  }
}

// Verify the code sent to the phone
export async function verifyPhoneCode(phone: string, code: string) {
  try {
    const formattedPhone = formatPhoneNumber(phone)

    // Check if there's a verification code for this phone
    const verification = verificationCodes[formattedPhone]
    if (!verification) {
      return { success: false, message: "No verification code found. Please request a new code." }
    }

    // Check if the code has expired
    if (verification.expires < Date.now()) {
      delete verificationCodes[formattedPhone]
      return { success: false, message: "Verification code has expired. Please request a new code." }
    }

    // Check if the code matches
    if (verification.code !== code) {
      return { success: false, message: "Invalid verification code. Please try again." }
    }

    // Code is valid, clean up
    delete verificationCodes[formattedPhone]

    // Create or update user in Supabase
    const supabase = createClient()

    // Check if user exists
    const { data: existingUser } = await supabase.from("users").select("id").eq("phone", formattedPhone).single()

    if (existingUser) {
      // Update last login
      await supabase.from("users").update({ last_login: new Date().toISOString() }).eq("id", existingUser.id)
    } else {
      // Create new user
      await supabase.from("users").insert([
        {
          phone: formattedPhone,
          last_login: new Date().toISOString(),
        },
      ])
    }

    // Create session
    const { data, error } = await supabase.auth.signInWithPassword({
      phone: formattedPhone,
      password: code, // This is just a placeholder, not actually used
    })

    if (error) {
      throw error
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error verifying code:", error)
    return {
      success: false,
      message: error.message || "Failed to verify code",
    }
  }
}
