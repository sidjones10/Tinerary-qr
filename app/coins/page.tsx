"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, ArrowUpRight, ArrowDownLeft, Coins, Gift, Loader2, Plus, ShoppingBag, Star, Trophy } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AppHeader } from "@/components/app-header"
import { COIN_EARNING_ACTIONS, COIN_SPENDING_REWARDS } from "@/lib/tiers"
import { REWARD_COSTS, REWARD_NAMES, type CoinSpendAction } from "@/lib/coins-service"
import { createClient } from "@/lib/supabase/client"

interface CoinTransaction {
  id: string
  amount: number
  type: "earn" | "spend"
  action: string
  description: string
  created_at: string
}

function UserCoinDashboard() {
  const [balance, setBalance] = useState<number | null>(null)
  const [lifetimeEarned, setLifetimeEarned] = useState(0)
  const [lifetimeSpent, setLifetimeSpent] = useState(0)
  const [transactions, setTransactions] = useState<CoinTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [redeeming, setRedeeming] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [balanceRes, txRes] = await Promise.all([
        fetch("/api/coins"),
        fetch("/api/coins/transactions?limit=10"),
      ])

      if (balanceRes.ok) {
        const balanceData = await balanceRes.json()
        setBalance(balanceData.balance)
        setLifetimeEarned(balanceData.lifetime_earned)
        setLifetimeSpent(balanceData.lifetime_spent)
      }

      if (txRes.ok) {
        const txData = await txRes.json()
        setTransactions(txData.transactions)
      }
    } catch (error) {
      console.error("Error fetching coin data:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRedeem = async (rewardSlug: CoinSpendAction) => {
    setRedeeming(rewardSlug)
    try {
      const res = await fetch("/api/coins/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reward_slug: rewardSlug }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setBalance(data.new_balance)
        // Refresh transaction list
        fetchData()
      } else {
        alert(data.error || "Failed to redeem reward")
      }
    } catch (error) {
      console.error("Error redeeming:", error)
      alert("Something went wrong. Please try again.")
    } finally {
      setRedeeming(null)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto mb-16">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (balance === null) return null

  return (
    <>
      {/* Balance Overview */}
      <div className="max-w-3xl mx-auto mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-tinerary-gold/20 to-tinerary-peach/20 border-tinerary-gold/30">
            <CardContent className="pt-6 text-center">
              <Coins className="h-8 w-8 text-tinerary-gold mx-auto mb-2" />
              <p className="text-3xl font-bold tabular-nums">{balance.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Current Balance</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <ArrowUpRight className="h-6 w-6 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold tabular-nums text-green-600">{lifetimeEarned.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Earned</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <ArrowDownLeft className="h-6 w-6 text-orange-500 mx-auto mb-2" />
              <p className="text-2xl font-bold tabular-nums text-orange-600">{lifetimeSpent.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Spent</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Redeem Rewards */}
      <div className="max-w-3xl mx-auto mb-12">
        <h2 className="text-2xl font-bold text-center mb-2">
          <span className="inline-flex items-center gap-2">
            <Gift className="h-5 w-5 text-tinerary-salmon" />
            Redeem Rewards
          </span>
        </h2>
        <p className="text-center text-muted-foreground mb-6">
          Spend your coins on perks and rewards.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(Object.entries(REWARD_COSTS) as [CoinSpendAction, number][]).map(([slug, cost]) => {
            const canAfford = balance >= cost
            return (
              <Card key={slug} className={canAfford ? "border-border" : "border-border opacity-60"}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{REWARD_NAMES[slug]}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {COIN_SPENDING_REWARDS.find(r => r.cost === cost)?.details}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={canAfford ? "default" : "outline"}
                      disabled={!canAfford || redeeming === slug}
                      onClick={() => handleRedeem(slug)}
                      className={canAfford ? "btn-sunset shrink-0" : "shrink-0"}
                    >
                      {redeeming === slug ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>{cost} coins</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <div className="max-w-3xl mx-auto mb-16">
          <h2 className="text-2xl font-bold text-center mb-6">
            <span className="inline-flex items-center gap-2">
              <Star className="h-5 w-5 text-tinerary-gold" />
              Recent Activity
            </span>
          </h2>
          <Card className="border-border">
            <CardContent className="p-0">
              <div className="divide-y">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-full p-1.5 ${tx.type === "earn" ? "bg-green-100 dark:bg-green-900/30" : "bg-orange-100 dark:bg-orange-900/30"}`}>
                        {tx.type === "earn" ? (
                          <ArrowUpRight className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                        ) : (
                          <ArrowDownLeft className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className={tx.type === "earn"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0"
                        : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-0"
                      }
                    >
                      {tx.amount > 0 ? "+" : ""}{tx.amount}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

export default function CoinsPage() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session?.user)
    })
  }, [])

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
              <Coins className="h-8 w-8 text-tinerary-gold" />
              <h1 className="text-4xl font-bold tracking-tight">Tinerary Coins</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Earn coins for the things you already do — share itineraries, help other travelers, and explore. Spend them on real perks and products.
            </p>
          </div>

          {/* Personalized Dashboard (logged-in users only) */}
          {isLoggedIn && <UserCoinDashboard />}

          {/* How it works */}
          <div className="max-w-3xl mx-auto mb-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              {[
                {
                  icon: <Plus className="size-8 text-tinerary-salmon" />,
                  title: "Earn",
                  description: "Publish itineraries, get saves, leave reviews, refer friends.",
                },
                {
                  icon: <Coins className="size-8 text-tinerary-gold" />,
                  title: "Accumulate",
                  description: "Coins stack up automatically. Creator tier users earn at 2x rate.",
                },
                {
                  icon: <Gift className="size-8 text-primary" />,
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
                <Star className="h-5 w-5 text-tinerary-gold" />
                Earning Coins
              </span>
            </h2>
            <p className="text-center text-muted-foreground mb-6">
              Every action that helps the community rewards you with coins.
            </p>
            <Card className="border-border">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-tinerary-dark">
                        <th className="text-left py-3 px-4 font-medium text-primary-foreground">Action</th>
                        <th className="text-center py-3 px-4 font-medium text-primary-foreground">Coins</th>
                        <th className="text-center py-3 px-4 font-medium text-primary-foreground">Creator (2x)</th>
                        <th className="text-left py-3 px-4 font-medium text-primary-foreground hidden sm:table-cell">Why</th>
                      </tr>
                    </thead>
                    <tbody>
                      {COIN_EARNING_ACTIONS.map((row, i) => (
                        <tr key={i} className="border-b last:border-b-0">
                          <td className="py-3 px-4 text-foreground">{row.action}</td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant="secondary" className="bg-tinerary-gold/20 text-tinerary-dark dark:text-tinerary-gold border-0">
                              +{row.coins}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant="secondary" className="bg-[#7C3AED]/20 text-[#7C3AED] border-0">
                              +{row.coins * 2}
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
                <ShoppingBag className="h-5 w-5 text-tinerary-salmon" />
                Spending Coins
              </span>
            </h2>
            <p className="text-center text-muted-foreground mb-6">
              Turn your coins into real perks, discounts, and exclusive content.
            </p>
            <Card className="border-border">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-tinerary-dark">
                        <th className="text-left py-3 px-4 font-medium text-primary-foreground">Reward</th>
                        <th className="text-center py-3 px-4 font-medium text-primary-foreground">Cost</th>
                        <th className="text-left py-3 px-4 font-medium text-primary-foreground hidden sm:table-cell">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {COIN_SPENDING_REWARDS.map((row, i) => (
                        <tr key={i} className="border-b last:border-b-0">
                          <td className="py-3 px-4 text-foreground">{row.reward}</td>
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
            <Card className="bg-gradient-to-r from-tinerary-peach/30 to-tinerary-gold/10 dark:from-tinerary-gold/10 dark:to-tinerary-peach/5 border-0">
              <CardContent className="py-8 text-center">
                <Trophy className="h-10 w-10 text-tinerary-gold mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">Sharing is rewarding, not required</h3>
                <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                  Private users can use every feature. But public users earn coins passively that unlock perks, discounts, and status. Over time, sharing just makes sense.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* CTA (only for non-logged-in users) */}
          {isLoggedIn === false && (
            <div className="text-center">
              <Button className="btn-sunset" size="lg" asChild>
                <Link href="/auth?tab=signup">
                  Start Earning Coins
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
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
