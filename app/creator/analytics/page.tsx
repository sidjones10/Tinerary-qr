"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  BarChart3,
  Eye,
  Heart,
  Bookmark,
  Share2,
  Users,
  TrendingUp,
  Zap,
  ArrowUpRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AppHeader } from "@/components/app-header"
import { createClient } from "@/lib/supabase/client"
import { getCreatorAnalytics, type CreatorAnalytics } from "@/lib/creator-service"

export default function CreatorAnalyticsPage() {
  const [analytics, setAnalytics] = useState<CreatorAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/auth?redirectTo=/creator/analytics")
        return
      }
      const data = await getCreatorAnalytics(session.user.id)
      setAnalytics(data)
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading analytics...</div>
        </main>
      </div>
    )
  }

  const stats = [
    { label: "Total Views", value: analytics?.totalViews?.toLocaleString() || "0", icon: Eye, change: "+18%" },
    { label: "Total Likes", value: analytics?.totalLikes?.toLocaleString() || "0", icon: Heart, change: "+12%" },
    { label: "Total Saves", value: analytics?.totalSaves?.toLocaleString() || "0", icon: Bookmark, change: "+24%" },
    { label: "Total Shares", value: analytics?.totalShares?.toLocaleString() || "0", icon: Share2, change: "+8%" },
    { label: "Followers", value: analytics?.totalFollowers?.toLocaleString() || "0", icon: Users, change: "+15%" },
    { label: "Engagement Rate", value: `${analytics?.engagementRate || 0}%`, icon: Zap, change: "+2.1%" },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1">
        <div className="container px-4 py-6 md:py-10">
          <Link
            href="/creator"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Creator Hub
          </Link>

          <div className="flex items-center gap-3 mb-8">
            <div className="size-10 rounded-xl bg-tinerary-gold/10 flex items-center justify-center">
              <BarChart3 className="size-5 text-tinerary-gold" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Track your content performance and audience growth
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {stats.map((stat) => (
              <Card key={stat.label} className="border-border">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <stat.icon className="size-5 text-muted-foreground" />
                    <span className="text-xs font-medium text-tinerary-salmon flex items-center gap-0.5">
                      {stat.change} <ArrowUpRight className="size-3" />
                    </span>
                  </div>
                  <p className="mt-3 text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Top Performing Content */}
          <Card className="border-border mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="size-5 text-primary" /> Top Performing Content
              </CardTitle>
              <CardDescription>Your itineraries ranked by total views</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.topItineraries && analytics.topItineraries.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {analytics.topItineraries.map((it, i) => (
                    <div
                      key={it.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-muted"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-lg font-bold text-muted-foreground w-6 text-center">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {it.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Eye className="size-3" /> {it.views.toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Heart className="size-3" /> {it.likes.toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Bookmark className="size-3" /> {it.saves.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Link
                        href={`/event/${it.id}`}
                        className="text-xs font-medium text-primary hover:underline shrink-0 ml-4"
                      >
                        View
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No public itineraries yet. Create and publish content to see analytics here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Engagement Breakdown */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Engagement Breakdown</CardTitle>
              <CardDescription>How your audience interacts with your content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                {[
                  { label: "Views", value: analytics?.totalViews || 0, max: Math.max(analytics?.totalViews || 1, 1), color: "[&>[data-slot=progress-indicator]]:bg-primary" },
                  { label: "Likes", value: analytics?.totalLikes || 0, max: Math.max(analytics?.totalViews || 1, 1), color: "[&>[data-slot=progress-indicator]]:bg-tinerary-salmon" },
                  { label: "Saves", value: analytics?.totalSaves || 0, max: Math.max(analytics?.totalViews || 1, 1), color: "[&>[data-slot=progress-indicator]]:bg-tinerary-gold" },
                  { label: "Shares", value: analytics?.totalShares || 0, max: Math.max(analytics?.totalViews || 1, 1), color: "[&>[data-slot=progress-indicator]]:bg-[#7C3AED]" },
                ].map((metric) => (
                  <div key={metric.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-foreground font-medium">{metric.label}</span>
                      <span className="text-muted-foreground">{metric.value.toLocaleString()}</span>
                    </div>
                    <Progress
                      value={metric.max > 0 ? (metric.value / metric.max) * 100 : 0}
                      className={`h-3 rounded-full ${metric.color} [&>[data-slot=progress-indicator]]:rounded-full`}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
