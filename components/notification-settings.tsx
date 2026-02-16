"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/providers/auth-provider"
import { createClient } from "@/lib/supabase/client"

export function NotificationSettings() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // In-app / push notification preferences (stored in user_preferences)
  const [notifications, setNotifications] = useState({
    push: true,
    email: true,
    sms: false,
    tripReminders: true,
    activityAlerts: true,
    itineraryChanges: true,
    newFollowers: true,
    likesComments: true,
    mentions: true,
  })

  // Email consent flags (stored on profiles table)
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [activityDigestConsent, setActivityDigestConsent] = useState(true)

  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return

      try {
        const supabase = createClient()

        // Load notification preferences from user_preferences
        const { data: prefs, error: prefsError } = await supabase
          .from("user_preferences")
          .select("notification_preferences")
          .eq("user_id", user.id)
          .single()

        if (prefsError && prefsError.code !== "PGRST116") {
          console.error("Error loading preferences:", prefsError)
        }

        if (prefs?.notification_preferences) {
          setNotifications((prev) => ({
            ...prev,
            ...prefs.notification_preferences,
          }))
        }

        // Load marketing & activity digest consent from profiles
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("marketing_consent, activity_digest_consent")
          .eq("id", user.id)
          .single()

        if (profileError && profileError.code !== "PGRST116") {
          console.error("Error loading profile consent:", profileError)
        }

        if (profile) {
          setMarketingConsent(profile.marketing_consent ?? false)
          setActivityDigestConsent(profile.activity_digest_consent ?? true)
        }
      } catch (error) {
        console.error("Error loading preferences:", error)
      }
    }

    loadPreferences()
  }, [user])

  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to save preferences.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()

      // 1. Save in-app notification preferences to user_preferences
      const { error: updateError } = await supabase
        .from("user_preferences")
        .update({
          notification_preferences: notifications,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)

      // If no rows were updated, insert a new row
      if (updateError && updateError.code === "PGRST116") {
        const { error: insertError } = await supabase
          .from("user_preferences")
          .insert({
            user_id: user.id,
            notification_preferences: notifications,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

        if (insertError) throw insertError
      } else if (updateError) {
        throw updateError
      }

      // 2. Save marketing & activity digest consent to profiles
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          marketing_consent: marketingConsent,
          activity_digest_consent: activityDigestConsent,
        })
        .eq("id", user.id)

      if (profileError) throw profileError

      // 3. Record consent changes in audit log
      await supabase.from("consent_records").insert([
        { user_id: user.id, consent_type: "marketing", consent_version: "1.0.0", consent_given: marketingConsent },
        { user_id: user.id, consent_type: "activity_digest", consent_version: "1.0.0", consent_given: activityDigestConsent },
      ])

      toast({
        title: "Preferences saved",
        description: "Your notification preferences have been updated.",
      })
    } catch (error: any) {
      console.error("Error saving preferences:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save notification preferences.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
        <CardDescription>Control how and when you receive notifications</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Notification Channels</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-muted-foreground">Receive notifications on your device</p>
              </div>
              <Switch checked={notifications.push} onCheckedChange={() => handleToggle("push")} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive notifications via email</p>
              </div>
              <Switch checked={notifications.email} onCheckedChange={() => handleToggle("email")} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">SMS Notifications</p>
                <p className="text-sm text-muted-foreground">Receive notifications via text message</p>
              </div>
              <Switch checked={notifications.sms} onCheckedChange={() => handleToggle("sms")} />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-medium text-muted-foreground">Trip & Event Notifications</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Trip Reminders</p>
                <p className="text-sm text-muted-foreground">Reminders about upcoming trips</p>
              </div>
              <Switch checked={notifications.tripReminders} onCheckedChange={() => handleToggle("tripReminders")} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Activity Alerts</p>
                <p className="text-sm text-muted-foreground">Alerts about activities during your trip</p>
              </div>
              <Switch checked={notifications.activityAlerts} onCheckedChange={() => handleToggle("activityAlerts")} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Itinerary Changes</p>
                <p className="text-sm text-muted-foreground">Notifications when itineraries are updated</p>
              </div>
              <Switch
                checked={notifications.itineraryChanges}
                onCheckedChange={() => handleToggle("itineraryChanges")}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-medium text-muted-foreground">Social Notifications</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">New Followers</p>
                <p className="text-sm text-muted-foreground">When someone follows you</p>
              </div>
              <Switch checked={notifications.newFollowers} onCheckedChange={() => handleToggle("newFollowers")} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Likes & Comments</p>
                <p className="text-sm text-muted-foreground">When someone likes or comments on your itineraries</p>
              </div>
              <Switch checked={notifications.likesComments} onCheckedChange={() => handleToggle("likesComments")} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Mentions</p>
                <p className="text-sm text-muted-foreground">When someone mentions you</p>
              </div>
              <Switch checked={notifications.mentions} onCheckedChange={() => handleToggle("mentions")} />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-medium text-muted-foreground">Marketing Emails</h3>
          <p className="text-xs text-muted-foreground -mt-2">Promotional content from Tinerary. You can opt in or out at any time.</p>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Marketing & Promotions</p>
                <p className="text-sm text-muted-foreground">Special deals, feature updates, newsletters, and travel inspiration</p>
              </div>
              <Switch checked={marketingConsent} onCheckedChange={() => setMarketingConsent(!marketingConsent)} />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-medium text-muted-foreground">Activity Digest</h3>
          <p className="text-xs text-muted-foreground -mt-2">Personalised emails based on your browsing and activity on Tinerary.</p>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Personalised Recommendations</p>
                <p className="text-sm text-muted-foreground">Emails about itineraries and destinations based on what you&apos;ve been looking at</p>
              </div>
              <Switch checked={activityDigestConsent} onCheckedChange={() => setActivityDigestConsent(!activityDigestConsent)} />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Preferences"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
