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
  DollarSign,
  TrendingDown,
  TrendingUp,
  ArrowUpRight,
  Receipt,
  Percent,
} from "lucide-react"

const quarterlyData = [
  { quarter: "Q1", bookings: 150, avgValue: "$85", avgRate: "13%", revenue: "$1,658" },
  { quarter: "Q2", bookings: 500, avgValue: "$95", avgRate: "12%", revenue: "$5,700" },
  { quarter: "Q3", bookings: 1200, avgValue: "$110", avgRate: "11%", revenue: "$14,520" },
  { quarter: "Q4", bookings: 2500, avgValue: "$120", avgRate: "10%", revenue: "$30,000" },
]

const recentTransactions = [
  {
    id: "TXN-4821",
    date: "Feb 25, 2026",
    customer: "Sarah M.",
    type: "Restaurant Booking",
    amount: "$145.00",
    commission: "$17.40",
    rate: "12%",
    status: "Completed",
  },
  {
    id: "TXN-4820",
    date: "Feb 25, 2026",
    customer: "James K.",
    type: "Experience Tour",
    amount: "$220.00",
    commission: "$26.40",
    rate: "12%",
    status: "Completed",
  },
  {
    id: "TXN-4819",
    date: "Feb 24, 2026",
    customer: "Emily R.",
    type: "Event Ticket",
    amount: "$75.00",
    commission: "$9.75",
    rate: "13%",
    status: "Completed",
  },
  {
    id: "TXN-4818",
    date: "Feb 24, 2026",
    customer: "Michael P.",
    type: "Restaurant Booking",
    amount: "$320.00",
    commission: "$35.20",
    rate: "11%",
    status: "Pending",
  },
  {
    id: "TXN-4817",
    date: "Feb 23, 2026",
    customer: "Lisa W.",
    type: "Prepayment",
    amount: "$89.00",
    commission: "$11.57",
    rate: "13%",
    status: "Completed",
  },
  {
    id: "TXN-4816",
    date: "Feb 22, 2026",
    customer: "David C.",
    type: "Experience Tour",
    amount: "$185.00",
    commission: "$20.35",
    rate: "11%",
    status: "Refunded",
  },
]

const volumeTiers = [
  { range: "First $2K/mo", rate: "15%", description: "Starting commission rate" },
  { range: "$2K - $10K/mo", rate: "12%", description: "Mid-volume discount" },
  { range: "$10K - $50K/mo", rate: "10%", description: "High-volume discount" },
  { range: "$50K+/mo", rate: "8%", description: "Enterprise volume rate" },
]

export function TransactionsContent() {
  return (
    <div className="mt-6 flex flex-col gap-6">
      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <DollarSign className="size-5 text-muted-foreground" />
              <span className="text-xs font-medium text-tinerary-salmon flex items-center gap-0.5">
                +24% <ArrowUpRight className="size-3" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold text-foreground">$4,230</p>
            <p className="text-xs text-muted-foreground mt-1">Total Revenue (Feb)</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Receipt className="size-5 text-muted-foreground" />
              <span className="text-xs font-medium text-tinerary-salmon flex items-center gap-0.5">
                +15% <ArrowUpRight className="size-3" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold text-foreground">87</p>
            <p className="text-xs text-muted-foreground mt-1">Bookings (Feb)</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Percent className="size-5 text-muted-foreground" />
              <span className="text-xs font-medium text-green-600 flex items-center gap-0.5">
                <TrendingDown className="size-3" /> -1%
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold text-foreground">11.5%</p>
            <p className="text-xs text-muted-foreground mt-1">Avg. Commission Rate</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <TrendingUp className="size-5 text-muted-foreground" />
              <span className="text-xs font-medium text-tinerary-salmon flex items-center gap-0.5">
                Projected <ArrowUpRight className="size-3" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold text-foreground">~$52K</p>
            <p className="text-xs text-muted-foreground mt-1">Annual Projection</p>
          </CardContent>
        </Card>
      </div>

      {/* Volume-Based Commission Scale */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Commission Scale</CardTitle>
          <CardDescription>
            5-15% commission on every booking. Volume-based sliding scale: 15% on first $2K/month, scaling down to 8% above $50K/month.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {volumeTiers.map((tier, i) => (
              <div
                key={tier.range}
                className="flex flex-col items-center p-4 rounded-xl bg-muted text-center"
              >
                <p className="text-2xl font-bold text-primary">{tier.rate}</p>
                <p className="text-sm font-semibold text-foreground mt-1">{tier.range}</p>
                <p className="text-xs text-muted-foreground mt-1">{tier.description}</p>
                {i === 1 && (
                  <Badge className="mt-2 bg-tinerary-peach text-tinerary-dark border-0 text-xs">
                    Your Current Tier
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Recent Transactions / Quarterly */}
      <Tabs defaultValue="recent">
        <TabsList className="w-full sm:w-auto bg-secondary">
          <TabsTrigger value="recent" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Recent Transactions
          </TabsTrigger>
          <TabsTrigger value="quarterly" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Quarterly Projections
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="mt-4">
          <Card className="border-border">
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow className="bg-tinerary-dark hover:bg-tinerary-dark">
                    <TableHead className="text-primary-foreground">ID</TableHead>
                    <TableHead className="text-primary-foreground">Date</TableHead>
                    <TableHead className="text-primary-foreground hidden sm:table-cell">Customer</TableHead>
                    <TableHead className="text-primary-foreground hidden md:table-cell">Type</TableHead>
                    <TableHead className="text-primary-foreground text-right">Amount</TableHead>
                    <TableHead className="text-primary-foreground text-right">Commission</TableHead>
                    <TableHead className="text-primary-foreground hidden lg:table-cell">Rate</TableHead>
                    <TableHead className="text-primary-foreground">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell className="font-mono text-xs text-foreground">{txn.id}</TableCell>
                      <TableCell className="text-foreground">{txn.date}</TableCell>
                      <TableCell className="hidden sm:table-cell text-foreground">{txn.customer}</TableCell>
                      <TableCell className="hidden md:table-cell text-foreground">{txn.type}</TableCell>
                      <TableCell className="text-right font-medium text-foreground">{txn.amount}</TableCell>
                      <TableCell className="text-right font-medium text-tinerary-salmon">{txn.commission}</TableCell>
                      <TableCell className="hidden lg:table-cell text-foreground">{txn.rate}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            txn.status === "Completed"
                              ? "bg-tinerary-peach text-tinerary-dark border-0"
                              : txn.status === "Pending"
                              ? "bg-tinerary-gold/20 text-tinerary-dark border-0"
                              : "bg-destructive/10 text-destructive border-0"
                          }
                        >
                          {txn.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quarterly" className="mt-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Quarterly Revenue Projections</CardTitle>
              <CardDescription>Annual projection: ~$52,000</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-tinerary-dark hover:bg-tinerary-dark">
                    <TableHead className="text-primary-foreground">Quarter</TableHead>
                    <TableHead className="text-primary-foreground text-right">Bookings</TableHead>
                    <TableHead className="text-primary-foreground text-right">Avg. Value</TableHead>
                    <TableHead className="text-primary-foreground text-right">Avg. Rate</TableHead>
                    <TableHead className="text-primary-foreground text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quarterlyData.map((row) => (
                    <TableRow key={row.quarter}>
                      <TableCell className="font-medium text-foreground">{row.quarter}</TableCell>
                      <TableCell className="text-right text-foreground">{row.bookings.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-foreground">{row.avgValue}</TableCell>
                      <TableCell className="text-right text-foreground">{row.avgRate}</TableCell>
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
