import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST - Record a referral and award coins to the referrer
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

    // Award coins to the referrer (100 coins for refer_user)
    // Check if already awarded for this specific referred user
    const { count: alreadyAwarded } = await supabase
      .from("coin_transactions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", referrer_id)
      .eq("action", "refer_user")
      .eq("reference_id", referred_id)

    if (!alreadyAwarded || alreadyAwarded === 0) {
      const { error: awardError } = await supabase.rpc("award_coins", {
        p_user_id: referrer_id,
        p_amount: 100, // COIN_AMOUNTS.refer_user
        p_action: "refer_user",
        p_description: "Referred a new user who signed up",
        p_reference_type: "referral",
        p_reference_id: referred_id,
        p_metadata: {},
      })

      if (awardError) {
        console.error("Error awarding referral coins:", awardError)
        // Don't fail the referral record — coins can be reconciled later
      }

      // Update referral status to rewarded
      await supabase
        .from("referrals")
        .update({ status: "rewarded" })
        .eq("referrer_id", referrer_id)
        .eq("referred_id", referred_id)
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
