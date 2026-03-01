import { createClient } from "@/lib/supabase/client"

// ─── Types ────────────────────────────────────────────────────

export interface Conversation {
  id: string
  otherUser: {
    id: string
    name: string | null
    username: string | null
    avatar_url: string | null
    tier: string | null
    is_verified: boolean | null
  }
  lastMessage: {
    content: string
    createdAt: string
    senderId: string
    isRead: boolean
  } | null
  unreadCount: number
  updatedAt: string
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  content: string
  isRead: boolean
  createdAt: string
  sender?: {
    id: string
    name: string | null
    username: string | null
    avatar_url: string | null
  }
}

// ─── Get or create conversation between two users ───────────

export async function getOrCreateConversation(
  currentUserId: string,
  otherUserId: string,
  supabaseClient?: any
): Promise<{ success: boolean; conversationId?: string; error?: string }> {
  try {
    const supabase = supabaseClient || createClient()

    // Find existing conversation between these two users
    const { data: myConversations } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", currentUserId)

    if (myConversations && myConversations.length > 0) {
      const myConvoIds = myConversations.map((c: any) => c.conversation_id)

      const { data: sharedConvo } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", otherUserId)
        .in("conversation_id", myConvoIds)
        .limit(1)
        .maybeSingle()

      if (sharedConvo) {
        return { success: true, conversationId: sharedConvo.conversation_id }
      }
    }

    // Create new conversation
    // Generate UUID client-side so we can insert without .select(),
    // avoiding the RLS SELECT policy (which requires participants that
    // don't exist yet).
    const conversationId = crypto.randomUUID()

    const { error: convoErr } = await supabase
      .from("conversations")
      .insert({ id: conversationId })

    if (convoErr) {
      throw convoErr
    }

    // Add both participants
    const { error: partErr } = await supabase
      .from("conversation_participants")
      .insert([
        { conversation_id: conversationId, user_id: currentUserId },
        { conversation_id: conversationId, user_id: otherUserId },
      ])

    if (partErr) throw partErr

    return { success: true, conversationId }
  } catch (error) {
    console.error("Error getting/creating conversation:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get conversation",
    }
  }
}

// ─── Send a message ─────────────────────────────────────────

export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
  supabaseClient?: any
): Promise<{ success: boolean; message?: Message; error?: string }> {
  try {
    const supabase = supabaseClient || createClient()

    // Generate ID client-side to avoid .select() after .insert()
    // (the SELECT RLS policy can fail due to nested participant checks)
    const messageId = crypto.randomUUID()
    const now = new Date().toISOString()

    const { error } = await supabase
      .from("messages")
      .insert({
        id: messageId,
        conversation_id: conversationId,
        sender_id: senderId,
        content,
      })

    if (error) throw error

    // Update conversation timestamp
    await supabase
      .from("conversations")
      .update({ updated_at: now })
      .eq("id", conversationId)

    return {
      success: true,
      message: {
        id: messageId,
        conversationId,
        senderId,
        content,
        isRead: false,
        createdAt: now,
      },
    }
  } catch (error) {
    console.error("Error sending message:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send message",
    }
  }
}

// ─── Get conversations list ─────────────────────────────────

