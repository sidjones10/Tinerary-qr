import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { UserProfileClient } from "@/components/user-profile-client"

export default async function UserProfilePage({ params }: { params: { username: string } }) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch profile by username
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", params.username)
    .single()

  if (error || !profile) {
    notFound()
  }

  // Check if viewing own profile
  const isOwnProfile = user && user.id === profile.id

  // If it's own profile, redirect to /profile
  if (isOwnProfile) {
    redirect("/profile")
  }

  // Check privacy settings
  if (profile.is_private && !isOwnProfile && user) {
    // Check if current user follows this profile
    const { data: followData } = await supabase
      .from("user_follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", profile.id)
      .single()

    // If profile is private and user doesn't follow them, show limited view
    if (!followData) {
      return (
        <UserProfileClient
          profile={profile}
          isOwnProfile={false}
          currentUserId={user.id}
          isPrivate={true}
          isFollowing={false}
          itineraries={[]}
        />
      )
    }
  }

  // Fetch user's public itineraries (or all if following/own profile)
  const canViewAll = isOwnProfile || !profile.is_private || user

  let itinerariesQuery = supabase
    .from("itineraries")
    .select(`
      *,
      itinerary_metrics(*),
      itinerary_categories(category)
    `)
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })

  if (!canViewAll) {
    itinerariesQuery = itinerariesQuery.eq("is_public", true)
  }

  const { data: itineraries } = await itinerariesQuery

  // Check if current user is following this profile
  let isFollowing = false
  if (user && !isOwnProfile) {
    const { data: followData } = await supabase
      .from("user_follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", profile.id)
      .single()

    isFollowing = !!followData
  }

  return (
    <UserProfileClient
      profile={profile}
      isOwnProfile={isOwnProfile}
      currentUserId={user?.id || null}
      isPrivate={profile.is_private}
      isFollowing={isFollowing}
      itineraries={itineraries || []}
    />
  )
}
