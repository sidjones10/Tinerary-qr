"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, AlertCircle, Loader2, CheckCircle, XCircle, Clock, Code, Globe, User, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"

interface ErrorLog {
  id: string
  error_type: string
  error_message: string
  error_stack: string | null
  component: string | null
  url: string | null
  user_id: string | null
  user_agent: string | null
  metadata: Record<string, any>
  resolved: boolean
  resolved_at: string | null
  created_at: string
  profiles?: { name: string; email: string } | null
}

const errorTypeColors: Record<string, string> = {
  client: "bg-blue-100 text-blue-700",
  server: "bg-purple-100 text-purple-700",
  api: "bg-amber-100 text-amber-700",
  database: "bg-red-100 text-red-700",
  auth: "bg-green-100 text-green-700",
}

export default function AdminErrorsPage() {
  const [errors, setErrors] = useState<ErrorLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "unresolved" | "resolved">("unresolved")
  const [expandedError, setExpandedError] = useState<string | null>(null)

  const fetchErrors = async () => {
    setIsLoading(true)
    const supabase = createClient()

    let query = supabase
      .from("error_logs")
      .select(`
        *,
        profiles:user_id (name, email)
      `)
      .order("created_at", { ascending: false })
      .limit(100)

    if (filter === "unresolved") {
      query = query.eq("resolved", false)
    } else if (filter === "resolved") {
      query = query.eq("resolved", true)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching error logs:", error)
      // Table might not exist yet
      setErrors([])
    } else {
      setErrors(data || [])
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchErrors()
  }, [filter])

  const handleResolve = async (errorId: string) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from("error_logs")
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: user?.id,
      })
      .eq("id", errorId)

    if (error) {
      toast({ title: "Error", description: "Failed to mark as resolved", variant: "destructive" })
    } else {
      toast({ title: "Success", description: "Error marked as resolved" })
      fetchErrors()
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="p-4 lg:p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild aria-label="Go back">
            <Link href="/admin">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[#2c2420]">Error Tracking</h1>
            <p className="text-sm text-[#2c2420]/50">Monitor and resolve application errors</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchErrors}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(["unresolved", "all", "resolved"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              filter === f
                ? "bg-[#2c2420] text-white"
                : "bg-white/60 dark:bg-card/60 text-[#2c2420]/60 hover:bg-white hover:text-[#2c2420]"
            }`}
          >
            {f === "unresolved" && <XCircle className="h-4 w-4 inline mr-2" />}
            {f === "resolved" && <CheckCircle className="h-4 w-4 inline mr-2" />}
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#ffb88c]" />
        </div>
      ) : errors.length === 0 ? (
        <div className="bg-white/70 dark:bg-card/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-10 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[#2c2420] mb-2">
            {filter === "unresolved" ? "No unresolved errors!" : "No errors found"}
          </h3>
          <p className="text-sm text-[#2c2420]/50">
            {filter === "unresolved"
              ? "All caught errors have been resolved."
              : "Error logs will appear here when they occur."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {errors.map((err) => (
            <div
              key={err.id}
              className={`bg-white/70 dark:bg-card/70 backdrop-blur rounded-2xl border transition-all ${
                err.resolved ? "border-green-200" : "border-red-200"
              }`}
            >
              <div
                className="p-4 cursor-pointer"
                onClick={() => setExpandedError(expandedError === err.id ? null : err.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={errorTypeColors[err.error_type] || "bg-gray-100 text-gray-700"}>
                        {err.error_type}
                      </Badge>
                      {err.resolved ? (
                        <Badge className="bg-green-100 text-green-700">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Resolved
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Open
                        </Badge>
                      )}
                      <span className="text-xs text-[#2c2420]/40 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(err.created_at)}
                      </span>
                    </div>
                    <p className="font-medium text-[#2c2420] mb-1 truncate">{err.error_message}</p>
                    <div className="flex items-center gap-4 text-xs text-[#2c2420]/50">
                      {err.component && (
                        <span className="flex items-center gap-1">
                          <Code className="h-3 w-3" />
                          {err.component}
                        </span>
                      )}
                      {err.url && (
                        <span className="flex items-center gap-1 truncate max-w-[200px]">
                          <Globe className="h-3 w-3" />
                          {err.url}
                        </span>
                      )}
                      {err.profiles && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {err.profiles.email}
                        </span>
                      )}
                    </div>
                  </div>
                  {!err.resolved && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleResolve(err.id)
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Resolve
                    </Button>
                  )}
                </div>
              </div>

              {/* Expanded details */}
              {expandedError === err.id && (
                <div className="px-4 pb-4 border-t border-[#2c2420]/5 pt-4">
                  {err.error_stack && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-[#2c2420]/60 mb-2">Stack Trace</p>
                      <pre className="bg-[#2c2420] text-white/90 p-3 rounded-lg text-xs overflow-x-auto">
                        {err.error_stack}
                      </pre>
                    </div>
                  )}
                  {err.user_agent && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-[#2c2420]/60 mb-1">User Agent</p>
                      <p className="text-xs text-[#2c2420]/70 break-all">{err.user_agent}</p>
                    </div>
                  )}
                  {Object.keys(err.metadata || {}).length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-[#2c2420]/60 mb-2">Metadata</p>
                      <pre className="bg-gray-100 dark:bg-card p-3 rounded-lg text-xs overflow-x-auto">
                        {JSON.stringify(err.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info box */}
      <Alert className="mt-8 bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Tip:</strong> To integrate with Vercel error tracking, add the Vercel Analytics or connect
          to Sentry for production-grade error monitoring. This page tracks errors logged via the
          <code className="mx-1 px-1 py-0.5 bg-blue-100 rounded">logError()</code> function.
        </AlertDescription>
      </Alert>
    </div>
  )
}
