import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { FollowingListClient } from "@/components/following-list-client"

export default async function FollowingPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch profile by ID
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, name, username, avatar_url, following_count")
    .eq("id", userId)
    .single()

  if (error || !profile) {
    notFound()
  }

  // Check if viewing own profile
  const isOwnProfile = user && user.id === profile.id

  // Get following using the RPC function
  const { data: following, error: followingError } = await supabase.rpc("get_following", {
    p_user_id: userId,
    p_limit: 50,
    p_offset: 0,
  })

  if (followingError) {
    console.error("Error fetching following:", followingError)
  }

  return (
    <FollowingListClient
      profile={profile}
      following={following || []}
      isOwnProfile={isOwnProfile}
      currentUserId={user?.id || null}
    />
  )
}
