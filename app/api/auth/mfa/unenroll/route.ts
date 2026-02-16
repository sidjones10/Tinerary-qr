import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

/**
 * POST /api/auth/mfa/unenroll
 * Removes a TOTP factor, disabling 2FA for the user.
 *
 * Body: { factorId: string }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 },
      )
    }

    const { factorId } = await request.json()

    if (!factorId) {
      return NextResponse.json(
        { success: false, message: "factorId is required" },
        { status: 400 },
      )
    }

    const { error } = await supabase.auth.mfa.unenroll({ factorId })

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Two-factor authentication has been disabled",
    })
  } catch (error) {
    console.error("MFA unenroll error:", error)
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
