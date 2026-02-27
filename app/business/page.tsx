"use client"

import Link from "next/link"
import { ArrowLeft, Check, BarChart3, Megaphone, Users, Zap, Building2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AppHeader } from "@/components/app-header"
import { BUSINESS_TIERS, MENTION_HIGHLIGHTS, ENTERPRISE_FEATURE_COMPARISON } from "@/lib/tiers"

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
              <Building2 className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold tracking-tight">Business Plans</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              List promotions, reach travelers, and grow your business on the platform where people plan their next adventure.
            </p>
          </div>

          {/* Business Tier Cards — v0 style */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
            {BUSINESS_TIERS.map((tier) => (
              <div
                key={tier.slug}
                className={`rounded-2xl border overflow-hidden transition-shadow hover:shadow-lg ${
                  tier.highlighted ? "shadow-lg ring-2 ring-primary/30" : "border-border"
                }`}
              >
                <div className={`${tier.highlighted ? "bg-primary" : "bg-tinerary-dark"} px-5 py-5 text-center relative`}>
                  {tier.highlighted && (
                    <Badge className="absolute top-2 right-2 bg-tinerary-peach text-tinerary-dark border-0 text-xs">
                      Most Popular
                    </Badge>
                  )}
                  <p className="text-xs font-bold tracking-widest text-primary-foreground uppercase">
                    {tier.name}
                  </p>
                  <p className="text-3xl font-bold text-primary-foreground mt-1">${tier.price}</p>
                  <p className="text-xs text-primary-foreground/80">/{tier.priceSuffix}</p>
                </div>
                <div className="p-5 flex flex-col gap-2.5 bg-card">
                  {tier.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2">
                      <Check className="size-4 text-tinerary-salmon shrink-0 mt-0.5" />
                      <span className="text-xs text-foreground leading-relaxed">{feature}</span>
                    </div>
                  ))}
                  <Button
                    className={`w-full mt-4 ${tier.highlighted ? "btn-sunset" : ""}`}
                    variant={tier.highlighted ? "default" : "outline"}
                    asChild
                  >
                    <Link href={`/business-onboarding?tier=${tier.slug}`}>
                      Get Started
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Why Tinerary */}
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-2xl font-bold text-center mb-8">Why advertise on Tinerary?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: <Users className="size-8 text-primary" />,
                  title: "Reach travelers",
                  description: "Your promotions appear when people are actively planning trips to your area.",
                },
                {
                  icon: <Megaphone className="size-8 text-tinerary-salmon" />,
                  title: "Organic mentions",
                  description: "When users mention your business in itineraries, highlight it with your branding.",
                },
                {
                  icon: <BarChart3 className="size-8 text-tinerary-gold" />,
                  title: "Real analytics",
                  description: "Track views, clicks, saves, and bookings with performance reports.",
                },
                {
                  icon: <Zap className="size-8 text-[#7C3AED]" />,
                  title: "Booking integration",
                  description: "Let travelers book directly from your listing without leaving the platform.",
                },
              ].map((item, i) => (
                <Card key={i} className="text-center border-border">
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
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {MENTION_HIGHLIGHTS.map((h) => (
                <div
                  key={h.name}
                  className="flex flex-col items-center p-5 rounded-2xl bg-muted text-center border border-border"
                >
                  <p className="text-2xl font-bold text-primary">${h.price}</p>
                  <p className="text-sm font-semibold text-foreground mt-1">{h.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{h.duration}</p>
                  <div className="w-full h-px bg-border my-3" />
                  <p className="text-xs text-muted-foreground leading-relaxed">{h.includes}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">
              Premium subscribers get 5 highlights/month included. Enterprise subscribers get unlimited.
            </p>
          </div>

          {/* Feature comparison table */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">Compare Plans</h2>
            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-tinerary-dark">
                        <th className="text-left py-3 px-4 font-medium text-primary-foreground">Feature</th>
                        {BUSINESS_TIERS.map((t) => (
                          <th key={t.slug} className="text-center py-3 px-4 font-medium text-primary-foreground">
                            {t.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ENTERPRISE_FEATURE_COMPARISON.map((row, i) => (
                        <tr key={i} className="border-b last:border-b-0">
                          <td className="py-3 px-4 font-medium text-foreground">{row.feature}</td>
                          <td className="py-3 px-4 text-center text-muted-foreground">{row.basic}</td>
                          <td className="py-3 px-4 text-center text-foreground">{row.premium}</td>
                          <td className="py-3 px-4 text-center font-medium text-foreground">{row.enterprise}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="bg-muted/50 py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center gap-4 mb-4">
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground hover:underline">
              Terms of Service
            </Link>
            <span className="text-muted-foreground/40">|</span>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground hover:underline">
              Privacy Policy
            </Link>
          </div>
          <p className="text-muted-foreground">&copy; {new Date().getFullYear()} Tinerary. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
