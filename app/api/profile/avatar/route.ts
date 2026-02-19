import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

const ALLOWED_TYPES: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
}

const MAX_SIZE = 2 * 1024 * 1024 // 2 MB

/**
 * Creates an admin Supabase client using the service role key.
 * Bypasses RLS – only use after verifying the user's identity.
 */
function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

/**
 * POST /api/profile/avatar
 * Handles the entire avatar flow server-side:
 *   1. Authenticates via cookie-based client
 *   2. Validates the file
 *   3. Deletes old avatar from storage
 *   4. Uploads new avatar to storage
 *   5. Updates profiles table (avatar_url)
 *   6. Updates auth user metadata (avatar_url)
 *
 * Form data fields:
 *   file – the image file (required)
 */
export async function POST(request: Request) {
  try {
    // Authenticate the user via cookie-based client
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

    // Convert File to Buffer for Node.js compatibility with Supabase SDK
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    // Use admin client (service role) for storage + DB operations
    // This bypasses RLS – safe because we already verified the user above
    const admin = createAdminClient()

    // ── Delete old avatar from storage ──
    // Look up current avatar_path from profiles
    const { data: currentProfile } = await admin
      .from("profiles")
      .select("avatar_path")
      .eq("id", user.id)
      .single()

    if (currentProfile?.avatar_path && currentProfile.avatar_path.startsWith(`${user.id}/`)) {
      await admin.storage.from("user-avatars").remove([currentProfile.avatar_path])
      // Ignore delete errors – old file may already be gone
    }

    // ── Upload new avatar ──
    const ext = allowedExtensions[0]
    const timestamp = Date.now()
    const filePath = `${user.id}/${timestamp}${ext}`

    const { data: uploadData, error: uploadError } = await admin.storage
      .from("user-avatars")
      .upload(filePath, fileBuffer, {
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
    } = admin.storage.from("user-avatars").getPublicUrl(uploadData.path)

    // ── Update profiles table ──
    const { error: profileError } = await admin
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
    const { error: authError } = await admin.auth.admin.updateUserById(user.id, {
      user_metadata: { avatar_url: publicUrl },
    })

    if (authError) {
      // Non-fatal: storage + profile already updated, just log
      console.error("Auth metadata update failed:", authError.message)
    }

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
 * No body required – avatar_path is looked up from the profiles table.
 */
export async function DELETE(request: Request) {
  try {
    // Authenticate the user via cookie-based client
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

    // Use admin client for storage + DB operations
    const admin = createAdminClient()

    // ── Look up current avatar_path and delete from storage ──
    const { data: currentProfile } = await admin
      .from("profiles")
      .select("avatar_path")
      .eq("id", user.id)
      .single()

    if (currentProfile?.avatar_path && currentProfile.avatar_path.startsWith(`${user.id}/`)) {
      await admin.storage.from("user-avatars").remove([currentProfile.avatar_path])
    }

    // ── Clear in profiles table ──
    const { error: profileError } = await admin
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
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: { avatar_url: null },
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
