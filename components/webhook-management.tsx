"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Webhook,
  Plus,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react"

// ─── Types ──────────────────────────────────────────────────────

interface WebhookItem {
  id: string
  url: string
  events: string[]
  is_active: boolean
  description: string | null
  created_at: string
  updated_at: string
}

interface WebhookLimits {
  max: number
  used: number
  remaining: number
}

const EVENT_LABELS: Record<string, string> = {
  "promotion.created": "Promotion Created",
  "promotion.updated": "Promotion Updated",
  "promotion.viewed": "Promotion Viewed",
  "promotion.clicked": "Promotion Clicked",
  "promotion.saved": "Promotion Saved",
  "booking.created": "Booking Created",
  "booking.confirmed": "Booking Confirmed",
  "booking.cancelled": "Booking Cancelled",
  "metrics.daily_report": "Daily Report",
  "mention.detected": "Mention Detected",
}

const EVENT_CATEGORIES: Record<string, string[]> = {
  "Promotions": [
    "promotion.created",
    "promotion.updated",
    "promotion.viewed",
    "promotion.clicked",
    "promotion.saved",
  ],
  "Bookings": [
    "booking.created",
    "booking.confirmed",
    "booking.cancelled",
  ],
  "Other": [
    "metrics.daily_report",
    "mention.detected",
  ],
}

// ─── Component ──────────────────────────────────────────────────

