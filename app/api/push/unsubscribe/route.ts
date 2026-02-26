import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { endpoint } = await request.json()

    if (endpoint) {
      // Remove a specific subscription
      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", user.id)
        .eq("endpoint", endpoint)
    } else {
      // Remove all subscriptions for this user
      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", user.id)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in push unsubscribe:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
