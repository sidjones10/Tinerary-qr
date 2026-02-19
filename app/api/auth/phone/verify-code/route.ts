import { NextResponse } from "next/server"
import { verifyPhoneCode } from "@/backend/services/auth"
import { createClient } from "@/utils/supabase/server"
import { sendWelcomeEmail } from "@/lib/email-notifications"

export async function POST(request: Request) {
  try {
    const { phoneNumber, code } = await request.json()

    if (!phoneNumber || !code) {
      return NextResponse.json({ error: "Phone number and verification code are required" }, { status: 400 })
    }

    // Verify the code using the proper verification service
    // This checks the code against the database, validates expiration, and checks attempts
    const result = await verifyPhoneCode(phoneNumber, code)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.message || "Verification failed",
        },
        { status: 400 },
      )
    }

    // Create a Supabase session for the verified user
    const supabase = await createClient()

    // Sign in the user with their phone using Supabase OTP
    // Since we've already verified the code, we can create a session directly
    const { data: authData, error: authError } = await supabase.auth.signInWithOtp({
      phone: result.phoneNumber!,
      options: {
        shouldCreateUser: true,
      },
    })

    if (authError) {
      // If OTP sign-in fails, the user is still verified
      // The client should handle session setup or retry
      console.error("OTP sign-in failed, user session may need manual setup:", authError)
      return NextResponse.json({
        success: true,
        message: result.message || "Verification successful",
        phoneNumber: result.phoneNumber,
        // Note: Client may need to handle session setup
      })
    }

    // Send welcome email if user has an email address
    try {
      const { data: userData } = await supabase
        .from("users")
        .select("email, name")
        .eq("phone", result.phoneNumber)
        .single()

      if (userData?.email) {
        await sendWelcomeEmail(userData.email, userData.name || userData.email.split("@")[0])
      }
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError)
    }

    return NextResponse.json({
      success: true,
      message: result.message || "Verification successful",
      phoneNumber: result.phoneNumber,
    })
  } catch (error) {
    console.error("Error verifying code:", error)

    return NextResponse.json(
      { error: "Failed to verify code", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
