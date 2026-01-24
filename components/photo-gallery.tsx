"use client"

import { useState, useRef } from "react"
import { Plus, X, Image as ImageIcon, Upload, Trash2, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { uploadEventPhoto, deleteEventPhoto, updatePhotoCaption, type EventPhoto } from "@/lib/photo-service"
import { useAuth } from "@/providers/auth-provider"

interface PhotoGalleryProps {
  itineraryId: string
  photos: EventPhoto[]
  isOwner: boolean
  onPhotosChange?: () => void
}

export function PhotoGallery({ itineraryId, photos: initialPhotos, isOwner, onPhotosChange }: PhotoGalleryProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [photos, setPhotos] = useState(initialPhotos)
  const [uploading, setUploading] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<EventPhoto | null>(null)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [editingCaption, setEditingCaption] = useState(false)
  const [captionText, setCaptionText] = useState("")

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !user?.id) return

    setUploading(true)

    try {
      // Upload all selected files
      const uploadPromises = Array.from(files).map((file) => uploadEventPhoto(itineraryId, user.id, file))

      const results = await Promise.all(uploadPromises)

      // Check for errors
      const errors = results.filter((r) => !r.success)
      if (errors.length > 0) {
        toast({
          title: "Upload errors",
          description: `${errors.length} photo(s) failed to upload`,
          variant: "destructive",
        })
      }

      // Update photos list with successful uploads
      const newPhotos = results.filter((r) => r.success && r.photo).map((r) => r.photo!)
      setPhotos([...newPhotos, ...photos])

      const successCount = newPhotos.length
      if (successCount > 0) {
        toast({
          title: "Success!",
          description: `${successCount} photo(s) uploaded successfully`,
        })
        onPhotosChange?.()
      }
    } catch (error: any) {
      console.error("Upload error:", error)
      toast({
        title: "Error",
        description: "Failed to upload photos",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm("Are you sure you want to delete this photo?")) return

    const result = await deleteEventPhoto(photoId)

    if (result.success) {
      setPhotos(photos.filter((p) => p.id !== photoId))
      setIsLightboxOpen(false)
      setSelectedPhoto(null)
      toast({
        title: "Deleted",
        description: "Photo deleted successfully",
      })
      onPhotosChange?.()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete photo",
        variant: "destructive",
      })
    }
  }

  const handleUpdateCaption = async () => {
    if (!selectedPhoto) return

    const result = await updatePhotoCaption(selectedPhoto.id, captionText)

    if (result.success) {
      // Update local state
      setPhotos(
        photos.map((p) => (p.id === selectedPhoto.id ? { ...p, caption: captionText } : p))
      )
      setSelectedPhoto({ ...selectedPhoto, caption: captionText })
      setEditingCaption(false)
      toast({
        title: "Updated",
        description: "Caption updated successfully",
      })
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update caption",
        variant: "destructive",
      })
    }
  }

  const openLightbox = (photo: EventPhoto) => {
    setSelectedPhoto(photo)
    setCaptionText(photo.caption || "")
    setIsLightboxOpen(true)
    setEditingCaption(false)
  }

  if (photos.length === 0 && !isOwner) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No photos yet</h3>
          <p className="text-muted-foreground">Photos will appear here when they're added</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardContent className="p-6">
          {isOwner && (
            <div className="mb-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                onClick={handleUploadClick}
                disabled={uploading}
                className="w-full sm:w-auto"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Uploading..." : "Upload Photos"}
              </Button>
            </div>
          )}

          {photos.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No photos yet</h3>
              <p className="text-muted-foreground mb-4">Upload your first photo to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                  onClick={() => openLightbox(photo)}
                >
                  <img
                    src={photo.url}
                    alt={photo.caption || "Event photo"}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity" />
                  {photo.caption && (
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                      <p className="text-white text-sm line-clamp-1">{photo.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lightbox */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
          {selectedPhoto && (
            <>
              <div className="relative">
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.caption || "Event photo"}
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                  onClick={() => setIsLightboxOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="p-6">
                {editingCaption ? (
                  <div className="space-y-3">
                    <Label htmlFor="caption">Caption</Label>
                    <Input
                      id="caption"
                      value={captionText}
                      onChange={(e) => setCaptionText(e.target.value)}
                      placeholder="Add a caption..."
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleUpdateCaption} size="sm">
                        Save
                      </Button>
                      <Button onClick={() => setEditingCaption(false)} variant="outline" size="sm">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {selectedPhoto.caption ? (
                      <p className="text-gray-700 mb-2">{selectedPhoto.caption}</p>
                    ) : (
                      <p className="text-muted-foreground italic mb-2">No caption</p>
                    )}
                    {isOwner && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setEditingCaption(true)}
                          variant="outline"
                          size="sm"
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Edit Caption
                        </Button>
                        <Button
                          onClick={() => handleDeletePhoto(selectedPhoto.id)}
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
