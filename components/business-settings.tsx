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
  Lock,
  Loader2,
} from "lucide-react"
import { USER_TIERS, BUSINESS_TIERS } from "@/lib/tiers"
import type { BusinessTierSlug } from "@/lib/tiers"
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
  const [selectedType, setSelectedType] = useState("standard")
  const [isBusinessMode, setIsBusinessMode] = useState(false)
  const [selectedBusinessTier, setSelectedBusinessTier] = useState<BusinessTierSlug>("basic")
  const [loaded, setLoaded] = useState(false)
  const [hasBusinessRecord, setHasBusinessRecord] = useState(false)

  // Setup dialog state
  const [setupOpen, setSetupOpen] = useState(false)
  const [setupName, setSetupName] = useState("")
  const [setupCategory, setSetupCategory] = useState("")
  const [setupDescription, setSetupDescription] = useState("")
  const [setupWebsite, setSetupWebsite] = useState("")
  const [setupSubmitting, setSetupSubmitting] = useState(false)
  const [setupError, setSetupError] = useState<string | null>(null)

  // Load business preferences and check for existing business record
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return

      try {
        const supabase = createClient()

        // Check if a businesses row exists
        const { data: biz } = await supabase
          .from("businesses")
          .select("id")
          .eq("user_id", user.id)
          .single()

        setHasBusinessRecord(!!biz)

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
          if (prefs.selectedBusinessTier) {
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
    setSelectedBusinessTier(tier)
    savePreferences(isBusinessMode, selectedType, tier)

    // If a business record already exists, update it
    if (!user || !hasBusinessRecord) return
    try {
      const supabase = createClient()
      const { data: biz } = await supabase
        .from("businesses")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (!biz) return

      await supabase
        .from("businesses")
        .update({ business_tier: tier })
        .eq("id", biz.id)

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
          setSetupOpen(false)
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
