"use client"

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
} from "lucide-react"
import { AFFILIATE_COMMISSIONS } from "@/lib/tiers"

const affiliateStats = [
  { label: "Affiliate Revenue", value: "$1,240", change: "+22%", icon: DollarSign },
  { label: "Active Links", value: "34", change: "+5 new", icon: Link2 },
  { label: "Click-through Rate", value: "8.3%", change: "+1.2%", icon: ArrowUpRight },
  { label: "Conversions", value: "89", change: "+18", icon: ShoppingCart },
]

const topAffiliateProducts = [
  {
    name: "Portable Phone Charger (Anker)",
    partner: "Amazon Associates",
    clicks: 342,
    conversions: 48,
    revenue: "$186.40",
    category: "Travel Tech",
  },
  {
    name: "Reef-Safe Sunscreen (Sun Bum)",
    partner: "Amazon Associates",
    clicks: 287,
    conversions: 39,
    revenue: "$124.80",
    category: "Beach & Sun",
  },
  {
    name: "Packing Cubes Set (Peak Design)",
    partner: "REI",
    clicks: 198,
    conversions: 28,
    revenue: "$98.00",
    category: "Organization",
  },
  {
    name: "Travel Adapter (Universal)",
    partner: "Amazon Associates",
    clicks: 156,
    conversions: 22,
    revenue: "$72.60",
    category: "Travel Tech",
  },
  {
    name: "Noise-Cancelling Earbuds (Sony)",
    partner: "Amazon Associates",
    clicks: 134,
    conversions: 15,
    revenue: "$210.00",
    category: "Electronics",
  },
]

const experienceReferrals = [
  {
    name: "Golden Gate Sunset Sail",
    partner: "Booking.com",
    referrals: 45,
    conversions: 12,
    revenue: "$320.00",
    status: "Active",
  },
  {
    name: "Alcatraz Night Tour",
    partner: "Viator",
    referrals: 38,
    conversions: 8,
    revenue: "$180.00",
    status: "Active",
  },
  {
    name: "Napa Wine Train",
    partner: "Booking.com",
    referrals: 29,
    conversions: 6,
    revenue: "$240.00",
    status: "Active",
  },
  {
    name: "SF Street Art Walk",
    partner: "Airbnb Experiences",
    referrals: 22,
    conversions: 5,
    revenue: "$87.50",
    status: "Paused",
  },
]

const packingListItems = [
  {
    item: "portable charger",
    matched: "Anker PowerCore 10000mAh",
    partner: "Amazon",
    autoLinked: true,
    mentions: 128,
  },
  {
    item: "reef-safe sunscreen",
    matched: "Sun Bum SPF 50",
    partner: "Amazon",
    autoLinked: true,
    mentions: 94,
  },
  {
    item: "travel pillow",
    matched: "Trtl Pillow Plus",
    partner: "REI",
    autoLinked: true,
    mentions: 76,
  },
  {
    item: "hiking boots",
    matched: "Salomon X Ultra 4",
    partner: "REI",
    autoLinked: false,
    mentions: 62,
  },
  {
    item: "dry bag",
    matched: "Sea to Summit 20L",
    partner: "Amazon",
    autoLinked: true,
    mentions: 51,
  },
]

export function AffiliateContent() {
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
              <CardDescription>Best-performing auto-linked products from packing lists</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-tinerary-dark hover:bg-tinerary-dark">
                    <TableHead className="text-primary-foreground">Product</TableHead>
                    <TableHead className="text-primary-foreground hidden sm:table-cell">Partner</TableHead>
                    <TableHead className="text-primary-foreground hidden md:table-cell">Category</TableHead>
                    <TableHead className="text-primary-foreground text-right">Clicks</TableHead>
                    <TableHead className="text-primary-foreground text-right hidden sm:table-cell">Conversions</TableHead>
                    <TableHead className="text-primary-foreground text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topAffiliateProducts.map((product) => (
                    <TableRow key={product.name}>
                      <TableCell className="font-medium text-foreground">{product.name}</TableCell>
                      <TableCell className="hidden sm:table-cell text-foreground">{product.partner}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="secondary" className="bg-tinerary-peach text-tinerary-dark border-0 text-xs">
                          {product.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-foreground">{product.clicks}</TableCell>
                      <TableCell className="text-right hidden sm:table-cell text-foreground">{product.conversions}</TableCell>
                      <TableCell className="text-right font-semibold text-tinerary-salmon">{product.revenue}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
              <div className="flex flex-col gap-3">
                {experienceReferrals.map((exp) => (
                  <div key={exp.name} className="flex items-center justify-between p-4 rounded-xl bg-muted">
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
                        via {exp.partner} &middot; {exp.referrals} referrals &middot; {exp.conversions} conversions
                      </p>
                    </div>
                    <p className="text-sm font-bold text-tinerary-salmon shrink-0 ml-4">{exp.revenue}</p>
                  </div>
                ))}
              </div>
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
                    <TableHead className="text-primary-foreground text-right">Mentions</TableHead>
                    <TableHead className="text-primary-foreground">Auto-Linked</TableHead>
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
                      <TableCell className="text-right text-foreground">{item.mentions}</TableCell>
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
