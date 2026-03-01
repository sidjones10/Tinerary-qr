import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getApiAccessConfig } from "@/lib/enterprise"
import { generateWebhookSecret, WEBHOOK_EVENTS } from "@/lib/webhook-service"
import type { BusinessTierSlug } from "@/lib/tiers"

/**
 * Enterprise Webhooks API
 *
 * GET    /api/enterprise/webhooks          — List all webhooks for the business
 * POST   /api/enterprise/webhooks          — Create a new webhook
 * PATCH  /api/enterprise/webhooks?id=<id>  — Update a webhook
 * DELETE /api/enterprise/webhooks?id=<id>  — Delete a webhook
 *
 * Authentication: session cookie (business owner must be logged in)
 */

async function getBusinessForUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: business } = await supabase
    .from("businesses")
    .select("id, business_tier")
    .eq("user_id", user.id)
    .single()

  return business
}

// ─── GET: List webhooks ─────────────────────────────────────────

export async function GET() {
  try {
    const supabase = await createClient()
    const business = await getBusinessForUser(supabase)
    if (!business) {
      return NextResponse.json({ error: "Not authenticated or no business account" }, { status: 401 })
    }

    const tier = (business.business_tier || "basic") as BusinessTierSlug
    const apiConfig = getApiAccessConfig(tier)
    if (!apiConfig.webhooksEnabled) {
      return NextResponse.json(
        { error: "Webhook integrations require an Enterprise plan." },
        { status: 403 }
      )
    }

    const { data: webhooks, error } = await supabase
      .from("business_webhooks")
      .select("id, url, events, is_active, description, created_at, updated_at")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: "Failed to fetch webhooks" }, { status: 500 })
    }

    return NextResponse.json({
      webhooks: webhooks || [],
      limits: {
        max: apiConfig.maxWebhooks,
        used: (webhooks || []).length,
        remaining: apiConfig.maxWebhooks - (webhooks || []).length,
      },
      available_events: WEBHOOK_EVENTS,
    })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ─── POST: Create webhook ───────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const business = await getBusinessForUser(supabase)
    if (!business) {
      return NextResponse.json({ error: "Not authenticated or no business account" }, { status: 401 })
    }

    const tier = (business.business_tier || "basic") as BusinessTierSlug
    const apiConfig = getApiAccessConfig(tier)
    if (!apiConfig.webhooksEnabled) {
      return NextResponse.json(
        { error: "Webhook integrations require an Enterprise plan." },
        { status: 403 }
      )
    }

    // Check limit
    const { count } = await supabase
      .from("business_webhooks")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)

    if ((count ?? 0) >= apiConfig.maxWebhooks) {
      return NextResponse.json(
        { error: `You have reached the maximum of ${apiConfig.maxWebhooks} webhooks.` },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { url, events, description } = body

    // Validate URL
    if (!url || typeof url !== "string" || !url.startsWith("https://")) {
      return NextResponse.json(
        { error: "Webhook URL must start with https://" },
        { status: 400 }
      )
    }

    // Validate events
    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: "At least one event type is required." },
        { status: 400 }
      )
    }

    const invalidEvents = events.filter((e: string) => !WEBHOOK_EVENTS.includes(e as any))
    if (invalidEvents.length > 0) {
      return NextResponse.json(
        { error: `Invalid event types: ${invalidEvents.join(", ")}` },
        { status: 400 }
      )
    }

    const secret = generateWebhookSecret()

    const { data: webhook, error } = await supabase
      .from("business_webhooks")
      .insert({
        business_id: business.id,
        url,
        secret,
        events,
        description: description || null,
        is_active: true,
      })
      .select("id, url, secret, events, is_active, description, created_at")
      .single()

    if (error) {
      return NextResponse.json({ error: "Failed to create webhook" }, { status: 500 })
    }

    // Return secret only on creation — it won't be shown again
    return NextResponse.json({ webhook }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ─── PATCH: Update webhook ──────────────────────────────────────

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const business = await getBusinessForUser(supabase)
    if (!business) {
      return NextResponse.json({ error: "Not authenticated or no business account" }, { status: 401 })
    }

    const tier = (business.business_tier || "basic") as BusinessTierSlug
    const apiConfig = getApiAccessConfig(tier)
    if (!apiConfig.webhooksEnabled) {
      return NextResponse.json({ error: "Webhook integrations require an Enterprise plan." }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const webhookId = searchParams.get("id")
    if (!webhookId) {
      return NextResponse.json({ error: "Missing webhook id" }, { status: 400 })
    }

    const body = await request.json()
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (body.url !== undefined) {
      if (typeof body.url !== "string" || !body.url.startsWith("https://")) {
        return NextResponse.json({ error: "Webhook URL must start with https://" }, { status: 400 })
      }
      updates.url = body.url
    }

    if (body.events !== undefined) {
      if (!Array.isArray(body.events) || body.events.length === 0) {
        return NextResponse.json({ error: "At least one event type is required." }, { status: 400 })
      }
      const invalidEvents = body.events.filter((e: string) => !WEBHOOK_EVENTS.includes(e as any))
      if (invalidEvents.length > 0) {
        return NextResponse.json({ error: `Invalid event types: ${invalidEvents.join(", ")}` }, { status: 400 })
      }
      updates.events = body.events
    }

    if (body.is_active !== undefined) {
      updates.is_active = Boolean(body.is_active)
    }

    if (body.description !== undefined) {
      updates.description = body.description || null
    }

    const { data: webhook, error } = await supabase
      .from("business_webhooks")
      .update(updates)
      .eq("id", webhookId)
      .eq("business_id", business.id)
      .select("id, url, events, is_active, description, created_at, updated_at")
      .single()

    if (error || !webhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 })
    }

    return NextResponse.json({ webhook })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ─── DELETE: Remove webhook ─────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const business = await getBusinessForUser(supabase)
    if (!business) {
      return NextResponse.json({ error: "Not authenticated or no business account" }, { status: 401 })
    }

    const tier = (business.business_tier || "basic") as BusinessTierSlug
    const apiConfig = getApiAccessConfig(tier)
    if (!apiConfig.webhooksEnabled) {
      return NextResponse.json({ error: "Webhook integrations require an Enterprise plan." }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const webhookId = searchParams.get("id")
    if (!webhookId) {
      return NextResponse.json({ error: "Missing webhook id" }, { status: 400 })
    }

    const { error } = await supabase
      .from("business_webhooks")
      .delete()
      .eq("id", webhookId)
      .eq("business_id", business.id)

    if (error) {
      return NextResponse.json({ error: "Failed to delete webhook" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
