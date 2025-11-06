import { NextResponse } from "next/server"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export async function POST() {
  try {
    const supabase = createClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Successfully signed out",
    })
  } catch (error) {
    console.error("Sign out error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred during sign out",
      },
      { status: 500 },
    )
  }
}
