import { type NextRequest, NextResponse } from "next/server"
import { startPhoneVerification } from "@/backend/services/auth"

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json()
    const phoneNumber = body.phoneNumber || body.phone

    // Validate required fields
    if (!phoneNumber) {
      return NextResponse.json(
        {
          success: false,
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
          success: false,
          error: result.error || "Failed to send verification code",
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      phoneNumber: result.phoneNumber,
      message: "Verification code sent successfully",
    })
  } catch (error: any) {
    console.error("Error in send-code route:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Server error processing your request. Please try again later.",
      },
      { status: 500 },
    )
  }
}