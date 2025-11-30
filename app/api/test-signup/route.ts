import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

/**
 * Test endpoint to see detailed signup errors
 * Visit: http://localhost:3002/api/test-signup?email=test@example.com
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email") || "test@example.com"
    const password = "testpassword123"

    const supabase = await createClient()

    console.log("=== Testing Signup ===")
    console.log("Email:", email)

    // Try to sign up
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: email.split("@")[0],
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    })

    console.log("=== Signup Result ===")
    console.log("Data:", JSON.stringify(data, null, 2))
    console.log("Error:", JSON.stringify(error, null, 2))

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: error.message,
            status: error.status,
            name: error.name,
            details: error,
          },
        },
        { status: 400 }
      )
    }

    // Check if profile was created
    if (data.user) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single()

      console.log("=== Profile Check ===")
      console.log("Profile:", JSON.stringify(profile, null, 2))
      console.log("Profile Error:", JSON.stringify(profileError, null, 2))

      return NextResponse.json({
        success: true,
        user: data.user,
        profile: profile,
        profileError: profileError,
        message: "User created successfully!",
      })
    }

    return NextResponse.json({
      success: true,
      data,
      message: "Check response for details",
    })
  } catch (error: any) {
    console.error("=== Unexpected Error ===")
    console.error(error)

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    )
  }
}
