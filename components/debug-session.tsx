"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/app/providers"
import { getSupabaseClient } from "@/lib/supabase-singleton"

export function DebugSession() {
  const { session, isAuthenticated, refreshSession } = useAuth()
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info")

  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    setStatusMessage(null)

    try {
      const result = await refreshSession()
      setLastRefresh(new Date())

      if (result.success) {
        setMessageType("success")
      } else {
        setMessageType("error")
      }

      setStatusMessage(result.message || "Session refresh attempted")
    } catch (err) {
      setMessageType("error")
      setStatusMessage(err instanceof Error ? err.message : String(err))
    } finally {
      setIsRefreshing(false)
    }
  }

  // Check session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = getSupabaseClient()
        const { data } = await supabase.auth.getSession()
        console.log("Current session check:", !!data.session)
      } catch (err) {
        console.error("Session check error:", err)
      }
    }

    checkSession()
  }, [])

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs z-50 max-w-xs">
      <h3 className="font-bold mb-2">Session Debug</h3>
      <div className="mb-2">
        <span>Session: </span>
        <span className={isAuthenticated ? "text-green-400" : "text-red-400"}>
          {isAuthenticated ? "Active" : "None"}
        </span>
      </div>
      {session && (
        <div className="mb-2">
          <div>User: {session.user?.email || session.user?.phone || session.user?.id}</div>
          <div>Expires: {new Date(session.expires_at! * 1000).toLocaleTimeString()}</div>
        </div>
      )}
      {lastRefresh && <div className="mb-2">Last refresh: {lastRefresh.toLocaleTimeString()}</div>}
      {statusMessage && (
        <div
          className={`mb-2 ${
            messageType === "success" ? "text-green-400" : messageType === "error" ? "text-red-400" : "text-blue-400"
          }`}
        >
          {statusMessage}
        </div>
      )}
      <button
        onClick={handleManualRefresh}
        disabled={isRefreshing}
        className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs disabled:opacity-50"
      >
        {isRefreshing ? "Refreshing..." : "Refresh Session"}
      </button>
    </div>
  )
}
