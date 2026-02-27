"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/providers/auth-provider"
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
} from "lucide-react"
import { USER_TIERS, BUSINESS_TIERS } from "@/lib/tiers"
import type { BusinessTierSlug } from "@/lib/tiers"

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
    href: "/creator-tier",
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
  const [selectedType, setSelectedType] = useState("standard")
  const [isBusinessMode, setIsBusinessMode] = useState(false)
  const [selectedBusinessTier, setSelectedBusinessTier] = useState<BusinessTierSlug>("basic")
  const [loaded, setLoaded] = useState(false)

  // Load business preferences from database
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
            // If professional mode is on, ensure Personal is not selected
            const type = prefs.isBusinessMode && prefs.selectedType === "standard" ? "creator" : prefs.selectedType
            setSelectedType(type)
          }
          if (prefs.selectedBusinessTier) {
            setSelectedBusinessTier(prefs.selectedBusinessTier)
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
    setSelectedBusinessTier(tier)
    savePreferences(isBusinessMode, selectedType, tier)

    // Also update the actual business tables so the rest of the app reflects the change
    if (!user) return
    try {
      const supabase = createClient()
      const { data: biz } = await supabase
        .from("businesses")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (!biz) return

      // Update businesses.business_tier
      await supabase
        .from("businesses")
        .update({ business_tier: tier })
        .eq("id", biz.id)

      // Upsert active subscription row so getEffectiveTier() picks up the change
      const { data: existingSub } = await supabase
        .from("business_subscriptions")
        .select("id")
        .eq("business_id", biz.id)
        .eq("status", "active")
        .single()

      if (existingSub) {
        await supabase
          .from("business_subscriptions")
          .update({ tier, updated_at: new Date().toISOString() })
          .eq("id", existingSub.id)
      } else {
        await supabase.from("business_subscriptions").insert({
          business_id: biz.id,
          tier,
          status: "active",
          updated_at: new Date().toISOString(),
        })
      }
    } catch (error) {
      console.error("Error updating business tier:", error)
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
                {BUSINESS_TIERS.map((tier) => {
                  const isSelected = selectedBusinessTier === tier.slug
                  return (
                    <button
                      key={tier.slug}
                      onClick={() => handleSelectBusinessTier(tier.slug)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/30 hover:bg-muted/50"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{tier.name}</p>
                          {tier.highlighted && (
                            <Badge className="bg-tinerary-peach text-tinerary-dark border-0 text-xs">Popular</Badge>
                          )}
                          {isSelected && (
                            <Badge className="bg-primary text-primary-foreground text-xs">Current</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">${tier.price}/{tier.priceSuffix}</p>
                      </div>
                      {isSelected ? (
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
                <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
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
