"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  MapPin,
  Globe,
  Star,
  Clock,
  Users,
  Eye,
  CalendarDays,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react"

const stats = [
  { label: "Profile Views", value: "2,487", change: "+18%", icon: Eye },
  { label: "Bookings", value: "142", change: "+12%", icon: CalendarDays },
  { label: "Followers", value: "1,230", change: "+8%", icon: Users },
  { label: "Avg Rating", value: "4.8", change: "+0.2", icon: Star },
]

const activePromotions = [
  { name: "Summer Dining Special", type: "Promotion", status: "Active", reach: "3.2K views" },
  { name: "Weekend Brunch Bundle", type: "Experience", status: "Active", reach: "1.8K views" },
  { name: "Happy Hour Deal", type: "Deal", status: "Scheduled", reach: "--" },
]

export function BusinessProfileContent() {
  return (
    <div className="mt-6 flex flex-col gap-6">
      {/* Profile Card */}
      <Card className="overflow-hidden border-border">
        <div className="h-32 bg-gradient-to-r from-tinerary-peach to-secondary" />
        <CardContent className="relative -mt-12">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="size-24 rounded-2xl bg-card border-4 border-card flex items-center justify-center shadow-md">
              <span className="text-3xl font-bold text-tinerary-salmon">TC</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">The Coastal Kitchen</h2>
                <CheckCircle2 className="size-5 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">Farm-to-table restaurant & catering</p>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3" /> San Francisco, CA
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Globe className="size-3" /> coastalkitchen.com
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" /> Joined Jan 2025
                </span>
              </div>
            </div>
            <Badge className="bg-tinerary-salmon text-primary-foreground border-0 self-start sm:self-end">
              Premium
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <stat.icon className="size-5 text-muted-foreground" />
                <span className="text-xs font-medium text-tinerary-salmon flex items-center gap-0.5">
                  {stat.change}
                  <ArrowUpRight className="size-3" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subscription & Promotions */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Current Plan */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Subscription Plan</CardTitle>
            <CardDescription>Your current Tinerary business tier</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-lg font-bold text-foreground">Premium</p>
                <p className="text-sm text-muted-foreground">$149 / month</p>
              </div>
              <button className="text-sm font-medium text-primary hover:underline">
                Upgrade to Enterprise
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Promotions Used</span>
                  <span>8 / Unlimited</span>
                </div>
                <Progress value={40} className="h-2 [&>[data-slot=progress-indicator]]:bg-tinerary-salmon" />
              </div>
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Mention Highlights (Included)</span>
                  <span>3 / 5</span>
                </div>
                <Progress value={60} className="h-2 [&>[data-slot=progress-indicator]]:bg-tinerary-gold" />
              </div>
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>API Calls This Month</span>
                  <span>1,240 / 10,000</span>
                </div>
                <Progress value={12} className="h-2 [&>[data-slot=progress-indicator]]:bg-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Promotions */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Active Promotions</CardTitle>
            <CardDescription>Your currently running business listings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {activePromotions.map((promo) => (
                <div
                  key={promo.name}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{promo.name}</p>
                    <p className="text-xs text-muted-foreground">{promo.type} &middot; {promo.reach}</p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      promo.status === "Active"
                        ? "bg-tinerary-peach text-tinerary-dark border-0"
                        : "bg-secondary text-secondary-foreground border-0"
                    }
                  >
                    {promo.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Snapshot */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Weekly Performance</CardTitle>
          <CardDescription>Key metrics from the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Discovery Feed Impressions", value: "12.4K" },
              { label: "Search Appearances", value: "3.1K" },
              { label: "Itinerary Mentions", value: "87" },
              { label: "Booking Conversions", value: "23" },
            ].map((item) => (
              <div key={item.label} className="text-center p-4 rounded-xl bg-muted">
                <p className="text-2xl font-bold text-foreground">{item.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
