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

  // Check privacy settings
  let isProfileRestricted = false
  let profilePrivacy = "public"

  if (!isOwnProfile) {
    const { data: prefsData } = await supabase
      .from("user_preferences")
      .select("privacy_preferences")
      .eq("user_id", userId)
      .single()

    profilePrivacy = prefsData?.privacy_preferences?.profilePrivacy ?? "public"

    if (profilePrivacy === "private") {
      isProfileRestricted = true
    } else if (profilePrivacy === "followers" && user) {
      const { data: followData } = await supabase
        .from("user_follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", userId)
        .maybeSingle()
      isProfileRestricted = !followData
    } else if (profilePrivacy === "followers" && !user) {
      isProfileRestricted = true
    }
  }

  // Only fetch following if profile is not restricted
  let following: any[] = []
  if (!isProfileRestricted) {
    const { data: followingData, error: followingError } = await supabase.rpc("get_following", {
      p_user_id: userId,
      p_limit: 50,
      p_offset: 0,
    })

    if (followingError) {
      console.error("Error fetching following:", followingError)
    }
    following = followingData || []
  }

  return (
    <FollowingListClient
      profile={profile}
      following={following}
      isOwnProfile={isOwnProfile}
      currentUserId={user?.id || null}
      isProfileRestricted={isProfileRestricted}
      profilePrivacy={profilePrivacy}
    />
  )
}
