"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/providers/auth-provider"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import {
  Briefcase,
  Crown,
  Sparkles,
  Users,
  Store,
  Link2,
  Coins,
  ArrowRight,
  Check,
  ChevronRight,
  AlertCircle,
  Clock,
  ArrowDown,
  ArrowUp,
  RotateCcw,
  XCircle,
  Loader2,
} from "lucide-react"
import { USER_TIERS, BUSINESS_TIERS } from "@/lib/tiers"
import { STANDARD_PRICES } from "@/lib/paywall"
import type { BusinessTierSlug } from "@/lib/tiers"
import type { BusinessSubscription } from "@/lib/business-tier-service"
import {
  cancelSubscription,
  resubscribe,
  changeTier,
  calculateProratedAmount,
  getSubscriptionStatus,
} from "@/lib/subscription-lifecycle"

const accountTypes = [
  {
    id: "standard",
    label: "Personal",
    description: "Free forever — plan trips, discover, and share itineraries.",
    icon: <Users className="size-5" />,
    color: "bg-tinerary-dark",
  },
  {
    id: "creator",
    label: "Creator",
    description: "Boost posts, sell templates, earn enhanced affiliate commissions.",
    icon: <Sparkles className="size-5" />,
    color: "bg-[#7C3AED]",
    price: "$49/mo",
  },
  {
    id: "business",
    label: "Business",
    description: "List promotions, get analytics, connect with travelers.",
    icon: <Store className="size-5" />,
    color: "bg-primary",
    price: "$49–$399/mo",
  },
]

const dashboardLinks = [
  {
    href: "/creator",
    icon: <Sparkles className="size-4 text-[#7C3AED]" />,
    title: "Creator Dashboard",
    description: "Post boosts, benefits & tier management",
    forType: ["creator"],
    forTier: null,
  },
  {
    href: "/business-profile",
    icon: <Store className="size-4 text-primary" />,
    title: "Business Hub",
    description: "Deals, analytics, mentions & all business tools",
    forType: ["business"],
    forTier: null,
  },
  {
    href: "/affiliate",
    icon: <Link2 className="size-4 text-blue-500" />,
    title: "Affiliate Marketing",
    description: "Referral links & packing list commerce",
    forType: ["creator", "business"],
    forTier: null,
  },
  {
    href: "/coins",
    icon: <Coins className="size-4 text-tinerary-gold" />,
    title: "Tinerary Coins",
    description: "Earn & spend rewards",
    forType: ["standard", "creator", "business"],
    forTier: null,
  },
  {
    href: "/pricing",
    icon: <Crown className="size-4 text-tinerary-gold" />,
    title: "Plans & Pricing",
    description: "Compare all tiers and features",
    forType: ["standard", "creator", "business"],
    forTier: null,
  },
]