export function WebhookManagement() {
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([])
  const [limits, setLimits] = useState<WebhookLimits | null>(null)
  const [availableEvents, setAvailableEvents] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Create form state
  const [showCreate, setShowCreate] = useState(false)
  const [newUrl, setNewUrl] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [newEvents, setNewEvents] = useState<string[]>([])
  const [creating, setCreating] = useState(false)
  const [newSecret, setNewSecret] = useState<string | null>(null)
  const [showSecret, setShowSecret] = useState(false)
  const [copiedSecret, setCopiedSecret] = useState(false)

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchWebhooks = useCallback(async () => {
    try {
      const res = await fetch("/api/enterprise/webhooks")
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to load webhooks")
        setLoading(false)
        return
      }
      const data = await res.json()
      setWebhooks(data.webhooks)
      setLimits(data.limits)
      setAvailableEvents(data.available_events)
      setError(null)
    } catch {
      setError("Failed to load webhooks")
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchWebhooks()
  }, [fetchWebhooks])

  const handleCreate = async () => {
    if (!newUrl || newEvents.length === 0) return
    setCreating(true)
    setError(null)

    try {
      const res = await fetch("/api/enterprise/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: newUrl,
          events: newEvents,
          description: newDescription || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to create webhook")
        setCreating(false)
        return
      }

      // Show the secret once
      setNewSecret(data.webhook.secret)
      setShowSecret(true)

      // Reset form and refresh list
      setNewUrl("")
      setNewDescription("")
      setNewEvents([])
      await fetchWebhooks()
    } catch {
      setError("Failed to create webhook")
    }
    setCreating(false)
  }

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/enterprise/webhooks?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !isActive }),
      })
      if (res.ok) {
        setWebhooks((prev) =>
          prev.map((w) => (w.id === id ? { ...w, is_active: !isActive } : w))
        )
      }
    } catch {
      setError("Failed to update webhook")
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/enterprise/webhooks?id=${id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setWebhooks((prev) => prev.filter((w) => w.id !== id))
        if (limits) {
          setLimits({ ...limits, used: limits.used - 1, remaining: limits.remaining + 1 })
        }
      }
    } catch {
      setError("Failed to delete webhook")
    }
    setDeletingId(null)
  }

  const copySecret = () => {
    if (newSecret) {
      navigator.clipboard.writeText(newSecret)
      setCopiedSecret(true)
      setTimeout(() => setCopiedSecret(false), 2000)
    }
  }

  const toggleEvent = (event: string) => {
    setNewEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    )
  }

  if (loading) {
    return (
      <Card className="border-border">
        <CardContent className="py-10 text-center">
          <Loader2 className="size-5 animate-spin mx-auto text-muted-foreground" />
          <p className="text-xs text-muted-foreground mt-2">Loading webhooks...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Webhook className="size-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Webhook Integrations</CardTitle>
                <CardDescription>
                  Receive real-time HTTP callbacks when events happen on your business account
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {limits && (
                <Badge variant="outline" className="text-[10px]">
                  {limits.used}/{limits.max} used
                </Badge>
              )}
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={fetchWebhooks}>
                <RefreshCw className="size-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/10 dark:border-red-900/30 dark:text-red-400 mb-4">
              <AlertCircle className="size-3.5 shrink-0" />
              <p className="text-xs">{error}</p>
            </div>
          )}

          {/* Secret reveal banner (shown once after creation) */}
          {newSecret && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-900/10 dark:border-amber-900/30 mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-400">
                    Signing secret — save this now, it won&apos;t be shown again
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="flex-1 text-xs bg-white dark:bg-black/20 border rounded px-2 py-1.5 font-mono select-all">
                      {showSecret ? newSecret : "••••••••••••••••••••••••"}
                    </code>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setShowSecret(!showSecret)}>
                      {showSecret ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={copySecret}>
                      {copiedSecret ? <Check className="size-3.5 text-green-600" /> : <Copy className="size-3.5" />}
                    </Button>
                  </div>
                  <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-1.5">
                    Use this secret to verify webhook signatures via the <code className="font-mono">X-Tinerary-Signature</code> header.
                  </p>
                </div>
                <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => setNewSecret(null)}>
                  Dismiss
                </Button>
              </div>
            </div>
          )}

          {/* Webhook list */}
          {webhooks.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-tinerary-dark hover:bg-tinerary-dark">
                  <TableHead className="text-primary-foreground">Endpoint</TableHead>
                  <TableHead className="text-primary-foreground">Events</TableHead>
                  <TableHead className="text-primary-foreground text-center">Status</TableHead>
                  <TableHead className="text-primary-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.map((webhook) => (
                  <TableRow key={webhook.id}>
                    <TableCell>
                      <div>
                        <code className="text-xs font-mono text-foreground">{webhook.url}</code>
                        {webhook.description && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">{webhook.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {webhook.events.slice(0, 3).map((e) => (
                          <Badge key={e} variant="secondary" className="text-[9px] px-1.5">
                            {EVENT_LABELS[e] || e}
                          </Badge>
                        ))}
                        {webhook.events.length > 3 && (
                          <Badge variant="secondary" className="text-[9px] px-1.5">
                            +{webhook.events.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={webhook.is_active}
                        onCheckedChange={() => handleToggle(webhook.id, webhook.is_active)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(webhook.id)}
                        disabled={deletingId === webhook.id}
                      >
                        {deletingId === webhook.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="size-3.5" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            !showCreate && (
              <div className="text-center py-8">
                <div className="size-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                  <Webhook className="size-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">No webhooks configured</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Create your first webhook to receive real-time event notifications via HTTP POST callbacks.
                </p>
              </div>
            )
          )}

          {/* Add webhook button */}
          {!showCreate && limits && limits.remaining > 0 && (
            <div className="mt-4">
              <Button
                size="sm"
                variant="outline"
                className="text-xs gap-1"
                onClick={() => setShowCreate(true)}
              >
                <Plus className="size-3" />
                Add Webhook
              </Button>
            </div>
          )}
          {limits && limits.remaining === 0 && !showCreate && (
            <p className="text-xs text-muted-foreground mt-3">
              You&apos;ve reached the maximum of {limits.max} webhooks. Delete one to add another.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Create webhook form */}
      {showCreate && (
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Create Webhook</CardTitle>
            <CardDescription>Configure a new endpoint to receive event callbacks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div>
                <Label className="text-xs font-medium">Endpoint URL</Label>
                <Input
                  type="url"
                  placeholder="https://your-server.com/webhooks/tinerary"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="mt-1 font-mono text-xs"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Must be an HTTPS URL</p>
              </div>

              <div>
                <Label className="text-xs font-medium">Description (optional)</Label>
                <Input
                  placeholder="e.g. Production booking alerts"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-medium mb-2 block">
                  Events ({newEvents.length} selected)
                </Label>
                <div className="space-y-3">
                  {Object.entries(EVENT_CATEGORIES).map(([category, events]) => (
                    <div key={category}>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                        {category}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {events.map((event) => {
                          const selected = newEvents.includes(event)
                          return (
                            <button
                              key={event}
                              onClick={() => toggleEvent(event)}
                              className={`px-2 py-1 rounded-md text-[10px] font-medium border transition-colors ${
                                selected
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-muted text-muted-foreground border-border hover:border-primary/30"
                              }`}
                            >
                              {EVENT_LABELS[event] || event}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  size="sm"
                  className="btn-sunset text-xs gap-1"
                  onClick={handleCreate}
                  disabled={!newUrl || newEvents.length === 0 || creating}
                >
                  {creating ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Plus className="size-3" />
                  )}
                  Create Webhook
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs"
                  onClick={() => {
                    setShowCreate(false)
                    setNewUrl("")
                    setNewDescription("")
                    setNewEvents([])
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documentation hint */}
      <Card className="border-border">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="size-4 text-blue-500 shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground leading-relaxed">
              <p className="font-medium text-foreground mb-1">How webhooks work</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Events are delivered as <code className="font-mono bg-muted px-1 rounded">POST</code> requests to your HTTPS endpoint</li>
                <li>Each request includes <code className="font-mono bg-muted px-1 rounded">X-Tinerary-Signature</code> (HMAC-SHA256) for verification</li>
                <li>Failed deliveries retry up to 3 times with exponential backoff (1s, 5s, 15s)</li>
                <li>Your endpoint must respond with a 2xx status within 10 seconds</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
