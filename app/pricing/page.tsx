"use client"

import Link from "next/link"
import { ArrowLeft, ArrowRight, Check, Coins, Crown, Megaphone, Sparkles, Store, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AppHeader } from "@/components/app-header"
import { USER_TIERS } from "@/lib/tiers"

const tierColors: Record<string, string> = {
  user: "bg-tinerary-dark",
  creator: "bg-[#7C3AED]",
  business: "bg-primary",
}

const tierIcons: Record<string, React.ReactNode> = {
  user: <Users className="size-5" />,
  creator: <Sparkles className="size-5" />,
  business: <Store className="size-5" />,
}

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex-1">
        <div className="container px-4 py-6 md:py-10">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>

          {/* Hero */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4">
              <Crown className="size-7 text-tinerary-gold" />
              <h1 className="text-4xl font-bold tracking-tight">
                Plans for every traveler
              </h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              All consumer features are free forever. Creators and businesses unlock powerful tools to grow their audience and reach travelers.
            </p>
          </div>

          {/* Tier Cards — v0 style */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
            {USER_TIERS.map((tier) => {
              const isCreator = tier.slug === "creator"
              return (
                <div
                  key={tier.slug}
                  className={`rounded-2xl border overflow-hidden transition-shadow hover:shadow-lg ${
                    isCreator ? "shadow-lg ring-2 ring-primary/30" : "border-border"
                  }`}
                >
                  <div className={`${tierColors[tier.slug]} px-5 py-5 text-center`}>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <span className="text-primary-foreground">{tierIcons[tier.slug]}</span>
                      <p className="text-xs font-bold tracking-widest text-primary-foreground uppercase">
                        {tier.name}
                      </p>
                    </div>
                    <p className="text-3xl font-bold text-primary-foreground mt-1">{tier.price}</p>
                    <p className="text-xs text-primary-foreground/80">{tier.priceSuffix}</p>
                  </div>
                  <div className="p-5 flex flex-col gap-2.5 bg-card">
                    <p className="text-sm text-muted-foreground mb-2">{tier.description}</p>
                    {tier.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-2">
                        <Check className="size-4 text-tinerary-salmon shrink-0 mt-0.5" />
                        <span className="text-xs text-foreground leading-relaxed">{feature}</span>
                      </div>
                    ))}
                    <div className="mt-4">
                      {tier.slug === "user" && (
                        <Button className="w-full" variant="outline" asChild>
                          <Link href="/auth?tab=signup">Get Started Free</Link>
                        </Button>
                      )}
                      {tier.slug === "creator" && (
                        <Button className="w-full btn-sunset" asChild>
                          <Link href="/creators">Learn More</Link>
                        </Button>
                      )}
                      {tier.slug === "business" && (
                        <Button className="w-full" variant="outline" asChild>
                          <Link href="/business">View Business Plans</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Dashboard Pages Grid */}
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-2xl font-bold text-center mb-8">Explore the Platform</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { href: "/creator-tier", icon: <Sparkles className="size-5 text-[#7C3AED]" />, title: "Creator Dashboard", desc: "Manage boosts, track benefits" },
                { href: "/business-profile", icon: <Store className="size-5 text-primary" />, title: "Business Profile", desc: "Listings, branding & analytics" },
                { href: "/mentions", icon: <Megaphone className="size-5 text-tinerary-salmon" />, title: "Mention Highlights", desc: "Highlight organic mentions" },
                { href: "/transactions", icon: <Crown className="size-5 text-tinerary-gold" />, title: "Transactions", desc: "Bookings & commission tracking" },
                { href: "/affiliate", icon: <Users className="size-5 text-blue-500" />, title: "Affiliate Marketing", desc: "Referral links & packing commerce" },
                { href: "/coins", icon: <Coins className="size-5 text-tinerary-gold" />, title: "Tinerary Coins", desc: "Earn & spend rewards" },
              ].map((item) => (
                <Link key={item.href} href={item.href}>
                  <Card className="border-border hover:shadow-md transition-all duration-200 hover:-translate-y-1 h-full">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-2">
                        {item.icon}
                        <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Callout Cards */}
          <div className="max-w-4xl mx-auto space-y-6">
            <Card className="overflow-hidden border-border">
              <div className="flex flex-col md:flex-row">
                <div className="bg-gradient-to-br from-tinerary-peach/40 to-tinerary-gold/20 dark:from-tinerary-gold/10 dark:to-tinerary-peach/5 p-8 md:w-1/3 flex items-center justify-center">
                  <Coins className="h-16 w-16 text-tinerary-gold" />
                </div>
                <div className="p-8 md:w-2/3">
                  <h3 className="text-xl font-semibold mb-2">Tinerary Coins</h3>
                  <p className="text-muted-foreground mb-4">
                    Earn coins by sharing itineraries, getting saves, leaving reviews, and referring friends. Spend them on Shop discounts, premium templates, profile badges, and more.
                  </p>
                  <Button variant="outline" asChild>
                    <Link href="/coins" className="inline-flex items-center">
                      See how coins work
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden border-border">
              <div className="flex flex-col md:flex-row">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 p-8 md:w-1/3 flex items-center justify-center">
                  <Megaphone className="h-16 w-16 text-primary" />
                </div>
                <div className="p-8 md:w-2/3">
                  <h3 className="text-xl font-semibold mb-2">Business Advertising</h3>
                  <p className="text-muted-foreground mb-4">
                    Local businesses pay $49–$399/mo to list promotions, get featured in discovery feeds, and connect with travelers through booking integration and mention highlights.
                  </p>
                  <Button variant="outline" asChild>
                    <Link href="/business" className="inline-flex items-center">
                      Explore business plans
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      <footer className="bg-muted/50 py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mb-4">
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
