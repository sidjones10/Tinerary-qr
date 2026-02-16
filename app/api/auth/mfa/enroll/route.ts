import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

/**
 * POST /api/auth/mfa/enroll
 * Starts TOTP enrollment — returns a QR code URI and secret so the user
 * can add it to their authenticator app (Google Authenticator, Authy, etc.).
 */
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 },
      )
    }

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Authenticator app",
    })

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      factorId: data.id,
      qrCode: data.totp.qr_code,   // data URI for <img src="">
      secret: data.totp.secret,     // manual-entry key
      uri: data.totp.uri,           // otpauth:// URI
    })
  } catch (error) {
    console.error("MFA enroll error:", error)
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
