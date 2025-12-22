import { type NextRequest, NextResponse } from "next/server"
import { trackAffiliateLinkClick } from "@/app/actions/promotion-actions"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const redirectUrl = searchParams.get("url")

    if (!code || !redirectUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required parameters",
        },
        { status: 400 },
      )
    }

    // Get IP and user agent for analytics
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    // Track the click
    await trackAffiliateLinkClick(code, ip, userAgent)

    // Redirect to the target URL
    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error("Error tracking affiliate click:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process affiliate link",
      },
      { status: 500 },
    )
  }
}
