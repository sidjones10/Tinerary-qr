"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  UserX,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Shield,
  ShieldAlert,
  ShieldOff,
  ShieldCheck,
  MessageSquare,
  AlertOctagon,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

type ReportStatus = "pending" | "reviewed" | "resolved" | "dismissed" | "all"

interface UserReport {
  id: string
  reported_user_id: string
  reporter_id: string
  reason: string
  description: string | null
  status: string
  severity: string
  admin_notes: string | null
  admin_action: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  reported_user: {
    id: string
    name: string | null
    username: string | null
    email: string | null
    avatar_url: string | null
    bio: string | null
  } | null
  reporter: {
    id: string
    name: string | null
    username: string | null
    email: string | null
    avatar_url: string | null
  } | null
  reviewer: {
    id: string
    name: string | null
    username: string | null
  } | null
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: any }
> = {
  pending: {
    label: "Pending",
    color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20",
    icon: Clock,
  },
  reviewed: {
    label: "Reviewed",
    color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
    icon: Eye,
  },
  resolved: {
    label: "Resolved",
    color: "text-green-600 bg-green-50 dark:bg-green-900/20",
    icon: CheckCircle,
  },
  dismissed: {
    label: "Dismissed",
    color: "text-gray-600 bg-gray-50 dark:bg-gray-900/20",
    icon: XCircle,
  },
}

const SEVERITY_CONFIG: Record<
  string,
  { label: string; color: string; icon: any }
> = {
  low: {
    label: "Low",
    color: "text-gray-600 bg-gray-50 dark:bg-gray-900/20",
    icon: Shield,
  },
  medium: {
    label: "Medium",
    color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20",
    icon: ShieldAlert,
  },
  high: {
    label: "High",
    color: "text-orange-600 bg-orange-50 dark:bg-orange-900/20",
    icon: AlertTriangle,
  },
  critical: {
    label: "Critical",
    color: "text-red-600 bg-red-50 dark:bg-red-900/20",
    icon: AlertOctagon,
  },
}

const REASON_LABELS: Record<string, string> = {
  harassment: "Harassment",
  hate_speech: "Hate Speech",
  spam: "Spam",
  impersonation: "Impersonation",
  inappropriate_content: "Inappropriate Content",
  predatory_behavior: "Predatory Behavior",
  scam: "Scam / Fraud",
  underage: "Underage User",
  self_harm: "Self-Harm / Dangerous",
  other: "Other",
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffHours < 1) {
    return "Just now"
  } else if (diffHours < 24) {
    return `${diffHours}h ago`
  } else if (diffDays < 7) {
    return `${diffDays}d ago`
  } else {
    return date.toLocaleDateString()
  }
}

