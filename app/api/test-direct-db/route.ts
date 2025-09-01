import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { sql } from "drizzle-orm"

export async function GET() {
  try {
    // Test direct database connection with a simple query
    const result = await db.execute(sql`SELECT 1 as test`)

    // Try to get user count as well
    let userCount = null
    try {
      const usersResult = await db.select({ count: sql`count(*)` }).from(users)
      userCount = usersResult[0]?.count
    } catch (userError) {
      console.error("User count error:", userError)
      userCount = { error: userError.message }
    }

    return NextResponse.json({
      success: true,
      message: "Direct database connection successful",
      data: {
        testResult: result,
        userCount,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Direct database connection error:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Direct database connection failed",
        error: error.message || String(error),
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
