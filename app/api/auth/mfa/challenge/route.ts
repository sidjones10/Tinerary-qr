import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

/**
 * POST /api/auth/mfa/challenge
 * Creates a new MFA challenge for the given factor. Called during sign-in
 * when the user has 2FA enabled.
 *
 * Body: { factorId: string }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { factorId } = await request.json()

    if (!factorId) {
      return NextResponse.json(
        { success: false, message: "factorId is required" },
        { status: 400 },
      )
    }

    const { data, error } = await supabase.auth.mfa.challenge({ factorId })

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      challengeId: data.id,
    })
  } catch (error) {
    console.error("MFA challenge error:", error)
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
