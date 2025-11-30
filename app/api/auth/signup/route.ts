import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

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
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
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
    // Wait a moment for the trigger to complete
    if (data.user) {
      // Give the trigger time to create the profile
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Verify the profile was created
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .single()

      if (profileError || !profile) {
        console.error("Profile creation may have failed:", profileError)
        // The trigger should handle this, but log for monitoring
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
