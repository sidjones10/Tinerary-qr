import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

/** Allowed MIME types and their extensions */
const ALLOWED_TYPES: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
}

/** Size limits per bucket (bytes) */
const SIZE_LIMITS: Record<string, number> = {
  "user-avatars": 2 * 1024 * 1024,       // 2 MB
  "itinerary-images": 5 * 1024 * 1024,    // 5 MB
  "event-photos": 10 * 1024 * 1024,       // 10 MB
}

const DEFAULT_SIZE_LIMIT = 5 * 1024 * 1024 // 5 MB

/**
 * POST /api/upload
 * Validates and uploads a file to Supabase Storage.
 *
 * Form data fields:
 *   file   – the file to upload (required)
 *   bucket – target storage bucket (required)
 *   path   – storage path / filename (optional, auto-generated if missing)
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 },
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const bucket = formData.get("bucket") as string | null
    const customPath = formData.get("path") as string | null

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided" },
        { status: 400 },
      )
    }

    if (!bucket) {
      return NextResponse.json(
        { success: false, message: "Bucket name is required" },
        { status: 400 },
      )
    }

    // ── Validate MIME type (check actual content-type header) ──
    const mimeType = file.type
    if (!ALLOWED_TYPES[mimeType]) {
      return NextResponse.json(
        {
          success: false,
          message: `File type "${mimeType}" is not allowed. Accepted types: ${Object.keys(ALLOWED_TYPES).join(", ")}`,
        },
        { status: 400 },
      )
    }

    // ── Validate file extension matches MIME type ──
    const fileName = file.name.toLowerCase()
    const allowedExtensions = ALLOWED_TYPES[mimeType]
    const hasValidExtension = allowedExtensions.some((ext) => fileName.endsWith(ext))
    if (!hasValidExtension) {
      return NextResponse.json(
        {
          success: false,
          message: `File extension does not match MIME type "${mimeType}". Expected: ${allowedExtensions.join(", ")}`,
        },
        { status: 400 },
      )
    }

    // ── Validate file size ──
    const maxSize = SIZE_LIMITS[bucket] ?? DEFAULT_SIZE_LIMIT
    if (file.size > maxSize) {
      const maxMB = (maxSize / (1024 * 1024)).toFixed(0)
      return NextResponse.json(
        { success: false, message: `File is too large. Maximum size for ${bucket}: ${maxMB} MB` },
        { status: 400 },
      )
    }

    // ── Validate magic bytes (first few bytes of the file) ──
    const buffer = Buffer.from(await file.slice(0, 12).arrayBuffer())
    if (!isValidImageMagicBytes(buffer, mimeType)) {
      return NextResponse.json(
        { success: false, message: "File content does not match its declared type" },
        { status: 400 },
      )
    }

    // ── Generate safe file path ──
    const ext = allowedExtensions[0]
    const timestamp = Date.now()
    const safeName = `${user.id}-${timestamp}${ext}`
    const filePath = customPath || safeName

    // ── Upload to Supabase Storage ──
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: mimeType,
      })

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 },
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    return NextResponse.json({
      success: true,
      path: data.path,
      publicUrl: urlData.publicUrl,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred during upload" },
      { status: 500 },
    )
  }
}

/**
 * Check file magic bytes to prevent disguised file uploads.
 */
function isValidImageMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 4) return false

  switch (mimeType) {
    case "image/jpeg":
      // JPEG: starts with FF D8 FF
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff

    case "image/png":
      // PNG: starts with 89 50 4E 47
      return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47

    case "image/gif":
      // GIF: starts with "GIF8"
      return buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38

    case "image/webp":
      // WebP: starts with "RIFF" ... "WEBP"
      if (buffer.length < 12) return false
      return (
        buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
        buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
      )

    default:
      return false
  }
}
