import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  let body: { email?: string; source?: string; referrer?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const email = (body.email ?? "").trim().toLowerCase()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email || !emailRegex.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("founders_list")
    .insert({
      email,
      source: body.source?.slice(0, 100) ?? null,
      referrer: body.referrer?.slice(0, 500) ?? null,
    })

  if (error && error.code !== "23505") {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
