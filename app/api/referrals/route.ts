import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST - Record a referral
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { referrer_id, referred_id } = body

    if (!referrer_id || !referred_id) {
      return NextResponse.json({ error: "Missing referrer_id or referred_id" }, { status: 400 })
    }

    // Don't allow self-referrals
    if (referrer_id === referred_id) {
      return NextResponse.json({ error: "Cannot refer yourself" }, { status: 400 })
    }

    // Check that the referrer exists
    const { data: referrer } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", referrer_id)
      .maybeSingle()

    if (!referrer) {
      return NextResponse.json({ error: "Referrer not found" }, { status: 404 })
    }

    // Check if this referral already exists
    const { data: existingReferral } = await supabase
      .from("referrals")
      .select("id")
      .eq("referrer_id", referrer_id)
      .eq("referred_id", referred_id)
      .maybeSingle()

    if (existingReferral) {
      return NextResponse.json({ success: true, already_tracked: true })
    }

    // Record the referral
    const { error: insertError } = await supabase
      .from("referrals")
      .insert({
        referrer_id,
        referred_id,
        status: "completed",
      })

    if (insertError) {
      console.error("Error inserting referral:", insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in referral API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET - Get current user's referral stats
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: referrals, error } = await supabase
      .from("referrals")
      .select("id, referred_id, status, created_at")
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching referrals:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      referrals: referrals || [],
      total: referrals?.length || 0,
      referral_link: `${request.nextUrl.origin}/?ref=${user.id}`,
    })
  } catch (error: any) {
    console.error("Error in referrals GET:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
