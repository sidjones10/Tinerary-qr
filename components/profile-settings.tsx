"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Pencil, ArrowLeft, Upload, Download } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { compressImage } from "@/lib/storage-service"
import Link from "next/link"
import { DeleteAccountDialog } from "@/components/delete-account-dialog"
import { Separator } from "@/components/ui/separator"

export function ProfileSettings() {
  const { user, refreshSession } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarPath, setAvatarPath] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [downloadingData, setDownloadingData] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        setIsLoading(true)
        try {
          const supabase = createClient()
          const { data, error } = await supabase
            .from("profiles")
            .select("name, username, bio, location, website, phone, avatar_url, avatar_path")
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
            console.log("Profile data loaded:", data)
            console.log("Avatar URL from DB:", data.avatar_url)
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
            setAvatarUrl(data.avatar_url || null)
            setAvatarPath(data.avatar_path || null)
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
      const supabase = createClient()
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

  const handleChangePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setUploadingAvatar(true)
    try {
      // Compress the image client-side before sending
      const compressedFile = await compressImage(file, 400, 400, 0.85)

      // Send to dedicated avatar endpoint that handles everything server-side:
      // upload to storage, update profiles table, update auth metadata
      const formData = new FormData()
      formData.append("file", compressedFile)
      if (avatarPath) {
        formData.append("oldPath", avatarPath)
      }

      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.message || `Upload failed with status ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || "Failed to upload image")
      }

      setAvatarUrl(result.url)
      setAvatarPath(result.path)

      toast({
        title: "Photo updated",
        description: "Your profile photo has been updated successfully.",
      })

      await refreshSession()
    } catch (error: any) {
      console.error("Error updating photo:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update profile photo.",
        variant: "destructive",
      })
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemovePhoto = async () => {
    if (!user) return

    setUploadingAvatar(true)
    try {
      // Use dedicated avatar endpoint to handle everything server-side
      const response = await fetch("/api/profile/avatar", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: avatarPath }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.message || `Delete failed with status ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || "Failed to remove photo")
      }

      setAvatarUrl(null)
      setAvatarPath(null)

      toast({
        title: "Photo removed",
        description: "Your profile photo has been removed.",
      })

      await refreshSession()
    } catch (error: any) {
      console.error("Error removing photo:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to remove profile photo.",
        variant: "destructive",
      })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleDownloadData = async () => {
    if (!user) return

    setDownloadingData(true)
    try {
      // Call the export API endpoint
      const response = await fetch("/api/user/export-data", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to download data")
      }

      // Get the blob data
      const blob = await response.blob()

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const timestamp = new Date().toISOString().split("T")[0]
      a.download = `tinerary-data-export-${timestamp}.json`
      document.body.appendChild(a)
      a.click()

      // Cleanup
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Data exported",
        description: "Your data has been downloaded successfully.",
      })
    } catch (error: any) {
      console.error("Error downloading data:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to download data.",
        variant: "destructive",
      })
    } finally {
      setDownloadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!user) {
        throw new Error("User not authenticated")
      }

      const supabase = createClient()

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
                  {avatarUrl ? (
                    <img
                      key={avatarUrl}
                      src={avatarUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error("Failed to load avatar:", avatarUrl)
                        // Hide broken image and show fallback
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="text-muted-foreground">
                      <Pencil size={20} />
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleChangePhoto}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Change
                      </>
                    )}
                  </Button>
                  {avatarUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-600"
                      onClick={handleRemovePhoto}
                      disabled={uploadingAvatar}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Recommended: Square image, at least 400x400px. Max 2MB.
              </p>
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

        <Separator className="my-6" />

        {/* Data & Privacy Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Data & Privacy</h3>
            <p className="text-sm text-muted-foreground">
              Manage your data and account privacy settings
            </p>
          </div>

          <div className="space-y-3">
            {/* Download My Data */}
            <div className="flex items-start justify-between p-4 border rounded-lg">
              <div className="space-y-1 flex-1">
                <h4 className="font-medium">Download Your Data</h4>
                <p className="text-sm text-muted-foreground">
                  Export all your data including itineraries, comments, and profile information in JSON format.
                  This complies with GDPR data portability requirements.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleDownloadData}
                disabled={downloadingData}
                className="ml-4 shrink-0"
              >
                {downloadingData ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download Data
                  </>
                )}
              </Button>
            </div>

            {/* Delete Account */}
            <div className="flex items-start justify-between p-4 border border-red-200 rounded-lg bg-red-50/50">
              <div className="space-y-1 flex-1">
                <h4 className="font-medium text-red-900">Delete Account</h4>
                <p className="text-sm text-red-700">
                  Permanently delete your account and all associated data. This action cannot be undone,
                  but you have 30 days to cancel. You'll receive a warning email 7 days before deletion.
                </p>
              </div>
              <div className="ml-4 shrink-0">
                {user && <DeleteAccountDialog userId={user.id} userEmail={user.email} />}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
