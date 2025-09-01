"use client"

import { useState } from "react"
import { Check, Copy, Facebook, Instagram, Link, Twitter, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function ItinerarySharingOptions() {
  const [copied, setCopied] = useState(false)
  const [shareLink, setShareLink] = useState("https://tinerary.app/trip/weekend-nyc-123")

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="mr-2 h-5 w-5 text-orange-500" />
          Share & Save Itinerary
        </CardTitle>
        <CardDescription>Share your itinerary with friends or save parts from others</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="share">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="share">Share</TabsTrigger>
            <TabsTrigger value="save">Save From Others</TabsTrigger>
          </TabsList>

          <TabsContent value="share" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Share Link</Label>
              <div className="flex gap-2">
                <Input value={shareLink} readOnly />
                <Button variant="outline" onClick={copyLink}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Privacy Settings</Label>
              <RadioGroup defaultValue="friends">
                <div className="flex items-center space-x-2 rounded-md border p-3">
                  <RadioGroupItem value="private" id="private-share" />
                  <Label htmlFor="private-share" className="flex-1 cursor-pointer">
                    <div className="font-medium">Private</div>
                    <div className="text-sm text-muted-foreground">Only visible to people you invite</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 rounded-md border p-3">
                  <RadioGroupItem value="friends" id="friends-share" />
                  <Label htmlFor="friends-share" className="flex-1 cursor-pointer">
                    <div className="font-medium">Friends</div>
                    <div className="text-sm text-muted-foreground">Visible to your friends and people you invite</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 rounded-md border p-3">
                  <RadioGroupItem value="public" id="public-share" />
                  <Label htmlFor="public-share" className="flex-1 cursor-pointer">
                    <div className="font-medium">Public</div>
                    <div className="text-sm text-muted-foreground">
                      Visible to everyone, including in discovery feed
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Share on Social Media</Label>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  <Facebook className="mr-2 h-4 w-4 text-blue-600" />
                  Facebook
                </Button>
                <Button variant="outline" className="flex-1">
                  <Instagram className="mr-2 h-4 w-4 text-pink-600" />
                  Instagram
                </Button>
                <Button variant="outline" className="flex-1">
                  <Twitter className="mr-2 h-4 w-4 text-blue-400" />
                  Twitter
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="save" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Save From Link</Label>
              <div className="flex gap-2">
                <Input placeholder="Paste itinerary link here..." />
                <Button variant="outline">
                  <Link className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Recently Viewed Itineraries</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-r from-violet-500 via-pink-500 to-orange-400 text-white">
                        AR
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">Weekend in NYC</p>
                      <p className="text-sm text-muted-foreground">By Alex Rodriguez</p>
                    </div>
                  </div>
                  <Button size="sm" className="btn-sunset">
                    Save
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-r from-violet-500 via-pink-500 to-orange-400 text-white">
                        TM
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">Tokyo Adventure</p>
                      <p className="text-sm text-muted-foreground">By Taylor Moore</p>
                    </div>
                  </div>
                  <Button size="sm" className="btn-sunset">
                    Save
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Save Options</Label>
              <RadioGroup defaultValue="full">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="full" id="full" />
                  <Label htmlFor="full">Save entire itinerary</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="activities" id="activities" />
                  <Label htmlFor="activities">Save selected activities only</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="template" id="template" />
                  <Label htmlFor="template">Use as template for new itinerary</Label>
                </div>
              </RadioGroup>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
