"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  Clock,
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Timer,
  Zap,
  HelpCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"

interface CronJob {
  id: string
  name: string
  endpoint: string
  schedule: string
  description: string
  lastRun: string | null
  lastStatus: string
  lastDuration: number | null
  lastError: string | null
  recentFailures: number
  totalRuns: number
  isHealthy: boolean | null
}

interface CronData {
  jobs: CronJob[]
  recentLogs: any[]
}

export default function AdminCronJobsPage() {
  const [data, setData] = useState<CronData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [triggering, setTriggering] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/admin/cron-jobs")
      if (res.ok) setData(await res.json())
    } catch (e) { console.error(e) }
    setIsLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const triggerJob = async (jobId: string) => {
    setTriggering(jobId)
    try {
      const res = await fetch("/api/admin/cron-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      })
      const result = await res.json()
      if (result.success) {
        toast({ title: "Job triggered", description: `Completed in ${result.duration}ms` })
      } else {
        toast({ title: "Job failed", description: result.error || "Unknown error", variant: "destructive" })
      }
      fetchData()
    } catch (e) {
      toast({ title: "Error", description: "Failed to trigger job", variant: "destructive" })
    }
    setTriggering(null)
  }

  const formatTime = (d: string) => {
    const diff = Date.now() - new Date(d).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(diff / 3600000)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(diff / 86400000)}d ago`
  }

  return (
    <div className="p-4 lg:p-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild><Link href="/admin"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <div>
            <h1 className="text-2xl font-bold text-[#2c2420]">Cron Job Monitoring</h1>
            <p className="text-sm text-[#2c2420]/50">Track scheduled task health and trigger manual runs</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#ffb88c]" /></div>
      ) : (
        <>
          {/* Jobs grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            {data?.jobs.map((job) => (
              <div key={job.id} className="bg-white/70 dark:bg-card/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${
                      job.isHealthy === true ? "bg-green-100" :
                      job.isHealthy === false ? "bg-red-100" :
                      "bg-gray-100"
                    }`}>
                      {job.isHealthy === true ? <CheckCircle className="h-5 w-5 text-green-600" /> :
                       job.isHealthy === false ? <XCircle className="h-5 w-5 text-red-600" /> :
                       <HelpCircle className="h-5 w-5 text-gray-400" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#2c2420]">{job.name}</h3>
                      <p className="text-xs text-[#2c2420]/40">{job.description}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => triggerJob(job.id)}
                    disabled={triggering === job.id}
                  >
                    {triggering === job.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 mr-1" />}
                    Run
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div>
                    <p className="text-xs text-[#2c2420]/40">Schedule</p>
                    <p className="text-sm font-medium text-[#2c2420] flex items-center gap-1"><Clock className="h-3 w-3" />{job.schedule}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#2c2420]/40">Last Run</p>
                    <p className="text-sm font-medium text-[#2c2420]">{job.lastRun ? formatTime(job.lastRun) : "Never"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#2c2420]/40">Duration</p>
                    <p className="text-sm font-medium text-[#2c2420] flex items-center gap-1">
                      <Timer className="h-3 w-3" />{job.lastDuration ? `${job.lastDuration}ms` : "N/A"}
                    </p>
                  </div>
                </div>

                {job.recentFailures > 0 && (
                  <div className="mt-3 flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg text-xs">
                    <AlertTriangle className="h-3 w-3" />
                    {job.recentFailures} recent failure{job.recentFailures > 1 ? "s" : ""}
                  </div>
                )}

                {job.lastError && (
                  <div className="mt-3 bg-red-50 rounded-lg p-3">
                    <p className="text-xs text-red-700 font-mono truncate">{job.lastError}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Recent logs */}
          {data?.recentLogs && data.recentLogs.length > 0 && (
            <div className="bg-white/70 dark:bg-card/70 backdrop-blur rounded-2xl border border-[#2c2420]/5">
              <div className="p-4 border-b border-[#2c2420]/5">
                <h3 className="font-semibold text-[#2c2420]">Recent Logs</h3>
              </div>
              <div className="divide-y divide-[#2c2420]/5">
                {data.recentLogs.slice(0, 20).map((log: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-4 p-4">
                    {log.status === "success" ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#2c2420]">{log.job_id}</p>
                      {log.error_message && <p className="text-xs text-red-600 truncate">{log.error_message}</p>}
                    </div>
                    <span className="text-xs text-[#2c2420]/40">{log.duration_ms}ms</span>
                    <span className="text-xs text-[#2c2420]/40">{formatTime(log.executed_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
