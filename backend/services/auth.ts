import { createClient } from "@supabase/supabase-js"
import { formatPhoneNumber, generateVerificationCode, sendVerificationSMS } from "./sms"
import { getEnv, getSiteUrl } from "@/lib/env-validation"

// Initialize Supabase client for server-side operations
const env = getEnv()
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
)

// Configuration
const CODE_EXPIRY_MINUTES = 15
const MAX_VERIFICATION_ATTEMPTS = 3

interface VerificationResult {
  success: boolean
  phoneNumber?: string
  error?: string
  message?: string
}

/**
 * Start phone verification by sending a code
 */
export async function startPhoneVerification(phone: string): Promise<VerificationResult> {
  try {
    // Format the phone number
    const formattedPhone = formatPhoneNumber(phone)

    // Validate phone number format
    if (!formattedPhone.startsWith("+") || formattedPhone.length < 10) {
      return {
        success: false,
        error: "Invalid phone number format",
      }
    }

    // Generate a verification code
    const code = generateVerificationCode()

    // Calculate expiry time
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + CODE_EXPIRY_MINUTES)

    // Delete any existing verification codes for this phone
    await supabase.from("verification_codes").delete().eq("phone", formattedPhone)

    // Store the verification code in the database
    const { error: insertError } = await supabase.from("verification_codes").insert({
      phone: formattedPhone,
      code: code,
      expires_at: expiresAt.toISOString(),
      attempts: 0,
      verified: false,
    })

    if (insertError) {
      console.error("Error storing verification code:", insertError)
      return {
        success: false,
        error: "Failed to create verification code",
      }
    }

    // Send the SMS
    const smsSent = await sendVerificationSMS(formattedPhone, code)

    if (!smsSent) {
      return {
        success: false,
        error: "Failed to send verification code",
      }
    }

    return {
      success: true,
      phoneNumber: formattedPhone,
    }
  } catch (error: any) {
    console.error("Error in startPhoneVerification:", error)
    return {
      success: false,
      error: error.message || "Failed to send verification code",
    }
  }
}

/**
 * Verify the code sent to the phone
 */
export async function verifyPhoneCode(phone: string, code: string): Promise<VerificationResult> {
  try {
    const formattedPhone = formatPhoneNumber(phone)

    // Retrieve the verification code from the database
    const { data: verificationRecord, error: fetchError } = await supabase
      .from("verification_codes")
      .select("*")
      .eq("phone", formattedPhone)
      .eq("verified", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (fetchError || !verificationRecord) {
      return {
        success: false,
        message: "No verification code found. Please request a new code.",
      }
    }

    // Check if the code has expired
    const now = new Date()
    const expiresAt = new Date(verificationRecord.expires_at)

    if (expiresAt < now) {
      // Clean up expired code
      await supabase.from("verification_codes").delete().eq("id", verificationRecord.id)

      return {
        success: false,
        message: "Verification code has expired. Please request a new code.",
      }
    }

    // Check attempts
    if (verificationRecord.attempts >= MAX_VERIFICATION_ATTEMPTS) {
      return {
        success: false,
        message: "Too many failed attempts. Please request a new code.",
      }
    }

    // Verify the code
    if (verificationRecord.code !== code) {
      // Increment attempts
      await supabase
        .from("verification_codes")
        .update({ attempts: verificationRecord.attempts + 1 })
        .eq("id", verificationRecord.id)

      return {
        success: false,
        message: "Invalid verification code. Please try again.",
      }
    }

    // Code is valid! Mark as verified
    await supabase.from("verification_codes").update({ verified: true }).eq("id", verificationRecord.id)

    // Check if user exists in the users table
    const { data: existingUser, error: userFetchError } = await supabase
      .from("users")
      .select("id, phone, email")
      .eq("phone", formattedPhone)
      .single()

    let userId: string

    if (existingUser) {
      userId = existingUser.id
      // Update last login/activity
      await supabase.from("users").update({ updated_at: new Date().toISOString() }).eq("id", existingUser.id)
    } else {
      // Create auth user first (if not exists)
      // Note: This requires proper Supabase auth setup
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        phone: formattedPhone,
        phone_confirm: true,
      })

      if (authError) {
        console.error("Error creating auth user:", authError)
        // Try to continue with manual user creation
      }

      const authUserId = authData?.user?.id

      // Create user record in users table
      if (authUserId) {
        const { data: newUser, error: insertError } = await supabase
          .from("users")
          .insert({
            id: authUserId,
            phone: formattedPhone,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select("id")
          .single()

        if (insertError) {
          console.error("Error creating user record:", insertError)
          return {
            success: false,
            message: "Failed to create user account",
          }
        }

        userId = newUser.id
      } else {
        // Fallback: create user without auth (not recommended for production)
        console.warn("Creating user without auth - this is not secure for production")
        return {
          success: false,
          message: "Failed to create user account. Please contact support.",
        }
      }
    }

    // Clean up the verification code
    await supabase.from("verification_codes").delete().eq("id", verificationRecord.id)

    return {
      success: true,
      phoneNumber: formattedPhone,
      message: "Phone verified successfully",
    }
  } catch (error: any) {
    console.error("Error in verifyPhoneCode:", error)
    return {
      success: false,
      message: error.message || "Failed to verify code",
    }
  }
}

/**
 * Create a session token for authenticated user
 * This generates a Supabase auth session
 */
export async function createUserSession(phone: string) {
  try {
    const formattedPhone = formatPhoneNumber(phone)

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, phone")
      .eq("phone", formattedPhone)
      .single()

    if (userError || !user) {
      return { success: false, error: "User not found" }
    }

    // Generate a session token using Supabase auth
    // Note: This requires the user to exist in auth.users
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: `${user.id}@placeholder.local`, // Placeholder email
      options: {
        redirectTo: getSiteUrl(),
      },
    })

    if (error) {
      console.error("Error generating session:", error)
      return { success: false, error: "Failed to create session" }
    }

    return {
      success: true,
      user: user,
      session: data,
    }
  } catch (error: any) {
    console.error("Error creating user session:", error)
    return {
      success: false,
      error: error.message || "Failed to create session",
    }
  }
}