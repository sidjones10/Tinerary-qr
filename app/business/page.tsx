"use client"

import Link from "next/link"
import { ArrowLeft, Check, BarChart3, Megaphone, Users, Zap, Star, Building2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AppHeader } from "@/components/app-header"
import { BUSINESS_TIERS, MENTION_HIGHLIGHTS } from "@/lib/tiers"

export default function BusinessPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex-1">
        <div className="container px-4 py-6 md:py-10">
          <Link href="/pricing" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Pricing
          </Link>

          {/* Hero */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4">
              <Building2 className="h-8 w-8 text-orange-500" />
              <h1 className="text-4xl font-bold tracking-tight">Business Plans</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              List promotions, reach travelers, and grow your business on the platform where people plan their next adventure.
            </p>
          </div>

          {/* Business Tier Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
            {BUSINESS_TIERS.map((tier) => (
              <Card
                key={tier.slug}
                className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg ${
                  tier.highlighted ? "border-2 border-primary shadow-md" : ""
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute top-0 right-0">
                    <Badge className="rounded-none rounded-bl-lg bg-primary text-primary-foreground">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">{tier.name}</CardTitle>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">${tier.price}</span>
                    <span className="text-sm text-muted-foreground">/{tier.priceSuffix}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2.5">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className={`w-full ${tier.highlighted ? "btn-sunset" : ""}`}
                    variant={tier.highlighted ? "default" : "outline"}
                  >
                    Get Started
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Why Tinerary */}
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-2xl font-bold text-center mb-8">Why advertise on Tinerary?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: <Users className="h-8 w-8 text-blue-500" />,
                  title: "Reach travelers",
                  description: "Your promotions appear when people are actively planning trips to your area.",
                },
                {
                  icon: <Megaphone className="h-8 w-8 text-pink-500" />,
                  title: "Organic mentions",
                  description: "When users mention your business in itineraries, highlight it with your branding.",
                },
                {
                  icon: <BarChart3 className="h-8 w-8 text-green-500" />,
                  title: "Real analytics",
                  description: "Track views, clicks, saves, and bookings with performance reports.",
                },
                {
                  icon: <Zap className="h-8 w-8 text-yellow-500" />,
                  title: "Booking integration",
                  description: "Let travelers book directly from your listing without leaving the platform.",
                },
              ].map((item, i) => (
                <Card key={i} className="text-center">
                  <CardContent className="pt-6">
                    <div className="flex justify-center mb-4">{item.icon}</div>
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Mention Highlights */}
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-2xl font-bold text-center mb-2">Organic Mention Highlights</h2>
            <p className="text-center text-muted-foreground mb-8 max-w-xl mx-auto">
              When a user mentions your business in a public itinerary, pay to highlight it with your logo, a booking link, and a special offer.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {MENTION_HIGHLIGHTS.map((h, i) => (
                <Card key={i} className="transition-all duration-200 hover:shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{h.name}</CardTitle>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold">${h.price}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground mb-1">{h.duration}</p>
                    <p className="text-sm">{h.includes}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">
              Premium subscribers get 5 highlights/month included. Enterprise subscribers get unlimited.
            </p>
          </div>

          {/* Feature comparison table */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">Compare Plans</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Feature</th>
                    {BUSINESS_TIERS.map((t) => (
                      <th key={t.slug} className="text-center py-3 px-4 font-medium">
                        {t.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: "Listing placement", basic: "Standard", premium: "Featured", enterprise: "Top-tier + badges" },
                    { feature: "Active promotions", basic: "Up to 5", premium: "Unlimited", enterprise: "Unlimited" },
                    { feature: "Analytics", basic: "Basic", premium: "Advanced", enterprise: "Real-time + API" },
                    { feature: "Support", basic: "Email", premium: "Priority", enterprise: "Dedicated manager" },
                    { feature: "Performance reports", basic: "Monthly", premium: "Weekly", enterprise: "Daily" },
                    { feature: "Booking integration", basic: "\u2014", premium: "\u2713", enterprise: "Priority placement" },
                    { feature: "Mention Highlights", basic: "\u2014", premium: "5/mo included", enterprise: "Unlimited" },
                    { feature: "Custom branded profile", basic: "\u2014", premium: "\u2014", enterprise: "\u2713" },
                  ].map((row, i) => (
                    <tr key={i} className="border-b last:border-b-0">
                      <td className="py-3 px-4 font-medium">{row.feature}</td>
                      <td className="py-3 px-4 text-center text-muted-foreground">{row.basic}</td>
                      <td className="py-3 px-4 text-center">{row.premium}</td>
                      <td className="py-3 px-4 text-center">{row.enterprise}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-100 dark:bg-card py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center gap-4 mb-4">
            <Link href="/terms" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:underline">
              Terms of Service
            </Link>
            <span className="text-gray-400 dark:text-gray-600">|</span>
            <Link href="/privacy" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:underline">
              Privacy Policy
            </Link>
          </div>
          <p className="text-gray-600 dark:text-gray-400">&copy; {new Date().getFullYear()} Tinerary. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
