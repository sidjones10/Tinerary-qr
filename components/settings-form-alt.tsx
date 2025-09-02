"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase-client"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface SettingsFormProps {
  initialData: {
    name: string
    email: string
  }
  onSuccess?: () => void
}

export function SettingsFormAlt({ initialData, onSuccess }: SettingsFormProps) {
  const [name, setName] = useState(initialData.name)
  const [isLoading, setIsLoading] = useState(false)
  const { user, refreshSession } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!user) {
        throw new Error("User not authenticated")
      }

      // Update user metadata in auth.users table
      const { error: updateError } = await supabase.auth.updateUser({
        data: { name },
      })

      if (updateError) {
        throw updateError
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          name: name,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (profileError) {
        throw profileError
      }

      // Refresh the session to get updated user data
      await refreshSession()

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      })

      if (onSuccess) onSuccess()
    } catch (error: any) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: error.message || "There was a problem updating your profile",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <Link href="/app" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>Manage your personal information and public profile</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={initialData.email} disabled placeholder="Your email" />
            <p className="text-sm text-muted-foreground">Email cannot be changed</p>
          </div>
        </form>
      </CardContent>
      <CardFooter>
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
      </CardFooter>
    </Card>
  )
}
