"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Palette,
  Image,
  Type,
  ExternalLink,
  QrCode,
  Video,
  Lock,
  Loader2,
} from "lucide-react"
import type { BusinessTierSlug } from "@/lib/tiers"
import type { EnterpriseBrandingConfig } from "@/lib/enterprise"
import { DEFAULT_BRANDING_CONFIG } from "@/lib/enterprise"

interface EnterpriseBrandedProfileProps {
  tier: BusinessTierSlug
  brandingConfig?: EnterpriseBrandingConfig | null
  onSave?: (config: EnterpriseBrandingConfig) => Promise<void> | void
  saving?: boolean
}

const brandingFeatures = [
  {
    id: "custom_colors",
    icon: Palette,
    label: "Brand Colors",
    description: "Set your primary, secondary, and accent colors",
  },
  {
    id: "cover_image",
    icon: Image,
    label: "Cover Image",
    description: "Upload a custom cover image for your profile",
  },
  {
    id: "custom_fonts",
    icon: Type,
    label: "Custom Typography",
    description: "Choose a custom font for your profile",
  },
  {
    id: "custom_cta_buttons",
    icon: ExternalLink,
    label: "CTA Buttons",
    description: "Customize call-to-action button text, URL, and style",
  },
  {
    id: "branded_qr_codes",
    icon: QrCode,
    label: "Branded QR Codes",
    description: "Generate QR codes with your brand colors and logo",
  },
  {
    id: "video_banner",
    icon: Video,
    label: "Video Banner",
    description: "Add a video banner to your profile header",
  },
]

const CTA_STYLES: { value: EnterpriseBrandingConfig["ctaButtonStyle"]; label: string }[] = [
  { value: "solid", label: "Solid" },
  { value: "outline", label: "Outline" },
  { value: "gradient", label: "Gradient" },
]

const LOGO_POSITIONS: { value: EnterpriseBrandingConfig["logoPosition"]; label: string }[] = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
]

