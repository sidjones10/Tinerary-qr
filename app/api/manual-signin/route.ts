import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { compare } from "bcryptjs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Find user by email
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (!user) {
      return NextResponse.json({ error: "User not found", debug: { email } }, { status: 404 })
    }

    // Check if password is set
    if (!user.password) {
      return NextResponse.json({ error: "Password not set for this user", debug: { userId: user.id } }, { status: 400 })
    }

    // Compare password
    const passwordMatch = await compare(password, user.password)

    if (!passwordMatch) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 })
    }

    // Return user data (excluding password)
    const { password: _, ...userData } = user

    return NextResponse.json({
      success: true,
      message: "Sign in successful",
      user: userData,
    })
  } catch (error) {
    console.error("Manual sign in error:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || String(error),
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
