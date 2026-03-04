"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  ShoppingCart,
  Link2,
  DollarSign,
  ArrowUpRight,
  Package,
  ExternalLink,
  Zap,
  Percent,
  Users,
  Inbox,
} from "lucide-react"
import { AFFILIATE_COMMISSIONS } from "@/lib/tiers"
import { PRODUCT_CATALOG } from "@/lib/product-catalog"
import { getAffiliateStats, getAffiliateDetails } from "@/app/actions/promotion-actions"

// Fallback stats shown until real data is available
const fallbackStats = [
  { label: "Affiliate Revenue", value: "$0", change: "--", icon: DollarSign },
  { label: "Active Links", value: "0", change: "--", icon: Link2 },
  { label: "Click-through Rate", value: "0%", change: "--", icon: ArrowUpRight },
  { label: "Conversions", value: "0", change: "--", icon: ShoppingCart },
]

// Build packing list matches from the live product catalog
const packingListItems = PRODUCT_CATALOG.map((entry) => {
  const primaryKeyword = entry.itemKeywords[0]
  return {
    item: primaryKeyword,
    matched: entry.product.name,
    partner: entry.product.partner,
    price: entry.product.price,
    autoLinked: true,
  }
}).slice(0, 10) // Show top 10

export function AffiliateContent({ userId }: { userId?: string }) {
  const [affiliateStats, setAffiliateStats] = useState(fallbackStats)
  const [products, setProducts] = useState<any[]>([])
  const [experiences, setExperiences] = useState<any[]>([])

  useEffect(() => {
    if (!userId) return

    getAffiliateStats(userId).then((result) => {
      if (result.success && result.data) {
        const { totalLinks, totalClicks, totalConversions, totalRevenue } = result.data
        const ctr = totalClicks > 0 && totalLinks > 0
          ? `${((totalConversions / totalClicks) * 100).toFixed(1)}%`
          : "0%"

        setAffiliateStats([
          { label: "Affiliate Revenue", value: `$${totalRevenue.toFixed(2)}`, change: "--", icon: DollarSign },
          { label: "Active Links", value: String(totalLinks), change: "--", icon: Link2 },
          { label: "Click-through Rate", value: ctr, change: "--", icon: ArrowUpRight },
          { label: "Conversions", value: String(totalConversions), change: "--", icon: ShoppingCart },
        ])
      }
    }).catch(console.error)

    getAffiliateDetails(userId).then((result) => {
      if (result.success && result.data) {
        setProducts(result.data.products)
        setExperiences(result.data.experiences)
      }
    }).catch(console.error)
  }, [userId])

  return (
    <div className="mt-6 flex flex-col gap-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {affiliateStats.map((stat) => (
          <Card key={stat.label} className="border-border">
            <CardContent className="pt-6">
              <stat.icon className="size-5 text-muted-foreground" />
              <p className="mt-3 text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              <p className="text-xs font-medium text-tinerary-salmon mt-0.5 flex items-center gap-0.5">
                {stat.change} <ArrowUpRight className="size-3" />
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two Channels Explanation */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-border bg-muted">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
                <Link2 className="size-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Experience & Promotion Referrals</h3>
                <p className="text-xs text-muted-foreground">Channel 1</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Users earn commission splits when they share referral links to experiences, promotions, and deals on Tinerary. Tinerary takes a platform cut.
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-muted">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-10 rounded-xl bg-tinerary-salmon flex items-center justify-center shrink-0">
                <Package className="size-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Packing List Auto-Matching</h3>
                <p className="text-xs text-muted-foreground">Channel 2</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Packing list items like &ldquo;portable charger&rdquo; or &ldquo;reef-safe sunscreen&rdquo; are auto-matched to product listings from Amazon Associates, REI, Booking.com, and other partners.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Commission Splits */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="size-5 text-tinerary-salmon" /> Affiliate Commission Splits
          </CardTitle>
          <CardDescription>Revenue sharing between users and Tinerary</CardDescription>
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

      <Tabs defaultValue="products">
        <TabsList className="w-full sm:w-auto bg-secondary">
          <TabsTrigger value="products" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Top Products
          </TabsTrigger>
          <TabsTrigger value="experiences" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Experience Referrals
          </TabsTrigger>
          <TabsTrigger value="packing" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Packing List Matches
          </TabsTrigger>
        </TabsList>

        {/* Top Products */}
        <TabsContent value="products" className="mt-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Top Affiliate Products</CardTitle>
              <CardDescription>Best-performing affiliate product links by revenue</CardDescription>
            </CardHeader>
            <CardContent>
              {products.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-tinerary-dark hover:bg-tinerary-dark">
                      <TableHead className="text-primary-foreground">Product Link</TableHead>
                      <TableHead className="text-primary-foreground text-right">Clicks</TableHead>
                      <TableHead className="text-primary-foreground text-right hidden sm:table-cell">Conversions</TableHead>
                      <TableHead className="text-primary-foreground text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium text-foreground max-w-[200px] truncate">{product.name}</TableCell>
                        <TableCell className="text-right text-foreground">{product.clicks}</TableCell>
                        <TableCell className="text-right hidden sm:table-cell text-foreground">{product.conversions}</TableCell>
                        <TableCell className="text-right font-semibold text-tinerary-salmon">{product.revenue}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Inbox className="size-10 mb-3 opacity-40" />
                  <p className="text-sm">No affiliate product data yet</p>
                  <p className="text-xs mt-1">Product performance will appear here as you generate and share affiliate links</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Experience Referrals */}
        <TabsContent value="experiences" className="mt-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Experience & Promotion Referrals</CardTitle>
              <CardDescription>Commission earned from experience and booking referrals</CardDescription>
            </CardHeader>
            <CardContent>
              {experiences.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {experiences.map((exp, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-muted">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{exp.name}</p>
                          <Badge
                            variant="secondary"
                            className={
                              exp.status === "Active"
                                ? "bg-tinerary-peach text-tinerary-dark border-0 text-xs"
                                : "bg-secondary text-secondary-foreground border-0 text-xs"
                            }
                          >
                            {exp.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {exp.category} &middot; {exp.referrals} referrals &middot; {exp.conversions} conversions
                        </p>
                      </div>
                      <p className="text-sm font-bold text-tinerary-salmon shrink-0 ml-4">{exp.revenue}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Inbox className="size-10 mb-3 opacity-40" />
                  <p className="text-sm">No experience referral data yet</p>
                  <p className="text-xs mt-1">Share promotion referral links to start earning commissions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Packing List Matches */}
        <TabsContent value="packing" className="mt-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="size-5 text-tinerary-gold" /> Packing List Commerce Model
              </CardTitle>
              <CardDescription>
                Auto-linking: Packing list items are automatically matched to product listings via affiliate partner APIs.
                Optional &ldquo;Shop this item&rdquo; buttons appear alongside packing list entries.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-tinerary-dark hover:bg-tinerary-dark">
                    <TableHead className="text-primary-foreground">Packing List Item</TableHead>
                    <TableHead className="text-primary-foreground hidden sm:table-cell">Matched Product</TableHead>
                    <TableHead className="text-primary-foreground hidden md:table-cell">Partner</TableHead>
                    <TableHead className="text-primary-foreground text-right">Price</TableHead>
                    <TableHead className="text-primary-foreground">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packingListItems.map((item) => (
                    <TableRow key={item.item}>
                      <TableCell className="font-medium text-foreground capitalize">{item.item}</TableCell>
                      <TableCell className="hidden sm:table-cell text-foreground">
                        <span className="flex items-center gap-1">
                          {item.matched}
                          <ExternalLink className="size-3 text-muted-foreground" />
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-foreground">{item.partner}</TableCell>
                      <TableCell className="text-right font-medium text-foreground">${item.price.toFixed(2)}</TableCell>
                      <TableCell>
                        {item.autoLinked ? (
                          <Badge className="bg-tinerary-peach text-tinerary-dark border-0 text-xs">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Pending</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
