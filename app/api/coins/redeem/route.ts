import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { REWARD_COSTS, REWARD_NAMES, type CoinSpendAction } from "@/lib/coins-service"

// POST - Redeem coins for a reward
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const rewardSlug = body.reward_slug as CoinSpendAction

    if (!rewardSlug || !REWARD_COSTS[rewardSlug]) {
      return NextResponse.json({ error: "Invalid reward" }, { status: 400 })
    }

    const cost = REWARD_COSTS[rewardSlug]
    const rewardName = REWARD_NAMES[rewardSlug]

    // Use spend_coins database function (handles balance check + race conditions)
    const { data: transactionId, error: spendError } = await supabase.rpc("spend_coins", {
      p_user_id: user.id,
      p_amount: cost,
      p_action: rewardSlug,
      p_description: `Redeemed: ${rewardName}`,
      p_reference_type: "redemption",
      p_reference_id: null,
      p_metadata: { reward_slug: rewardSlug },
    })

    if (spendError) {
      if (spendError.message?.includes("Insufficient")) {
        return NextResponse.json({ error: "Insufficient coin balance" }, { status: 400 })
      }
      console.error("Error spending coins:", spendError)
      return NextResponse.json({ error: spendError.message }, { status: 500 })
    }

    // Create redemption record
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    const { data: redemption, error: redeemError } = await supabase
      .from("coin_redemptions")
      .insert({
        user_id: user.id,
        transaction_id: transactionId,
        reward_slug: rewardSlug,
        reward_name: rewardName,
        cost,
        status: "active",
        expires_at: expiresAt.toISOString(),
      })
      .select("id")
      .single()

    if (redeemError) {
      console.error("Error creating redemption:", redeemError)
    }

    // Get updated balance
    const { data: balanceData } = await supabase
      .from("coin_balances")
      .select("balance")
      .eq("user_id", user.id)
      .single()

    return NextResponse.json({
      success: true,
      redemption_id: redemption?.id || null,
      transaction_id: transactionId,
      new_balance: balanceData?.balance || 0,
      reward: rewardName,
    })
  } catch (error: any) {
    console.error("Error in redeem API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET - Get user's active redemptions
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("coin_redemptions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching redemptions:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ redemptions: data || [] })
  } catch (error: any) {
    console.error("Error in redemptions API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
