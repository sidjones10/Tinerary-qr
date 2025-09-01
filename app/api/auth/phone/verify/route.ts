import { type NextRequest, NextResponse } from "next/server"
import { verifyPhoneCode } from "@/backend/services/auth"

export async function POST(request: NextRequest) {
  try {
    // Parse the request body safely
    let phone, code
    try {
      const body = await request.json()
      phone = body.phoneNumber || body.phone
      code = body.code || body.verificationCode
    } catch (e) {
      console.error("Failed to parse request body:", e)
      return NextResponse.json(
        {
          error: "Invalid request format",
        },
        { status: 400 },
      )
    }

    // Validate required fields
    if (!phone || !code) {
      return NextResponse.json(
        {
          error: "Phone number and verification code are required",
        },
        { status: 400 },
      )
    }

    // Verify the code
    const result = await verifyPhoneCode(phone, code)

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.message || "Verification failed",
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Phone verified successfully",
    })
  } catch (error: any) {
    console.error("Phone verification error:", error)

    // Always return a proper JSON response, even for server errors
    return NextResponse.json(
      {
        error: "Server error processing your request. Please try again later.",
      },
      { status: 500 },
    )
  }
}
