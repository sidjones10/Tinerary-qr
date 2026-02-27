"use client"

import { Badge } from "@/components/ui/badge"
import { Shield, CheckCircle2, Crown } from "lucide-react"
import type { BusinessTierSlug } from "@/lib/tiers"

interface EnterpriseBadgeProps {
  tier: BusinessTierSlug
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
  className?: string
}

const tierBadgeConfig = {
  basic: {
    icon: CheckCircle2,
    label: "Business",
    className: "bg-muted text-muted-foreground border-border",
    iconClassName: "text-muted-foreground",
  },
  premium: {
    icon: CheckCircle2,
    label: "Verified Business",
    className: "bg-primary/10 text-primary border-primary/20",
    iconClassName: "text-primary",
  },
  enterprise: {
    icon: Shield,
    label: "Enterprise",
    className: "bg-gradient-to-r from-tinerary-gold/20 to-tinerary-peach/20 text-tinerary-dark border-tinerary-gold/30 dark:text-tinerary-gold dark:border-tinerary-gold/40",
    iconClassName: "text-tinerary-gold",
  },
}

const sizeConfig = {
  sm: { iconSize: "size-3", textSize: "text-[10px]", padding: "px-1.5 py-0.5", gap: "gap-1" },
  md: { iconSize: "size-3.5", textSize: "text-xs", padding: "px-2 py-0.5", gap: "gap-1" },
  lg: { iconSize: "size-4", textSize: "text-sm", padding: "px-2.5 py-1", gap: "gap-1.5" },
}

export function EnterpriseBadge({ tier, size = "md", showLabel = true, className = "" }: EnterpriseBadgeProps) {
  const config = tierBadgeConfig[tier]
  const sizes = sizeConfig[size]
  const Icon = config.icon

  if (tier === "basic" && !showLabel) return null

  return (
    <Badge
      variant="outline"
      className={`${config.className} ${sizes.padding} ${sizes.gap} inline-flex items-center font-medium border ${className}`}
    >
      <Icon className={`${sizes.iconSize} ${config.iconClassName}`} />
      {showLabel && <span className={sizes.textSize}>{config.label}</span>}
    </Badge>
  )
}

interface EnterpriseProfileBadgeProps {
  tier: BusinessTierSlug
  businessName: string
}

export function EnterpriseProfileBadge({ tier, businessName }: EnterpriseProfileBadgeProps) {
  if (tier !== "enterprise") {
    return (
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-bold text-foreground">{businessName}</h2>
        {tier === "premium" && <CheckCircle2 className="size-5 text-primary" />}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <h2 className="text-xl font-bold text-foreground">{businessName}</h2>
      <div className="flex items-center gap-1.5">
        <Shield className="size-5 text-tinerary-gold" />
        <Badge className="bg-gradient-to-r from-tinerary-gold to-tinerary-peach text-tinerary-dark border-0 text-xs font-bold tracking-wide">
          ENTERPRISE
        </Badge>
      </div>
    </div>
  )
}

interface TopTierPlacementIndicatorProps {
  tier: BusinessTierSlug
}

export function TopTierPlacementIndicator({ tier }: TopTierPlacementIndicatorProps) {
  if (tier !== "enterprise") return null

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-tinerary-gold/10 border border-tinerary-gold/20">
      <Crown className="size-3 text-tinerary-gold" />
      <span className="text-[10px] font-bold text-tinerary-gold uppercase tracking-wider">Top Placement</span>
    </div>
  )
}