export default function AdminUserReportsPage() {
  const [reports, setReports] = useState<UserReport[]>([])
  const [total, setTotal] = useState(0)
  const [counts, setCounts] = useState({
    pending: 0,
    reviewed: 0,
    resolved: 0,
    critical: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<ReportStatus>("pending")
  const [page, setPage] = useState(1)
  const [selectedReport, setSelectedReport] = useState<UserReport | null>(null)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [adminNotes, setAdminNotes] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()
  const limit = 20

  const fetchReports = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/admin/user-reports?status=${statusFilter}&page=${page}&limit=${limit}`
      )
      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      setReports(data.reports || [])
      setTotal(data.total || 0)
      setCounts(
        data.counts || { pending: 0, reviewed: 0, resolved: 0, critical: 0 }
      )
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch reports",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, page, toast])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const handleReview = async (status: string, adminAction?: string) => {
    if (!selectedReport) return
    setIsUpdating(true)

    try {
      const response = await fetch("/api/admin/user-reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: selectedReport.id,
          status,
          adminNotes: adminNotes.trim() || undefined,
          adminAction,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      toast({
        title: "Report updated",
        description: `Report has been ${status}${adminAction ? ` — user ${adminAction}` : ""}.`,
      })

      setReviewModalOpen(false)
      setSelectedReport(null)
      setAdminNotes("")
      fetchReports()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update report",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const openReview = (report: UserReport) => {
    setSelectedReport(report)
    setAdminNotes(report.admin_notes || "")
    setReviewModalOpen(true)
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="p-4 lg:p-8 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#2c2420] tracking-tight flex items-center gap-2">
            <UserX className="h-7 w-7 text-red-500" />
            User Reports
          </h1>
          <p className="text-[#2c2420]/50 text-sm mt-1">
            Review and manage reported user accounts
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: "Pending",
            count: counts.pending,
            color: "text-amber-600 bg-amber-50",
            icon: Clock,
          },
          {
            label: "Critical/High",
            count: counts.critical,
            color: "text-red-600 bg-red-50",
            icon: AlertOctagon,
          },
          {
            label: "Reviewed",
            count: counts.reviewed,
            color: "text-blue-600 bg-blue-50",
            icon: Eye,
          },
          {
            label: "Resolved",
            count: counts.resolved,
            color: "text-green-600 bg-green-50",
            icon: CheckCircle,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white/70 dark:bg-card/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${s.color}`}>
                <s.icon className="h-4 w-4" />
              </div>
              <span className="text-xs text-[#2c2420]/50">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-[#2c2420]">{s.count}</p>
          </div>
        ))}
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-1 bg-white/60 dark:bg-card/60 rounded-xl p-1 border border-[#2c2420]/5 mb-6 overflow-x-auto">
        {(
          ["pending", "reviewed", "resolved", "dismissed", "all"] as const
        ).map((status) => {
          const config = STATUS_CONFIG[status]
          return (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status)
                setPage(1)
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === status
                  ? "bg-[#2c2420] text-white shadow-sm"
                  : "text-[#2c2420]/50 hover:text-[#2c2420]/80"
              }`}
            >
              {config ? (
                <config.icon className="h-3 w-3" />
              ) : (
                <UserX className="h-3 w-3" />
              )}
              {status === "all" ? "All" : (config?.label || status)}
            </button>
          )
        })}
      </div>

      {/* Reports List */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#ffb88c] mx-auto mb-4" />
            <p className="text-[#2c2420]/60">Loading user reports...</p>
          </div>
        </div>
      ) : reports.length === 0 ? (
        <Card className="bg-white/70 dark:bg-card/70 backdrop-blur border-[#2c2420]/5">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-[#2c2420] mb-2">
              No user reports found
            </h3>
            <p className="text-sm text-[#2c2420]/50 max-w-sm">
              {statusFilter === "pending"
                ? "No pending user reports to review. The community is safe!"
                : `No ${statusFilter === "all" ? "" : statusFilter} user reports to display.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const statusConfig =
              STATUS_CONFIG[report.status] || STATUS_CONFIG.pending
            const StatusIcon = statusConfig.icon
            const severityConfig =
              SEVERITY_CONFIG[report.severity] || SEVERITY_CONFIG.medium
            const SeverityIcon = severityConfig.icon
            const reportedUser = report.reported_user
            const reporter = report.reporter

            return (
              <Card
                key={report.id}
                className={`bg-white/70 dark:bg-card/70 backdrop-blur border-[#2c2420]/5 hover:shadow-md transition-shadow cursor-pointer ${
                  report.severity === "critical"
                    ? "border-l-4 border-l-red-500"
                    : report.severity === "high"
                      ? "border-l-4 border-l-orange-500"
                      : ""
                }`}
                onClick={() => openReview(report)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Reported user avatar */}
                    <div className="shrink-0">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={reportedUser?.avatar_url || undefined}
                        />
                        <AvatarFallback className="bg-red-100 text-red-600 font-semibold">
                          {(
                            reportedUser?.name ||
                            reportedUser?.username ||
                            "?"
                          )[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Report details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <h3 className="text-sm font-semibold text-[#2c2420]">
                            {reportedUser?.name ||
                              reportedUser?.username ||
                              "Unknown User"}
                          </h3>
                          <p className="text-xs text-[#2c2420]/40">
                            @
                            {reportedUser?.username ||
                              reportedUser?.email?.split("@")[0] ||
                              "unknown"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${severityConfig.color}`}
                          >
                            <SeverityIcon className="h-3 w-3" />
                            {severityConfig.label}
                          </div>
                          <div
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                          <AlertTriangle className="h-3 w-3" />
                          {REASON_LABELS[report.reason] || report.reason}
                        </span>
                        <span className="text-xs text-[#2c2420]/40 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(report.created_at)}
                        </span>
                      </div>

                      {report.description && (
                        <p className="text-xs text-[#2c2420]/60 mt-2 line-clamp-2">
                          {report.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage
                            src={reporter?.avatar_url || undefined}
                          />
                          <AvatarFallback className="bg-[#ffb88c]/20 text-[#d97a4a] text-[8px]">
                            {(
                              reporter?.name ||
                              reporter?.email ||
                              "?"
                            )[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-[#2c2420]/50">
                          Reported by{" "}
                          {reporter?.name ||
                            reporter?.username ||
                            reporter?.email?.split("@")[0] ||
                            "Unknown"}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-[#2c2420]/50">
            Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of{" "}
            {total} reports
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Review Modal */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#ffb88c]" />
              Review User Report
            </DialogTitle>
            <DialogDescription>
              Take action on this reported user account
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4 mt-2">
              {/* Reported User Info */}
              <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs font-medium text-[#2c2420]/40 uppercase">
                    Reported User
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={
                          selectedReport.reported_user?.avatar_url || undefined
                        }
                      />
                      <AvatarFallback className="bg-red-100 text-red-600">
                        {(
                          selectedReport.reported_user?.name ||
                          selectedReport.reported_user?.username ||
                          "?"
                        )[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-[#2c2420]">
                        {selectedReport.reported_user?.name || "Unknown"}
                      </p>
                      <p className="text-xs text-[#2c2420]/50">
                        @
                        {selectedReport.reported_user?.username ||
                          selectedReport.reported_user?.email?.split(
                            "@"
                          )[0] ||
                          "unknown"}
                      </p>
                    </div>
                    <Link
                      href={`/user/${selectedReport.reported_user_id}`}
                      target="_blank"
                      className="ml-auto text-[#ffb88c] hover:text-[#d97a4a]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-[#2c2420]/40 uppercase">
                    Reason
                  </p>
                  <p className="text-sm text-red-600 font-medium mt-0.5">
                    {REASON_LABELS[selectedReport.reason] ||
                      selectedReport.reason}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-[#2c2420]/40 uppercase">
                    Severity
                  </p>
                  <div className="mt-0.5">
                    {(() => {
                      const sc =
                        SEVERITY_CONFIG[selectedReport.severity] ||
                        SEVERITY_CONFIG.medium
                      return (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.color}`}
                        >
                          <sc.icon className="h-3 w-3" />
                          {sc.label}
                        </span>
                      )
                    })()}
                  </div>
                </div>

                {selectedReport.description && (
                  <div>
                    <p className="text-xs font-medium text-[#2c2420]/40 uppercase">
                      Details
                    </p>
                    <p className="text-sm text-[#2c2420]/70 mt-0.5">
                      {selectedReport.description}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-xs font-medium text-[#2c2420]/40 uppercase">
                    Reported by
                  </p>
                  <p className="text-sm text-[#2c2420]/70 mt-0.5">
                    {selectedReport.reporter?.name ||
                      selectedReport.reporter?.email ||
                      "Unknown"}{" "}
                    &middot; {formatDate(selectedReport.created_at)}
                  </p>
                </div>

                {selectedReport.reviewer && (
                  <div>
                    <p className="text-xs font-medium text-[#2c2420]/40 uppercase">
                      Previously reviewed by
                    </p>
                    <p className="text-sm text-[#2c2420]/70 mt-0.5">
                      {selectedReport.reviewer.name ||
                        selectedReport.reviewer.username}{" "}
                      &middot;{" "}
                      {selectedReport.reviewed_at
                        ? formatDate(selectedReport.reviewed_at)
                        : ""}
                    </p>
                  </div>
                )}

                {selectedReport.admin_action && (
                  <div>
                    <p className="text-xs font-medium text-[#2c2420]/40 uppercase">
                      Previous Action
                    </p>
                    <p className="text-sm text-[#2c2420]/70 mt-0.5 capitalize">
                      {selectedReport.admin_action.replace("_", " ")}
                    </p>
                  </div>
                )}
              </div>

              {/* Admin Notes */}
              <div>
                <Label htmlFor="admin-notes" className="text-sm font-medium">
                  Admin Notes
                </Label>
                <Textarea
                  id="admin-notes"
                  placeholder="Add notes about this review decision..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="mt-1.5 resize-none"
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-[#2c2420]/40 uppercase">
                  Actions
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReview("dismissed", "no_action")}
                    disabled={isUpdating}
                    className="text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                  >
                    <XCircle className="h-4 w-4 mr-1.5" />
                    Dismiss
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReview("reviewed")}
                    disabled={isUpdating}
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                  >
                    <MessageSquare className="h-4 w-4 mr-1.5" />
                    Mark Reviewed
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReview("resolved", "warned")}
                    disabled={isUpdating}
                    className="text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                  >
                    <ShieldAlert className="h-4 w-4 mr-1.5" />
                    Warn User
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (
                        confirm(
                          "Are you sure you want to suspend this user's account?"
                        )
                      ) {
                        handleReview("resolved", "suspended")
                      }
                    }}
                    disabled={isUpdating}
                    className="text-orange-600 hover:text-orange-800 hover:bg-orange-50"
                  >
                    <ShieldOff className="h-4 w-4 mr-1.5" />
                    Suspend User
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    className="col-span-2"
                    onClick={() => {
                      if (
                        confirm(
                          "Are you sure you want to BAN this user? This will prevent them from accessing the platform."
                        )
                      ) {
                        handleReview("resolved", "banned")
                      }
                    }}
                    disabled={isUpdating}
                  >
                    <ShieldCheck className="h-4 w-4 mr-1.5" />
                    Ban User
                  </Button>
                </div>
              </div>

              {isUpdating && (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-5 w-5 animate-spin text-[#ffb88c] mr-2" />
                  <span className="text-sm text-[#2c2420]/60">
                    Updating...
                  </span>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
