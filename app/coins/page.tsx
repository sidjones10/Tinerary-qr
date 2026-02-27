"use client"

import Link from "next/link"
import { ArrowLeft, ArrowRight, Coins, Gift, Plus, ShoppingBag, Star, Trophy } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AppHeader } from "@/components/app-header"
import { COIN_EARNING_ACTIONS, COIN_SPENDING_REWARDS } from "@/lib/tiers"

export default function CoinsPage() {
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
              <Coins className="h-8 w-8 text-yellow-500" />
              <h1 className="text-4xl font-bold tracking-tight">Tinerary Coins</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Earn coins for the things you already do — share itineraries, help other travelers, and explore. Spend them on real perks and products.
            </p>
          </div>

          {/* How it works */}
          <div className="max-w-3xl mx-auto mb-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              {[
                {
                  icon: <Plus className="h-8 w-8 text-green-500" />,
                  title: "Earn",
                  description: "Publish itineraries, get saves, leave reviews, refer friends.",
                },
                {
                  icon: <Coins className="h-8 w-8 text-yellow-500" />,
                  title: "Accumulate",
                  description: "Coins stack up automatically. Creator tier users earn at 2x rate.",
                },
                {
                  icon: <Gift className="h-8 w-8 text-pink-500" />,
                  title: "Spend",
                  description: "Redeem for Shop discounts, templates, profile badges, and boosts.",
                },
              ].map((step, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="rounded-full bg-muted p-4 mb-3">{step.icon}</div>
                  <h3 className="font-semibold mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Earning Table */}
          <div className="max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl font-bold text-center mb-2">
              <span className="inline-flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Earning Coins
              </span>
            </h2>
            <p className="text-center text-muted-foreground mb-6">
              Every action that helps the community rewards you with coins.
            </p>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left py-3 px-4 font-medium">Action</th>
                        <th className="text-center py-3 px-4 font-medium">Coins</th>
                        <th className="text-left py-3 px-4 font-medium hidden sm:table-cell">Why</th>
                      </tr>
                    </thead>
                    <tbody>
                      {COIN_EARNING_ACTIONS.map((row, i) => (
                        <tr key={i} className="border-b last:border-b-0">
                          <td className="py-3 px-4">{row.action}</td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                              +{row.coins}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">{row.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Spending Table */}
          <div className="max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl font-bold text-center mb-2">
              <span className="inline-flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-pink-500" />
                Spending Coins
              </span>
            </h2>
            <p className="text-center text-muted-foreground mb-6">
              Turn your coins into real perks, discounts, and exclusive content.
            </p>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left py-3 px-4 font-medium">Reward</th>
                        <th className="text-center py-3 px-4 font-medium">Cost</th>
                        <th className="text-left py-3 px-4 font-medium hidden sm:table-cell">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {COIN_SPENDING_REWARDS.map((row, i) => (
                        <tr key={i} className="border-b last:border-b-0">
                          <td className="py-3 px-4">{row.reward}</td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant="outline">
                              {row.cost} coins
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">{row.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Key principle callout */}
          <div className="max-w-3xl mx-auto mb-16">
            <Card className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-0">
              <CardContent className="py-8 text-center">
                <Trophy className="h-10 w-10 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">Sharing is rewarding, not required</h3>
                <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                  Private users can use every feature. But public users earn coins passively that unlock perks, discounts, and status. Over time, sharing just makes sense.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Button className="btn-sunset" size="lg" asChild>
              <Link href="/auth?tab=signup">
                Start Earning Coins
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
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
