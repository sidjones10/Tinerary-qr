"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function TestRealtimePage() {
  const [status, setStatus] = useState<string>("Initializing...")
  const [events, setEvents] = useState<any[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    setStatus("Creating channel...")

    // Create a test channel
    const channel = supabase
      .channel("realtime-test")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          console.log("Realtime event received:", payload)
          setEvents((prev) => [
            {
              type: payload.eventType,
              timestamp: new Date().toISOString(),
              data: payload,
            },
            ...prev,
          ])
        }
      )
      .subscribe((channelStatus) => {
        console.log("Channel status:", channelStatus)
        setStatus(channelStatus)

        if (channelStatus === "SUBSCRIBED") {
          setIsConnected(true)
          setStatus("✅ Connected! Listening for changes...")
        } else if (channelStatus === "CHANNEL_ERROR") {
          setIsConnected(false)
          setStatus("❌ Error: Could not subscribe to Realtime")
        } else if (channelStatus === "TIMED_OUT") {
          setIsConnected(false)
          setStatus("⏱️ Connection timed out")
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const testNotification = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      alert("You must be logged in to test notifications")
      return
    }

    // Insert a test notification
    const { error } = await supabase.from("notifications").insert({
      user_id: user.id,
      type: "test",
      title: "Test Notification",
      message: `Test notification sent at ${new Date().toLocaleTimeString()}`,
      is_read: false,
    })

    if (error) {
      console.error("Error creating test notification:", error)
      alert("Error creating notification: " + error.message)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Supabase Realtime Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connection Status */}
          <div>
            <h3 className="font-semibold mb-2">Connection Status</h3>
            <Badge variant={isConnected ? "default" : "destructive"}>
              {status}
            </Badge>
          </div>

          {/* Test Button */}
          <div>
            <h3 className="font-semibold mb-2">Test Realtime</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Click the button to create a test notification. If Realtime is working,
              you'll see it appear in the events list below instantly.
            </p>
            <Button onClick={testNotification} disabled={!isConnected}>
              Send Test Notification
            </Button>
          </div>

          {/* Events Log */}
          <div>
            <h3 className="font-semibold mb-2">
              Realtime Events ({events.length})
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No events yet. Try creating a test notification above.
                </p>
              ) : (
                events.map((event, i) => (
                  <Card key={i} className="bg-muted">
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <Badge>{event.type}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(event.data.new, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded">
            <h3 className="font-semibold mb-2">Setup Instructions</h3>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>Go to Supabase Dashboard → Database → Replication</li>
              <li>Enable Realtime for the "notifications" table</li>
              <li>Refresh this page</li>
              <li>Click "Send Test Notification" to verify it works</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
