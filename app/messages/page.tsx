"use client"

import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  MessageCircle,
  Send,
  CheckCircle2,
  Loader2,
  Trash2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AppHeader } from "@/components/app-header"
import { createClient } from "@/lib/supabase/client"
import {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  deleteConversation,
  type Conversation,
  type Message,
} from "@/lib/message-service"

function getInitials(name: string | null) {
  if (!name) return "?"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  return new Date(dateStr).toLocaleDateString()
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col">
          <AppHeader />
          <main className="flex-1 flex items-center justify-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </main>
        </div>
      }
    >
      <MessagesPageContent />
    </Suspense>
  )
}

function MessagesPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const withUserId = searchParams.get("with")

  // Single shared Supabase client — ensures all calls use the same
  // authenticated session instead of creating new clients each time
  const supabaseRef = useRef(createClient())

  const [userId, setUserId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const initDone = useRef(false)

  const supabase = supabaseRef.current

  // Get active conversation's other user
  const activeConvo = conversations.find((c) => c.id === activeConvoId)

  // Load conversations
  const loadConversations = useCallback(
    async (uid: string) => {
      const data = await getConversations(uid, supabase)
      setConversations(data)
      return data
    },
    [supabase]
  )

  // Load messages for a conversation
  // Accepts an optional uid param so the init effect can call this without
  // depending on the userId state (which would destabilise the callback ref
  // and re-trigger the effect, causing duplicate conversations).
  const loadMessages = useCallback(
    async (convoId: string, uid?: string) => {
      setMessagesLoading(true)
      const data = await getMessages(convoId, 50, 0, supabase)
      setMessages(data)
      setMessagesLoading(false)
      const resolvedUid = uid ?? userId
      if (resolvedUid) {
        await markMessagesAsRead(convoId, resolvedUid, supabase)
        setConversations((prev) =>
          prev.map((c) => (c.id === convoId ? { ...c, unreadCount: 0 } : c))
        )
      }
    },
    [userId, supabase]
  )

  // Initial load — runs exactly once thanks to the initDone ref guard.
  // Without the guard, changing userId (null → real id) would recreate
  // loadMessages, which would re-trigger this effect and race with the
  // first run, producing duplicate conversations.
  useEffect(() => {
    if (initDone.current) return
    initDone.current = true

    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.push("/auth?redirectTo=/messages")
        return
      }

      const uid = session.user.id
      setUserId(uid)
      const convos = await loadConversations(uid)

      // If ?with= param, open or create that conversation
      if (withUserId && withUserId !== uid) {
        // Check if we already have a conversation with this user
        const existingConvo = convos.find(
          (c) => c.otherUser.id === withUserId
        )

        if (existingConvo) {
          setActiveConvoId(existingConvo.id)
          await loadMessages(existingConvo.id, uid)
        } else {
          const result = await getOrCreateConversation(uid, withUserId, supabase)
          if (result.success && result.conversationId) {
            const { data: otherProfile } = await supabase
              .from("profiles")
              .select("id, name, username, avatar_url, tier, is_verified")
              .eq("id", withUserId)
              .maybeSingle()

            const newConvo: Conversation = {
              id: result.conversationId,
              otherUser: {
                id: withUserId,
                name: otherProfile?.name || null,
                username: otherProfile?.username || null,
                avatar_url: otherProfile?.avatar_url || null,
                tier: otherProfile?.tier || null,
                is_verified: otherProfile?.is_verified || false,
              },
              lastMessage: null,
              unreadCount: 0,
              updatedAt: new Date().toISOString(),
            }
            setConversations((prev) => [newConvo, ...prev])
            setActiveConvoId(result.conversationId)
            await loadMessages(result.conversationId, uid)
          } else {
            setError(result.error || "Failed to open conversation")
          }
        }
      } else if (convos.length > 0) {
        setActiveConvoId(convos[0].id)
        await loadMessages(convos[0].id, uid)
      }

      setLoading(false)
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Real-time subscription
  useEffect(() => {
    if (!activeConvoId) return
    const channel = supabase
      .channel(`messages:${activeConvoId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeConvoId}`,
        },
        (payload) => {
          const newMsg = payload.new as any
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev
            return [
              ...prev,
              {
                id: newMsg.id,
                conversationId: newMsg.conversation_id,
                senderId: newMsg.sender_id,
                content: newMsg.content,
                isRead: newMsg.is_read,
                createdAt: newMsg.created_at,
              },
            ]
          })
          // Mark as read if from other user
          if (userId && newMsg.sender_id !== userId) {
            markMessagesAsRead(activeConvoId, userId, supabase)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeConvoId, userId, supabase])

  async function handleSend() {
    if (!newMessage.trim() || !activeConvoId || !userId || sending) return
    setSending(true)
    const result = await sendMessage(activeConvoId, userId, newMessage.trim(), supabase)
    if (result.success && result.message) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === result.message!.id)) return prev
        return [...prev, result.message!]
      })
      setNewMessage("")
      // Update last message in conversation list
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConvoId
            ? {
                ...c,
                lastMessage: {
                  content: result.message!.content,
                  createdAt: result.message!.createdAt,
                  senderId: userId,
                  isRead: false,
                },
                updatedAt: result.message!.createdAt,
              }
            : c
        )
      )
    } else {
      setError(result.error || "Failed to send message")
    }
    setSending(false)
  }

  function handleSelectConvo(convoId: string) {
    setActiveConvoId(convoId)
    loadMessages(convoId)
  }

  async function handleDeleteConvo(convoId: string) {
    if (!confirm("Delete this conversation? This cannot be undone.")) return
    const result = await deleteConversation(convoId, supabase)
    if (result.success) {
      setConversations((prev) => prev.filter((c) => c.id !== convoId))
      if (activeConvoId === convoId) {
        setActiveConvoId(null)
        setMessages([])
      }
    } else {
      setError(result.error || "Failed to delete conversation")
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1">
        <div className="container px-4 py-6 md:py-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <MessageCircle className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Messages</h1>
              <p className="text-sm text-muted-foreground">
                Your direct messages
              </p>
            </div>
          </div>

          {error && (
            <Card className="border-destructive/50 bg-destructive/5 mb-4">
              <CardContent className="py-4 text-center">
                <p className="text-sm text-destructive">{error}</p>
              </CardContent>
            </Card>
          )}

          {conversations.length === 0 && !withUserId ? (
            /* Empty state */
            <Card className="border-border">
              <CardContent className="py-16 text-center">
                <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="size-10 text-primary/50" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Messages Yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Start a conversation by visiting someone&apos;s profile and
                  tapping the Message button.
                </p>
              </CardContent>
            </Card>
          ) : (
            /* Chat layout */
            <div className="grid lg:grid-cols-[340px_1fr] gap-6 h-[calc(100vh-220px)]">
              {/* Conversation List */}
              <Card className="border-border overflow-hidden flex flex-col">
                <CardHeader className="pb-3 shrink-0">
                  <CardTitle className="text-base">Conversations</CardTitle>
                </CardHeader>
                <div className="flex-1 overflow-y-auto">
                  {conversations.map((convo) => (
                    <button
                      key={convo.id}
                      onClick={() => handleSelectConvo(convo.id)}
                      className={`w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50 border-b border-border/50 ${
                        activeConvoId === convo.id
                          ? "bg-primary/5 border-l-2 border-l-primary"
                          : ""
                      }`}
                    >
                      <div className="relative">
                        <Avatar className="size-10">
                          <AvatarImage
                            src={convo.otherUser.avatar_url || undefined}
                          />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                            {getInitials(
                              convo.otherUser.name || convo.otherUser.username
                            )}
                          </AvatarFallback>
                        </Avatar>
                        {(convo.otherUser.tier === "creator" ||
                          convo.otherUser.tier === "business" ||
                          convo.otherUser.is_verified) && (
                          <CheckCircle2 className="size-4 text-[#7C3AED] absolute -bottom-0.5 -right-0.5 bg-card rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {convo.otherUser.name ||
                              convo.otherUser.username ||
                              "User"}
                          </p>
                          {convo.lastMessage && (
                            <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                              {timeAgo(convo.lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-xs text-muted-foreground truncate">
                            {convo.lastMessage
                              ? convo.lastMessage.senderId === userId
                                ? `You: ${convo.lastMessage.content}`
                                : convo.lastMessage.content
                              : "No messages yet"}
                          </p>
                          {convo.unreadCount > 0 && (
                            <Badge className="bg-primary text-primary-foreground border-0 text-[10px] size-5 flex items-center justify-center rounded-full p-0 shrink-0 ml-2">
                              {convo.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>

              {/* Message Thread */}
              <Card className="border-border overflow-hidden flex flex-col">
                {activeConvo ? (
                  <>
                    {/* Thread header */}
                    <div className="flex items-center gap-3 p-4 border-b border-border shrink-0">
                      <Link href={`/user/${activeConvo.otherUser.id}`}>
                        <Avatar className="size-9">
                          <AvatarImage
                            src={
                              activeConvo.otherUser.avatar_url || undefined
                            }
                          />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                            {getInitials(
                              activeConvo.otherUser.name ||
                                activeConvo.otherUser.username
                            )}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-foreground">
                            {activeConvo.otherUser.name ||
                              activeConvo.otherUser.username ||
                              "User"}
                          </p>
                          {(activeConvo.otherUser.tier === "creator" ||
                            activeConvo.otherUser.tier === "business" ||
                            activeConvo.otherUser.is_verified) && (
                            <CheckCircle2 className="size-3.5 text-[#7C3AED]" />
                          )}
                        </div>
                        {activeConvo.otherUser.username && (
                          <p className="text-xs text-muted-foreground">
                            @{activeConvo.otherUser.username}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => handleDeleteConvo(activeConvo.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {messagesLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="size-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="text-center py-12">
                          <p className="text-sm text-muted-foreground">
                            No messages yet. Say hello!
                          </p>
                        </div>
                      ) : (
                        messages.map((msg) => {
                          const isMine = msg.senderId === userId
                          return (
                            <div
                              key={msg.id}
                              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                                  isMine
                                    ? "bg-primary text-primary-foreground rounded-br-md"
                                    : "bg-muted text-foreground rounded-bl-md"
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words">
                                  {msg.content}
                                </p>
                                <p
                                  className={`text-[10px] mt-1 ${
                                    isMine
                                      ? "text-primary-foreground/60"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {timeAgo(msg.createdAt)}
                                </p>
                              </div>
                            </div>
                          )
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Compose */}
                    <div className="p-4 border-t border-border shrink-0">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault()
                              handleSend()
                            }
                          }}
                          placeholder="Type a message..."
                          className="flex-1 h-10 px-4 rounded-full border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                        <Button
                          size="icon"
                          className="btn-sunset rounded-full size-10 shrink-0"
                          disabled={!newMessage.trim() || sending}
                          onClick={handleSend}
                        >
                          {sending ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Send className="size-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-center p-4">
                    <div>
                      <MessageCircle className="size-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">
                        Select a conversation to start messaging
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
