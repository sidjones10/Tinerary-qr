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

  return { adminClient, user }
}

export async function GET(request: NextRequest) {
  try {
    const result = await getAdminClient()
    if ("error" in result && !("adminClient" in result)) return result.error
    const { adminClient } = result as { adminClient: any }

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get("filter") || "all"

    let businessQuery = adminClient
      .from("businesses")
      .select(`*, profiles:user_id (name, email, avatar_url, account_tier)`)
      .order("created_at", { ascending: false })

    if (filter === "verified") businessQuery = businessQuery.eq("is_verified", true)
    if (filter === "unverified") businessQuery = businessQuery.eq("is_verified", false)

    const [businessesResult, creatorsResult, totalBusinesses, verifiedCount] = await Promise.all([
      businessQuery.limit(50),
      adminClient.from("profiles").select("id, name, email, avatar_url, account_tier, created_at").eq("account_tier", "creator").order("created_at", { ascending: false }).limit(20),
      adminClient.from("businesses").select("*", { count: "exact", head: true }),
      adminClient.from("businesses").select("*", { count: "exact", head: true }).eq("is_verified", true),
    ])

    return NextResponse.json({
      businesses: businessesResult.data || [],
      creators: creatorsResult.data || [],
      stats: {
        totalBusinesses: totalBusinesses.count || 0,
        verifiedBusinesses: verifiedCount.count || 0,
        totalCreators: creatorsResult.data?.length || 0,
      },
    })
  } catch (error: any) {
    console.error("Admin businesses error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await getAdminClient()
    if ("error" in result && !("adminClient" in result)) return result.error
    const { adminClient } = result as { adminClient: any }

    const body = await request.json()
    const { action, businessId, userId } = body

    if (action === "verify") {
      await adminClient.from("businesses").update({ is_verified: true }).eq("id", businessId)
      return NextResponse.json({ success: true })
    }

    if (action === "unverify") {
      await adminClient.from("businesses").update({ is_verified: false }).eq("id", businessId)
      return NextResponse.json({ success: true })
    }

    if (action === "suspend") {
      await adminClient.from("profiles").update({ is_suspended: true }).eq("id", userId)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error: any) {
    console.error("Admin businesses POST error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
