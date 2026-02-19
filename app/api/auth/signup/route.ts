import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { getSiteUrl } from "@/lib/env-validation"
import { sendWelcomeEmail } from "@/lib/email-notifications"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

// 5 sign-up attempts per IP per 15 minutes
const SIGNUP_RATE_LIMIT = { maxRequests: 5, windowSeconds: 15 * 60 }

export async function POST(request: Request) {
  try {
    // Rate limit by IP
    const ip = getClientIp(request)
    const rl = await rateLimit(`signup:${ip}`, SIGNUP_RATE_LIMIT)
    if (!rl.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many sign-up attempts. Please try again later.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
          },
        },
      )
    }

    const { email, password, username } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required",
        },
        { status: 400 },
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid email address",
        },
        { status: 400 },
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 8 characters long",
        },
        { status: 400 },
      )
    }

    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must contain at least one uppercase letter, one lowercase letter, and one number",
        },
        { status: 400 },
      )
    }

    // Initialize Supabase client
    const supabase = await createClient()

    // Create user with Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username || email.split("@")[0],
        },
        emailRedirectTo: `${getSiteUrl()}/auth/callback`,
      },
    })

    if (error) {
      console.error("Supabase signup error:", error)
      // Use a generic message to avoid confirming whether an email is already registered
      return NextResponse.json(
        {
          success: false,
          message: "Unable to create account. The email may already be in use, or please try again later.",
        },
        { status: 400 },
      )
    }

    // Profile is created automatically by database trigger
    // Verify the profile was created with retry logic
    if (data.user) {
      const maxRetries = 5
      const baseDelay = 100
      let profile = null
      let profileError = null

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        // Wait with exponential backoff
        if (attempt > 0) {
          const delay = baseDelay * Math.pow(2, attempt - 1)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }

        // Check if profile exists
        const result = await supabase.from("profiles").select("id").eq("id", data.user.id).single()

        if (result.data && !result.error) {
          profile = result.data
          break
        }

        profileError = result.error

        // If it's not a "not found" error, stop retrying
        if (result.error && result.error.code !== "PGRST116") {
          break
        }
      }

      if (!profile) {
        console.error("Profile creation failed after retries:", profileError)
        // Return error since profile is required for app functionality
        return NextResponse.json(
          {
            success: false,
            message: "Account created but profile setup failed. Please contact support.",
          },
          { status: 500 },
        )
      }

      // Send welcome email via Resend
      try {
        const displayName = username || email.split("@")[0]
        await sendWelcomeEmail(email, displayName)
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError)
        // Don't fail signup if email fails - just log it
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: data.user?.email_confirmed_at
          ? "Account created successfully!"
          : "Please check your email for verification.",
        user: data.user,
        needsVerification: !data.user?.email_confirmed_at,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Unexpected error during signup:", error)
    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred during signup. Please try again.",
      },
      { status: 500 },
    )
  }
}
