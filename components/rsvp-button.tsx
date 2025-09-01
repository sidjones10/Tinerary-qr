"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase-client"
import { useToast } from "@/components/ui/use-toast"

interface RsvpButtonProps {
  activityId: number
  itineraryId: string
  onRsvp?: () => void
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function RsvpButton({
  activityId,
  itineraryId,
  onRsvp,
  variant = "outline",
  size = "sm",
  className = "",
}: RsvpButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleRsvp = async () => {
    setIsLoading(true)

    try {
      // Check if user is authenticated
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        // Redirect to login page with return URL
        router.push(`/login?message=You must be logged in to RSVP&redirect=/itinerary/${itineraryId}`)
        return
      }

      // If authenticated, proceed with RSVP
      // In a real app, you would save the RSVP to the database here

      toast({
        title: "RSVP Successful",
        description: "Your RSVP has been recorded.",
      })

      if (onRsvp) {
        onRsvp()
      }
    } catch (error) {
      console.error("Error RSVPing:", error)
      toast({
        title: "Error",
        description: "There was a problem recording your RSVP",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button variant={variant} size={size} className={className} onClick={handleRsvp} disabled={isLoading}>
      {isLoading ? "Processing..." : "RSVP"}
    </Button>
  )
}
