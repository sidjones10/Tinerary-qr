"use client"

import { useCallback, useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import { Lock, ArrowRight, Sparkles } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import {
  PAYWALL_ENABLED,
  checkGate,
  type PaywallGateId,
} from "@/lib/paywall"

interface PaywallGateProps {
  /** Which gate to enforce (defined in lib/paywall.ts) */
  gate: PaywallGateId
  /** Content rendered when the gate passes */
  children: ReactNode
  /**
   * Optional custom fallback. When provided, it replaces the default
   * upgrade prompt. Useful for pages that already render their own
   * "locked" state (e.g. business-analytics basic tier view).
   */
  fallback?: ReactNode
}

/**
 * Wraps protected content with a paywall check.
 *
 * When `PAYWALL_ENABLED` is false (testing phase), children are
 * always rendered. When enabled, the component checks auth,
 * account type, and business tier against the gate config.
 */
export function PaywallGate({ gate, children, fallback }: PaywallGateProps) {
  const [status, setStatus] = useState<"loading" | "allowed" | "blocked">("loading")
  const [gateLabel, setGateLabel] = useState("")
  const [upgradeRoute, setUpgradeRoute] = useState("/pricing")
  const [upgradeMessage, setUpgradeMessage] = useState("")

  const checkAccess = useCallback(async () => {
    // Fast path: if paywall is disabled, always allow
    if (!PAYWALL_ENABLED) {
      setStatus("allowed")
      return
    }

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      const result = checkGate(gate, {
        isAuthenticated: false,
        accountType: null,
        businessTier: null,
      })
      setGateLabel(result.gate.label)
      setUpgradeRoute(result.gate.upgradeRoute)
      setUpgradeMessage(result.gate.upgradeMessage)
      setStatus(result.allowed ? "allowed" : "blocked")
      return
    }

    // Fetch account type and business tier from user_preferences
    let accountType: "standard" | "creator" | "business" = "standard"
    let businessTier: "basic" | "premium" | "enterprise" | null = null

    const { data: prefs } = await supabase
      .from("user_preferences")
      .select("business_preferences")
      .eq("user_id", session.user.id)
      .single()

    if (prefs?.business_preferences) {
      const bp = prefs.business_preferences as any
      if (bp.isBusinessMode && bp.selectedType) {
        accountType = bp.selectedType
      }
    }

    // If business account, check actual subscription tier
    if (accountType === "business") {
      const { data: biz } = await supabase
        .from("businesses")
        .select("id, business_tier")
        .eq("user_id", session.user.id)
        .single()

      if (biz) {
        businessTier = (biz.business_tier || "basic") as "basic" | "premium" | "enterprise"

        // Also check actual subscription status
        const { data: sub } = await supabase
          .from("business_subscriptions")
          .select("tier, status")
          .eq("business_id", biz.id)
          .eq("status", "active")
          .single()

        if (sub) {
          businessTier = sub.tier as "basic" | "premium" | "enterprise"
        }
      }
    }

    const result = checkGate(gate, {
      isAuthenticated: true,
      accountType,
      businessTier,
    })

    setGateLabel(result.gate.label)
    setUpgradeRoute(result.gate.upgradeRoute)
    setUpgradeMessage(result.gate.upgradeMessage)
    setStatus(result.allowed ? "allowed" : "blocked")
  }, [gate])

  useEffect(() => {
    checkAccess()
  }, [checkAccess])

  // Loading state
  if (status === "loading") {
    return (
      <div className="flex flex-col gap-6">
        <Card className="animate-pulse border-border">
          <CardContent className="pt-6">
            <div className="h-20 bg-muted rounded" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Allowed — render children
  if (status === "allowed") {
    return <>{children}</>
  }

  // Blocked — render fallback or default upgrade prompt
  if (fallback) {
    return <>{fallback}</>
  }

  return (
    <Card className="border-border">
      <CardContent className="py-16 text-center">
        <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Lock className="size-8 text-primary" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">{gateLabel}</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
          {upgradeMessage}
        </p>
        <Button className="btn-sunset" asChild>
          <Link href={upgradeRoute}>
            <Sparkles className="mr-2 size-4" />
            View Plans
            <ArrowRight className="ml-2 size-3" />
          </Link>
        </Button>
        <div className="mt-4">
          <Badge variant="secondary" className="text-[10px]">
            Subscription required
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
