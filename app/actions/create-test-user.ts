"use server"

import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { hash } from "bcryptjs"

export async function createTestUser() {
  try {
    // Check if test user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, "test@example.com"),
    })

    if (existingUser) {
      // If test user exists, return the credentials
      return {
        success: true,
        message: "Test user already exists",
        credentials: {
          email: "test@example.com",
          password: "Test123!",
        },
      }
    }

    // Create a new test user
    const hashedPassword = await hash("Test123!", 10)

    await db.insert(users).values({
      email: "test@example.com",
      password: hashedPassword,
      name: "Test User",
    })

    return {
      success: true,
      message: "Test user created successfully",
      credentials: {
        email: "test@example.com",
        password: "Test123!",
      },
    }
  } catch (error) {
    console.error("Error creating test user:", error)
    return {
      success: false,
      message: "Failed to create test user",
      error: String(error),
    }
  }
}
