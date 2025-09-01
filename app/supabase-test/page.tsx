"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SupabaseTestPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const [session, setSession] = useState<any>(null)
  const [itineraries, setItineraries] = useState<any[]>([])

  useEffect(() => {
    async function checkSupabase() {
      try {
        // Test Supabase connection
        const { data, error } = await supabase.from("itineraries").select("count").limit(1)

        if (error) {
          throw error
        }

        // Get session
        const {
          data: { session: userSession },
        } = await supabase.auth.getSession()
        setSession(userSession)

        // Get itineraries if logged in
        if (userSession) {
          const { data: userItineraries, error: itinerariesError } = await supabase
            .from("itineraries")
            .select("*")
            .limit(5)

          if (itinerariesError) {
            console.error("Error fetching itineraries:", itinerariesError)
          } else {
            setItineraries(userItineraries || [])
          }
        }

        setStatus("success")
        setMessage("Supabase connection successful!")
      } catch (error: any) {
        console.error("Supabase connection error:", error)
        setStatus("error")
        setMessage(`Error: ${error.message || "Unknown error"}`)
      }
    }

    checkSupabase()
  }, [])

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Supabase Connection Test</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
        </CardHeader>
        <CardContent>
          {status === "loading" && <p>Testing connection...</p>}
          {status === "success" && <p className="text-green-600">{message}</p>}
          {status === "error" && <p className="text-red-600">{message}</p>}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Authentication Status</CardTitle>
        </CardHeader>
        <CardContent>
          {session ? (
            <div>
              <p className="mb-2">Logged in as: {session.user.email}</p>
              <Button
                onClick={async () => {
                  await supabase.auth.signOut()
                  window.location.reload()
                }}
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <p>Not logged in</p>
          )}
        </CardContent>
      </Card>

      {session && (
        <Card>
          <CardHeader>
            <CardTitle>Your Itineraries</CardTitle>
          </CardHeader>
          <CardContent>
            {itineraries.length > 0 ? (
              <ul className="list-disc pl-5">
                {itineraries.map((itinerary) => (
                  <li key={itinerary.id} className="mb-2">
                    <strong>{itinerary.title}</strong> - {itinerary.location}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No itineraries found</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
