"use client"

import { useState } from "react"
import { X, Upload, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Photo {
  id: string
  url: string
  caption?: string
  day?: string
  location?: string
  uploadedBy?: string
}

export function TripPhotoGallery() {
  const [photos, setPhotos] = useState<Photo[]>([
    {
      id: "1",
      url: "/placeholder.svg?height=600&width=800",
      caption: "Sunset at the beach",
      day: "Day 1",
      location: "Malibu Beach",
      uploadedBy: "Alex",
    },
    {
      id: "2",
      url: "/placeholder.svg?height=800&width=600",
      caption: "Hiking in the mountains",
      day: "Day 2",
      location: "Runyon Canyon",
      uploadedBy: "Taylor",
    },
    {
      id: "3",
      url: "/placeholder.svg?height=600&width=800",
      caption: "Dinner at the restaurant",
      day: "Day 2",
      location: "Downtown LA",
      uploadedBy: "Jordan",
    },
    {
      id: "4",
      url: "/placeholder.svg?height=800&width=600",
      caption: "Museum visit",
      day: "Day 3",
      location: "LACMA",
      uploadedBy: "Casey",
    },
    {
      id: "5",
      url: "/placeholder.svg?height=600&width=800",
      caption: "Group photo",
      day: "Day 3",
      location: "Hollywood Sign",
      uploadedBy: "Alex",
    },
  ])

  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const openPhotoDialog = (photo: Photo) => {
    setSelectedPhoto(photo)
    setIsDialogOpen(true)
  }

  const closePhotoDialog = () => {
    setSelectedPhoto(null)
    setIsDialogOpen(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Trip Photos</h2>
        <Button className="btn-sunset">
          <Upload className="mr-2 h-4 w-4" />
          Upload Photos
        </Button>
      </div>

      <Tabs defaultValue="gallery">
        <TabsList className="grid w-full grid-cols-2 bg-white/70 backdrop-blur-sm">
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="gallery" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="relative aspect-square overflow-hidden rounded-md cursor-pointer group"
                onClick={() => openPhotoDialog(photo)}
              >
                <img
                  src={photo.url || "/placeholder.svg"}
                  alt={photo.caption || "Trip photo"}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                  {photo.caption && <p className="text-white text-sm font-medium truncate">{photo.caption}</p>}
                  {photo.location && <p className="text-white/80 text-xs truncate">{photo.location}</p>}
                </div>
              </div>
            ))}

            <div className="aspect-square rounded-md border-2 border-dashed flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-2">
                <Plus className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground text-center">Add more photos</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <ScrollArea className="h-[500px] pr-4">
            {Array.from(new Set(photos.map((p) => p.day))).map((day) => (
              <div key={day} className="mb-8">
                <h3 className="text-lg font-semibold mb-3">{day}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {photos
                    .filter((p) => p.day === day)
                    .map((photo) => (
                      <div
                        key={photo.id}
                        className="flex gap-4 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => openPhotoDialog(photo)}
                      >
                        <div className="h-20 w-20 rounded-md overflow-hidden flex-shrink-0">
                          <img
                            src={photo.url || "/placeholder.svg"}
                            alt={photo.caption || "Trip photo"}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          {photo.caption && <p className="font-medium">{photo.caption}</p>}
                          {photo.location && <p className="text-sm text-muted-foreground">{photo.location}</p>}
                          <p className="text-xs text-muted-foreground mt-1">Uploaded by {photo.uploadedBy}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedPhoto?.caption || "Trip Photo"}</DialogTitle>
            <DialogDescription>
              {selectedPhoto?.location && `${selectedPhoto.location} • `}
              {selectedPhoto?.day}
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <img
              src={selectedPhoto?.url || "/placeholder.svg"}
              alt={selectedPhoto?.caption || "Trip photo"}
              className="w-full rounded-md"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70"
              onClick={closePhotoDialog}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex justify-between">
            <p className="text-sm text-muted-foreground">Uploaded by {selectedPhoto?.uploadedBy}</p>
            <Button variant="outline" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
