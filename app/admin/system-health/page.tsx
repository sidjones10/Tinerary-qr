"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  Activity,
  Database,
  Server,
  HardDrive,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  Map,
  AlertCircle,
  Clock,
  Wifi,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface HealthData {
  status: string
  timestamp: string
  database: { latency: number; status: string }
  api: { latency: number; status: string }
  stats: {
    totalUsers: number
    totalItineraries: number
    errorsLast24h: number
    errorsLastWeek: number
    loginsLast24h: number
    storageBuckets: number
  }
  tables: { name: string; count: number }[]
  storage: { buckets: { name: string; public: boolean }[] }
}

const statusIcon = (status: string) => {
  if (status === "healthy") return <CheckCircle className="h-5 w-5 text-green-600" />
  if (status === "degraded") return <AlertTriangle className="h-5 w-5 text-amber-600" />
  return <XCircle className="h-5 w-5 text-red-600" />
}

const statusColor = (status: string) => {
  if (status === "healthy") return "bg-green-100 text-green-700"
  if (status === "degraded") return "bg-amber-100 text-amber-700"
  return "bg-red-100 text-red-700"
}

export default function AdminSystemHealthPage() {
  const [data, setData] = useState<HealthData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(false)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/admin/system-health")
      if (res.ok) setData(await res.json())
      else setData({ status: "unhealthy", timestamp: new Date().toISOString() } as HealthData)
    } catch (e) {
      setData({ status: "unhealthy", timestamp: new Date().toISOString() } as HealthData)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchData])

  return (
    <div className="p-4 lg:p-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild><Link href="/admin"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <div>
            <h1 className="text-2xl font-bold text-[#2c2420]">System Health</h1>
            <p className="text-sm text-[#2c2420]/50">Real-time infrastructure monitoring</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant={autoRefresh ? "default" : "outline"} size="sm" onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? "bg-green-600 hover:bg-green-700" : ""}>
            <Wifi className="h-4 w-4 mr-2" />{autoRefresh ? "Live" : "Auto-refresh"}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
        </div>
      </div>

      {isLoading && !data ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#ffb88c]" /></div>
      ) : (
        <>
          {/* Overall status */}
          <div className={`rounded-2xl border p-6 mb-6 ${data?.status === "healthy" ? "bg-green-50 border-green-200" : data?.status === "degraded" ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"}`}>
            <div className="flex items-center gap-4">
              {statusIcon(data?.status || "unhealthy")}
              <div>
                <h2 className="text-lg font-bold text-[#2c2420]">
                  System is {data?.status === "healthy" ? "Healthy" : data?.status === "degraded" ? "Degraded" : "Unhealthy"}
                </h2>
                <p className="text-xs text-[#2c2420]/50">Last checked: {data?.timestamp ? new Date(data.timestamp).toLocaleString() : "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Service status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Database */}
            <div className="bg-white/70 dark:bg-card/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-[#2c2420]">Database (Supabase)</h3>
                </div>
                <Badge className={statusColor(data?.database?.status || "unknown")}>{data?.database?.status || "Unknown"}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#2c2420]/40">Latency</p>
                  <p className="text-lg font-bold text-[#2c2420]">{data?.database?.latency || 0}ms</p>
                </div>
                <div>
                  <p className="text-xs text-[#2c2420]/40">Status</p>
                  <p className="text-lg font-bold text-[#2c2420] capitalize">{data?.database?.status || "Unknown"}</p>
                </div>
              </div>
            </div>

            {/* API */}
            <div className="bg-white/70 dark:bg-card/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Server className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-[#2c2420]">API Server</h3>
                </div>
                <Badge className={statusColor(data?.api?.status || "unknown")}>{data?.api?.status || "Unknown"}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#2c2420]/40">Response Time</p>
                  <p className="text-lg font-bold text-[#2c2420]">{data?.api?.latency || 0}ms</p>
                </div>
                <div>
                  <p className="text-xs text-[#2c2420]/40">Status</p>
                  <p className="text-lg font-bold text-[#2c2420] capitalize">{data?.api?.status || "Unknown"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Users", value: data?.stats?.totalUsers || 0, icon: Users, color: "text-blue-600 bg-blue-50" },
              { label: "Itineraries", value: data?.stats?.totalItineraries || 0, icon: Map, color: "text-green-600 bg-green-50" },
              { label: "Errors (24h)", value: data?.stats?.errorsLast24h || 0, icon: AlertCircle, color: data?.stats?.errorsLast24h ? "text-red-600 bg-red-50" : "text-green-600 bg-green-50" },
              { label: "Logins (24h)", value: data?.stats?.loginsLast24h || 0, icon: Clock, color: "text-purple-600 bg-purple-50" },
            ].map((s) => (
              <div key={s.label} className="bg-white/70 dark:bg-card/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1.5 rounded-lg ${s.color}`}><s.icon className="h-4 w-4" /></div>
                  <span className="text-xs text-[#2c2420]/50">{s.label}</span>
                </div>
                <p className="text-2xl font-bold text-[#2c2420]">{s.value.toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* Storage */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white/70 dark:bg-card/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-5">
              <div className="flex items-center gap-3 mb-4">
                <HardDrive className="h-5 w-5 text-amber-600" />
                <h3 className="font-semibold text-[#2c2420]">Storage Buckets</h3>
              </div>
              <div className="space-y-2">
                {data?.storage?.buckets.length === 0 && <p className="text-sm text-[#2c2420]/40">No storage buckets</p>}
                {data?.storage?.buckets.map((b: any) => (
                  <div key={b.name} className="flex items-center justify-between py-2 px-3 bg-[#2c2420]/[0.02] rounded-lg">
                    <span className="text-sm font-medium text-[#2c2420]">{b.name}</span>
                    <Badge className={b.public ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                      {b.public ? "Public" : "Private"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/70 dark:bg-card/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-5">
              <div className="flex items-center gap-3 mb-4">
                <Activity className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-[#2c2420]">Error Trend</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#2c2420]/60">Last 24 hours</span>
                  <span className={`text-lg font-bold ${(data?.stats?.errorsLast24h || 0) > 0 ? "text-red-600" : "text-green-600"}`}>
                    {data?.stats?.errorsLast24h || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#2c2420]/60">Last 7 days</span>
                  <span className={`text-lg font-bold ${(data?.stats?.errorsLastWeek || 0) > 0 ? "text-amber-600" : "text-green-600"}`}>
                    {data?.stats?.errorsLastWeek || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
