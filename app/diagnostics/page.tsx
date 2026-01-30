"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

export default function DiagnosticsPage() {
  const { user } = useAuth()
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(false)

  const runDiagnostics = async () => {
    setLoading(true)
    const supabase = createClient()
    const diagnostics: any = {}

    try {
      // 1. Check if user is authenticated
      diagnostics.userAuthenticated = !!user
      diagnostics.userId = user?.id || null

      // 2. Test toggle_like function exists and is callable
      try {
        const { data, error } = await supabase.rpc('toggle_like', {
          user_uuid: user?.id || '00000000-0000-0000-0000-000000000000',
          itinerary_uuid: '00000000-0000-0000-0000-000000000000'
        })
        diagnostics.toggleLikeExists = !error || error.code !== '42883' // 42883 = function does not exist
        diagnostics.toggleLikeError = error?.message || null
      } catch (e: any) {
        diagnostics.toggleLikeExists = false
        diagnostics.toggleLikeError = e.message
      }

      // 3. Test user_has_liked function
      try {
        const { data, error } = await supabase.rpc('user_has_liked', {
          user_uuid: user?.id || '00000000-0000-0000-0000-000000000000',
          itinerary_uuid: '00000000-0000-0000-0000-000000000000'
        })
        diagnostics.userHasLikedExists = !error || error.code !== '42883'
        diagnostics.userHasLikedError = error?.message || null
      } catch (e: any) {
        diagnostics.userHasLikedExists = false
        diagnostics.userHasLikedError = e.message
      }

      // 4. Check saved_itineraries table access
      try {
        const { data, error } = await supabase
          .from('saved_itineraries')
          .select('id, type')
          .limit(1)
        diagnostics.savedItinerariesAccess = !error
        diagnostics.savedItinerariesError = error?.message || null
      } catch (e: any) {
        diagnostics.savedItinerariesAccess = false
        diagnostics.savedItinerariesError = e.message
      }

      // 5. Check user's likes if authenticated
      if (user) {
        try {
          const { data, error } = await supabase
            .from('saved_itineraries')
            .select('id, itinerary_id, type, created_at')
            .eq('user_id', user.id)
            .eq('type', 'like')

          diagnostics.userLikes = data || []
          diagnostics.userLikesCount = data?.length || 0
          diagnostics.userLikesError = error?.message || null
        } catch (e: any) {
          diagnostics.userLikesError = e.message
        }
      }

      // 6. Check itinerary_metrics table
      try {
        const { data, error } = await supabase
          .from('itinerary_metrics')
          .select('itinerary_id, like_count')
          .limit(5)
        diagnostics.metricsAccess = !error
        diagnostics.metricsError = error?.message || null
        diagnostics.sampleMetrics = data || []
      } catch (e: any) {
        diagnostics.metricsAccess = false
        diagnostics.metricsError = e.message
      }

      // 7. Check if we can query itineraries with metrics join
      try {
        const { data, error } = await supabase
          .from('itineraries')
          .select(`
            id,
            title,
            metrics:itinerary_metrics(like_count, comment_count)
          `)
          .limit(3)

        diagnostics.itineraryMetricsJoin = !error
        diagnostics.itineraryMetricsJoinError = error?.message || null
        diagnostics.sampleItineraries = data || []
      } catch (e: any) {
        diagnostics.itineraryMetricsJoin = false
        diagnostics.itineraryMetricsJoinError = e.message
      }

    } catch (error: any) {
      diagnostics.generalError = error.message
    }

    setResults(diagnostics)
    setLoading(false)
  }

  useEffect(() => {
    if (user) {
      runDiagnostics()
    }
  }, [user])

  const StatusIcon = ({ status }: { status: boolean | undefined }) => {
    if (status === undefined) return null
    return status ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">System Diagnostics</h1>

      <Button onClick={runDiagnostics} disabled={loading} className="mb-6">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Running Diagnostics...
          </>
        ) : (
          "Run Diagnostics"
        )}
      </Button>

      {Object.keys(results).length > 0 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <StatusIcon status={results.userAuthenticated} />
                Authentication
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>User Authenticated: {results.userAuthenticated ? "Yes" : "No"}</p>
              {results.userId && <p className="text-sm text-muted-foreground">User ID: {results.userId}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <StatusIcon status={results.toggleLikeExists} />
                toggle_like Function
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Function Exists: {results.toggleLikeExists ? "Yes" : "No"}</p>
              {results.toggleLikeError && (
                <p className="text-sm text-red-500 mt-2">Error: {results.toggleLikeError}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <StatusIcon status={results.userHasLikedExists} />
                user_has_liked Function
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Function Exists: {results.userHasLikedExists ? "Yes" : "No"}</p>
              {results.userHasLikedError && (
                <p className="text-sm text-red-500 mt-2">Error: {results.userHasLikedError}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <StatusIcon status={results.savedItinerariesAccess} />
                saved_itineraries Table
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Table Accessible: {results.savedItinerariesAccess ? "Yes" : "No"}</p>
              {results.savedItinerariesError && (
                <p className="text-sm text-red-500 mt-2">Error: {results.savedItinerariesError}</p>
              )}
            </CardContent>
          </Card>

          {results.userLikes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Your Likes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>Total Likes: {results.userLikesCount}</p>
                {results.userLikesError && (
                  <p className="text-sm text-red-500 mt-2">Error: {results.userLikesError}</p>
                )}
                {results.userLikes.length > 0 && (
                  <div className="mt-4">
                    <p className="font-semibold mb-2">Your liked itineraries:</p>
                    <ul className="text-sm space-y-1">
                      {results.userLikes.map((like: any) => (
                        <li key={like.id} className="text-muted-foreground">
                          Itinerary ID: {like.itinerary_id} (Created: {new Date(like.created_at).toLocaleString()})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <StatusIcon status={results.metricsAccess} />
                itinerary_metrics Table
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Table Accessible: {results.metricsAccess ? "Yes" : "No"}</p>
              {results.metricsError && (
                <p className="text-sm text-red-500 mt-2">Error: {results.metricsError}</p>
              )}
              {results.sampleMetrics && results.sampleMetrics.length > 0 && (
                <div className="mt-4">
                  <p className="font-semibold mb-2">Sample metrics:</p>
                  <ul className="text-sm space-y-1">
                    {results.sampleMetrics.map((metric: any) => (
                      <li key={metric.itinerary_id} className="text-muted-foreground">
                        Itinerary: {metric.itinerary_id} - Likes: {metric.like_count}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <StatusIcon status={results.itineraryMetricsJoin} />
                Itineraries + Metrics Join
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Join Works: {results.itineraryMetricsJoin ? "Yes" : "No"}</p>
              {results.itineraryMetricsJoinError && (
                <p className="text-sm text-red-500 mt-2">Error: {results.itineraryMetricsJoinError}</p>
              )}
              {results.sampleItineraries && results.sampleItineraries.length > 0 && (
                <div className="mt-4">
                  <p className="font-semibold mb-2">Sample itineraries with metrics:</p>
                  <ul className="text-sm space-y-2">
                    {results.sampleItineraries.map((itin: any) => (
                      <li key={itin.id} className="text-muted-foreground">
                        <div className="font-medium text-foreground">{itin.title}</div>
                        <div>
                          Metrics: {JSON.stringify(itin.metrics)}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
