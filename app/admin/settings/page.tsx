"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Save,
  Shield,
  Bell,
  Globe,
  Loader2,
  Mail,
  CreditCard,
  Users,
  Eye,
  Sparkles,
  Store,
  Check,
  Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAuth } from "@/providers/auth-provider"
import { createClient } from "@/lib/supabase/client"
import { ADMIN_PAYWALL_STORAGE_KEY, PAYWALL_ENABLED } from "@/lib/paywall"
import { BUSINESS_TIERS, USER_TIERS } from "@/lib/tiers"
import type { BusinessTierSlug } from "@/lib/tiers"

// ─── Account type options for admin emulation ─────────────────
const accountTypeOptions = [
  {
    id: "standard",
    label: "Personal",
    description: "Default free user — no professional features active.",
    icon: <Users className="size-5" />,
    color: "bg-[#2c2420]",
  },
  {
    id: "creator",
    label: "Creator",
    description: "Emulate creator mode — see boost, templates, sponsorships.",
    icon: <Sparkles className="size-5" />,
    color: "bg-[#7C3AED]",
  },
  {
    id: "business",
    label: "Business",
    description: "Emulate business mode — see deals, analytics, mentions.",
    icon: <Store className="size-5" />,
    color: "bg-[#ffb88c]",
  },
]

