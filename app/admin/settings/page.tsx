"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Save, Shield, Bell, Globe, Loader2, Mail, CreditCard, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function AdminSettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState({
    // Site settings
    siteName: "Tinerary",
    siteDescription: "Collaborative travel planning platform",
    supportEmail: "support@tinerary.app",
    // Feature flags
    enableGuestBrowsing: true,
    guestViewLimit: 5,
    enablePublicProfiles: true,
    enableComments: true,
    enableLikes: true,
    // Registration
    requireEmailVerification: false,
    minAge: 13,
    enableMinorAccounts: true,
    // Notifications
    sendWelcomeEmail: true,
    sendWeeklyDigest: true,
    // Business
    enableBusinessAccounts: true,
    commissionRate: 10,
  })

  const handleSave = async () => {
    setIsLoading(true)
    // In a real app, this would save to database or environment config
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast({ title: "Settings saved", description: "Your changes have been applied." })
    setIsLoading(false)
  }

  return (
    <div className="p-4 lg:p-8 max-w-[1000px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
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
        {/* Site Settings */}
        <Card className="bg-white/70 backdrop-blur border-[#2c2420]/5">
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
        <Card className="bg-white/70 backdrop-blur border-[#2c2420]/5">
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
        <Card className="bg-white/70 backdrop-blur border-[#2c2420]/5">
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
        <Card className="bg-white/70 backdrop-blur border-[#2c2420]/5">
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
        <Card className="bg-white/70 backdrop-blur border-[#2c2420]/5">
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
        <Card className="bg-gray-50 border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-600 text-sm">Environment Information</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-gray-500 space-y-1">
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
