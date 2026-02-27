import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - Get current user's coin balance
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Ensure balance row exists
    await supabase.rpc("ensure_coin_balance", { p_user_id: user.id })

    const { data, error } = await supabase
      .from("coin_balances")
      .select("balance, lifetime_earned, lifetime_spent")
      .eq("user_id", user.id)
      .single()

    if (error) {
      console.error("Error fetching coin balance:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      balance: data?.balance || 0,
      lifetime_earned: data?.lifetime_earned || 0,
      lifetime_spent: data?.lifetime_spent || 0,
    })
  } catch (error: any) {
    console.error("Error in coins API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
