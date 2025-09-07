import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { hash } from "bcryptjs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Email, password, and name are required" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, email),
    })

    if (existingUser) {
      return NextResponse.json(
        {
          message: "User already exists",
          user: {
            id: existingUser.id,
            email: existingUser.email,
            name: existingUser.name,
          },
        },
        { status: 200 },
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 10)

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        name,
        password: hashedPassword,
      })
      .returning({ id: users.id, email: users.email, name: users.name })

    return NextResponse.json({
      success: true,
      message: "User created successfully",
      user: newUser,
    })
  } catch (error) {
    console.error("Create user error:", error)

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
