"use client"

import { useState } from "react"
import { X, Camera, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { uploadImage, compressImage } from "@/lib/storage-service"

interface PostEventCoverPromptProps {
  itineraryId: string
  itineraryTitle: string
  eventType: "event" | "trip"
  currentCover?: string
  onCoverUpdated?: (newCoverUrl: string) => void
  onDismiss?: () => void
}

export function PostEventCoverPrompt({
  itineraryId,
  itineraryTitle,
  eventType,
  currentCover,
  onCoverUpdated,
  onDismiss,
}: PostEventCoverPromptProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const handleDismiss = async () => {
    setIsOpen(false)

    // Mark as dismissed so it doesn't show again
    const supabase = createClient()
    await supabase
      .from("itineraries")
      .update({ cover_update_prompted: true })
      .eq("id", itineraryId)

    onDismiss?.()
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      // Compress image
      const compressedFile = await compressImage(file, 1200, 800, 0.85)

      // Upload to Supabase Storage
      const result = await uploadImage(compressedFile, "itinerary-images", "covers")

      if (!result.success || !result.url) {
        throw new Error(result.error || "Failed to upload image")
      }

      // Update the itinerary cover
      const supabase = createClient()
      const { error } = await supabase
        .from("itineraries")
        .update({
          image_url: result.url,
          cover_update_prompted: true,
        })
        .eq("id", itineraryId)

      if (error) throw error

      toast({
        title: "Cover updated!",
        description: `Your ${eventType} cover has been updated with a memory from the ${eventType}.`,
      })

      onCoverUpdated?.(result.url)
      setIsOpen(false)
    } catch (error: any) {
      console.error("Error uploading cover:", error)
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-purple-500" />
            Update your cover photo?
          </DialogTitle>
          <DialogDescription>
            Your {eventType} &quot;{itineraryTitle}&quot; has ended! Would you like to update the cover with a photo from the {eventType}?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {currentCover && (
            <div className="relative rounded-lg overflow-hidden">
              <img
                src={currentCover}
                alt="Current cover"
                className="w-full h-32 object-cover opacity-50"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm text-gray-600 bg-white/80 dark:bg-card/80 px-3 py-1 rounded-full">
                  Current cover
                </span>
              </div>
            </div>
          )}

          <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-purple-300 transition-colors">
            <input
              type="file"
              id="cover-update"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
              disabled={isUploading}
            />
            <label htmlFor="cover-update" className="cursor-pointer">
              <div className="mx-auto w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-3">
                {isUploading ? (
                  <div className="animate-spin h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-purple-500" />
                )}
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">
                {isUploading ? "Uploading..." : "Click to upload a new cover"}
              </p>
              <p className="text-xs text-muted-foreground">
                Choose a favorite photo from your {eventType}
              </p>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleDismiss} disabled={isUploading}>
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
