import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Check for required environment variables
    const envVars = {
      DATABASE_URL: process.env.DATABASE_URL ? "✅ Set" : "❌ Missing",
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ? "✅ Set" : "❌ Missing",
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "✅ Set" : "❌ Missing",
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing",
    }

    // Check if all required variables are set
    const allSet = Object.values(envVars).every((status) => status === "✅ Set")

    return NextResponse.json({
      success: allSet,
      message: allSet ? "All required environment variables are set" : "Some environment variables are missing",
      variables: envVars,
    })
  } catch (error) {
    console.error("Environment check error:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Failed to check environment variables",
        error: error.message || String(error),
      },
      { status: 500 },
    )
  }
}