export function BusinessSettings() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [selectedType, setSelectedType] = useState("standard")
  const [isBusinessMode, setIsBusinessMode] = useState(false)
  const [selectedBusinessTier, setSelectedBusinessTier] = useState<BusinessTierSlug>("basic")
  const [loaded, setLoaded] = useState(false)
  const [subscription, setSubscription] = useState<BusinessSubscription | null>(null)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Load business preferences and subscription from database
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return

      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("user_preferences")
          .select("business_preferences")
          .eq("user_id", user.id)
          .single()

        if (error && error.code !== "PGRST116") {
          console.error("Error loading business preferences:", error)
          return
        }

        if (data?.business_preferences) {
          const prefs = data.business_preferences
          if (typeof prefs.isBusinessMode === "boolean") setIsBusinessMode(prefs.isBusinessMode)
          if (prefs.selectedType) {
            const type = prefs.isBusinessMode && prefs.selectedType === "standard" ? "creator" : prefs.selectedType
            setSelectedType(type)
          }
          if (prefs.selectedBusinessTier) {
            setSelectedBusinessTier(prefs.selectedBusinessTier)
          }
        }

        // Load actual subscription data
        const { data: biz } = await supabase
          .from("businesses")
          .select("id")
          .eq("user_id", user.id)
          .single()

        if (biz) {
          setBusinessId(biz.id)
          const { data: sub } = await supabase
            .from("business_subscriptions")
            .select("*")
            .eq("business_id", biz.id)
            .single()

          if (sub) {
            setSubscription(sub as BusinessSubscription)
            setSelectedBusinessTier(sub.tier as BusinessTierSlug)
          }
        }
      } catch (error) {
        console.error("Error loading business preferences:", error)
      } finally {
        setLoaded(true)
      }
    }

    loadPreferences()
  }, [user])

  // Persist business preferences whenever they change
  const savePreferences = useCallback(
    async (mode: boolean, type: string, businessTier?: BusinessTierSlug) => {
      if (!user || !loaded) return

      try {
        const supabase = createClient()
        const businessPreferences = {
          isBusinessMode: mode,
          selectedType: type,
          selectedBusinessTier: businessTier ?? selectedBusinessTier,
        }

        const { error: updateError } = await supabase
          .from("user_preferences")
          .update({
            business_preferences: businessPreferences,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)

        if (updateError && updateError.code === "PGRST116") {
          await supabase.from("user_preferences").insert({
            user_id: user.id,
            business_preferences: businessPreferences,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        }
      } catch (error) {
        console.error("Error saving business preferences:", error)
      }
    },
    [user, loaded, selectedBusinessTier],
  )

  const handleToggleBusinessMode = (checked: boolean) => {
    setIsBusinessMode(checked)
    if (checked) {
      // Default to creator when enabling professional mode (Personal is not a professional type)
      const newType = selectedType === "standard" ? "creator" : selectedType
      setSelectedType(newType)
      savePreferences(checked, newType)
    } else {
      setSelectedType("standard")
      savePreferences(checked, "standard")
    }
  }

  const handleSelectType = (type: string) => {
    setSelectedType(type)
    savePreferences(isBusinessMode, type)
  }

  const handleSelectBusinessTier = async (tier: BusinessTierSlug) => {
    if (!user || !subscription) {
      // No existing subscription — just save preference (original fallback)
      setSelectedBusinessTier(tier)
      savePreferences(isBusinessMode, selectedType, tier)
      return
    }

    if (tier === subscription.tier && !subscription.pending_tier) return

    setActionLoading(true)
    try {
      const result = await changeTier(subscription.id, tier)

      if (!result.success) {
        toast({
          title: "Error",
          description: result.error || "Failed to change plan.",
          variant: "destructive",
        })
        return
      }

      if (result.subscription) {
        setSubscription(result.subscription)
        setSelectedBusinessTier(result.subscription.tier as BusinessTierSlug)
        savePreferences(isBusinessMode, selectedType, result.subscription.tier as BusinessTierSlug)
      }

      const subStatus = result.subscription ? getSubscriptionStatus(result.subscription) : null

      if (subStatus?.pendingDowngradeTo) {
        const downTier = BUSINESS_TIERS.find(t => t.slug === subStatus.pendingDowngradeTo)
        toast({
          title: "Downgrade scheduled",
          description: `Your plan will switch to ${downTier?.name || tier} at the start of your next billing period. You keep all current features until then.`,
        })
      } else if (result.chargeAmount && result.chargeAmount > 0) {
        toast({
          title: "Plan upgraded",
          description: `Upgraded successfully. Prorated charge: $${result.chargeAmount.toFixed(2)} for the remainder of this billing period.`,
        })
      } else {
        toast({
          title: "Plan updated",
          description: "Your subscription has been updated.",
        })
      }

      // Update the businesses table to reflect upgrades (immediate tier changes)
      if (result.subscription && !subStatus?.pendingDowngradeTo) {
        const supabase = createClient()
        const { data: biz } = await supabase
          .from("businesses")
          .select("id")
          .eq("user_id", user.id)
          .single()

        if (biz) {
          await supabase
            .from("businesses")
            .update({ business_tier: result.subscription.tier })
            .eq("id", biz.id)
        }
      }
    } catch (error) {
      console.error("Error changing business tier:", error)
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!subscription) return
    setActionLoading(true)
    try {
      const result = await cancelSubscription(subscription.id)
      if (!result.success) {
        toast({
          title: "Error",
          description: result.error || "Failed to cancel subscription.",
          variant: "destructive",
        })
        return
      }
      if (result.subscription) {
        setSubscription(result.subscription)
      }
      const periodEnd = subscription.current_period_end
        ? new Date(subscription.current_period_end).toLocaleDateString()
        : "the end of your billing period"
      toast({
        title: "Subscription canceled",
        description: `You'll keep access to all features until ${periodEnd}. You can resubscribe anytime before then without being charged again.`,
      })
    } catch (error) {
      console.error("Error canceling subscription:", error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleResubscribe = async () => {
    if (!subscription) return
    setActionLoading(true)
    try {
      const result = await resubscribe(subscription.id)
      if (!result.success) {
        toast({
          title: "Error",
          description: result.error || "Failed to resubscribe.",
          variant: "destructive",
        })
        return
      }
      if (result.subscription) {
        setSubscription(result.subscription)
      }
      toast({
        title: "Welcome back!",
        description: "Your subscription has been reactivated. No additional charge for this billing period.",
      })
    } catch (error) {
      console.error("Error resubscribing:", error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelPendingDowngrade = async () => {
    if (!subscription) return
    setActionLoading(true)
    try {
      // Re-select the current tier to clear pending_tier
      const result = await changeTier(subscription.id, subscription.tier as BusinessTierSlug)
      if (result.success && result.subscription) {
        setSubscription(result.subscription)
        toast({
          title: "Downgrade canceled",
          description: `You'll stay on the ${BUSINESS_TIERS.find(t => t.slug === subscription.tier)?.name || subscription.tier} plan.`,
        })
      }
    } catch (error) {
      console.error("Error canceling downgrade:", error)
    } finally {
      setActionLoading(false)
    }
  }

  // Filter dashboard links based on active account type and business tier
  const visibleLinks = dashboardLinks.filter((l) => {
    if (!l.forType.includes(selectedType)) return false
    // If the link has tier restrictions and we're in business mode, filter by tier
    if (l.forTier && selectedType === "business") {
      return l.forTier.includes(selectedBusinessTier)
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Switch to Professional Account */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-br from-tinerary-salmon to-primary flex items-center justify-center">
              <Briefcase className="size-5 text-white" />
            </div>
            <div>
              <CardTitle>Professional Account</CardTitle>
              <CardDescription>
                Switch to a Creator or Business account to unlock professional tools
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted mb-6">
            <div>
              <p className="text-sm font-medium text-foreground">Enable professional features</p>
              <p className="text-xs text-muted-foreground">
                Like Instagram&apos;s professional mode — activates business tools alongside your personal account
              </p>
            </div>
            <Switch
              checked={isBusinessMode}
              onCheckedChange={handleToggleBusinessMode}
            />
          </div>

          {/* Account Type Selection */}
          <div className="grid gap-3">
            {accountTypes.map((type) => {
              const isSelected = selectedType === type.id
              const isLocked = (!isBusinessMode && type.id !== "standard") || (isBusinessMode && type.id === "standard")
              return (
                <button
                  key={type.id}
                  onClick={() => !isLocked && handleSelectType(type.id)}
                  disabled={isLocked}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : isLocked
                      ? "border-border opacity-50 cursor-not-allowed"
                      : "border-border hover:border-primary/30 hover:bg-muted/50 cursor-pointer"
                  }`}
                >
                  <div className={`size-10 rounded-lg ${type.color} flex items-center justify-center shrink-0 text-white`}>
                    {type.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{type.label}</p>
                      {type.price && (
                        <Badge variant="secondary" className="text-xs">{type.price}</Badge>
                      )}
                      {isSelected && (
                        <Badge className="bg-primary text-primary-foreground text-xs">Current</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{type.description}</p>
                  </div>
                  {isSelected && <Check className="size-5 text-primary shrink-0" />}
                </button>
              )
            })}
          </div>

          {!isBusinessMode && (
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Turn on professional features above to switch to Creator or Business.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Current Plan Details */}
      {isBusinessMode && selectedType !== "standard" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {selectedType === "creator" ? "Creator Plan" : "Business Plan"}
            </CardTitle>
            <CardDescription>
              {selectedType === "creator"
                ? "You're on the Creator tier at $49/month."
                : "Choose a Business subscription that fits your needs."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedType === "creator" ? (
              <div className="space-y-2">
                {USER_TIERS.find((t) => t.slug === "creator")?.features.map((f) => (
                  <div key={f} className="flex items-start gap-2">
                    <Check className="size-4 text-tinerary-salmon shrink-0 mt-0.5" />
                    <span className="text-xs text-foreground">{f}</span>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
                  <Link href="/creators">
                    View full Creator details
                    <ArrowRight className="ml-2 size-3" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-3">
                {/* Subscription status banners */}
                {subscription?.cancel_at_period_end && (
                  <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800 dark:text-amber-200">
                      <span className="font-medium">Cancellation pending.</span>{" "}
                      You have access to all {BUSINESS_TIERS.find(t => t.slug === subscription.tier)?.name} features until{" "}
                      {new Date(subscription.current_period_end).toLocaleDateString()}.
                      <Button
                        variant="link"
                        size="sm"
                        className="text-amber-800 dark:text-amber-200 underline p-0 h-auto ml-1"
                        onClick={handleResubscribe}
                        disabled={actionLoading}
                      >
                        Resubscribe (no charge)
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {subscription?.pending_tier && !subscription.cancel_at_period_end && (
                  <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800">
                    <ArrowDown className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                      <span className="font-medium">Downgrade scheduled.</span>{" "}
                      Your plan will switch to {BUSINESS_TIERS.find(t => t.slug === subscription.pending_tier)?.name} on{" "}
                      {new Date(subscription.current_period_end).toLocaleDateString()}.
                      You keep all {BUSINESS_TIERS.find(t => t.slug === subscription.tier)?.name} features until then.
                      <Button
                        variant="link"
                        size="sm"
                        className="text-blue-800 dark:text-blue-200 underline p-0 h-auto ml-1"
                        onClick={handleCancelPendingDowngrade}
                        disabled={actionLoading}
                      >
                        Cancel downgrade
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {BUSINESS_TIERS.map((tier) => {
                  const isCurrent = subscription?.tier === tier.slug
                  const isPendingDowngrade = subscription?.pending_tier === tier.slug
                  const isUpgradeFromCurrent = subscription && STANDARD_PRICES[tier.slug] > STANDARD_PRICES[subscription.tier as BusinessTierSlug]
                  const isDowngradeFromCurrent = subscription && STANDARD_PRICES[tier.slug] < STANDARD_PRICES[subscription.tier as BusinessTierSlug]

                  // Calculate proration preview for upgrades
                  let prorationPreview: string | null = null
                  if (isUpgradeFromCurrent && subscription?.current_period_start && subscription?.current_period_end) {
                    const { proratedAmount, daysRemaining } = calculateProratedAmount(
                      subscription.tier as BusinessTierSlug,
                      tier.slug,
                      subscription.current_period_start,
                      subscription.current_period_end
                    )
                    if (proratedAmount > 0) {
                      prorationPreview = `$${proratedAmount.toFixed(2)} prorated for ${daysRemaining} days remaining`
                    }
                  }

                  return (
                    <button
                      key={tier.slug}
                      onClick={() => handleSelectBusinessTier(tier.slug)}
                      disabled={actionLoading || (isCurrent && !subscription?.pending_tier && !subscription?.cancel_at_period_end)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        isCurrent
                          ? "border-primary bg-primary/5 shadow-sm"
                          : isPendingDowngrade
                          ? "border-blue-300 bg-blue-50/50 dark:border-blue-700 dark:bg-blue-950/20"
                          : "border-border hover:border-primary/30 hover:bg-muted/50"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{tier.name}</p>
                          {tier.highlighted && (
                            <Badge className="bg-tinerary-peach text-tinerary-dark border-0 text-xs">Popular</Badge>
                          )}
                          {isCurrent && (
                            <Badge className="bg-primary text-primary-foreground text-xs">Current</Badge>
                          )}
                          {isPendingDowngrade && (
                            <Badge variant="outline" className="text-blue-600 border-blue-300 text-xs">
                              <Clock className="size-3 mr-1" />
                              Scheduled
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">${tier.price}/{tier.priceSuffix}</p>
                        {isUpgradeFromCurrent && prorationPreview && (
                          <p className="text-xs text-green-600 mt-0.5 flex items-center gap-1">
                            <ArrowUp className="size-3" />
                            Upgrade: {prorationPreview}
                          </p>
                        )}
                        {isDowngradeFromCurrent && !isPendingDowngrade && (
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <ArrowDown className="size-3" />
                            Takes effect next billing period
                          </p>
                        )}
                      </div>
                      {actionLoading ? (
                        <Loader2 className="size-4 animate-spin text-muted-foreground shrink-0" />
                      ) : isCurrent ? (
                        <Check className="size-5 text-primary shrink-0" />
                      ) : (
                        <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                      )}
                    </button>
                  )
                })}
                {/* Features for the selected business tier */}
                {(() => {
                  const activeTier = BUSINESS_TIERS.find((t) => t.slug === selectedBusinessTier)
                  if (!activeTier) return null
                  return (
                    <div className="mt-3 p-3 rounded-xl bg-muted/50 border border-border">
                      <p className="text-xs font-semibold text-foreground mb-2">
                        {activeTier.name} Plan — ${activeTier.price}/{activeTier.priceSuffix}
                      </p>
                      <div className="space-y-1.5">
                        {activeTier.features.map((f) => (
                          <div key={f} className="flex items-start gap-2">
                            <Check className="size-3.5 text-primary shrink-0 mt-0.5" />
                            <span className="text-xs text-muted-foreground">{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}

                {/* Cancel / Resubscribe button */}
                {subscription && subscription.status === "active" && !subscription.cancel_at_period_end && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    onClick={handleCancelSubscription}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="mr-2 size-3 animate-spin" />
                    ) : (
                      <XCircle className="mr-2 size-3" />
                    )}
                    Cancel subscription
                  </Button>
                )}

                {subscription?.cancel_at_period_end && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                    onClick={handleResubscribe}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="mr-2 size-3 animate-spin" />
                    ) : (
                      <RotateCcw className="mr-2 size-3" />
                    )}
                    Resubscribe (no additional charge)
                  </Button>
                )}

                <Button variant="outline" size="sm" className="mt-1 w-full" asChild>
                  <Link href="/business">
                    Compare all business plans
                    <ArrowRight className="ml-2 size-3" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dashboard & Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tools & Dashboards</CardTitle>
          <CardDescription>
            {isBusinessMode
              ? "Access your professional tools and dashboards."
              : "Explore what's available on Tinerary."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {visibleLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors group"
              >
                <div className="size-9 rounded-lg bg-muted group-hover:bg-background flex items-center justify-center shrink-0">
                  {link.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{link.title}</p>
                  <p className="text-xs text-muted-foreground">{link.description}</p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground shrink-0" />
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
