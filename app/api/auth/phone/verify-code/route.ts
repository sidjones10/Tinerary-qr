import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

export async function POST(request: Request) {
  try {
    const { phoneNumber, code } = await request.json()

    if (!phoneNumber || !code) {
      return NextResponse.json({ error: "Phone number and verification code are required" }, { status: 400 })
    }

    // In a real app, you would verify the code against what's stored in your database
    // For this example, we'll assume the code is valid

    // Create a Supabase client
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: "", ...options })
          },
        },
      },
    )

    // Check if user exists
    const { data: existingUser } = await supabase.from("users").select("id").eq("phone", phoneNumber).single()

    let userId

    if (existingUser) {
      userId = existingUser.id
    } else {
      // Create a new user
      const { data: newUser, error } = await supabase
        .from("users")
        .insert([{ phone: phoneNumber, created_at: new Date().toISOString() }])
        .select("id")
        .single()

      if (error) {
        throw new Error(`Failed to create user: ${error.message}`)
      }

      userId = newUser.id
    }

    // Sign in the user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: `${phoneNumber}@example.com`, // Using phone as email for now
      password: code, // Using code as password for now
    })

    if (authError) {
      throw new Error(`Authentication failed: ${authError.message}`)
    }

    // Return success response with session
    return NextResponse.json({
      success: true,
      message: "Verification successful",
      user: { id: userId, phone: phoneNumber },
    })
  } catch (error) {
    console.error("Error verifying code:", error)

    return NextResponse.json(
      { error: "Failed to verify code", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
