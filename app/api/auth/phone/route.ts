import { type NextRequest, NextResponse } from "next/server"
import { startPhoneVerification } from "@/backend/services/auth"

export async function POST(request: NextRequest) {
  try {
    // Parse the request body safely
    let phoneNumber, name
    try {
      const body = await request.json()
      phoneNumber = body.phoneNumber || body.phone
      name = body.name
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
    if (!phoneNumber) {
      return NextResponse.json(
        {
          error: "Phone number is required",
        },
        { status: 400 },
      )
    }

    // Start phone verification
    const result = await startPhoneVerification(phoneNumber)

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || "Failed to send verification code",
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      phoneNumber: result.phoneNumber,
      message: "Verification code sent",
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
