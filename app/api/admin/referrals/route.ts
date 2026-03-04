import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

async function getAdminClient() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: "Authentication required" }, { status: 401 }) }

  const { data: profile } = await supabase.from("profiles").select("is_admin, role").eq("id", user.id).single()
  if (!profile?.is_admin && profile?.role !== "admin") {
    return { error: NextResponse.json({ error: "Admin access required" }, { status: 403 }) }
  }

  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  return { adminClient }
}

export async function GET(request: NextRequest) {
  try {
    const result = await getAdminClient()
    if ("error" in result && !("adminClient" in result)) return result.error
    const { adminClient } = result as { adminClient: any }

    const [referralsResult, affiliateResult, totalReferrals, totalClicks] = await Promise.all([
      adminClient
        .from("referrals")
        .select(`*, referrer:referrer_id (name, email, avatar_url), referred:referred_id (name, email, avatar_url)`)
        .order("created_at", { ascending: false })
        .limit(50),
      adminClient
        .from("affiliate_clicks")
        .select(`*, creator:creator_id (name, email)`)
        .order("created_at", { ascending: false })
        .limit(50),
      adminClient.from("referrals").select("*", { count: "exact", head: true }),
      adminClient.from("affiliate_clicks").select("*", { count: "exact", head: true }),
    ])

    const totalRevenue = affiliateResult.data?.reduce((sum: number, a: any) => sum + (a.revenue || 0), 0) || 0
    const totalClickCount = affiliateResult.data?.reduce((sum: number, a: any) => sum + (a.click_count || 0), 0) || 0

    return NextResponse.json({
      referrals: referralsResult.data || [],
      affiliateClicks: affiliateResult.data || [],
      stats: {
        totalReferrals: totalReferrals.count || 0,
        totalAffiliateEntries: totalClicks.count || 0,
        totalRevenue,
        totalClickCount,
      },
    })
  } catch (error: any) {
    console.error("Admin referrals error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
