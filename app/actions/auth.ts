"use server"

import { createClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function signIn(email: string, password: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/", "layout")
  redirect("/dashboard")
}

export async function signUp(email: string, password: string, username?: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username || email.split("@")[0],
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.user) {
    // Create user profile in the database
    const { error: profileError } = await supabase.from("users").insert([
      {
        id: data.user.id,
        email,
        name: username || email.split("@")[0],
        created_at: new Date().toISOString(),
      },
    ])

    if (profileError) {
      console.error("Profile creation error:", profileError)
    }
  }

  revalidatePath("/", "layout")
  return { success: true, needsVerification: !data.user?.email_confirmed_at }
}

export async function signOut() {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/", "layout")
  redirect("/auth")
}
