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
    const supabase = createClient()

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

    // If user was created successfully
    if (data.user) {
      // Try to create user profile in database
      try {
        const { error: profileError } = await supabase.from("users").insert([
          {
            id: data.user.id,
            email: email,
            name: username || email.split("@")[0],
            created_at: new Date().toISOString(),
          },
        ])

        if (profileError) {
          console.error("Error creating user profile:", profileError)
          // Don't fail the signup if profile creation fails
        }
      } catch (profileErr) {
        console.error("Exception creating profile:", profileErr)
        // Continue anyway since the auth account was created
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
