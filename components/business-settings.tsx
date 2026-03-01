"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
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
  Lock,
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
import { createBusiness } from "@/app/actions/business-actions"

const CATEGORIES = [
  "Accommodation",
  "Activities & Tours",
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Wellness & Spa",
  "Travel Services",
  "Other",
]

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
  },
  {
    href: "/business-profile",
    icon: <Store className="size-4 text-primary" />,
    title: "Business Hub",
    description: "Deals, analytics, mentions & all business tools",
    forType: ["business"],
  },
  {
    href: "/affiliate",
    icon: <Link2 className="size-4 text-blue-500" />,
    title: "Affiliate Marketing",
    description: "Referral links & packing list commerce",
    forType: ["creator", "business"],
  },
  {
    href: "/coins",
    icon: <Coins className="size-4 text-tinerary-gold" />,
    title: "Tinerary Coins",
    description: "Earn & spend rewards",
    forType: ["standard", "creator", "business"],
  },
  {
    href: "/pricing",
    icon: <Crown className="size-4 text-tinerary-gold" />,
    title: "Plans & Pricing",
    description: "Compare all tiers and features",
    forType: ["standard", "creator", "business"],
  },
]

export function BusinessSettings() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [selectedType, setSelectedType] = useState("standard")
  const [isBusinessMode, setIsBusinessMode] = useState(false)
  const [selectedBusinessTier, setSelectedBusinessTier] = useState<BusinessTierSlug>("basic")
  const [loaded, setLoaded] = useState(false)
  const [hasBusinessRecord, setHasBusinessRecord] = useState(false)
  const [subscription, setSubscription] = useState<BusinessSubscription | null>(null)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Setup dialog state
  const [setupOpen, setSetupOpen] = useState(false)
  const [setupName, setSetupName] = useState("")
  const [setupCategory, setSetupCategory] = useState("")
  const [setupDescription, setSetupDescription] = useState("")
  const [setupWebsite, setSetupWebsite] = useState("")
  const [setupSubmitting, setSetupSubmitting] = useState(false)
  const [setupError, setSetupError] = useState<string | null>(null)

  // Load business preferences, subscription, and check for existing business record
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return

      try {
        const supabase = createClient()

        // Check if a businesses row exists and load subscription
        const { data: biz } = await supabase
          .from("businesses")
          .select("id")
          .eq("user_id", user.id)
          .single()

        setHasBusinessRecord(!!biz)

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

        // Load preferences
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
          // Only use preference tier if no subscription overrides it
          if (prefs.selectedBusinessTier && !subscription) {
            setSelectedBusinessTier(prefs.selectedBusinessTier)
          }
        }

        // Pre-fill setup form from profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, bio, website")
          .eq("id", user.id)
          .single()

        if (profile) {
          if (profile.name) setSetupName(profile.name)
          if (profile.bio) setSetupDescription(profile.bio)
          if (profile.website) setSetupWebsite(profile.website)
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
    if (!user) return

    if (!subscription) {
      // No existing subscription — just save preference.
      // The user still needs to go through the setup dialog to create
      // the actual business record.
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

  const handleSetupSubmit = async () => {
    setSetupError(null)
    setSetupSubmitting(true)

    const formData = new FormData()
    formData.set("name", setupName)
    formData.set("category", setupCategory)
    formData.set("description", setupDescription)
    formData.set("website", setupWebsite)
    formData.set("tier", selectedBusinessTier)

    try {
      const result = await createBusiness(formData)

      if (result && "success" in result) {
        if (result.success) {
          setHasBusinessRecord(true)
          setBusinessId(result.data?.id || null)
          setSetupOpen(false)

          // Reload subscription data for the newly created business
          if (result.data?.id) {
            const supabase = createClient()
            const { data: sub } = await supabase
              .from("business_subscriptions")
              .select("*")
              .eq("business_id", result.data.id)
              .single()

            if (sub) {
              setSubscription(sub as BusinessSubscription)
            }
          }
        } else {
          setSetupError(result.error || "Something went wrong.")
        }
      }
    } catch {
      setSetupError("Something went wrong. Please try again.")
    } finally {
      setSetupSubmitting(false)
    }
  }

  // Filter dashboard links based on active account type
  const visibleLinks = dashboardLinks.filter((l) => l.forType.includes(selectedType))

  // Whether tools should be locked (business type selected but no business record)
  const toolsLocked = isBusinessMode && selectedType === "business" && !hasBusinessRecord

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
          {toolsLocked ? (
            <div className="text-center py-6">
              <div className="size-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                <Lock className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Set up your business to unlock tools
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                Create your business profile to access the Business Hub, analytics, deals, and more.
              </p>
              <Button
                className="btn-sunset mt-4"
                onClick={() => setSetupOpen(true)}
              >
                <Store className="size-4 mr-2" />
                Set Up Your Business
              </Button>
            </div>
          ) : (
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
          )}
        </CardContent>
      </Card>

      {/* Business Setup Dialog */}
      <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Up Your Business</DialogTitle>
            <DialogDescription>
              Tell us about your business to get started. You can update these details later.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="setup-name">
                Business Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="setup-name"
                value={setupName}
                onChange={(e) => setSetupName(e.target.value)}
                placeholder="e.g. Sunset Beach Resort"
                maxLength={100}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="setup-category">
                Category <span className="text-destructive">*</span>
              </Label>
              <select
                id="setup-category"
                value={setupCategory}
                onChange={(e) => setSetupCategory(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="setup-desc">Description</Label>
              <Textarea
                id="setup-desc"
                value={setupDescription}
                onChange={(e) => setSetupDescription(e.target.value)}
                placeholder="What your business offers to travelers..."
                maxLength={500}
                rows={3}
              />
              <p className="text-xs text-muted-foreground text-right">
                {setupDescription.length}/500
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="setup-website">Website</Label>
              <Input
                id="setup-website"
                value={setupWebsite}
                onChange={(e) => setSetupWebsite(e.target.value)}
                placeholder="https://yourbusiness.com"
              />
            </div>

            {/* Selected tier badge */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border border-border">
              <Crown className="size-4 text-tinerary-gold" />
              <span className="text-xs text-muted-foreground">Plan:</span>
              <Badge variant="secondary" className="text-xs">
                {BUSINESS_TIERS.find((t) => t.slug === selectedBusinessTier)?.name || "Basic"} — $
                {BUSINESS_TIERS.find((t) => t.slug === selectedBusinessTier)?.price || "49"}/
                {BUSINESS_TIERS.find((t) => t.slug === selectedBusinessTier)?.priceSuffix || "mo"}
              </Badge>
            </div>

            {setupError && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                {setupError}
              </p>
            )}

            <Button
              className="btn-sunset w-full"
              disabled={!setupName.trim() || !setupCategory || setupSubmitting}
              onClick={handleSetupSubmit}
            >
              {setupSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Create Business
                  <ArrowRight className="ml-2 size-4" />
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