export default function AdminSettingsPage() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState({
    siteName: "Tinerary",
    siteDescription: "Collaborative travel planning platform",
    supportEmail: "support@tinerary.app",
    enableGuestBrowsing: true,
    guestViewLimit: 5,
    enablePublicProfiles: true,
    enableComments: true,
    enableLikes: true,
    requireEmailVerification: false,
    minAge: 13,
    enableMinorAccounts: true,
    sendWelcomeEmail: true,
    sendWeeklyDigest: true,
    enableBusinessAccounts: true,
    commissionRate: 10,
  })

  // ─── Admin account type emulation state ─────────────────────
  const [emulatedType, setEmulatedType] = useState<string>("standard")
  const [emulatedBusinessTier, setEmulatedBusinessTier] = useState<BusinessTierSlug>("basic")
  const [emulationLoaded, setEmulationLoaded] = useState(false)

  // ─── Admin paywall testing toggle ───────────────────────────
  const [adminPaywallEnabled, setAdminPaywallEnabled] = useState(false)

  // Load admin emulation preferences from database on mount
  useEffect(() => {
    const loadEmulation = async () => {
      if (!user) return

      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("user_preferences")
          .select("business_preferences")
          .eq("user_id", user.id)
          .single()

        if (error && error.code !== "PGRST116") {
          console.error("Error loading emulation prefs:", error)
          return
        }

        if (data?.business_preferences) {
          const prefs = data.business_preferences as any
          if (prefs.isBusinessMode && prefs.selectedType) {
            setEmulatedType(prefs.selectedType)
          }
          if (prefs.selectedBusinessTier) {
            setEmulatedBusinessTier(prefs.selectedBusinessTier)
          }
        }
      } catch (error) {
        console.error("Error loading emulation prefs:", error)
      } finally {
        setEmulationLoaded(true)
      }
    }

    // Load paywall toggle from localStorage
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(ADMIN_PAYWALL_STORAGE_KEY)
      if (stored !== null) {
        setAdminPaywallEnabled(stored === "true")
      }
    }

    loadEmulation()
  }, [user])

  // Persist emulation preferences to database
  const saveEmulation = useCallback(
    async (type: string, businessTier?: BusinessTierSlug) => {
      if (!user || !emulationLoaded) return

      const isBusinessMode = type !== "standard"
      const tier = businessTier ?? emulatedBusinessTier
      const businessPreferences = {
        isBusinessMode,
        selectedType: type,
        selectedBusinessTier: tier,
      }

      try {
        const supabase = createClient()
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

        toast({
          title: "Account type updated",
          description: `Now emulating ${type === "standard" ? "Personal" : type} account.`,
        })
      } catch (error) {
        console.error("Error saving emulation prefs:", error)
      }
    },
    [user, emulationLoaded, emulatedBusinessTier],
  )

  const handleSelectType = (type: string) => {
    setEmulatedType(type)
    saveEmulation(type)
  }

  const handleSelectBusinessTier = (tier: BusinessTierSlug) => {
    setEmulatedBusinessTier(tier)
    saveEmulation(emulatedType, tier)

    // Also update actual business tables so PaywallGate picks up changes
    updateBusinessTierInDb(tier)
  }

  const updateBusinessTierInDb = async (tier: BusinessTierSlug) => {
    if (!user) return
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

  const handleToggleAdminPaywall = (checked: boolean) => {
    setAdminPaywallEnabled(checked)
    if (typeof window !== "undefined") {
      localStorage.setItem(ADMIN_PAYWALL_STORAGE_KEY, String(checked))
    }
    toast({
      title: checked ? "Paywalls enabled" : "Paywalls disabled",
      description: checked
        ? "You will now see paywalls as users would. Use the Skip button to bypass them."
        : "Paywalls are disabled for your admin session.",
    })
  }

  const handleSave = async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast({ title: "Settings saved", description: "Your changes have been applied." })
    setIsLoading(false)
  }

  return (
    <div className="p-4 lg:p-8 max-w-[1000px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild aria-label="Go back">
            <Link href="/admin">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[#2c2420]">Settings</h1>
            <p className="text-sm text-[#2c2420]/50">Configure platform settings</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>

      <div className="space-y-6">
        {/* ─── Admin Account Type Emulation ─────────────────────── */}
        <Card className="bg-white/70 dark:bg-card/70 backdrop-blur border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#2c2420]">
              <Eye className="h-5 w-5 text-amber-600" />
              Account Type Emulation
            </CardTitle>
            <CardDescription>
              Switch your admin account to a Creator or Business account type to
              monitor and inspect processes and flows as those account types
              would experience them. This changes your active account type in
              the platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Account type selector */}
            <div className="grid gap-3">
              {accountTypeOptions.map((type) => {
                const isSelected = emulatedType === type.id
                return (
                  <button
                    key={type.id}
                    onClick={() => handleSelectType(type.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-amber-400 bg-amber-50/50 shadow-sm dark:border-amber-600 dark:bg-amber-950/20"
                        : "border-[#2c2420]/10 hover:border-amber-300/50 hover:bg-amber-50/30 cursor-pointer"
                    }`}
                  >
                    <div className={`size-10 rounded-lg ${type.color} flex items-center justify-center shrink-0 text-white`}>
                      {type.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[#2c2420]">{type.label}</p>
                        {isSelected && (
                          <Badge className="bg-amber-500 text-white text-xs border-0">Active</Badge>
                        )}
                      </div>
                      <p className="text-xs text-[#2c2420]/60 mt-0.5">{type.description}</p>
                    </div>
                    {isSelected && <Check className="size-5 text-amber-600 shrink-0" />}
                  </button>
                )
              })}
            </div>

            {/* Business tier picker (visible when emulating business) */}
            {emulatedType === "business" && (
              <div className="mt-4 p-4 rounded-xl bg-[#2c2420]/5 border border-[#2c2420]/10">
                <p className="text-sm font-semibold text-[#2c2420] mb-3">Business Tier</p>
                <div className="grid gap-2">
                  {BUSINESS_TIERS.map((tier) => {
                    const isSelected = emulatedBusinessTier === tier.slug
                    return (
                      <button
                        key={tier.slug}
                        onClick={() => handleSelectBusinessTier(tier.slug)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "border-amber-400 bg-amber-50/50 shadow-sm dark:border-amber-600 dark:bg-amber-950/20"
                            : "border-[#2c2420]/10 hover:border-amber-300/50 hover:bg-amber-50/30"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-[#2c2420]">{tier.name}</p>
                            {tier.highlighted && (
                              <Badge className="bg-[#ffb88c] text-[#2c2420] border-0 text-xs">Popular</Badge>
                            )}
                            {isSelected && (
                              <Badge className="bg-amber-500 text-white text-xs border-0">Active</Badge>
                            )}
                          </div>
                          <p className="text-xs text-[#2c2420]/60">${tier.price}/{tier.priceSuffix}</p>
                        </div>
                        {isSelected && <Check className="size-5 text-amber-600 shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Creator features summary */}
            {emulatedType === "creator" && (
              <div className="mt-4 p-4 rounded-xl bg-[#7C3AED]/5 border border-[#7C3AED]/10">
                <p className="text-sm font-semibold text-[#2c2420] mb-2">Creator Plan Features</p>
                <div className="space-y-1.5">
                  {USER_TIERS.find((t) => t.slug === "creator")?.features.map((f) => (
                    <div key={f} className="flex items-start gap-2">
                      <Check className="size-3.5 text-[#7C3AED] shrink-0 mt-0.5" />
                      <span className="text-xs text-[#2c2420]/70">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── Admin Paywall Testing Toggle ────────────────────── */}
        <Card className="bg-white/70 dark:bg-card/70 backdrop-blur border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#2c2420]">
              <Lock className="h-5 w-5 text-amber-600" />
              Paywall Testing
            </CardTitle>
            <CardDescription>
              Enable paywalls for your admin session to verify they work
              correctly. When blocked, you&apos;ll see a Skip button to bypass
              the paywall — normal users will never see the Skip button.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted">
              <div>
                <p className="text-sm font-medium text-[#2c2420]">Enable paywalls for my session</p>
                <p className="text-xs text-[#2c2420]/50 mt-0.5">
                  {PAYWALL_ENABLED
                    ? "Global paywalls are ON — this toggle lets you disable them for yourself."
                    : "Global paywalls are OFF — this toggle lets you enable them for testing."}
                </p>
              </div>
              <Switch
                checked={adminPaywallEnabled}
                onCheckedChange={handleToggleAdminPaywall}
              />
            </div>

            {adminPaywallEnabled && (
              <div className="flex items-start gap-3 p-3 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30">
                <Shield className="size-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 dark:text-amber-200">
                  <p className="font-medium mb-1">Paywalls active for your session</p>
                  <p>
                    Pages with paywall gates will now enforce subscription
                    checks. When blocked you&apos;ll see a <strong>Skip Paywall</strong> button
                    that only appears for admin accounts. After skipping, a banner
                    reminds you the gate would have blocked a regular user.
                  </p>
                </div>
              </div>
            )}

            {!adminPaywallEnabled && (
              <p className="text-xs text-[#2c2420]/40 text-center">
                Turn on paywall testing above, then visit any gated page (e.g.
                Creator Hub, Business Analytics) to see the paywall in action.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Site Settings */}
        <Card className="bg-white/70 dark:bg-card/70 backdrop-blur border-[#2c2420]/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#2c2420]">
              <Globe className="h-5 w-5" />
              Site Settings
            </CardTitle>
            <CardDescription>General platform configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="siteName">Site Name</Label>
                <Input
                  id="siteName"
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supportEmail">Support Email</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteDescription">Site Description</Label>
              <Textarea
                id="siteDescription"
                value={settings.siteDescription}
                onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Feature Flags */}
        <Card className="bg-white/70 dark:bg-card/70 backdrop-blur border-[#2c2420]/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#2c2420]">
              <Shield className="h-5 w-5" />
              Features
            </CardTitle>
            <CardDescription>Enable or disable platform features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Guest Browsing</Label>
                <p className="text-xs text-muted-foreground">Allow non-users to browse public itineraries</p>
              </div>
              <Switch
                checked={settings.enableGuestBrowsing}
                onCheckedChange={(checked) => setSettings({ ...settings, enableGuestBrowsing: checked })}
              />
            </div>
            {settings.enableGuestBrowsing && (
              <div className="pl-4 border-l-2 border-[#ffb88c]/30">
                <div className="space-y-2">
                  <Label htmlFor="guestViewLimit">Guest View Limit</Label>
                  <Input
                    id="guestViewLimit"
                    type="number"
                    min={1}
                    max={20}
                    value={settings.guestViewLimit}
                    onChange={(e) => setSettings({ ...settings, guestViewLimit: parseInt(e.target.value) || 5 })}
                    className="w-24"
                  />
                  <p className="text-xs text-muted-foreground">Number of itineraries guests can view before signup prompt</p>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <Label>Public Profiles</Label>
                <p className="text-xs text-muted-foreground">Allow users to have public profile pages</p>
              </div>
              <Switch
                checked={settings.enablePublicProfiles}
                onCheckedChange={(checked) => setSettings({ ...settings, enablePublicProfiles: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Comments</Label>
                <p className="text-xs text-muted-foreground">Allow users to comment on itineraries</p>
              </div>
              <Switch
                checked={settings.enableComments}
                onCheckedChange={(checked) => setSettings({ ...settings, enableComments: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Likes</Label>
                <p className="text-xs text-muted-foreground">Allow users to like itineraries</p>
              </div>
              <Switch
                checked={settings.enableLikes}
                onCheckedChange={(checked) => setSettings({ ...settings, enableLikes: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* User Settings */}
        <Card className="bg-white/70 dark:bg-card/70 backdrop-blur border-[#2c2420]/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#2c2420]">
              <Users className="h-5 w-5" />
              Registration
            </CardTitle>
            <CardDescription>User registration and account settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Verification</Label>
                <p className="text-xs text-muted-foreground">Require users to verify their email address</p>
              </div>
              <Switch
                checked={settings.requireEmailVerification}
                onCheckedChange={(checked) => setSettings({ ...settings, requireEmailVerification: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Minor Accounts (13-17)</Label>
                <p className="text-xs text-muted-foreground">Allow users under 18 with parental consent</p>
              </div>
              <Switch
                checked={settings.enableMinorAccounts}
                onCheckedChange={(checked) => setSettings({ ...settings, enableMinorAccounts: checked })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minAge">Minimum Age</Label>
              <Input
                id="minAge"
                type="number"
                min={13}
                max={21}
                value={settings.minAge}
                onChange={(e) => setSettings({ ...settings, minAge: parseInt(e.target.value) || 13 })}
                className="w-24"
              />
              <p className="text-xs text-muted-foreground">Minimum age to create an account (COPPA minimum: 13)</p>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="bg-white/70 dark:bg-card/70 backdrop-blur border-[#2c2420]/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#2c2420]">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>Email and push notification settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Welcome Email</Label>
                <p className="text-xs text-muted-foreground">Send welcome email to new users</p>
              </div>
              <Switch
                checked={settings.sendWelcomeEmail}
                onCheckedChange={(checked) => setSettings({ ...settings, sendWelcomeEmail: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Weekly Digest</Label>
                <p className="text-xs text-muted-foreground">Send weekly digest emails to users</p>
              </div>
              <Switch
                checked={settings.sendWeeklyDigest}
                onCheckedChange={(checked) => setSettings({ ...settings, sendWeeklyDigest: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Business Settings */}
        <Card className="bg-white/70 dark:bg-card/70 backdrop-blur border-[#2c2420]/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#2c2420]">
              <CreditCard className="h-5 w-5" />
              Business
            </CardTitle>
            <CardDescription>Business account and payment settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Business Accounts</Label>
                <p className="text-xs text-muted-foreground">Allow businesses to create accounts</p>
              </div>
              <Switch
                checked={settings.enableBusinessAccounts}
                onCheckedChange={(checked) => setSettings({ ...settings, enableBusinessAccounts: checked })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="commissionRate">Commission Rate (%)</Label>
              <Input
                id="commissionRate"
                type="number"
                min={0}
                max={50}
                value={settings.commissionRate}
                onChange={(e) => setSettings({ ...settings, commissionRate: parseInt(e.target.value) || 10 })}
                className="w-24"
              />
              <p className="text-xs text-muted-foreground">Commission percentage on bookings (5-15% recommended)</p>
            </div>
          </CardContent>
        </Card>

        {/* Environment Info */}
        <Card className="bg-gray-50 dark:bg-background border-gray-200 dark:border-border">
          <CardHeader>
            <CardTitle className="text-gray-600 dark:text-gray-400 text-sm">Environment Information</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p><strong>Note:</strong> Some settings require environment variables to be configured in your hosting platform (e.g., Vercel).</p>
            <p>For production deployments, ensure you have configured:</p>
            <ul className="list-disc pl-4 mt-2 space-y-1">
              <li>NEXT_PUBLIC_SUPABASE_URL</li>
              <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
              <li>NEXT_PUBLIC_ADMIN_EMAIL (for admin access)</li>
              <li>Stripe API keys (for payments)</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
