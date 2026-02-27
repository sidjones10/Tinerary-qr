"use client"

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
} from "lucide-react"
import type { BusinessTierSlug } from "@/lib/tiers"
import type { EnterpriseBrandingConfig } from "@/lib/enterprise"
import { DEFAULT_BRANDING_CONFIG } from "@/lib/enterprise"

interface EnterpriseBrandedProfileProps {
  tier: BusinessTierSlug
  brandingConfig?: EnterpriseBrandingConfig | null
  onSave?: (config: EnterpriseBrandingConfig) => void
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

export function EnterpriseBrandedProfile({
  tier,
  brandingConfig,
  onSave,
}: EnterpriseBrandedProfileProps) {
  const isEnterprise = tier === "enterprise"
  const config = brandingConfig || DEFAULT_BRANDING_CONFIG

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
        {/* Brand Colors */}
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Brand Colors</Label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Primary</Label>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="size-8 rounded-lg border border-border"
                    style={{ backgroundColor: config.primaryColor }}
                  />
                  <Input
                    type="text"
                    defaultValue={config.primaryColor}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Secondary</Label>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="size-8 rounded-lg border border-border"
                    style={{ backgroundColor: config.secondaryColor }}
                  />
                  <Input
                    type="text"
                    defaultValue={config.secondaryColor}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Accent</Label>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="size-8 rounded-lg border border-border"
                    style={{ backgroundColor: config.accentColor }}
                  />
                  <Input
                    type="text"
                    defaultValue={config.accentColor}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Feature Grid */}
          <div className="grid sm:grid-cols-2 gap-3">
            {brandingFeatures.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                >
                  <div className="size-8 rounded-lg bg-card flex items-center justify-center shrink-0 border border-border">
                    <Icon className="size-3.5 text-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground">{feature.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{feature.description}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* CTA Button Config */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Call-to-Action Button</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Button Text</Label>
                <Input
                  type="text"
                  defaultValue={config.ctaButtonText}
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Button URL</Label>
                <Input
                  type="url"
                  defaultValue={config.ctaButtonUrl}
                  placeholder="https://..."
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
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
                <div className="size-12 rounded-xl bg-white border-2 border-card shadow-sm flex items-center justify-center">
                  {config.logoUrl ? (
                    <img src={config.logoUrl} alt="Logo" className="size-full rounded-xl object-cover" />
                  ) : (
                    <span className="text-lg font-bold" style={{ color: config.accentColor }}>B</span>
                  )}
                </div>
                <div className="mt-2">
                  <p className="text-sm font-bold text-foreground">Your Business Name</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Your custom branded profile</p>
                </div>
                <Button
                  size="sm"
                  className="mt-3 text-xs"
                  style={{
                    backgroundColor: config.accentColor,
                    color: "white",
                  }}
                >
                  {config.ctaButtonText || "Book Now"}
                </Button>
              </div>
            </div>
          </div>

          <Button className="w-full btn-sunset" onClick={() => onSave?.(config)}>
            Save Branding
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
