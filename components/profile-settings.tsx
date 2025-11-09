"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Pencil, ArrowLeft } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase-client"
import Link from "next/link"

export function ProfileSettings() {
  const { user, refreshSession } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    fullName: user?.user_metadata?.name || "",
    username: user?.user_metadata?.username || "",
    email: user?.email || "",
    phone: user?.phone || "",
    bio: user?.user_metadata?.bio || "",
    location: user?.user_metadata?.location || "",
    website: user?.user_metadata?.website || "",
  })
  const [originalUsername, setOriginalUsername] = useState("")
  const [checkingUsername, setCheckingUsername] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        setIsLoading(true)
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("name, username, bio, location, website, phone")
            .eq("id", user.id)
            .single()

          if (error) {
            console.error("Error fetching profile:", error)
            toast({
              title: "Error",
              description: "Failed to load profile data.",
              variant: "destructive",
            })
          } else if (data) {
            setFormData({
              fullName: data.name || "",
              username: data.username || "",
              email: user.email || "",
              phone: data.phone || user.phone || "",
              bio: data.bio || "",
              location: data.location || "",
              website: data.website || "",
            })
            setOriginalUsername(data.username || "")
          }
        } finally {
          setIsLoading(false)
        }
      }
    }

    fetchProfile()
  }, [user, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const checkUsernameAvailability = async (username: string) => {
    if (!username || username === originalUsername) {
      return true
    }

    setCheckingUsername(true)
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .single()

      if (error && error.code === "PGRST116") {
        // No rows returned, username is available
        return true
      }

      if (data) {
        toast({
          title: "Username taken",
          description: "This username is already in use. Please choose another.",
          variant: "destructive",
        })
        return false
      }

      return true
    } catch (error) {
      console.error("Error checking username:", error)
      return true // Allow proceed on error
    } finally {
      setCheckingUsername(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!user) {
        throw new Error("User not authenticated")
      }

      // Check username availability if it changed
      if (formData.username && formData.username !== originalUsername) {
        const isAvailable = await checkUsernameAvailability(formData.username)
        if (!isAvailable) {
          setIsLoading(false)
          return
        }
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (formData.email && !emailRegex.test(formData.email)) {
        throw new Error("Please enter a valid email address")
      }

      // Update email if changed
      if (formData.email && formData.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email,
        })

        if (emailError) {
          throw new Error(`Email update failed: ${emailError.message}`)
        }

        toast({
          title: "Email update initiated",
          description: "Please check your email to confirm the change.",
        })
      }

      // Update phone if changed
      if (formData.phone && formData.phone !== user.phone) {
        const { error: phoneError } = await supabase.auth.updateUser({
          phone: formData.phone,
        })

        if (phoneError) {
          console.error("Phone update error:", phoneError)
          // Don't fail the whole operation if phone update fails
        }
      }

      // Update user metadata in auth.users table
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          name: formData.fullName,
          username: formData.username,
          website: formData.website,
        },
      })

      if (authError) {
        throw authError
      }

      // Update user profile in the profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          name: formData.fullName,
          username: formData.username,
          bio: formData.bio,
          location: formData.location,
          website: formData.website,
          phone: formData.phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (profileError) {
        throw profileError
      }

      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      })

      setOriginalUsername(formData.username)
      await refreshSession()
    } catch (error: any) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: error.message || "There was a problem updating your profile.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>Manage your personal information and public profile</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="space-y-2 flex-1">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Jessica Chen"
                />
              </div>

              <div className="space-y-2 flex-1">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="jesschan"
                  disabled={checkingUsername}
                />
                <p className="text-xs text-muted-foreground">
                  Your username is visible to others. Choose wisely!
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="space-y-2 flex-1">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="jessica@example.com"
                />
                <p className="text-xs text-muted-foreground">
                  Email changes require verification
                </p>
              </div>

              <div className="space-y-2 flex-1">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                name="website"
                type="url"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://yourwebsite.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Travel enthusiast and foodie. Always planning my next adventure!"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Los Angeles, CA"
              />
            </div>

            <div className="space-y-2">
              <Label>Profile Photo</Label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {user?.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url || "/placeholder.svg"}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-muted-foreground">
                      <Pencil size={20} />
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm">
                    Change
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="text-red-500">
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
