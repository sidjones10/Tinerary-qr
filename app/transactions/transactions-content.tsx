"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Percent,
  Download,
  Utensils,
  Compass,
  Ticket,
  CreditCard,
  BarChart3,
  FileText,
  RefreshCw,
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

/* ──────────────── Data ──────────────── */

const monthlyRevenue = [
  { month: "Sep", revenue: 1200 },
  { month: "Oct", revenue: 1850 },
  { month: "Nov", revenue: 2400 },
  { month: "Dec", revenue: 3100 },
  { month: "Jan", revenue: 3650 },
  { month: "Feb", revenue: 4230 },
]

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
    commission: "+$17.40",
    rate: "12%",
    status: "Completed" as const,
  },
  {
    id: "TXN-4820",
    date: "Feb 25, 2026",
    customer: "James K.",
    type: "Experience Tour",
    amount: "$220.00",
    commission: "+$26.40",
    rate: "12%",
    status: "Completed" as const,
  },
  {
    id: "TXN-4819",
    date: "Feb 24, 2026",
    customer: "Emily R.",
    type: "Event Ticket",
    amount: "$75.00",
    commission: "+$9.75",
    rate: "13%",
    status: "Completed" as const,
  },
  {
    id: "TXN-4818",
    date: "Feb 24, 2026",
    customer: "Michael P.",
    type: "Restaurant Booking",
    amount: "$320.00",
    commission: "+$35.20",
    rate: "11%",
    status: "Pending" as const,
  },
  {
    id: "TXN-4817",
    date: "Feb 23, 2026",
    customer: "Lisa W.",
    type: "Prepayment",
    amount: "$89.00",
    commission: "+$11.57",
    rate: "13%",
    status: "Completed" as const,
  },
  {
    id: "TXN-4816",
    date: "Feb 22, 2026",
    customer: "David C.",
    type: "Experience Tour",
    amount: "$185.00",
    commission: "-$20.35",
    rate: "11%",
    status: "Refunded" as const,
  },
]

const volumeTiers = [
  { range: "First $2K/mo", rate: "15%", description: "Starting commission rate" },
  { range: "$2K - $10K/mo", rate: "12%", description: "Mid-volume discount" },
  { range: "$10K - $50K/mo", rate: "10%", description: "High-volume discount" },
  { range: "$50K+/mo", rate: "8%", description: "Enterprise volume rate" },
]

/* ──────────────── Helpers ──────────────── */

