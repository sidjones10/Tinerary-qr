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
import {
  Sparkles,
  Eye,
  Link2,
  Bell,
  Tag,
  BookOpen,
} from "lucide-react"
import { MENTION_HIGHLIGHTS } from "@/lib/tiers"

const quarterlyProjections = [
  { quarter: "Q1", itineraries: 200, mentions: 120, highlighted: 15, revenue: "$350" },
  { quarter: "Q2", itineraries: 800, mentions: 520, highlighted: 80, revenue: "$1,800" },
  { quarter: "Q3", itineraries: 2500, mentions: 1750, highlighted: 300, revenue: "$5,400" },
  { quarter: "Q4", itineraries: 5000, mentions: 3600, highlighted: 700, revenue: "$10,800" },
]

const recentMentions = [
  {
    itinerary: "SF Food Tour: Mission to Marina",
    creator: "Sarah_Travels",
    date: "Feb 25, 2026",
    context: "\"Amazing dinner at The Coastal Kitchen - must try the seafood risotto!\"",
    highlighted: true,
    views: "1,240",
  },
  {
    itinerary: "Valentine's Day SF Guide",
    creator: "CityExplorer",
    date: "Feb 22, 2026",
    context: "\"Romantic dinner recommendation: The Coastal Kitchen on the waterfront\"",
    highlighted: true,
    views: "890",
  },
  {
    itinerary: "48 Hours in San Francisco",
    creator: "TravelWithMike",
    date: "Feb 20, 2026",
    context: "\"Grabbed brunch at Coastal Kitchen - the avocado toast is incredible\"",
    highlighted: false,
    views: "2,100",
  },
  {
    itinerary: "Best Restaurants Near Fisherman's Wharf",
    creator: "FoodieJen",
    date: "Feb 18, 2026",
    context: "\"Don't skip The Coastal Kitchen for their fresh catch of the day\"",
    highlighted: false,
    views: "670",
  },
  {
    itinerary: "Bay Area Weekend Escapes",
    creator: "NomadNina",
    date: "Feb 15, 2026",
    context: "\"Sunset dinner at Coastal Kitchen - the views and food are both stunning\"",
    highlighted: true,
    views: "1,560",
  },
]

const stats = [
  { label: "Total Mentions", value: "47", change: "+12", icon: Tag },
  { label: "Highlighted", value: "3", change: "of 5 included", icon: Sparkles },
  { label: "Highlight Views", value: "3,690", change: "+24%", icon: Eye },
  { label: "Booking Clicks", value: "82", change: "+31%", icon: Link2 },
]

export function MentionsContent() {
  return (
    <div className="mt-6 flex flex-col gap-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border">
            <CardContent className="pt-6">
              <stat.icon className="size-5 text-muted-foreground" />
              <p className="mt-3 text-2xl font-bold text-foreground">{stat.value}</p>
              <div className="flex items-center gap-1 mt-1">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
              <p className="text-xs font-medium text-tinerary-salmon mt-0.5">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* How It Works */}
      <Card className="border-border bg-muted">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="size-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <Sparkles className="size-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">How Mention Highlights Work</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                When a free user creates a public itinerary and mentions your business, you are notified and can pay
                to &ldquo;highlight&rdquo; the mention — adding a visual badge, your logo, a booking link, and a special offer.
                The original itinerary is never altered; highlights appear as value-adding overlays.
              </p>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-card">
              <Bell className="size-4 text-tinerary-salmon" />
              <span className="text-xs text-foreground">Get notified of mentions</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-card">
              <Tag className="size-4 text-tinerary-gold" />
              <span className="text-xs text-foreground">Add badge + booking link</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-card">
              <BookOpen className="size-4 text-primary" />
              <span className="text-xs text-foreground">Overlay without editing</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="mentions">
        <TabsList className="w-full sm:w-auto bg-secondary">
          <TabsTrigger value="mentions" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Recent Mentions
          </TabsTrigger>
          <TabsTrigger value="pricing" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Highlight Pricing
          </TabsTrigger>
          <TabsTrigger value="projections" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Projections
          </TabsTrigger>
        </TabsList>

        {/* Recent Mentions */}
        <TabsContent value="mentions" className="mt-4">
          <div className="flex flex-col gap-4">
            {recentMentions.map((mention) => (
              <Card key={mention.itinerary} className="border-border">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-semibold text-foreground">{mention.itinerary}</h4>
                        {mention.highlighted ? (
                          <Badge className="bg-tinerary-gold/20 text-tinerary-dark border-0 text-xs">
                            Highlighted
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Not Highlighted
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        By @{mention.creator} &middot; {mention.date}
                      </p>
                      <p className="text-sm text-foreground mt-2 italic leading-relaxed">{mention.context}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Eye className="size-3" /> {mention.views} views
                        </span>
                      </div>
                    </div>
                    {!mention.highlighted && (
                      <button className="shrink-0 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-medium hover:bg-primary/90 transition-colors">
                        Highlight
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Highlight Pricing */}
        <TabsContent value="pricing" className="mt-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Highlight Pricing</CardTitle>
              <CardDescription>
                Premium subscribers get 5 highlights/month included. Enterprise subscribers get unlimited.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {MENTION_HIGHLIGHTS.map((plan) => (
                  <div
                    key={plan.name}
                    className="flex flex-col items-center p-5 rounded-2xl bg-muted text-center border border-border"
                  >
                    <p className="text-2xl font-bold text-primary">${plan.price}</p>
                    <p className="text-sm font-semibold text-foreground mt-1">{plan.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{plan.duration}</p>
                    <div className="w-full h-px bg-border my-3" />
                    <p className="text-xs text-muted-foreground leading-relaxed">{plan.includes}</p>
                    <button className="mt-4 w-full px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-medium hover:bg-primary/90 transition-colors">
                      Purchase
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projections */}
        <TabsContent value="projections" className="mt-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Mention Highlight Projections</CardTitle>
              <CardDescription>
                Annual projection: ~$18,350. Scales directly with user content creation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-tinerary-dark hover:bg-tinerary-dark">
                    <TableHead className="text-primary-foreground">Quarter</TableHead>
                    <TableHead className="text-primary-foreground text-right">Public Itineraries</TableHead>
                    <TableHead className="text-primary-foreground text-right">Biz Mentions</TableHead>
                    <TableHead className="text-primary-foreground text-right">Highlights Bought</TableHead>
                    <TableHead className="text-primary-foreground text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quarterlyProjections.map((row) => (
                    <TableRow key={row.quarter}>
                      <TableCell className="font-medium text-foreground">{row.quarter}</TableCell>
                      <TableCell className="text-right text-foreground">{row.itineraries.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-foreground">{row.mentions.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-foreground">{row.highlighted}</TableCell>
                      <TableCell className="text-right font-semibold text-tinerary-salmon">{row.revenue}</TableCell>
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
