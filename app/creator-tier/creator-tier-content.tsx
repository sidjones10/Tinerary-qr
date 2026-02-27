"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Crown,
  Rocket,
  Eye,
  Heart,
  Check,
  Zap,
  ArrowUpRight,
  Sparkles,
} from "lucide-react"
import { useState } from "react"
import { USER_TIERS } from "@/lib/tiers"

const tierColors: Record<string, string> = {
  user: "bg-tinerary-dark",
  creator: "bg-[#7C3AED]",
  business: "bg-primary",
}

const boostedPosts = [
  {
    title: "SF Hidden Gems: 48hr Guide",
    boostBudget: "$25",
    spent: "$18.50",
    impressions: "4,200",
    engagement: "12.3%",
    status: "Active",
    progress: 74,
  },
  {
    title: "Best Brunch Spots Mission District",
    boostBudget: "$15",
    spent: "$15.00",
    impressions: "2,800",
    engagement: "9.7%",
    status: "Completed",
    progress: 100,
  },
  {
    title: "Weekend Wine Country Itinerary",
    boostBudget: "$30",
    spent: "$5.20",
    impressions: "890",
    engagement: "15.1%",
    status: "Active",
    progress: 17,
  },
]

const boostMetrics = [
  { label: "Total Boost Spend", value: "$38.70", icon: Zap },
  { label: "Boosted Impressions", value: "7,890", icon: Eye },
  { label: "Engagement Rate", value: "12.4%", icon: Heart },
  { label: "New Followers from Boosts", value: "47", icon: ArrowUpRight },
]

export function CreatorTierContent() {
  const [selectedTier, setSelectedTier] = useState(1)

  return (
    <div className="mt-6 flex flex-col gap-6">
      {/* Tier Comparison */}
      <Card className="border-border overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="size-5 text-tinerary-gold" /> Platform User Tiers
          </CardTitle>
          <CardDescription>
            Tinerary has three distinct user types. All consumer features remain free forever.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {USER_TIERS.map((tier, i) => (
              <div
                key={tier.slug}
                onClick={() => setSelectedTier(i)}
                className={`rounded-2xl border overflow-hidden transition-shadow cursor-pointer ${
                  i === selectedTier ? "shadow-lg ring-2 ring-primary/30" : "border-border"
                }`}
              >
                <div className={`${tierColors[tier.slug] || "bg-primary"} px-5 py-4 text-center`}>
                  <p className="text-xs font-bold tracking-widest text-primary-foreground uppercase">
                    {tier.name}
                  </p>
                  <p className="text-2xl font-bold text-primary-foreground mt-1">{tier.price}</p>
                  <p className="text-xs text-primary-foreground/80">{tier.priceSuffix}</p>
                </div>
                <div className="p-4 flex flex-col gap-2.5 bg-card">
                  {tier.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2">
                      <Check className="size-4 text-tinerary-salmon shrink-0 mt-0.5" />
                      <span className="text-xs text-foreground leading-relaxed">{feature}</span>
                    </div>
                  ))}
                  {tier.slug === "creator" && (
                    <Badge className="mt-2 bg-tinerary-peach text-tinerary-dark border-0 self-center">
                      Current Plan
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Post Boost Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {boostMetrics.map((metric) => (
          <Card key={metric.label} className="border-border">
            <CardContent className="pt-6">
              <metric.icon className="size-5 text-muted-foreground" />
              <p className="mt-3 text-2xl font-bold text-foreground">{metric.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{metric.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Boosted Posts */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="size-5 text-primary" /> Boosted Posts
              </CardTitle>
              <CardDescription>Manage your post boost campaigns</CardDescription>
            </div>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
              Boost a Post
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {boostedPosts.map((post) => (
              <div
                key={post.title}
                className="p-4 rounded-xl bg-muted flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{post.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Budget: {post.boostBudget} &middot; Spent: {post.spent}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      post.status === "Active"
                        ? "bg-tinerary-peach text-tinerary-dark border-0"
                        : "bg-secondary text-secondary-foreground border-0"
                    }
                  >
                    {post.status}
                  </Badge>
                </div>
                <Progress value={post.progress} className="h-2 [&>[data-slot=progress-indicator]]:bg-primary" />
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Eye className="size-3" /> {post.impressions}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Heart className="size-3" /> {post.engagement}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Creator Benefits Summary */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-tinerary-gold" /> Creator Benefits Active
          </CardTitle>
          <CardDescription>Your enabled creator-tier features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { label: "Verified Badge", desc: "Displayed on all content", active: true },
              { label: "Analytics Dashboard", desc: "Full audience insights", active: true },
              { label: "70/30 Affiliate Split", desc: "Enhanced commission rate", active: true },
              { label: "Priority Discovery", desc: "Boosted in feeds & search", active: true },
              { label: "Template Selling", desc: "Sell itinerary templates", active: true },
              { label: "Sponsorship Inbox", desc: "Direct brand collaborations", active: false },
            ].map((feature) => (
              <div
                key={feature.label}
                className={`flex items-start gap-3 p-3 rounded-xl ${
                  feature.active ? "bg-muted" : "bg-muted/50 opacity-60"
                }`}
              >
                <div
                  className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
                    feature.active
                      ? "bg-primary text-primary-foreground"
                      : "bg-border text-muted-foreground"
                  }`}
                >
                  <Check className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{feature.label}</p>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
