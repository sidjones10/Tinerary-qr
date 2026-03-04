import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

async function getAdminClient(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: "Authentication required" }, { status: 401 }) }

  const { data: profile } = await supabase.from("profiles").select("is_admin, role").eq("id", user.id).single()
  if (!profile?.is_admin && profile?.role !== "admin") {
    return { error: NextResponse.json({ error: "Admin access required" }, { status: 403 }) }
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: NextResponse.json({ error: "Server configuration error" }, { status: 500 }) }
  }

  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  return { adminClient, user }
}

export async function GET(request: NextRequest) {
  try {
    const result = await getAdminClient(request)
    if ("error" in result && !("adminClient" in result)) return result.error
    const { adminClient } = result as { adminClient: any; user: any }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = 20
    const offset = (page - 1) * limit

    const [
      transactionsResult,
      totalResult,
      balancesResult,
      totalCoinsResult,
      recentRedemptionsResult,
    ] = await Promise.all([
      adminClient
        .from("coin_transactions")
        .select(`*, profiles:user_id (name, email, avatar_url)`)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1),
      adminClient.from("coin_transactions").select("*", { count: "exact", head: true }),
      adminClient.from("coin_balances").select("*, profiles:user_id (name, email, avatar_url)").order("balance", { ascending: false }).limit(10),
      adminClient.from("coin_balances").select("balance, lifetime_earned, lifetime_spent"),
      adminClient.from("coin_redemptions").select("*, profiles:user_id (name, email)").order("created_at", { ascending: false }).limit(10),
    ])

    const totalCirculating = totalCoinsResult.data?.reduce((sum: number, b: any) => sum + (b.balance || 0), 0) || 0
    const totalEarned = totalCoinsResult.data?.reduce((sum: number, b: any) => sum + (b.lifetime_earned || 0), 0) || 0
    const totalSpent = totalCoinsResult.data?.reduce((sum: number, b: any) => sum + (b.lifetime_spent || 0), 0) || 0

    return NextResponse.json({
      transactions: transactionsResult.data || [],
      total: totalResult.count || 0,
      topBalances: balancesResult.data || [],
      recentRedemptions: recentRedemptionsResult.data || [],
      stats: { totalCirculating, totalEarned, totalSpent, totalHolders: totalCoinsResult.data?.length || 0 },
      page,
      totalPages: Math.ceil((totalResult.count || 0) / limit),
    })
  } catch (error: any) {
    console.error("Admin coins error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await getAdminClient(request)
    if ("error" in result && !("adminClient" in result)) return result.error
    const { adminClient, user } = result as { adminClient: any; user: any }

    const body = await request.json()
    const { action, userId, amount, reason } = body

    if (action === "award") {
      const { error } = await adminClient.from("coin_transactions").insert({
        user_id: userId,
        amount: Math.abs(amount),
        type: "earn",
        action: "admin_award",
        description: reason || "Admin award",
      })

      if (error) return NextResponse.json({ error: error.message }, { status: 400 })

      await adminClient.rpc("increment_coin_balance", { p_user_id: userId, p_amount: Math.abs(amount) }).catch(() => {
        // Fallback: update directly
        return adminClient.from("coin_balances").upsert({
          user_id: userId,
          balance: Math.abs(amount),
          lifetime_earned: Math.abs(amount),
        }, { onConflict: "user_id" })
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error: any) {
    console.error("Admin coins POST error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
