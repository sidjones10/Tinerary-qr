"use client"

import Link from "next/link"
import { ArrowLeft, ArrowRight, Check, Coins, Megaphone, Sparkles, Store, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AppHeader } from "@/components/app-header"
import { USER_TIERS } from "@/lib/tiers"

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
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Plans for every traveler
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              All consumer features are free forever. Creators and businesses unlock powerful tools to grow their audience and reach travelers.
            </p>
          </div>

          {/* Tier Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
            {USER_TIERS.map((tier) => {
              const isCreator = tier.slug === "creator"
              return (
                <Card
                  key={tier.slug}
                  className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg ${
                    isCreator ? "border-2 border-primary shadow-md" : ""
                  }`}
                >
                  {isCreator && (
                    <div className="absolute top-0 right-0">
                      <Badge className="rounded-none rounded-bl-lg bg-primary text-primary-foreground">
                        Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      {tier.slug === "user" && <Users className="h-5 w-5 text-blue-500" />}
                      {tier.slug === "creator" && <Sparkles className="h-5 w-5 text-primary" />}
                      {tier.slug === "business" && <Store className="h-5 w-5 text-orange-500" />}
                      <CardTitle className="text-xl">{tier.name}</CardTitle>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">{tier.price}</span>
                      <span className="text-sm text-muted-foreground">{tier.priceSuffix}</span>
                    </div>
                    <CardDescription className="mt-2">{tier.description}</CardDescription>
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
                  </CardFooter>
                </Card>
              )
            })}
          </div>

          {/* Additional Sections */}
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Tinerary Coins callout */}
            <Card className="overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 p-8 md:w-1/3 flex items-center justify-center">
                  <Coins className="h-16 w-16 text-yellow-500" />
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

            {/* Business advertising callout */}
            <Card className="overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-8 md:w-1/3 flex items-center justify-center">
                  <Megaphone className="h-16 w-16 text-blue-500" />
                </div>
                <div className="p-8 md:w-2/3">
                  <h3 className="text-xl font-semibold mb-2">Business Advertising</h3>
                  <p className="text-muted-foreground mb-4">
                    Local businesses pay $49&#8211;$399/mo to list promotions, get featured in discovery feeds, and connect with travelers through booking integration and mention highlights.
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
