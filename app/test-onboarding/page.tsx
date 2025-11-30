"use client"

import { useState } from "react"
import { useAuth } from "@/providers/auth-provider"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, CheckCircle, XCircle, Info } from "lucide-react"

export default function TestOnboardingPage() {
  const { user } = useAuth()
  const [onboardingStatus, setOnboardingStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null)

  const checkOnboardingStatus = async () => {
    if (!user) return

    setLoading(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from("profiles")
      .select("onboarding_completed, interests, name, username")
      .eq("id", user.id)
      .single()

    if (error) {
      setMessage({ type: "error", text: error.message })
    } else {
      setOnboardingStatus(data)
      setMessage(null)
    }

    setLoading(false)
  }

  const resetOnboarding = async () => {
    if (!user) return

    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase
      .from("profiles")
      .update({
        onboarding_completed: false,
        interests: [],
      })
      .eq("id", user.id)

    if (error) {
      setMessage({ type: "error", text: `Failed to reset: ${error.message}` })
    } else {
      setMessage({ type: "success", text: "Onboarding reset! Refresh the page to see it." })
      checkOnboardingStatus()
    }

    setLoading(false)
  }

  const completeOnboarding = async () => {
    if (!user) return

    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase
      .from("profiles")
      .update({
        onboarding_completed: true,
      })
      .eq("id", user.id)

    if (error) {
      setMessage({ type: "error", text: `Failed to complete: ${error.message}` })
    } else {
      setMessage({ type: "success", text: "Onboarding marked as completed!" })
      checkOnboardingStatus()
    }

    setLoading(false)
  }

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Onboarding Flow Tester</CardTitle>
          <CardDescription>
            Test and debug the onboarding experience for new users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!user ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                You must be logged in to test onboarding. <a href="/auth" className="underline">Sign in</a>
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Status Check */}
              <div>
                <h3 className="font-semibold mb-3">Current Status</h3>
                <Button onClick={checkOnboardingStatus} disabled={loading} className="mb-4">
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                  Check Status
                </Button>

                {onboardingStatus && (
                  <Card className="bg-muted/50">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Onboarding Completed:</span>
                        <Badge variant={onboardingStatus.onboarding_completed ? "default" : "destructive"}>
                          {onboardingStatus.onboarding_completed ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Yes
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              No
                            </>
                          )}
                        </Badge>
                      </div>

                      <div>
                        <span className="font-medium">User Name:</span>
                        <p className="text-sm text-muted-foreground">
                          {onboardingStatus.name || onboardingStatus.username || "Not set"}
                        </p>
                      </div>

                      <div>
                        <span className="font-medium">Selected Interests:</span>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {onboardingStatus.interests && onboardingStatus.interests.length > 0 ? (
                            onboardingStatus.interests.map((interest: string) => (
                              <Badge key={interest} variant="outline">
                                {interest}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">None selected</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Actions */}
              <div>
                <h3 className="font-semibold mb-3">Test Actions</h3>
                <div className="space-y-3">
                  <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Reset Onboarding</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Set onboarding_completed to false and clear interests. Refresh the page after to see the onboarding modal.
                      </p>
                      <Button
                        onClick={resetOnboarding}
                        disabled={loading}
                        variant="outline"
                        className="border-orange-300 hover:bg-orange-100"
                      >
                        Reset Onboarding
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Mark as Completed</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Mark onboarding as completed without showing the flow.
                      </p>
                      <Button
                        onClick={completeOnboarding}
                        disabled={loading}
                        variant="outline"
                        className="border-green-300 hover:bg-green-100"
                      >
                        Complete Onboarding
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Messages */}
              {message && (
                <Alert variant={message.type === "error" ? "destructive" : "default"}>
                  {message.type === "success" ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>{message.text}</AlertDescription>
                </Alert>
              )}

              {/* Instructions */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  How to Test
                </h4>
                <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                  <li>Click "Reset Onboarding" to set onboarding_completed = false</li>
                  <li>Refresh the page (F5 or reload)</li>
                  <li>Onboarding modal should appear</li>
                  <li>Complete or skip the onboarding flow</li>
                  <li>Click "Check Status" to verify it was saved</li>
                </ol>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