const typeConfig: Record<string, { icon: typeof Utensils; color: string; bg: string }> = {
  "Restaurant Booking": { icon: Utensils, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-500/20" },
  "Experience Tour": { icon: Compass, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-500/20" },
  "Event Ticket": { icon: Ticket, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-500/20" },
  "Prepayment": { icon: CreditCard, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/20" },
}

const statusStyles: Record<string, string> = {
  Completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  Pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  Refunded: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
}

/* ──────────────── Custom Tooltip ──────────────── */

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-md">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">${payload[0].value.toLocaleString()}</p>
    </div>
  )
}

/* ──────────────── Component ──────────────── */

export function TransactionsContent() {
  return (
    <div className="mt-6 flex flex-col gap-6">
      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-500/20">
                <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                +24% <ArrowUpRight className="h-3 w-3" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold text-foreground">$4,230</p>
            <p className="text-xs text-muted-foreground mt-1">Total Revenue (Feb)</p>
          </CardContent>
        </Card>

        {/* Bookings */}
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20">
                <Receipt className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                +15% <ArrowUpRight className="h-3 w-3" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold text-foreground">87</p>
            <p className="text-xs text-muted-foreground mt-1">Bookings (Feb)</p>
          </CardContent>
        </Card>

        {/* Avg. Commission Rate */}
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20">
                <Percent className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                <TrendingDown className="h-3 w-3" /> -1%
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold text-foreground">11.5%</p>
            <p className="text-xs text-muted-foreground mt-1">Avg. Commission Rate</p>
          </CardContent>
        </Card>

        {/* Annual Projection */}
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-500/20">
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-500/20 dark:text-purple-400">
                Projected <ArrowUpRight className="h-3 w-3" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold text-foreground">~$52K</p>
            <p className="text-xs text-muted-foreground mt-1">Annual Projection</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Revenue Chart + Commission Scale (side-by-side on lg) ── */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Revenue Trend Chart */}
        <Card className="border-border lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Monthly Revenue Trend</CardTitle>
              <CardDescription>Commission earnings over the last 6 months</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyRevenue} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${v >= 1000 ? `${v / 1000}k` : v}`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} fill="url(#revenueGradient)" dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Commission Scale */}
        <Card className="border-border lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Commission Scale</CardTitle>
            <CardDescription>Volume-based sliding scale</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {volumeTiers.map((tier, i) => {
                const isCurrentTier = i === 1
                return (
                  <div
                    key={tier.range}
                    className={`relative flex items-center justify-between rounded-xl px-4 py-3 transition-colors ${
                      isCurrentTier
                        ? "bg-primary/10 ring-2 ring-primary/30"
                        : "bg-muted"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{tier.range}</p>
                      <p className="text-xs text-muted-foreground">{tier.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-primary">{tier.rate}</span>
                      {isCurrentTier && (
                        <Badge className="bg-tinerary-peach text-tinerary-dark border-0 text-[10px] leading-tight">
                          Current
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Tabs: Recent Transactions / Quarterly ── */}
      <Tabs defaultValue="recent">
        <div className="flex items-center justify-between">
          <TabsList className="bg-secondary">
            <TabsTrigger value="recent" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Recent Transactions
            </TabsTrigger>
            <TabsTrigger value="quarterly" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Quarterly Projections
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Recent Transactions — List Style */}
        <TabsContent value="recent" className="mt-4">
          <Card className="border-border">
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {recentTransactions.map((txn) => {
                  const cfg = typeConfig[txn.type] ?? typeConfig["Prepayment"]
                  const Icon = cfg.icon
                  const isRefund = txn.status === "Refunded"

                  return (
                    <div key={txn.id} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/50">
                      {/* Category Icon */}
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${cfg.bg}`}>
                        <Icon className={`h-5 w-5 ${cfg.color}`} />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">{txn.type}</p>
                          <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 border-0 ${statusStyles[txn.status]}`}>
                            {txn.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {txn.customer} &middot; {txn.date} &middot; <span className="font-mono">{txn.id}</span>
                        </p>
                      </div>

                      {/* Amounts */}
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-semibold ${isRefund ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                          {txn.commission}
                        </p>
                        <p className="text-xs text-muted-foreground">{txn.amount} @ {txn.rate}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quarterly Projections */}
        <TabsContent value="quarterly" className="mt-4">
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Quarterly Revenue Projections</CardTitle>
              <CardDescription>Annual projection: ~$52,000</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {quarterlyData.map((row, i) => (
                  <div key={row.quarter} className="rounded-xl bg-muted p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                        <BarChart3 className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-xs font-bold text-muted-foreground">{row.quarter} 2026</span>
                    </div>
                    <p className="text-xl font-bold text-foreground">{row.revenue}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{row.bookings.toLocaleString()} bookings</p>
                    <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-xs text-muted-foreground">
                      <span>Avg. {row.avgValue}</span>
                      <span>Rate {row.avgRate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Quick Actions ── */}
      <div className="grid sm:grid-cols-3 gap-3">
        <Button variant="outline" className="h-auto flex-col gap-2 py-4">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <span className="text-xs font-medium">Generate Report</span>
        </Button>
        <Button variant="outline" className="h-auto flex-col gap-2 py-4">
          <Download className="h-5 w-5 text-muted-foreground" />
          <span className="text-xs font-medium">Export CSV</span>
        </Button>
        <Button variant="outline" className="h-auto flex-col gap-2 py-4">
          <RefreshCw className="h-5 w-5 text-muted-foreground" />
          <span className="text-xs font-medium">Refresh Data</span>
        </Button>
      </div>
    </div>
  )
}
