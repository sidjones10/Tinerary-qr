import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/client"
import {
  getConversations,
  getOrCreateConversation,
  sendMessage,
} from "@/lib/message-service"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

const RATE_LIMIT = { maxRequests: 60, windowSeconds: 60 }

// GET — list conversations for the current user
export async function GET(request: Request) {
  try {
    const ip = getClientIp(request)
    const rl = await rateLimit(`messages:${ip}`, RATE_LIMIT)
    if (!rl.allowed) {
      return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429 })
    }

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const conversations = await getConversations(session.user.id)
    return NextResponse.json({ success: true, data: conversations })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch conversations" },
      { status: 500 }
    )
  }
}

// POST — send a message (creates conversation if needed)
export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    const rl = await rateLimit(`messages:${ip}`, RATE_LIMIT)
    if (!rl.allowed) {
      return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429 })
    }

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { recipientId, content, conversationId } = body

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { success: false, error: "Message content is required" },
        { status: 400 }
      )
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { success: false, error: "Message too long (max 5000 characters)" },
        { status: 400 }
      )
    }

    let convoId = conversationId

    // If no conversationId, create/find one
    if (!convoId) {
      if (!recipientId) {
        return NextResponse.json(
          { success: false, error: "recipientId or conversationId is required" },
          { status: 400 }
        )
      }

      if (recipientId === session.user.id) {
        return NextResponse.json(
          { success: false, error: "Cannot message yourself" },
          { status: 400 }
        )
      }

      const convoResult = await getOrCreateConversation(session.user.id, recipientId)
      if (!convoResult.success || !convoResult.conversationId) {
        return NextResponse.json(
          { success: false, error: convoResult.error || "Failed to create conversation" },
          { status: 500 }
        )
      }
      convoId = convoResult.conversationId
    }

    const result = await sendMessage(convoId, session.user.id, content.trim())
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to send message" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { conversationId: convoId, message: result.message },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to send message" },
      { status: 500 }
    )
  }
}
