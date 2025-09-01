import { NextResponse } from "next/server"
import { testConnection, supabaseClient } from "@/lib/db/supabase-db"

export async function GET() {
  try {
    // Test the Supabase connection
    const connectionTest = await testConnection()

    if (!connectionTest.success) {
      throw new Error(`Supabase connection test failed: ${JSON.stringify(connectionTest.error)}`)
    }

    // Get some additional information about the Supabase project
    const { data: versionData } = await supabaseClient.rpc("version")

    return NextResponse.json({
      success: true,
      message: "Supabase database connection successful",
      data: {
        connectionTest,
        version: versionData,
        timestamp: new Date().toISOString(),
        connectionInfo: {
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set (masked for security)" : "Not set",
          supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set (masked for security)" : "Not set",
          nodeEnv: process.env.NODE_ENV,
        },
      },
    })
  } catch (error: any) {
    console.error("Database connection error:", error)

    // Provide detailed error information
    return NextResponse.json(
      {
        success: false,
        message: "Database connection failed",
        error: error.message || String(error),
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
        connectionInfo: {
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
            ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 10)}...`
            : "Not set",
          supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set (masked for security)" : "Not set",
          nodeEnv: process.env.NODE_ENV,
        },
      },
      { status: 500 },
    )
  }
}
