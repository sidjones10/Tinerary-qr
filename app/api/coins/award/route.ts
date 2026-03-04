import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { COIN_AMOUNTS, type CoinEarnAction } from "@/lib/coins-service"

const VALID_ACTIONS: CoinEarnAction[] = [
  "publish_public_itinerary",
  "itinerary_10_views",
  "itinerary_saved",
  "leave_review",
  "refer_user",
  "complete_booking",
  "share_social",
  "add_5_activities",
  "first_itinerary",
]

const ACTION_DESCRIPTIONS: Record<CoinEarnAction, string> = {
  publish_public_itinerary: "Published a public itinerary",
  itinerary_10_views: "Itinerary reached 10+ views",
  itinerary_saved: "Itinerary was saved by another user",
  leave_review: "Left a review on a business",
  refer_user: "Referred a new user who signed up",
  complete_booking: "Completed a booking",
  share_social: "Shared itinerary to social media",
  add_5_activities: "Added 5+ activities to an itinerary",
  first_itinerary: "Created first itinerary ever",
}

// POST - Award coins to the current user for an action
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { action, reference_type, reference_id } = body

    if (!action || !VALID_ACTIONS.includes(action as CoinEarnAction)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const coinAction = action as CoinEarnAction
    const amount = COIN_AMOUNTS[coinAction]

    // Prevent duplicate awards for the same action + reference
    if (reference_id) {
      const { count: alreadyAwarded } = await supabase
        .from("coin_transactions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("action", coinAction)
        .eq("reference_id", reference_id)

      if (alreadyAwarded && alreadyAwarded > 0) {
        return NextResponse.json({
          success: true,
          already_awarded: true,
          message: "Coins already awarded for this action",
        })
      }
    }

    // For one-time actions (like first_itinerary), check if already earned regardless of reference
    if (coinAction === "first_itinerary") {
      const { count: alreadyEarned } = await supabase
        .from("coin_transactions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("action", "first_itinerary")
        .eq("type", "earn")

      if (alreadyEarned && alreadyEarned > 0) {
        return NextResponse.json({
          success: true,
          already_awarded: true,
          message: "First itinerary bonus already earned",
        })
      }
    }

    // Award coins via database function
    const { data: transactionId, error: awardError } = await supabase.rpc("award_coins", {
      p_user_id: user.id,
      p_amount: amount,
      p_action: coinAction,
      p_description: ACTION_DESCRIPTIONS[coinAction],
      p_reference_type: reference_type || null,
      p_reference_id: reference_id || null,
      p_metadata: {},
    })

    if (awardError) {
      console.error("Error awarding coins:", awardError)
      return NextResponse.json({ error: awardError.message }, { status: 500 })
    }

    // Get updated balance
    const { data: balanceData } = await supabase
      .from("coin_balances")
      .select("balance")
      .eq("user_id", user.id)
      .single()

    return NextResponse.json({
      success: true,
      transaction_id: transactionId,
      coins_awarded: amount,
      new_balance: balanceData?.balance || 0,
    })
  } catch (error: any) {
    console.error("Error in coin award API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
