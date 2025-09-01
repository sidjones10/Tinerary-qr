"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Info } from "lucide-react"

export function PrivacySettings() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const [profilePrivacy, setProfilePrivacy] = useState("public")
  const [privacySettings, setPrivacySettings] = useState({
    shareLocation: false,
    locationHistory: true,
    showActivity: true,
    readReceipts: true,
    personalizedRecs: true,
    dataCollection: true,
  })

  const handleToggle = (key: keyof typeof privacySettings) => {
    setPrivacySettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleSave = async () => {
    setIsLoading(true)

    try {
      // Save privacy settings logic would go here

      toast({
        title: "Settings saved",
        description: "Your privacy settings have been updated.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save privacy settings.",
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
