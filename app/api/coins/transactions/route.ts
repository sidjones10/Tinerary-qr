import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - Get current user's coin transaction history
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50)
    const offset = parseInt(searchParams.get("offset") || "0")
    const type = searchParams.get("type") // 'earn' or 'spend'

    let query = supabase
      .from("coin_transactions")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (type === "earn" || type === "spend") {
      query = query.eq("type", type)
    }

    const { data, error, count } = await query

    if (error) {
      console.error("Error fetching transactions:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      transactions: data || [],
      total: count || 0,
      limit,
      offset,
    })
  } catch (error: any) {
    console.error("Error in transactions API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
