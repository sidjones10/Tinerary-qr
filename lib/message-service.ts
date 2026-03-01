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
  otherUserId: string
): Promise<{ success: boolean; conversationId?: string; error?: string }> {
  try {
    const supabase = createClient()

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
        .single()

      if (sharedConvo) {
        return { success: true, conversationId: sharedConvo.conversation_id }
      }
    }

    // Create new conversation
    const { data: newConvo, error: convoErr } = await supabase
      .from("conversations")
      .insert({})
      .select("id")
      .single()

    if (convoErr || !newConvo) {
      throw convoErr || new Error("Failed to create conversation")
    }

    // Add both participants
    const { error: partErr } = await supabase
      .from("conversation_participants")
      .insert([
        { conversation_id: newConvo.id, user_id: currentUserId },
        { conversation_id: newConvo.id, user_id: otherUserId },
      ])

    if (partErr) throw partErr

    return { success: true, conversationId: newConvo.id }
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
  content: string
): Promise<{ success: boolean; message?: Message; error?: string }> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
      })
      .select("id, conversation_id, sender_id, content, is_read, created_at")
      .single()

    if (error) throw error

    // Update conversation timestamp
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId)

    return {
      success: true,
      message: {
        id: data.id,
        conversationId: data.conversation_id,
        senderId: data.sender_id,
        content: data.content,
        isRead: data.is_read,
        createdAt: data.created_at,
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

export async function getConversations(userId: string): Promise<Conversation[]> {
  try {
    const supabase = createClient()

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

    // Get other participants for each conversation
    const { data: allParticipants } = await supabase
      .from("conversation_participants")
      .select("conversation_id, user_id, profiles:user_id(id, name, username, avatar_url, tier, is_verified)")
      .in("conversation_id", convoIds)
      .neq("user_id", userId)

    // Get latest message for each conversation
    const conversations: Conversation[] = []

    for (const convo of convos) {
      const otherParticipant = allParticipants?.find(
        (p: any) => p.conversation_id === convo.id
      )

      if (!otherParticipant) continue

      const profile = otherParticipant.profiles as any

      // Get latest message
      const { data: latestMsg } = await supabase
        .from("messages")
        .select("content, created_at, sender_id, is_read")
        .eq("conversation_id", convo.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

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
  offset = 0
): Promise<Message[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("messages")
      .select(
        "id, conversation_id, sender_id, content, is_read, created_at, profiles:sender_id(id, name, username, avatar_url)"
      )
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return (data || []).map((m: any) => ({
      id: m.id,
      conversationId: m.conversation_id,
      senderId: m.sender_id,
      content: m.content,
      isRead: m.is_read,
      createdAt: m.created_at,
      sender: m.profiles
        ? {
            id: m.profiles.id,
            name: m.profiles.name,
            username: m.profiles.username,
            avatar_url: m.profiles.avatar_url,
          }
        : undefined,
    }))
  } catch (error) {
    console.error("Error fetching messages:", error)
    return []
  }
}

// ─── Mark messages as read ──────────────────────────────────

export async function markMessagesAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  try {
    const supabase = createClient()
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
