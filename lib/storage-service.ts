import { createClient } from "@/lib/supabase/client"

export interface UploadResult {
  success: boolean
  url?: string
  path?: string
  error?: string
}

/**
 * Upload an image to Supabase Storage
 * @param file - The file to upload
 * @param bucket - The storage bucket name
 * @param folder - Optional folder path within the bucket
 * @returns Upload result with public URL
 */
export async function uploadImage(
  file: File,
  bucket: "itinerary-images" | "user-avatars",
  folder?: string,
): Promise<UploadResult> {
  try {
    const supabase = createClient()

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return {
        success: false,
        error: "File must be an image",
      }
    }

    // Validate file size (5MB for itineraries, 2MB for avatars)
    const maxSize = bucket === "itinerary-images" ? 5 * 1024 * 1024 : 2 * 1024 * 1024
    if (file.size > maxSize) {
      return {
        success: false,
        error: `File size must be less than ${maxSize / (1024 * 1024)}MB`,
      }
    }

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return {
        success: false,
        error: "User not authenticated",
      }
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = folder ? `${user.id}/${folder}/${fileName}` : `${user.id}/${fileName}`

    // Upload file
    const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    })

    if (error) {
      console.error("Storage upload error:", error)
      return {
        success: false,
        error: error.message,
      }
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(data.path)

    return {
      success: true,
      url: publicUrl,
      path: data.path,
    }
  } catch (error: any) {
    console.error("Upload error:", error)
    return {
      success: false,
      error: error.message || "Failed to upload image",
    }
  }
}

/**
 * Delete an image from Supabase Storage
 * @param path - The storage path of the image
 * @param bucket - The storage bucket name
 */
export async function deleteImage(
  path: string,
  bucket: "itinerary-images" | "user-avatars",
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    const { error } = await supabase.storage.from(bucket).remove([path])

    if (error) {
      console.error("Storage delete error:", error)
      return {
        success: false,
        error: error.message,
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Delete error:", error)
    return {
      success: false,
      error: error.message || "Failed to delete image",
    }
  }
}

/**
 * Update an image (delete old and upload new)
 * @param file - The new file to upload
 * @param oldPath - The path of the old image to delete
 * @param bucket - The storage bucket name
 * @param folder - Optional folder path within the bucket
 */
export async function updateImage(
  file: File,
  oldPath: string | null,
  bucket: "itinerary-images" | "user-avatars",
  folder?: string,
): Promise<UploadResult> {
  try {
    // Delete old image if it exists
    if (oldPath) {
      await deleteImage(oldPath, bucket)
    }

    // Upload new image
    return await uploadImage(file, bucket, folder)
  } catch (error: any) {
    console.error("Update error:", error)
    return {
      success: false,
      error: error.message || "Failed to update image",
    }
  }
}

/**
 * Get public URL for an image
 * @param path - The storage path of the image
 * @param bucket - The storage bucket name
 */
export function getImageUrl(path: string, bucket: "itinerary-images" | "user-avatars"): string {
  const supabase = createClient()
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path)
  return publicUrl
}

/**
 * Convert base64 to File object
 * @param base64 - Base64 string
 * @param filename - Desired filename
 */
export function base64ToFile(base64: string, filename: string): File {
  const arr = base64.split(",")
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png"
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], filename, { type: mime })
}

/**
 * Compress an image file
 * @param file - The image file to compress
 * @param maxWidth - Maximum width in pixels (default 800)
 * @param maxHeight - Maximum height in pixels (default 800)
 * @param quality - Compression quality 0-1 (default 0.8)
 * @returns Compressed image file
 */
export async function compressImage(
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.8,
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement("canvas")
        let width = img.width
        let height = img.height

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = height * (maxWidth / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = width * (maxHeight / height)
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Could not get canvas context"))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Could not compress image"))
              return
            }
            const baseName = file.name.replace(/\.[^.]+$/, '') || 'image'
            const compressedFile = new File([blob], `${baseName}.jpg`, {
              type: "image/jpeg",
              lastModified: Date.now(),
            })
            resolve(compressedFile)
          },
          "image/jpeg",
          quality,
        )
      }
      img.onerror = () => {
        reject(new Error("Could not load image"))
      }
    }
    reader.onerror = () => {
      reject(new Error("Could not read file"))
    }
  })
}

/**
 * Check if storage buckets exist and are configured
 */
export async function checkStorageSetup(): Promise<{
  success: boolean
  buckets: string[]
  missing: string[]
  error?: string
}> {
  try {
    const supabase = createClient()

    const { data: buckets, error } = await supabase.storage.listBuckets()

    if (error) {
      return {
        success: false,
        buckets: [],
        missing: ["itinerary-images", "user-avatars"],
        error: error.message,
      }
    }

    const bucketNames = buckets?.map((b) => b.name) || []
    const requiredBuckets = ["itinerary-images", "user-avatars"]
    const missing = requiredBuckets.filter((b) => !bucketNames.includes(b))

    return {
      success: missing.length === 0,
      buckets: bucketNames.filter((b) => requiredBuckets.includes(b)),
      missing,
    }
  } catch (error: any) {
    return {
      success: false,
      buckets: [],
      missing: ["itinerary-images", "user-avatars"],
      error: error.message || "Failed to check storage setup",
    }
  }
}
