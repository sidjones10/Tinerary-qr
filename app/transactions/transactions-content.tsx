"use client"

import { useState, useEffect, useCallback } from "react"
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
  CreditCard,
  BarChart3,
  FileText,
  RefreshCw,
  Loader2,
  Inbox,
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
import { getBusinessTransactions, generatePerformanceReport } from "@/app/actions/promotion-actions"

/* ──────────────── Commission Scale (static config) ──────────────── */

const volumeTiers = [
  { range: "First $2K/mo", rate: "15%", description: "Starting commission rate" },
  { range: "$2K - $10K/mo", rate: "12%", description: "Mid-volume discount" },
  { range: "$10K - $50K/mo", rate: "10%", description: "High-volume discount" },
  { range: "$50K+/mo", rate: "8%", description: "Enterprise volume rate" },
]

/* ──────────────── Helpers ──────────────── */

const statusStyles: Record<string, string> = {
  Completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  Pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  Refunded: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
}

function formatCurrency(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`
  return `$${n.toFixed(2)}`
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

/* ──────────────── Types ──────────────── */

interface TransactionData {
  summary: {
    totalRevenue: number
    revenueChange: number
    totalBookings: number
    bookingsChange: number
    avgCommissionRate: number
    annualProjection: number
  }
  monthlyRevenue: { month: string; revenue: number }[]
  recentTransactions: {
    id: string
    date: string
    type: string
    amount: string
    commission: string
    rate: string
    status: string
  }[]
  promotions: {
    id: string
    title: string
    status: string
    type: string
    views: number
    clicks: number
    saves: number
  }[]
}

/* ──────────────── Component ──────────────── */

export function TransactionsContent() {
  const [data, setData] = useState<TransactionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [reportLoading, setReportLoading] = useState(false)
  const [csvLoading, setCsvLoading] = useState(false)

  const fetchData = useCallback(async () => {
    const result = await getBusinessTransactions()
    if (result.success && result.data) {
      setData(result.data as TransactionData)
    }
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const handleGenerateReport = async () => {
    setReportLoading(true)
    try {
      const result = await generatePerformanceReport()
      if (result.success && result.data) {
        const report = result.data
        const reportText = [
          `Performance Report — ${report.businessName}`,
          `Plan: ${report.tier}`,
          `Period: ${report.period}`,
          `Generated: ${new Date(report.generatedAt).toLocaleString()}`,
          "",
          `Total Promotions: ${report.metrics.totalPromotions}`,
          `Active Promotions: ${report.metrics.activePromotions}`,
          `Total Views: ${report.metrics.totalViews}`,
          `Total Clicks: ${report.metrics.totalClicks}`,
          `Total Saves: ${report.metrics.totalSaves}`,
          `Click-Through Rate: ${report.metrics.clickThroughRate}%`,
          `Top Promotion: ${report.metrics.topPromotion}`,
        ].join("\n")

        const blob = new Blob([reportText], { type: "text/plain" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `tinerary-report-${new Date().toISOString().split("T")[0]}.txt`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error("Error generating report:", error)
    }
    setReportLoading(false)
  }

  const handleExportCSV = () => {
    if (!data) return
    setCsvLoading(true)
    try {
      const headers = ["ID", "Date", "Type", "Amount", "Commission", "Rate", "Status"]
      const rows = data.recentTransactions.map((txn) =>
        [txn.id, txn.date, txn.type, txn.amount, txn.commission, txn.rate, txn.status].join(",")
      )
      const csv = [headers.join(","), ...rows].join("\n")
      const blob = new Blob([csv], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error exporting CSV:", error)
    }
    setCsvLoading(false)
  }

  if (loading) {
    return (
      <div className="mt-6 flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading transactions...</span>
      </div>
    )
  }

  const summary = data?.summary ?? {
    totalRevenue: 0,
    revenueChange: 0,
    totalBookings: 0,
    bookingsChange: 0,
    avgCommissionRate: 0,
    annualProjection: 0,
  }

  const hasTransactions = (data?.recentTransactions?.length ?? 0) > 0
  const hasChartData = (data?.monthlyRevenue?.length ?? 0) > 0

  // Determine current volume tier based on monthly revenue
  const currentTierIndex = summary.totalRevenue >= 50000 ? 3
    : summary.totalRevenue >= 10000 ? 2
    : summary.totalRevenue >= 2000 ? 1
    : 0

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
              {summary.revenueChange !== 0 && (
                <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                  summary.revenueChange >= 0
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                    : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                }`}>
                  {summary.revenueChange >= 0 ? "+" : ""}{summary.revenueChange}%
                  {summary.revenueChange >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                </span>
              )}
            </div>
            <p className="mt-3 text-2xl font-bold text-foreground">{formatCurrency(summary.totalRevenue)}</p>
            <p className="text-xs text-muted-foreground mt-1">Revenue (Last 30 days)</p>
          </CardContent>
        </Card>

        {/* Bookings */}
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20">
                <Receipt className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              {summary.bookingsChange !== 0 && (
                <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                  summary.bookingsChange >= 0
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                    : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                }`}>
                  {summary.bookingsChange >= 0 ? "+" : ""}{summary.bookingsChange}%
                  {summary.bookingsChange >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                </span>
              )}
            </div>
            <p className="mt-3 text-2xl font-bold text-foreground">{summary.totalBookings}</p>
            <p className="text-xs text-muted-foreground mt-1">Transactions (Last 30 days)</p>
          </CardContent>
        </Card>

        {/* Avg. Commission Rate */}
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20">
                <Percent className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-foreground">{summary.avgCommissionRate}%</p>
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
            <p className="mt-3 text-2xl font-bold text-foreground">
              {summary.annualProjection > 0 ? `~${formatCurrency(summary.annualProjection)}` : "$0"}
            </p>
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
          </CardHeader>
          <CardContent>
            {hasChartData ? (
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data!.monthlyRevenue} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
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
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <BarChart3 className="h-10 w-10 mb-3 opacity-40" />
                <p className="text-sm">No revenue data yet</p>
                <p className="text-xs mt-1">Revenue will appear here as transactions come in</p>
              </div>
            )}
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
                const isCurrentTier = i === currentTierIndex
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

      {/* ── Recent Transactions ── */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent Transactions</CardTitle>
          <CardDescription>Latest commission earnings from bookings and affiliate links</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {hasTransactions ? (
            <div className="divide-y divide-border">
              {data!.recentTransactions.map((txn) => {
                const isRefund = txn.commission.startsWith("-")
                return (
                  <div key={txn.id} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/50">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-500/20">
                      <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{txn.type}</p>
                        <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 border-0 ${statusStyles[txn.status] || ""}`}>
                          {txn.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {txn.date} &middot; <span className="font-mono">{txn.id}</span>
                      </p>
                    </div>
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
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Inbox className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm">No transactions yet</p>
              <p className="text-xs mt-1">Transactions will appear here as customers book through your promotions</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Quick Actions ── */}
      <div className="grid sm:grid-cols-3 gap-3">
        <Button variant="outline" className="h-auto flex-col gap-2 py-4" onClick={handleGenerateReport} disabled={reportLoading}>
          {reportLoading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <FileText className="h-5 w-5 text-muted-foreground" />}
          <span className="text-xs font-medium">{reportLoading ? "Generating..." : "Generate Report"}</span>
        </Button>
        <Button variant="outline" className="h-auto flex-col gap-2 py-4" onClick={handleExportCSV} disabled={csvLoading || !hasTransactions}>
          {csvLoading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <Download className="h-5 w-5 text-muted-foreground" />}
          <span className="text-xs font-medium">{csvLoading ? "Exporting..." : "Export CSV"}</span>
        </Button>
        <Button variant="outline" className="h-auto flex-col gap-2 py-4" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <RefreshCw className="h-5 w-5 text-muted-foreground" />}
          <span className="text-xs font-medium">{refreshing ? "Refreshing..." : "Refresh Data"}</span>
        </Button>
      </div>
    </div>
  )
}
