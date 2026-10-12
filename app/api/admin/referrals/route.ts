import { NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/auth/require-admin"


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
