"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Info } from "lucide-react"
import { useAuth } from "@/providers/auth-provider"
import { createClient } from "@/lib/supabase/client"

export function PrivacySettings() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  const [profilePrivacy, setProfilePrivacy] = useState("public")
  const [privacySettings, setPrivacySettings] = useState({
    shareLocation: false,
    locationHistory: true,
    showActivity: true,
    readReceipts: true,
    personalizedRecs: true,
    dataCollection: true,
  })

  // Load privacy settings from database
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return

      try {
        const supabase = createClient()

        // Load profile privacy from profiles table
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("is_private")
          .eq("id", user.id)
          .single()

        if (profileError && profileError.code !== "PGRST116") {
          console.error("Error loading profile privacy:", profileError)
        } else if (profileData) {
          // Map is_private boolean to profilePrivacy string
          if (profileData.is_private === true) {
            setProfilePrivacy("private")
          } else if (profileData.is_private === false) {
            setProfilePrivacy("public")
          }
        }

        // Load other privacy settings from user_preferences
        const { data: prefsData, error: prefsError } = await supabase
          .from("user_preferences")
          .select("privacy_preferences")
          .eq("user_id", user.id)
          .single()

        if (prefsError && prefsError.code !== "PGRST116") {
          console.error("Error loading privacy preferences:", prefsError)
          return
        }

        if (prefsData?.privacy_preferences) {
          setPrivacySettings((prev) => ({
            ...prev,
            ...prefsData.privacy_preferences,
          }))
        }
      } catch (error) {
        console.error("Error loading privacy settings:", error)
      }
    }

    loadPreferences()
  }, [user])

  const handleToggle = (key: keyof typeof privacySettings) => {
    setPrivacySettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to save settings.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()

      // Update profile privacy in profiles table
      const isPrivate = profilePrivacy === "private" || profilePrivacy === "followers"
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          is_private: isPrivate,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (profileError) {
        throw new Error(`Failed to update profile privacy: ${profileError.message}`)
      }

      // Save other privacy settings to user_preferences
      const { error: updateError } = await supabase
        .from("user_preferences")
        .update({
          privacy_preferences: {
            ...privacySettings,
            profilePrivacy, // Store the exact privacy level
          },
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)

      // If no rows were updated, insert a new row
      if (updateError && updateError.code === "PGRST116") {
        const { error: insertError } = await supabase
          .from("user_preferences")
          .insert({
            user_id: user.id,
            privacy_preferences: {
              ...privacySettings,
              profilePrivacy,
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

        if (insertError) throw insertError
      } else if (updateError) {
        throw updateError
      }

      toast({
        title: "Settings saved",
        description: "Your privacy settings have been updated.",
      })
    } catch (error: any) {
      console.error("Error saving privacy settings:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save privacy settings.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy Settings</CardTitle>
        <CardDescription>Control your privacy and security preferences</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Profile Privacy</h3>

          <RadioGroup value={profilePrivacy} onValueChange={setProfilePrivacy} className="space-y-3">
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="public" id="public" className="mt-1" />
              <div className="grid gap-1.5">
                <Label htmlFor="public" className="font-medium">
                  Public
                </Label>
                <p className="text-sm text-muted-foreground">Anyone can view your profile and itineraries</p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <RadioGroupItem value="followers" id="followers" className="mt-1" />
              <div className="grid gap-1.5">
                <Label htmlFor="followers" className="font-medium">
                  Followers Only
                </Label>
                <p className="text-sm text-muted-foreground">
                  Only people who follow you can view your profile and itineraries
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <RadioGroupItem value="private" id="private" className="mt-1" />
              <div className="grid gap-1.5">
                <Label htmlFor="private" className="font-medium">
                  Private
                </Label>
                <p className="text-sm text-muted-foreground">
                  Only you and people you specifically invite can view your itineraries
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-medium text-muted-foreground">Location Sharing</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Share Precise Location</p>
                <p className="text-sm text-muted-foreground">Allow others to see your exact location in itineraries</p>
              </div>
              <Switch checked={privacySettings.shareLocation} onCheckedChange={() => handleToggle("shareLocation")} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Location History</p>
                <p className="text-sm text-muted-foreground">Save your location history for better recommendations</p>
              </div>
              <Switch
                checked={privacySettings.locationHistory}
                onCheckedChange={() => handleToggle("locationHistory")}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-medium text-muted-foreground">Activity Privacy</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Show Activity Status</p>
                <p className="text-sm text-muted-foreground">Let others see when you're active on Itinerary</p>
              </div>
              <Switch checked={privacySettings.showActivity} onCheckedChange={() => handleToggle("showActivity")} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Read Receipts</p>
                <p className="text-sm text-muted-foreground">Let others know when you've read their messages</p>
              </div>
              <Switch checked={privacySettings.readReceipts} onCheckedChange={() => handleToggle("readReceipts")} />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-medium text-muted-foreground">Data & Personalization</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Personalized Recommendations</p>
                <p className="text-sm text-muted-foreground">
                  Allow us to use your activity to personalize recommendations
                </p>
              </div>
              <Switch
                checked={privacySettings.personalizedRecs}
                onCheckedChange={() => handleToggle("personalizedRecs")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Data Collection</p>
                <p className="text-sm text-muted-foreground">Allow us to collect usage data to improve our services</p>
              </div>
              <Switch checked={privacySettings.dataCollection} onCheckedChange={() => handleToggle("dataCollection")} />
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-md text-blue-800 text-sm flex items-start gap-2 mt-4">
            <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p>
              Your privacy is important to us. Review our{" "}
              <a href="#" className="underline font-medium">
                Privacy Policy
              </a>{" "}
              to learn more about how we protect your data.
            </p>
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
              "Save Privacy Settings"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
