import { createClient } from "@/lib/supabase/client"

export interface EventPhoto {
  id: string
  itinerary_id: string
  user_id: string
  storage_path: string
  url: string
  caption?: string
  width?: number
  height?: number
  file_size?: number
  mime_type?: string
  created_at: string
  updated_at: string
}

/**
 * Upload a photo to an event
 */
export async function uploadEventPhoto(
  itineraryId: string,
  userId: string,
  file: File,
  caption?: string
): Promise<{ success: boolean; photo?: EventPhoto; error?: string }> {
  try {
    const supabase = createClient()

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return { success: false, error: "File must be an image" }
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return { success: false, error: "File size must be less than 10MB" }
    }

    // Generate unique file name
    const fileExt = file.name.split(".").pop()
    const fileName = `${itineraryId}/${userId}-${Date.now()}.${fileExt}`

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("event-photos")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return { success: false, error: uploadError.message }
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("event-photos").getPublicUrl(fileName)

    // Get image dimensions
    const dimensions = await getImageDimensions(file)

    // Save photo metadata to database
    const { data: photoData, error: dbError } = await supabase
      .from("event_photos")
      .insert({
        itinerary_id: itineraryId,
        user_id: userId,
        storage_path: fileName,
        url: publicUrl,
        caption: caption || null,
        width: dimensions?.width,
        height: dimensions?.height,
        file_size: file.size,
        mime_type: file.type,
      })
      .select()
      .single()

    if (dbError) {
      // If database insert fails, try to delete the uploaded file
      await supabase.storage.from("event-photos").remove([fileName])
      return { success: false, error: dbError.message }
    }

    return { success: true, photo: photoData as EventPhoto }
  } catch (error: any) {
    console.error("Error uploading photo:", error)
    return { success: false, error: error.message || "Failed to upload photo" }
  }
}

/**
 * Get photos for an event
 */
export async function getEventPhotos(
  itineraryId: string
): Promise<{ success: boolean; photos?: EventPhoto[]; error?: string }> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("event_photos")
      .select("*")
      .eq("itinerary_id", itineraryId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return { success: true, photos: data as EventPhoto[] }
  } catch (error: any) {
    console.error("Error getting photos:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Delete a photo
 */
export async function deleteEventPhoto(
  photoId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    // Get photo data first
    const { data: photo, error: fetchError } = await supabase
      .from("event_photos")
      .select("storage_path")
      .eq("id", photoId)
      .single()

    if (fetchError) throw fetchError

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from("event-photos")
      .remove([photo.storage_path])

    if (storageError) {
      console.error("Storage delete error:", storageError)
      // Continue with database deletion even if storage delete fails
    }

    // Delete from database
    const { error: dbError } = await supabase.from("event_photos").delete().eq("id", photoId)

    if (dbError) throw dbError

    return { success: true }
  } catch (error: any) {
    console.error("Error deleting photo:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Update photo caption
 */
export async function updatePhotoCaption(
  photoId: string,
  caption: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from("event_photos")
      .update({ caption, updated_at: new Date().toISOString() })
      .eq("id", photoId)

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    console.error("Error updating caption:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Helper function to get image dimensions
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.width, height: img.height })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(null)
    }

    img.src = url
  })
}
