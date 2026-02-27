"use client"

import Link from "next/link"
import { ArrowLeft, ArrowRight, Check, Coins, Rocket, Sparkles, TrendingUp, Palette, Percent, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AppHeader } from "@/components/app-header"
import { BOOST_PACKAGES, AFFILIATE_COMMISSIONS } from "@/lib/tiers"

export default function CreatorsPage() {
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
              <Sparkles className="h-8 w-8 text-[#7C3AED]" />
              <h1 className="text-4xl font-bold tracking-tight">Creator Tier</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              For travel bloggers, local influencers, and trip planning enthusiasts who want to grow their audience and earn.
            </p>
          </div>

          {/* Creator pricing card — v0 style */}
          <div className="max-w-lg mx-auto mb-16">
            <div className="rounded-2xl border overflow-hidden shadow-lg ring-2 ring-primary/30">
              <div className="bg-[#7C3AED] px-5 py-6 text-center">
                <p className="text-xs font-bold tracking-widest text-primary-foreground uppercase">Creator</p>
                <p className="text-4xl font-bold text-primary-foreground mt-1">$49</p>
                <p className="text-xs text-primary-foreground/80">per month</p>
              </div>
              <div className="p-6 flex flex-col gap-3 bg-card">
                <p className="text-sm text-muted-foreground mb-2">
                  Everything in User, plus powerful tools to grow and earn.
                </p>
                {[
                  "Boost individual posts",
                  "Creator badge & verified profile",
                  "Analytics dashboard",
                  "Enhanced affiliate commissions (70/30)",
                  "Priority in discovery feed",
                  "Sell itinerary templates",
                  "Sponsorship inbox",
                  "Business-lite listing tools",
                  "2x coin earning rate",
                ].map((feature) => (
                  <div key={feature} className="flex items-start gap-2">
                    <Check className="size-4 text-tinerary-salmon shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </div>
                ))}
                <Button className="w-full btn-sunset mt-4">Get Started as a Creator</Button>
              </div>
            </div>
          </div>

          {/* Why Creator */}
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-2xl font-bold text-center mb-8">Why go Creator?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: <TrendingUp className="size-8 text-tinerary-gold" />,
                  title: "Grow your audience",
                  description: "Priority placement in the discovery feed puts your itineraries in front of more travelers.",
                },
                {
                  icon: <Rocket className="size-8 text-primary" />,
                  title: "Boost your posts",
                  description: "Pay to amplify individual itineraries with targeted impressions from $5.",
                },
                {
                  icon: <Coins className="size-8 text-tinerary-gold" />,
                  title: "Earn more",
                  description: "70/30 affiliate split (vs 60/40 for standard users) plus 2x coin earning rate.",
                },
                {
                  icon: <Palette className="size-8 text-tinerary-salmon" />,
                  title: "Sell templates",
                  description: "Create and sell premium itinerary templates to other travelers.",
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

          {/* Post Boost Pricing */}
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-2xl font-bold text-center mb-2">Post Boost Pricing</h2>
            <p className="text-center text-muted-foreground mb-8 max-w-xl mx-auto">
              Amplify any itinerary post to reach more travelers. Pick the package that fits your goals.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {BOOST_PACKAGES.map((pkg) => (
                <div
                  key={pkg.name}
                  className="flex flex-col items-center p-5 rounded-2xl bg-muted text-center border border-border"
                >
                  <p className="text-2xl font-bold text-primary">${pkg.price}</p>
                  <p className="text-sm font-semibold text-foreground mt-1">{pkg.name}</p>
                  <div className="w-full h-px bg-border my-3" />
                  <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Impressions:</span> {pkg.impressions}</p>
                  <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Duration:</span> {pkg.duration}</p>
                  <p className="text-xs text-muted-foreground mt-1">Cost per 1K: {pkg.costPer1K}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Affiliate Commission Splits */}
          <div className="max-w-2xl mx-auto mb-16">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="size-5 text-tinerary-salmon" /> Affiliate Commission Splits
                </CardTitle>
                <CardDescription>Creators earn a bigger share of every affiliate sale.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  {AFFILIATE_COMMISSIONS.map((split) => (
                    <div key={split.userType} className="p-5 rounded-2xl bg-muted">
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="size-4 text-muted-foreground" />
                        <h4 className="text-sm font-bold text-foreground">{split.userType}</h4>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div>
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>User Share</span>
                            <span className="font-semibold text-foreground">{split.userShare}</span>
                          </div>
                          <Progress
                            value={parseInt(split.userShare)}
                            className="h-3 rounded-full [&>[data-slot=progress-indicator]]:bg-tinerary-salmon [&>[data-slot=progress-indicator]]:rounded-full"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Tinerary Share</span>
                            <span className="font-semibold text-foreground">{split.tineraryShare}</span>
                          </div>
                          <Progress
                            value={parseInt(split.tineraryShare)}
                            className="h-3 rounded-full [&>[data-slot=progress-indicator]]:bg-primary [&>[data-slot=progress-indicator]]:rounded-full"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Card className="max-w-xl mx-auto bg-gradient-to-r from-tinerary-peach/30 to-tinerary-salmon/10 dark:from-tinerary-salmon/10 dark:to-tinerary-peach/5 border-0">
              <CardContent className="py-10">
                <h3 className="text-xl font-bold mb-2">Ready to level up?</h3>
                <p className="text-muted-foreground mb-6">Join Tinerary as a Creator and start earning today.</p>
                <Button className="btn-sunset" size="lg">
                  Become a Creator
                </Button>
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