export async function getConversations(userId: string, supabaseClient?: any): Promise<Conversation[]> {
  try {
    const supabase = supabaseClient || createClient()

    // Get all conversation IDs for this user
    const { data: participations } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", userId)

    if (!participations || participations.length === 0) return []

    const convoIds = participations.map((p: any) => p.conversation_id)

    // Get conversations with updated_at
    const { data: convos } = await supabase
      .from("conversations")
      .select("id, updated_at")
      .in("id", convoIds)
      .order("updated_at", { ascending: false })

    if (!convos || convos.length === 0) return []

    // Get other participants for each conversation (without FK join)
    const { data: otherParticipants } = await supabase
      .from("conversation_participants")
      .select("conversation_id, user_id")
      .in("conversation_id", convoIds)
      .neq("user_id", userId)

    if (!otherParticipants || otherParticipants.length === 0) return []

    // Fetch profiles for the other users explicitly
    const otherUserIds = [...new Set(otherParticipants.map((p: any) => p.user_id))]
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, username, avatar_url, tier, is_verified")
      .in("id", otherUserIds)

    const profileMap = new Map(
      (profiles || []).map((p: any) => [p.id, p])
    )

    // Build conversation list
    const conversations: Conversation[] = []

    for (const convo of convos) {
      const otherParticipant = otherParticipants.find(
        (p: any) => p.conversation_id === convo.id
      )

      if (!otherParticipant) continue

      const profile = profileMap.get(otherParticipant.user_id)

      // Get latest message
      const { data: latestMsg } = await supabase
        .from("messages")
        .select("content, created_at, sender_id, is_read")
        .eq("conversation_id", convo.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      // Get unread count
      const { count: unread } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", convo.id)
        .eq("is_read", false)
        .neq("sender_id", userId)

      conversations.push({
        id: convo.id,
        otherUser: {
          id: profile?.id || otherParticipant.user_id,
          name: profile?.name || null,
          username: profile?.username || null,
          avatar_url: profile?.avatar_url || null,
          tier: profile?.tier || null,
          is_verified: profile?.is_verified || false,
        },
        lastMessage: latestMsg
          ? {
              content: latestMsg.content,
              createdAt: latestMsg.created_at,
              senderId: latestMsg.sender_id,
              isRead: latestMsg.is_read,
            }
          : null,
        unreadCount: unread || 0,
        updatedAt: convo.updated_at,
      })
    }

    return conversations
  } catch (error) {
    console.error("Error fetching conversations:", error)
    return []
  }
}

// ─── Get messages in a conversation ─────────────────────────

export async function getMessages(
  conversationId: string,
  limit = 50,
  offset = 0,
  supabaseClient?: any
): Promise<Message[]> {
  try {
    const supabase = supabaseClient || createClient()

    const { data, error } = await supabase
      .from("messages")
      .select("id, conversation_id, sender_id, content, is_read, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) throw error
    if (!data || data.length === 0) return []

    // Fetch sender profiles explicitly (avoids PostgREST FK join issues)
    const senderIds = [...new Set(data.map((m: any) => m.sender_id))]
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, username, avatar_url")
      .in("id", senderIds)

    const profileMap = new Map(
      (profiles || []).map((p: any) => [p.id, p])
    )

    return data.map((m: any) => {
      const profile = profileMap.get(m.sender_id)
      return {
        id: m.id,
        conversationId: m.conversation_id,
        senderId: m.sender_id,
        content: m.content,
        isRead: m.is_read,
        createdAt: m.created_at,
        sender: profile
          ? {
              id: profile.id,
              name: profile.name,
              username: profile.username,
              avatar_url: profile.avatar_url,
            }
          : undefined,
      }
    })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return []
  }
}

// ─── Mark messages as read ──────────────────────────────────

export async function markMessagesAsRead(
  conversationId: string,
  userId: string,
  supabaseClient?: any
): Promise<void> {
  try {
    const supabase = supabaseClient || createClient()
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .neq("sender_id", userId)
      .eq("is_read", false)
  } catch (error) {
    console.error("Error marking messages as read:", error)
  }
}

// ─── Get total unread count across all conversations ────────

export async function getTotalUnreadCount(userId: string): Promise<number> {
  try {
    const supabase = createClient()

    // Get user's conversation IDs
    const { data: participations } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", userId)

    if (!participations || participations.length === 0) return 0

    const convoIds = participations.map((p: any) => p.conversation_id)

    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .in("conversation_id", convoIds)
      .eq("is_read", false)
      .neq("sender_id", userId)

    return count || 0
  } catch (error) {
    console.error("Error fetching unread count:", error)
    return 0
  }
}
