"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Rocket,
  BarChart3,
  ShoppingBag,
  Mail,
  Sparkles,
  Check,
  Crown,
  Eye,
  Heart,
  Users,
  Coins,
  TrendingUp,
  ArrowRight,
  Zap,
  Percent,
  Store,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AppHeader } from "@/components/app-header"
import { createClient } from "@/lib/supabase/client"
import { getCreatorAnalytics, type CreatorAnalytics } from "@/lib/creator-service"

const creatorFeatures = [
  {
    title: "Boost Posts",
    description: "Amplify your itineraries with targeted impressions",
    icon: Rocket,
    href: "/creator/boost",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    title: "Analytics Dashboard",
    description: "Full audience insights and content performance",
    icon: BarChart3,
    href: "/creator/analytics",
    color: "text-tinerary-gold",
    bgColor: "bg-tinerary-gold/10",
  },
  {
    title: "Sell Templates",
    description: "Create and sell premium itinerary templates",
    icon: ShoppingBag,
    href: "/creator/templates",
    color: "text-tinerary-salmon",
    bgColor: "bg-tinerary-salmon/10",
  },
  {
    title: "Sponsorship Inbox",
    description: "Direct brand collaboration opportunities",
    icon: Mail,
    href: "/creator/sponsorships",
    color: "text-[#7C3AED]",
    bgColor: "bg-[#7C3AED]/10",
  },
]

const activePerks = [
  { label: "Verified Badge", desc: "Displayed on all your content", icon: Check },
  { label: "70/30 Affiliate Split", desc: "Enhanced commission rate", icon: Percent },
  { label: "Priority Discovery", desc: "Boosted in feeds & search", icon: TrendingUp },
  { label: "2x Coin Rate", desc: "Double coins on all actions", icon: Coins },
  { label: "Business-Lite Listings", desc: "Create deals & promotions", icon: Store },
  { label: "Sponsorship Inbox", desc: "Receive brand collaborations", icon: Mail },
]

export default function CreatorHubPage() {
  const [analytics, setAnalytics] = useState<CreatorAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/auth?redirectTo=/creator")
        return
      }
      setUserId(session.user.id)
      const data = await getCreatorAnalytics(session.user.id)
      setAnalytics(data)
      setLoading(false)
    }
    load()
  }, [router])

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1">
        <div className="container px-4 py-6 md:py-10">
          {/* Hero */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-10 rounded-xl bg-[#7C3AED] flex items-center justify-center">
                <Crown className="size-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Creator Hub</h1>
                <p className="text-sm text-muted-foreground">
                  Grow your audience, boost your content, and earn more
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              {
                label: "Total Views",
                value: analytics?.totalViews?.toLocaleString() || "0",
                icon: Eye,
              },
              {
                label: "Total Likes",
                value: analytics?.totalLikes?.toLocaleString() || "0",
                icon: Heart,
              },
              {
                label: "Followers",
                value: analytics?.totalFollowers?.toLocaleString() || "0",
                icon: Users,
              },
              {
                label: "Engagement",
                value: `${analytics?.engagementRate || 0}%`,
                icon: Zap,
              },
            ].map((stat) => (
              <Card key={stat.label} className="border-border">
                <CardContent className="pt-6">
                  <stat.icon className="size-5 text-muted-foreground" />
                  <p className="mt-3 text-2xl font-bold text-foreground">
                    {loading ? "..." : stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Feature Cards */}
          <h2 className="text-lg font-bold mb-4">Creator Tools</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {creatorFeatures.map((feature) => (
              <Link key={feature.title} href={feature.href}>
                <Card className="border-border hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="pt-6">
                    <div
                      className={`size-10 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4`}
                    >
                      <feature.icon className={`size-5 ${feature.color}`} />
                    </div>
                    <h3 className="text-sm font-bold text-foreground">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                    <div className="flex items-center gap-1 mt-3 text-xs font-medium text-primary">
                      Open <ArrowRight className="size-3" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Active Perks */}
          <Card className="border-border mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="size-5 text-tinerary-gold" /> Active Creator Perks
              </CardTitle>
              <CardDescription>Your enabled creator-tier benefits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {activePerks.map((perk) => (
                  <div
                    key={perk.label}
                    className="flex items-start gap-3 p-3 rounded-xl bg-muted"
                  >
                    <div className="size-8 rounded-lg bg-primary flex items-center justify-center shrink-0 text-primary-foreground">
                      <perk.icon className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{perk.label}</p>
                      <p className="text-xs text-muted-foreground">{perk.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* CTA for non-creators */}
          <Card className="bg-gradient-to-r from-[#7C3AED]/10 to-tinerary-peach/20 border-0">
            <CardContent className="py-8 text-center">
              <Crown className="size-10 text-[#7C3AED] mx-auto mb-3" />
              <h3 className="text-lg font-bold mb-2">
                You're on the Creator Tier
              </h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                All premium creator features are active. Explore your tools above or visit pricing to learn about Business upgrades.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button asChild variant="outline">
                  <Link href="/pricing">View Plans</Link>
                </Button>
                <Button asChild className="btn-sunset">
                  <Link href="/creator/analytics">View Analytics</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
