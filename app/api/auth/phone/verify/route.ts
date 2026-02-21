import { type NextRequest, NextResponse } from "next/server"
import { verifyPhoneCode } from "@/backend/services/auth"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { sendWelcomeEmail } from "@/lib/email-notifications"

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json()
    const phoneNumber = body.phoneNumber || body.phone
    const code = body.code || body.verificationCode

    // Validate required fields
    if (!phoneNumber || !code) {
      return NextResponse.json(
        {
          success: false,
          error: "Phone number and verification code are required",
        },
        { status: 400 },
      )
    }

    // Verify the code
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

    // Create Supabase client with cookie handling
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              // Handle cookie setting errors in middleware
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({ name, value: "", ...options })
            } catch (error) {
              // Handle cookie removal errors in middleware
            }
          },
        },
      },
    )

    // Get the user by phone number
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, phone, email, name")
      .eq("phone", result.phoneNumber)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found after verification",
        },
        { status: 500 },
      )
    }

    // Sign in the user using Supabase auth
    // We'll use the phone as identifier and create an OTP session
    const { data: authData, error: authError } = await supabase.auth.signInWithOtp({
      phone: result.phoneNumber!,
      options: {
        shouldCreateUser: false, // User already created in verification
      },
    })

    // Alternative: Use admin API to create a session directly
    if (authError) {
      console.error("OTP sign-in error:", authError)

      // Fallback: Create session using admin API
      const { data: session, error: sessionError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: user.email || `${user.id}@phone.local`,
      })

      if (sessionError) {
        console.error("Session creation error:", sessionError)
        // Still return success since verification worked
        return NextResponse.json({
          success: true,
          message: "Verification successful",
          user: {
            id: user.id,
            phone: user.phone,
            name: user.name,
          },
          // Client will need to handle auth state
          requiresClientAuth: true,
        })
      }
    }

    // Send welcome email if user has an email address
    if (user.email) {
      try {
        await sendWelcomeEmail(user.email, user.name || user.email.split("@")[0])
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError)
      }
    }

    // Return success with user info
    return NextResponse.json({
      success: true,
      message: "Verification successful",
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
      },
    })
  } catch (error: any) {
    console.error("Error in verify-code route:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Server error processing your request. Please try again later.",
      },
      { status: 500 },
    )
  }
}