"use client"

import { useCallback, useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import { Lock, ArrowRight, Sparkles, SkipForward, Shield } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import {
  PAYWALL_ENABLED,
  ADMIN_PAYWALL_STORAGE_KEY,
  PAYWALL_GATES,
  meetsMinimumTier,
  checkGate,
  type PaywallGateId,
} from "@/lib/paywall"
import type { BusinessTierSlug } from "@/lib/tiers"

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
 * Evaluates gate logic without respecting the global PAYWALL_ENABLED flag.
 * Used when an admin has toggled paywall testing on in their session
 * while the global flag is still off.
 */
function evaluateGate(
  gateId: PaywallGateId,
  context: {
    isAuthenticated: boolean
    accountType: "standard" | "creator" | "business" | null
    businessTier: BusinessTierSlug | null
  }
): { allowed: boolean } {
  const gate = PAYWALL_GATES[gateId]

  if (!context.isAuthenticated) {
    return { allowed: false }
  }

  if (gate.requiredAccountType && context.accountType !== gate.requiredAccountType) {
    if (gate.requiredAccountType === "creator" && context.accountType === "business") {
      // business includes creator features — allow
    } else {
      return { allowed: false }
    }
  }

  if (gate.requiredTier && context.accountType === "business") {
    const effectiveTier = context.businessTier || "basic"
    if (!meetsMinimumTier(effectiveTier, gate.requiredTier)) {
      return { allowed: false }
    }
  }

  return { allowed: true }
}

/**
 * Wraps protected content with a paywall check.
 *
 * When `PAYWALL_ENABLED` is false (testing phase), children are
 * always rendered — unless the current user is an admin who has
 * toggled their personal paywall testing mode on via admin settings.
 *
 * Admin users who are blocked see a "Skip" button so they can
 * bypass the gate and continue inspecting the underlying page.
 * Normal users never see the skip button.
 */
export function PaywallGate({ gate, children, fallback }: PaywallGateProps) {
  const [status, setStatus] = useState<"loading" | "allowed" | "blocked">("loading")
  const [gateLabel, setGateLabel] = useState("")
  const [upgradeRoute, setUpgradeRoute] = useState("/pricing")
  const [upgradeMessage, setUpgradeMessage] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminSkipped, setAdminSkipped] = useState(false)

  const checkAccess = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    // Determine if the current user is an admin
    let userIsAdmin = false
    if (session) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin, role")
        .eq("id", session.user.id)
        .single()

      userIsAdmin = profile?.is_admin === true || profile?.role === "admin"
      setIsAdmin(userIsAdmin)
    }

    // Determine effective paywall state:
    // - If admin has toggled paywall testing on via localStorage, use that
    // - Otherwise fall back to the global PAYWALL_ENABLED constant
    let paywallActive = PAYWALL_ENABLED
    if (userIsAdmin && typeof window !== "undefined") {
      const adminOverride = localStorage.getItem(ADMIN_PAYWALL_STORAGE_KEY)
      if (adminOverride !== null) {
        paywallActive = adminOverride === "true"
      }
    }

    // Fast path: if paywall is not active, always allow
    if (!paywallActive) {
      setStatus("allowed")
      return
    }

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

    const gateConfig = PAYWALL_GATES[gate]
    setGateLabel(gateConfig.label)
    setUpgradeRoute(gateConfig.upgradeRoute)
    setUpgradeMessage(gateConfig.upgradeMessage)

    // When global PAYWALL_ENABLED is off but admin has it on,
    // checkGate() would bypass — so evaluate manually instead.
    if (!PAYWALL_ENABLED && paywallActive) {
      const { allowed } = evaluateGate(gate, {
        isAuthenticated: true,
        accountType,
        businessTier,
      })
      setStatus(allowed ? "allowed" : "blocked")
      return
    }

    const result = checkGate(gate, {
      isAuthenticated: true,
      accountType,
      businessTier,
    })
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

  // Allowed — render children (with bypass banner if admin skipped)
  if (status === "allowed" || adminSkipped) {
    return (
      <>
        {adminSkipped && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200">
            <Shield className="size-4 shrink-0" />
            <span>Admin bypass active — this gate (<strong>{gateLabel}</strong>) would block normal users.</span>
          </div>
        )}
        {children}
      </>
    )
  }

  // Blocked — render fallback or default upgrade prompt
  // Admin users always get the skip bar above the blocked content
  if (fallback) {
    return (
      <>
        {isAdmin && <AdminSkipBar gateLabel={gateLabel} onSkip={() => setAdminSkipped(true)} />}
        {fallback}
      </>
    )
  }

  return (
    <>
      {isAdmin && <AdminSkipBar gateLabel={gateLabel} onSkip={() => setAdminSkipped(true)} />}
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
    </>
  )
}

/** Admin-only skip banner shown when a paywall blocks an admin user. */
function AdminSkipBar({
  gateLabel,
  onSkip,
}: {
  gateLabel: string
  onSkip: () => void
}) {
  return (
    <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-700 dark:bg-amber-950/30">
      <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200">
        <Shield className="size-4 shrink-0" />
        <span>
          Admin testing — <strong>{gateLabel}</strong> paywall is active.
        </span>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="border-amber-400 text-amber-800 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-200 dark:hover:bg-amber-900/40"
        onClick={onSkip}
      >
        <SkipForward className="mr-1.5 size-3.5" />
        Skip Paywall
      </Button>
    </div>
  )
}
