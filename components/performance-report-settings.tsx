"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  FileBarChart,
  Mail,
  Clock,
  Crown,
  Lock,
  Download,
  CheckCircle2,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  getBusinessSubscriptionByUserId,
  getEffectiveTier,
  getReportFrequency,
} from "@/lib/business-tier-service"
import type { BusinessTierSlug } from "@/lib/tiers"
import { useToast } from "@/components/ui/use-toast"

export function PerformanceReportSettings() {
  const [tier, setTier] = useState<BusinessTierSlug>("basic")
  const [emailReports, setEmailReports] = useState(true)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const { toast } = useToast()

  const frequency = getReportFrequency(tier)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setLoading(false); return }
      const { subscription, businessTier } = await getBusinessSubscriptionByUserId(session.user.id)
      setTier(getEffectiveTier(subscription, businessTier))
      setLoading(false)
    }
    load()
  }, [])

  const handleDownloadReport = async () => {
    setDownloading(true)
    try {
      const res = await fetch("/api/business/reports")
      if (!res.ok) throw new Error("Failed to fetch report")
      const data = await res.json()

      // Generate a simple CSV from the report
      const report = data.report
      const lines = [
        `Performance Report - ${report.businessName}`,
        `Period: ${new Date(report.periodStart).toLocaleDateString()} to ${new Date(report.periodEnd).toLocaleDateString()}`,
        `Tier: ${report.tier}`,
        `Report Frequency: ${report.reportFrequency}`,
        "",
        "Summary",
        `Total Views,${report.summary.totalViews}`,
        `Total Clicks,${report.summary.totalClicks}`,
        `Total Saves,${report.summary.totalSaves}`,
        `Total Shares,${report.summary.totalShares}`,
        `Active Promotions,${report.summary.activePromotions}`,
        `Average CTR,${report.summary.avgCtr}%`,
        "",
        "Promotion,Status,Category,Location,Views,Clicks,CTR,Saves,Shares",
        ...report.promotions.map(
          (p: any) =>
            `"${p.title}",${p.status},${p.category},"${p.location}",${p.views},${p.clicks},${p.ctr}%,${p.saves},${p.shares}`
        ),
      ]

      const blob = new Blob([lines.join("\n")], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `performance-report-${new Date().toISOString().split("T")[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)

      toast({ title: "Report downloaded", description: "CSV report has been downloaded." })
    } catch {
      toast({ title: "Error", description: "Failed to download report.", variant: "destructive" })
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <Card className="animate-pulse border-border">
        <CardContent className="pt-6"><div className="h-24 bg-muted rounded" /></CardContent>
      </Card>
    )
  }

  // Basic tier: locked
  if (frequency === "monthly") {
    return (
      <Card className="border-border">
        <CardContent className="py-12 text-center">
          <Lock className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="text-base font-bold mb-1">Weekly Performance Reports</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
            Upgrade to Premium to receive weekly performance reports with detailed promotion analytics delivered to your inbox.
          </p>
          <Button className="btn-sunset" size="sm" asChild>
            <Link href="/business">Upgrade to Premium</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileBarChart className="size-5 text-primary" />
            <div>
              <CardTitle className="text-base">Performance Reports</CardTitle>
              <CardDescription>
                {frequency === "daily" ? "Daily" : "Weekly"} reports delivered to your email
              </CardDescription>
            </div>
          </div>
          <Badge className={`border-0 text-xs ${
            frequency === "daily"
              ? "bg-tinerary-gold/20 text-tinerary-dark"
              : "bg-primary/10 text-primary"
          }`}>
            <Crown className="size-3 mr-1" />
            {frequency === "daily" ? "Enterprise" : "Premium"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="size-4 text-muted-foreground" />
            <Label htmlFor="email-reports" className="text-sm">Email {frequency} reports</Label>
          </div>
          <Switch
            id="email-reports"
            checked={emailReports}
            onCheckedChange={setEmailReports}
          />
        </div>

        <div className="p-3 rounded-xl bg-muted">
          <p className="text-xs text-muted-foreground mb-2">Report includes:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              "Views, clicks, and saves summary",
              "Click-through rate trends",
              "Per-promotion breakdown",
              "Audience engagement insights",
              ...(frequency === "daily" ? ["Real-time performance data", "Hourly traffic patterns"] : []),
            ].map((item) => (
              <div key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3 text-primary shrink-0" />
                <span className="text-xs text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" />
            Next report: {frequency === "daily" ? "Tomorrow 8:00 AM" : "Next Monday 8:00 AM"}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadReport}
            disabled={downloading}
          >
            <Download className="size-3.5 mr-1.5" />
            {downloading ? "Downloading..." : "Download Now"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
