import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { getSiteUrl } from "@/lib/env-validation"

export async function POST(request: Request) {
  try {
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

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 6 characters long",
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
      return NextResponse.json(
        {
          success: false,
          message: error.message,
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
