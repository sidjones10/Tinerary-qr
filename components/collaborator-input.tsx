"use client"

import { useState } from "react"
import { Check, Plus, X } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function CollaboratorInput() {
  const [email, setEmail] = useState("")
  const [collaborators, setCollaborators] = useState([
    { email: "alex@example.com", name: "Alex Rodriguez", status: "accepted", role: "editor" },
    { email: "taylor@example.com", name: "Taylor Moore", status: "pending", role: "viewer" },
  ])

  const addCollaborator = () => {
    if (email && !collaborators.some((c) => c.email === email)) {
      // In a real app, this would send an invitation
      setCollaborators([
        ...collaborators,
        {
          email,
          name: email.split("@")[0],
          status: "pending",
          role: "viewer",
        },
      ])
      setEmail("")
    }
  }

  const removeCollaborator = (emailToRemove: string) => {
    setCollaborators(collaborators.filter((c) => c.email !== emailToRemove))
  }

  return (
    <Tabs defaultValue="collaborators">
      <TabsList className="w-full grid grid-cols-2">
        <TabsTrigger value="collaborators">Collaborators</TabsTrigger>
        <TabsTrigger value="guests">Guests</TabsTrigger>
      </TabsList>

      <TabsContent value="collaborators" className="space-y-4 mt-4">
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
          <p className="text-sm text-amber-800">
            <strong>Collaborators</strong> can edit the itinerary, add activities, and invite others.
          </p>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="email" className="sr-only">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="friend@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button type="button" onClick={addCollaborator} disabled={!email}>
            <Plus className="h-4 w-4 mr-2" />
            Invite
          </Button>
        </div>

        <div className="space-y-2">
          <Label>Invited Collaborators</Label>
          <div className="space-y-2">
            {collaborators.length === 0 ? (
              <p className="text-sm text-muted-foreground">No collaborators yet</p>
            ) : (
              collaborators.map((collaborator) => (
                <div key={collaborator.email} className="flex items-center justify-between p-2 border rounded-md">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-r from-violet-500 via-pink-500 to-orange-400 text-white text-xs">
                        {collaborator.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{collaborator.name}</p>
                      <p className="text-xs text-muted-foreground">{collaborator.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select className="text-xs border rounded px-2 py-1" defaultValue={collaborator.role}>
                      <option value="editor">Can edit</option>
                      <option value="viewer">Can view</option>
                    </select>
                    {collaborator.status === "pending" ? (
                      <Badge variant="outline" className="text-amber-500 border-amber-200 bg-amber-50">
                        Pending
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-emerald-500 border-emerald-200 bg-emerald-50">
                        <Check className="mr-1 h-3 w-3" />
                        Joined
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeCollaborator(collaborator.email)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="guests" className="space-y-4 mt-4">
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-sm text-blue-800">
            <strong>Guests</strong> can view the itinerary and RSVP to activities, but cannot edit.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Guest List Type</Label>
            <RadioGroup defaultValue="private">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="private" id="private" />
                <Label htmlFor="private">Private (invite only)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="public" id="public" />
                <Label htmlFor="public">Public (anyone with the link)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="password" id="password" />
                <Label htmlFor="password">Password protected</Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>RSVP Settings</Label>
            <div className="space-y-2">
              <div className="flex items-center">
                <Label className="flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="h-4 w-4 rounded border border-primary mr-2 peer-checked:bg-primary peer-checked:text-primary-foreground" />
                  <span>Allow guests to RSVP to individual activities</span>
                </Label>
              </div>
              <div className="flex items-center">
                <Label className="flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="h-4 w-4 rounded border border-primary mr-2 peer-checked:bg-primary peer-checked:text-primary-foreground" />
                  <span>Show guest list to all attendees</span>
                </Label>
              </div>
              <div className="flex items-center">
                <Label className="flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="h-4 w-4 rounded border border-primary mr-2 peer-checked:bg-primary peer-checked:text-primary-foreground" />
                  <span>Allow guests to invite others</span>
                </Label>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex gap-2">
            <div className="flex-1">
              <Input type="email" placeholder="friend@example.com" />
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Invite Guest
            </Button>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}
