"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Mail,
  Inbox,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  DollarSign,
  Eye,
  Sparkles,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AppHeader } from "@/components/app-header"
import { PaywallGate } from "@/components/paywall-gate"
import { createClient } from "@/lib/supabase/client"
import {
  getSponsorshipMessages,
  updateSponsorshipStatus,
  type SponsorshipMessage,
} from "@/lib/creator-service"
import { useToast } from "@/components/ui/use-toast"

const statusConfig: Record<string, { label: string; color: string }> = {
  new: { label: "New", color: "bg-tinerary-peach text-tinerary-dark" },
  read: { label: "Read", color: "bg-secondary text-secondary-foreground" },
  replied: { label: "Replied", color: "bg-primary/10 text-primary" },
  accepted: { label: "Accepted", color: "bg-green-100 text-green-800" },
  declined: { label: "Declined", color: "bg-destructive/10 text-destructive" },
}

export default function CreatorSponsorshipsPage() {
  const [messages, setMessages] = useState<SponsorshipMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/auth?redirectTo=/creator/sponsorships")
        return
      }
      const data = await getSponsorshipMessages(session.user.id)
      setMessages(data)
      setLoading(false)
    }
    load()
  }, [router])

  async function handleStatusUpdate(messageId: string, status: SponsorshipMessage["status"]) {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const result = await updateSponsorshipStatus(messageId, session.user.id, status)
    if (result.success) {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, status } : m))
      )
      toast({ title: `Message ${status}` })
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
  }

  const newCount = messages.filter((m) => m.status === "new").length
  const acceptedCount = messages.filter((m) => m.status === "accepted").length

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1">
        <div className="container px-4 py-6 md:py-10">
          <Link
            href="/creator"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Creator Hub
          </Link>

          <PaywallGate gate="creator_sponsorships">
          <div className="flex items-center gap-3 mb-8">
            <div className="size-10 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center">
              <Mail className="size-5 text-[#7C3AED]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Sponsorship Inbox</h1>
              <p className="text-sm text-muted-foreground">
                Brand collaboration opportunities delivered directly to you
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Messages", value: messages.length.toString(), icon: Inbox },
              { label: "New", value: newCount.toString(), icon: Sparkles },
              { label: "Accepted", value: acceptedCount.toString(), icon: CheckCircle2 },
              { label: "Response Rate", value: messages.length > 0 ? `${Math.round(((acceptedCount + messages.filter(m => m.status === "declined").length) / messages.length) * 100)}%` : "0%", icon: MessageSquare },
            ].map((stat) => (
              <Card key={stat.label} className="border-border">
                <CardContent className="pt-6">
                  <stat.icon className="size-5 text-muted-foreground" />
                  <p className="mt-3 text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* How it works */}
          <Card className="border-border bg-muted mb-8">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="size-10 rounded-xl bg-[#7C3AED] flex items-center justify-center shrink-0">
                  <Mail className="size-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">How Sponsorships Work</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Brands can send collaboration proposals directly to your inbox based on your content, audience, and travel niche.
                    Review proposals, negotiate terms, and accept partnerships that align with your style.
                  </p>
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-card">
                  <Inbox className="size-4 text-[#7C3AED]" />
                  <span className="text-xs text-foreground">Receive proposals</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-card">
                  <Eye className="size-4 text-tinerary-gold" />
                  <span className="text-xs text-foreground">Review & negotiate</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-card">
                  <CheckCircle2 className="size-4 text-tinerary-salmon" />
                  <span className="text-xs text-foreground">Accept & collaborate</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Inbox className="size-5 text-[#7C3AED]" /> Inbox
                {newCount > 0 && (
                  <Badge className="bg-[#7C3AED] text-white border-0 text-xs">
                    {newCount} new
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Brand collaboration proposals and sponsorship inquiries
              </CardDescription>
            </CardHeader>
            <CardContent>
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Sponsorship Messages Yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    As your audience grows, brands will reach out with collaboration opportunities.
                    Keep creating great content!
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {messages.map((msg) => {
                    const config = statusConfig[msg.status] || statusConfig.new
                    const isExpanded = expandedId === msg.id
                    return (
                      <div
                        key={msg.id}
                        className={`rounded-xl border transition-all ${
                          msg.status === "new" ? "border-[#7C3AED]/30 bg-[#7C3AED]/5" : "border-border bg-muted"
                        }`}
                      >
                        <div
                          className="p-4 cursor-pointer"
                          onClick={() => {
                            setExpandedId(isExpanded ? null : msg.id)
                            if (msg.status === "new") {
                              handleStatusUpdate(msg.id, "read")
                            }
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="size-10 rounded-full bg-card border flex items-center justify-center shrink-0">
                                {msg.brandLogo ? (
                                  <img
                                    src={msg.brandLogo}
                                    alt={msg.brandName}
                                    className="size-full rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="text-sm font-bold text-muted-foreground">
                                    {msg.brandName.slice(0, 2).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-bold text-foreground">{msg.brandName}</p>
                                  <Badge
                                    variant="secondary"
                                    className={`${config.color} border-0 text-xs`}
                                  >
                                    {config.label}
                                  </Badge>
                                </div>
                                <p className="text-sm text-foreground mt-0.5 truncate">{msg.subject}</p>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(msg.createdAt).toLocaleDateString()}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {msg.campaignType}
                                  </span>
                                  {msg.budget && (
                                    <span className="flex items-center gap-0.5 text-xs text-tinerary-salmon font-medium">
                                      <DollarSign className="size-3" /> {msg.budget}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="px-4 pb-4 border-t border-border/50 pt-3">
                            <p className="text-sm text-foreground leading-relaxed mb-4">
                              {msg.message}
                            </p>
                            {msg.status !== "accepted" && msg.status !== "declined" && (
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  className="btn-sunset"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleStatusUpdate(msg.id, "accepted")
                                  }}
                                >
                                  <CheckCircle2 className="size-4 mr-1" /> Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleStatusUpdate(msg.id, "declined")
                                  }}
                                >
                                  <XCircle className="size-4 mr-1" /> Decline
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleStatusUpdate(msg.id, "replied")
                                  }}
                                >
                                  <MessageSquare className="size-4 mr-1" /> Reply
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
          </PaywallGate>
        </div>
      </main>
    </div>
  )
}