export function EnterpriseBrandedProfile({
  tier,
  brandingConfig,
  onSave,
  saving = false,
}: EnterpriseBrandedProfileProps) {
  const isEnterprise = tier === "enterprise"
  const [config, setConfig] = useState<EnterpriseBrandingConfig>(
    () => ({ ...DEFAULT_BRANDING_CONFIG, ...(brandingConfig || {}) })
  )

  const updateField = <K extends keyof EnterpriseBrandingConfig>(
    key: K,
    value: EnterpriseBrandingConfig[K]
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  if (!isEnterprise) {
    return (
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-muted flex items-center justify-center">
              <Palette className="size-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">Custom Branded Profile</CardTitle>
              <CardDescription>
                Available exclusively on the Enterprise plan.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {brandingFeatures.map((feature) => (
              <div
                key={feature.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 opacity-60"
              >
                <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Lock className="size-3.5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground">{feature.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/10 text-center">
            <p className="text-xs text-muted-foreground">
              Upgrade to <a href="/business" className="text-primary font-medium hover:underline">Enterprise ($399/mo)</a> to
              fully customize your business profile with brand colors, custom imagery, and more.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-tinerary-gold/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-br from-tinerary-gold to-tinerary-peach flex items-center justify-center">
              <Palette className="size-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Custom Branded Profile</CardTitle>
              <CardDescription>
                Customize your business profile appearance and branding.
              </CardDescription>
            </div>
          </div>
          <Badge className="bg-gradient-to-r from-tinerary-gold to-tinerary-peach text-tinerary-dark border-0 text-xs">
            Enterprise
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {/* Brand Colors */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Brand Colors</Label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Primary</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={config.primaryColor}
                    onChange={(e) => updateField("primaryColor", e.target.value)}
                    className="size-8 rounded-lg border border-border cursor-pointer p-0"
                  />
                  <Input
                    type="text"
                    value={config.primaryColor}
                    onChange={(e) => updateField("primaryColor", e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Secondary</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={config.secondaryColor}
                    onChange={(e) => updateField("secondaryColor", e.target.value)}
                    className="size-8 rounded-lg border border-border cursor-pointer p-0"
                  />
                  <Input
                    type="text"
                    value={config.secondaryColor}
                    onChange={(e) => updateField("secondaryColor", e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Accent</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={config.accentColor}
                    onChange={(e) => updateField("accentColor", e.target.value)}
                    className="size-8 rounded-lg border border-border cursor-pointer p-0"
                  />
                  <Input
                    type="text"
                    value={config.accentColor}
                    onChange={(e) => updateField("accentColor", e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Cover Image URL */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Cover Image</Label>
            <Input
              type="url"
              value={config.coverImageUrl || ""}
              onChange={(e) => updateField("coverImageUrl", e.target.value || null)}
              placeholder="https://example.com/cover.jpg"
              className="h-8 text-xs"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Recommended size: 1200x400px. Displayed behind your profile header.
            </p>
          </div>

          {/* Video Banner URL */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Video Banner</Label>
            <Input
              type="url"
              value={config.videoBannerUrl || ""}
              onChange={(e) => updateField("videoBannerUrl", e.target.value || null)}
              placeholder="https://example.com/banner.mp4"
              className="h-8 text-xs"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              MP4 format, max 15 seconds. Replaces cover image when set.
            </p>
          </div>

          {/* Logo */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Logo</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Logo URL</Label>
                <Input
                  type="url"
                  value={config.logoUrl || ""}
                  onChange={(e) => updateField("logoUrl", e.target.value || null)}
                  placeholder="https://example.com/logo.png"
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Logo Position</Label>
                <div className="flex gap-1 mt-1">
                  {LOGO_POSITIONS.map((pos) => (
                    <Button
                      key={pos.value}
                      type="button"
                      size="sm"
                      variant={config.logoPosition === pos.value ? "default" : "outline"}
                      className="h-8 text-xs flex-1"
                      onClick={() => updateField("logoPosition", pos.value)}
                    >
                      {pos.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* CTA Button Config */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Call-to-Action Button</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Button Text</Label>
                <Input
                  type="text"
                  value={config.ctaButtonText}
                  onChange={(e) => updateField("ctaButtonText", e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Button URL</Label>
                <Input
                  type="url"
                  value={config.ctaButtonUrl}
                  onChange={(e) => updateField("ctaButtonUrl", e.target.value)}
                  placeholder="https://..."
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>
            <div className="mt-2">
              <Label className="text-xs text-muted-foreground">Button Style</Label>
              <div className="flex gap-1 mt-1">
                {CTA_STYLES.map((style) => (
                  <Button
                    key={style.value}
                    type="button"
                    size="sm"
                    variant={config.ctaButtonStyle === style.value ? "default" : "outline"}
                    className="h-8 text-xs flex-1"
                    onClick={() => updateField("ctaButtonStyle", style.value)}
                  >
                    {style.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Preview */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Profile Preview</Label>
            <div className="rounded-xl border border-border overflow-hidden">
              <div
                className="h-24 relative"
                style={{
                  background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})`,
                }}
              >
                {config.coverImageUrl && (
                  <img
                    src={config.coverImageUrl}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="p-4 bg-card relative -mt-6">
                <div className={`flex ${config.logoPosition === "center" ? "justify-center" : ""}`}>
                  <div className="size-12 rounded-xl bg-white border-2 border-card shadow-sm flex items-center justify-center">
                    {config.logoUrl ? (
                      <img src={config.logoUrl} alt="Logo" className="size-full rounded-xl object-cover" />
                    ) : (
                      <span className="text-lg font-bold" style={{ color: config.accentColor }}>B</span>
                    )}
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm font-bold text-foreground">Your Business Name</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Your custom branded profile</p>
                </div>
                {config.ctaButtonUrl && (
                  <Button
                    size="sm"
                    className="mt-3 text-xs"
                    style={
                      config.ctaButtonStyle === "outline"
                        ? { borderColor: config.accentColor, color: config.accentColor, backgroundColor: "transparent", border: `2px solid ${config.accentColor}` }
                        : config.ctaButtonStyle === "gradient"
                        ? { background: `linear-gradient(135deg, ${config.primaryColor}, ${config.accentColor})`, color: "white" }
                        : { backgroundColor: config.accentColor, color: "white" }
                    }
                  >
                    {config.ctaButtonText || "Book Now"}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <Button
            className="w-full btn-sunset"
            onClick={() => onSave?.(config)}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Branding"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
