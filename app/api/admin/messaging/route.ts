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

    const [
      conversationsResult,
      messagesResult,
      totalConversations,
      totalMessages,
      mentionsResult,
    ] = await Promise.all([
      adminClient
        .from("conversations")
        .select(`*, creator:creator_id (name, email)`)
        .order("updated_at", { ascending: false })
        .limit(20),
      adminClient
        .from("messages")
        .select(`*, profiles:user_id (name, email, avatar_url)`)
        .order("created_at", { ascending: false })
        .limit(50),
      adminClient.from("conversations").select("*", { count: "exact", head: true }),
      adminClient.from("messages").select("*", { count: "exact", head: true }),
      adminClient
        .from("mentions")
        .select(`*, mentioner:user_id (name, email), mentioned:mentioned_user_id (name, email)`)
        .order("created_at", { ascending: false })
        .limit(30),
    ])

    // Calculate messages in last 24h
    const oneDayAgo = new Date(Date.now() - 86400000).toISOString()
    const recentMessagesResult = await adminClient
      .from("messages")
      .select("*", { count: "exact", head: true })
      .gte("created_at", oneDayAgo)

    return NextResponse.json({
      conversations: conversationsResult.data || [],
      recentMessages: messagesResult.data || [],
      mentions: mentionsResult.data || [],
      stats: {
        totalConversations: totalConversations.count || 0,
        totalMessages: totalMessages.count || 0,
        messagesLast24h: recentMessagesResult.count || 0,
        totalMentions: mentionsResult.data?.length || 0,
      },
    })
  } catch (error: any) {
    console.error("Admin messaging error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
