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
    specialDeals: false,
    productUpdates: true,
    newsletter: false,
  })

  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return

      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("user_preferences")
          .select("notification_preferences")
          .eq("user_id", user.id)
          .single()

        if (error && error.code !== "PGRST116") {
          console.error("Error loading preferences:", error)
          return
        }

        if (data?.notification_preferences) {
          setNotifications((prev) => ({
            ...prev,
            ...data.notification_preferences,
          }))
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

      // Try to update existing preferences
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
          <h3 className="text-sm font-medium text-muted-foreground">Marketing Notifications</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Special Deals</p>
                <p className="text-sm text-muted-foreground">Notifications about special deals and promotions</p>
              </div>
              <Switch checked={notifications.specialDeals} onCheckedChange={() => handleToggle("specialDeals")} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Product Updates</p>
                <p className="text-sm text-muted-foreground">Notices about new features and improvements</p>
              </div>
              <Switch checked={notifications.productUpdates} onCheckedChange={() => handleToggle("productUpdates")} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Newsletter</p>
                <p className="text-sm text-muted-foreground">Monthly newsletter with travel tips and inspiration</p>
              </div>
              <Switch checked={notifications.newsletter} onCheckedChange={() => handleToggle("newsletter")} />
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
