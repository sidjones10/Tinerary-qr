import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

const ALLOWED_TYPES: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
}

const MAX_SIZE = 2 * 1024 * 1024 // 2 MB

/**
 * POST /api/profile/avatar
 * Handles the entire avatar flow server-side:
 *   1. Validates the file
 *   2. Deletes old avatar from storage (if provided)
 *   3. Uploads new avatar to storage
 *   4. Updates profiles table (avatar_url + avatar_path)
 *   5. Updates auth user metadata (avatar_url)
 *
 * Form data fields:
 *   file    – the image file (required)
 *   oldPath – storage path of old avatar to delete (optional)
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 },
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const oldPath = formData.get("oldPath") as string | null

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided" },
        { status: 400 },
      )
    }

    // ── Validate MIME type ──
    const mimeType = file.type
    if (!ALLOWED_TYPES[mimeType]) {
      return NextResponse.json(
        {
          success: false,
          message: `File type "${mimeType}" is not allowed. Accepted: ${Object.keys(ALLOWED_TYPES).join(", ")}`,
        },
        { status: 400 },
      )
    }

    // ── Validate extension matches MIME ──
    const fileName = file.name.toLowerCase()
    const allowedExtensions = ALLOWED_TYPES[mimeType]
    if (!allowedExtensions.some((ext) => fileName.endsWith(ext))) {
      return NextResponse.json(
        {
          success: false,
          message: `File extension does not match type "${mimeType}". Expected: ${allowedExtensions.join(", ")}`,
        },
        { status: 400 },
      )
    }

    // ── Validate file size ──
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, message: "File is too large. Maximum size: 2 MB" },
        { status: 400 },
      )
    }

    // ── Delete old avatar if provided ──
    if (oldPath) {
      await supabase.storage.from("user-avatars").remove([oldPath])
      // Ignore delete errors – old file may already be gone
    }

    // ── Upload new avatar ──
    const ext = allowedExtensions[0]
    const timestamp = Date.now()
    const filePath = `${user.id}/${timestamp}${ext}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("user-avatars")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: mimeType,
      })

    if (uploadError) {
      return NextResponse.json(
        { success: false, message: `Storage upload failed: ${uploadError.message}` },
        { status: 500 },
      )
    }

    // ── Get public URL ──
    const {
      data: { publicUrl },
    } = supabase.storage.from("user-avatars").getPublicUrl(uploadData.path)

    // ── Update profiles table ──
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        avatar_url: publicUrl,
        avatar_path: uploadData.path,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (profileError) {
      return NextResponse.json(
        { success: false, message: `Profile update failed: ${profileError.message}` },
        { status: 500 },
      )
    }

    // ── Update auth user metadata ──
    await supabase.auth.updateUser({
      data: { avatar_url: publicUrl },
    })

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: uploadData.path,
    })
  } catch (error) {
    console.error("Avatar upload error:", error)
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred" },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/profile/avatar
 * Removes the avatar from storage, profiles table, and auth metadata.
 *
 * Body JSON: { path: string }
 */
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 },
      )
    }

    const body = await request.json()
    const path = body?.path as string | null

    // ── Delete from storage ──
    if (path) {
      await supabase.storage.from("user-avatars").remove([path])
    }

    // ── Clear in profiles table ──
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        avatar_url: null,
        avatar_path: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (profileError) {
      return NextResponse.json(
        { success: false, message: `Profile update failed: ${profileError.message}` },
        { status: 500 },
      )
    }

    // ── Clear auth metadata ──
    await supabase.auth.updateUser({
      data: { avatar_url: null },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Avatar delete error:", error)
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
