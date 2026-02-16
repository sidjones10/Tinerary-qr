import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

/**
 * POST /api/auth/mfa/verify
 * Verifies a TOTP code. Used both during enrollment (to activate the factor)
 * and during sign-in (to satisfy an MFA challenge).
 *
 * Body: { factorId: string, code: string, challengeId?: string }
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

    const { factorId, code, challengeId } = await request.json()

    if (!factorId || !code) {
      return NextResponse.json(
        { success: false, message: "factorId and code are required" },
        { status: 400 },
      )
    }

    // If no challengeId was provided, create a new challenge first
    let resolvedChallengeId = challengeId
    if (!resolvedChallengeId) {
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId })

      if (challengeError) {
        return NextResponse.json(
          { success: false, message: challengeError.message },
          { status: 400 },
        )
      }
      resolvedChallengeId = challengeData.id
    }

    // Verify the TOTP code
    const { data, error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: resolvedChallengeId,
      code,
    })

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Verification successful",
    })
  } catch (error) {
    console.error("MFA verify error:", error)
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
