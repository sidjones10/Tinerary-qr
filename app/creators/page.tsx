"use client"

import Link from "next/link"
import { ArrowLeft, ArrowRight, Check, Coins, Rocket, Sparkles, TrendingUp, Palette } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
              <Sparkles className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold tracking-tight">Creator Tier</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              For travel bloggers, local influencers, and trip planning enthusiasts who want to grow their audience and earn.
            </p>
          </div>

          {/* Creator pricing card */}
          <div className="max-w-lg mx-auto mb-16">
            <Card className="border-2 border-primary shadow-md overflow-hidden">
              <CardHeader className="text-center pb-4">
                <Badge className="w-fit mx-auto mb-2 bg-primary text-primary-foreground">Creator</Badge>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold">$49</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <CardDescription className="mt-2">
                  Everything in User, plus powerful tools to grow and earn.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
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
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full btn-sunset">Get Started as a Creator</Button>
              </CardFooter>
            </Card>
          </div>

          {/* Why Creator */}
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-2xl font-bold text-center mb-8">Why go Creator?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: <TrendingUp className="h-8 w-8 text-green-500" />,
                  title: "Grow your audience",
                  description: "Priority placement in the discovery feed puts your itineraries in front of more travelers.",
                },
                {
                  icon: <Rocket className="h-8 w-8 text-blue-500" />,
                  title: "Boost your posts",
                  description: "Pay to amplify individual itineraries with targeted impressions from $5.",
                },
                {
                  icon: <Coins className="h-8 w-8 text-yellow-500" />,
                  title: "Earn more",
                  description: "70/30 affiliate split (vs 60/40 for standard users) plus 2x coin earning rate.",
                },
                {
                  icon: <Palette className="h-8 w-8 text-pink-500" />,
                  title: "Sell templates",
                  description: "Create and sell premium itinerary templates to other travelers.",
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

          {/* Post Boost Pricing */}
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-2xl font-bold text-center mb-2">Post Boost Pricing</h2>
            <p className="text-center text-muted-foreground mb-8 max-w-xl mx-auto">
              Amplify any itinerary post to reach more travelers. Pick the package that fits your goals.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {BOOST_PACKAGES.map((pkg, i) => (
                <Card key={i} className="transition-all duration-200 hover:shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{pkg.name}</CardTitle>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold">${pkg.price}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <p className="text-sm"><span className="font-medium">Impressions:</span> {pkg.impressions}</p>
                    <p className="text-sm"><span className="font-medium">Duration:</span> {pkg.duration}</p>
                    <p className="text-xs text-muted-foreground">Cost per 1K: {pkg.costPer1K}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Affiliate Commission Table */}
          <div className="max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl font-bold text-center mb-2">Affiliate Commission Splits</h2>
            <p className="text-center text-muted-foreground mb-8">
              Creators earn a bigger share of every affiliate sale.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">User Type</th>
                    <th className="text-center py-3 px-4 font-medium">Your Share</th>
                    <th className="text-center py-3 px-4 font-medium">Tinerary Share</th>
                  </tr>
                </thead>
                <tbody>
                  {AFFILIATE_COMMISSIONS.map((row, i) => (
                    <tr key={i} className="border-b last:border-b-0">
                      <td className="py-3 px-4 font-medium">{row.userType}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={row.userType === "Creator" ? "default" : "secondary"}>
                          {row.userShare}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center text-muted-foreground">{row.tineraryShare}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Card className="max-w-xl mx-auto bg-gradient-to-r from-pink-50 to-orange-50 dark:from-pink-900/20 dark:to-orange-900/20 border-0">
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
