import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { FollowersListClient } from "@/components/followers-list-client"

export default async function FollowersPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch profile by ID
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, name, username, avatar_url, followers_count")
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
    const { data: privacyData } = await supabase.rpc("get_profile_privacy", {
      target_user_id: userId,
    })

    profilePrivacy = privacyData ?? "public"

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

  // Only fetch followers if profile is not restricted
  let followers: any[] = []
  if (!isProfileRestricted) {
    const { data: followersData, error: followersError } = await supabase.rpc("get_followers", {
      p_user_id: userId,
      p_limit: 50,
      p_offset: 0,
    })

    if (followersError) {
      console.error("Error fetching followers:", followersError)
    }
    followers = followersData || []
  }

  return (
    <FollowersListClient
      profile={profile}
      followers={followers}
      isOwnProfile={isOwnProfile}
      currentUserId={user?.id || null}
      isProfileRestricted={isProfileRestricted}
      profilePrivacy={profilePrivacy}
    />
  )
}
