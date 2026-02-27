import { createClient } from "@/lib/supabase/client"
import { BOOST_PACKAGES, AFFILIATE_COMMISSIONS, COIN_EARNING_ACTIONS } from "@/lib/tiers"

// ─── Types ────────────────────────────────────────────────────

export interface CreatorProfile {
  userId: string
  tier: "user" | "creator" | "business"
  isVerified: boolean
  coinMultiplier: number
  affiliateShare: number
  createdAt: string
}

export interface BoostCampaign {
  id: string
  itineraryId: string
  itineraryTitle: string
  packageName: string
  budget: number
  spent: number
  impressions: number
  clicks: number
  engagement: number
  status: "active" | "completed" | "paused"
  startDate: string
  endDate: string
  createdAt: string
}

export interface CreatorAnalytics {
  totalViews: number
  totalLikes: number
  totalSaves: number
  totalShares: number
  totalFollowers: number
  followersGrowth: number
  topItineraries: {
    id: string
    title: string
    views: number
    likes: number
    saves: number
  }[]
  viewsByDay: { date: string; views: number }[]
  audienceLocations: { location: string; count: number }[]
  engagementRate: number
  avgTimeOnContent: number
}

export interface ItineraryTemplate {
  id: string
  creatorId: string
  creatorName: string
  title: string
  description: string
  location: string
  duration: number
  price: number
  coverImage: string | null
  category: string
  salesCount: number
  rating: number
  reviewCount: number
  status: "active" | "draft" | "archived"
  createdAt: string
}

export interface SponsorshipMessage {
  id: string
  brandName: string
  brandLogo: string | null
  subject: string
  message: string
  budget: string
  status: "new" | "read" | "replied" | "accepted" | "declined"
  createdAt: string
  campaignType: string
}

// ─── Creator Tier Check ──────────────────────────────────────

export async function getCreatorProfile(userId: string): Promise<CreatorProfile | null> {
  try {
    const supabase = createClient()
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, tier, is_verified, created_at")
      .eq("id", userId)
      .single()

    if (!profile) return null

    const tier = profile.tier || "user"
    const isCreator = tier === "creator" || tier === "business"

    return {
      userId: profile.id,
      tier,
      isVerified: isCreator || profile.is_verified || false,
      coinMultiplier: isCreator ? 2 : 1,
      affiliateShare: isCreator ? 70 : 60,
      createdAt: profile.created_at,
    }
  } catch (error) {
    console.error("Error fetching creator profile:", error)
    return null
  }
}

export function isCreatorTier(tier: string | undefined | null): boolean {
  return tier === "creator" || tier === "business"
}

// ─── Post Boost ──────────────────────────────────────────────

export async function getBoostCampaigns(userId: string): Promise<BoostCampaign[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("boost_campaigns")
      .select("*, itineraries(title)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return (data || []).map((campaign: any) => ({
      id: campaign.id,
      itineraryId: campaign.itinerary_id,
      itineraryTitle: campaign.itineraries?.title || "Untitled",
      packageName: campaign.package_name,
      budget: campaign.budget,
      spent: campaign.spent || 0,
      impressions: campaign.impressions || 0,
      clicks: campaign.clicks || 0,
      engagement: campaign.engagement_rate || 0,
      status: campaign.status,
      startDate: campaign.start_date,
      endDate: campaign.end_date,
      createdAt: campaign.created_at,
    }))
  } catch (error) {
    console.error("Error fetching boost campaigns:", error)
    return []
  }
}

export async function createBoostCampaign(
  userId: string,
  itineraryId: string,
  packageName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const pkg = BOOST_PACKAGES.find((p) => p.name === packageName)
    if (!pkg) return { success: false, error: "Invalid boost package" }

    const supabase = createClient()

    // Verify itinerary ownership
    const { data: itinerary } = await supabase
      .from("itineraries")
      .select("id, user_id")
      .eq("id", itineraryId)
      .eq("user_id", userId)
      .single()

    if (!itinerary) return { success: false, error: "Itinerary not found or not owned by you" }

    const durationDays = parseInt(pkg.duration) || 1
    const startDate = new Date()
    const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000)

    const { error } = await supabase.from("boost_campaigns").insert({
      user_id: userId,
      itinerary_id: itineraryId,
      package_name: packageName,
      budget: pkg.price,
      spent: 0,
      impressions: 0,
      clicks: 0,
      engagement_rate: 0,
      status: "active",
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
    })

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error("Error creating boost campaign:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create boost campaign",
    }
  }
}

// ─── Creator Analytics ───────────────────────────────────────

export async function getCreatorAnalytics(userId: string): Promise<CreatorAnalytics> {
  try {
    const supabase = createClient()

    // Fetch all user's public itineraries with their metrics
    const { data: itineraries } = await supabase
      .from("itineraries")
      .select("id, title, itinerary_metrics(*)")
      .eq("user_id", userId)
      .eq("is_public", true)

    const items = itineraries || []

    let totalViews = 0
    let totalLikes = 0
    let totalSaves = 0
    let totalShares = 0

    const topItineraries = items
      .map((it: any) => {
        const m = it.itinerary_metrics
        const views = m?.view_count || 0
        const likes = m?.like_count || 0
        const saves = m?.save_count || 0
        const shares = m?.share_count || 0
        totalViews += views
        totalLikes += likes
        totalSaves += saves
        totalShares += shares
        return { id: it.id, title: it.title, views, likes, saves }
      })
      .sort((a: any, b: any) => b.views - a.views)
      .slice(0, 10)

    // Fetch follower count
    const { count: followerCount } = await supabase
      .from("user_follows")
      .select("id", { count: "exact", head: true })
      .eq("following_id", userId)

    const totalFollowers = followerCount || 0

    // Calculate engagement rate
    const totalEngagements = totalLikes + totalSaves + totalShares
    const engagementRate = totalViews > 0 ? (totalEngagements / totalViews) * 100 : 0

    return {
      totalViews,
      totalLikes,
      totalSaves,
      totalShares,
      totalFollowers,
      followersGrowth: 0,
      topItineraries,
      viewsByDay: [],
      audienceLocations: [],
      engagementRate: Math.round(engagementRate * 10) / 10,
      avgTimeOnContent: 0,
    }
  } catch (error) {
    console.error("Error fetching creator analytics:", error)
    return {
      totalViews: 0,
      totalLikes: 0,
      totalSaves: 0,
      totalShares: 0,
      totalFollowers: 0,
      followersGrowth: 0,
      topItineraries: [],
      viewsByDay: [],
      audienceLocations: [],
      engagementRate: 0,
      avgTimeOnContent: 0,
    }
  }
}

// ─── Template Marketplace ────────────────────────────────────

export async function getCreatorTemplates(userId: string): Promise<ItineraryTemplate[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("itinerary_templates")
      .select("*, profiles:creator_id(name, username)")
      .eq("creator_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return (data || []).map((t: any) => ({
      id: t.id,
      creatorId: t.creator_id,
      creatorName: t.profiles?.name || t.profiles?.username || "Unknown",
      title: t.title,
      description: t.description || "",
      location: t.location || "",
      duration: t.duration || 0,
      price: t.price || 0,
      coverImage: t.cover_image,
      category: t.category || "General",
      salesCount: t.sales_count || 0,
      rating: t.rating || 0,
      reviewCount: t.review_count || 0,
      status: t.status || "draft",
      createdAt: t.created_at,
    }))
  } catch (error) {
    console.error("Error fetching templates:", error)
    return []
  }
}

export async function getMarketplaceTemplates(
  limit = 20,
  offset = 0
): Promise<ItineraryTemplate[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("itinerary_templates")
      .select("*, profiles:creator_id(name, username)")
      .eq("status", "active")
      .order("sales_count", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return (data || []).map((t: any) => ({
      id: t.id,
      creatorId: t.creator_id,
      creatorName: t.profiles?.name || t.profiles?.username || "Unknown",
      title: t.title,
      description: t.description || "",
      location: t.location || "",
      duration: t.duration || 0,
      price: t.price || 0,
      coverImage: t.cover_image,
      category: t.category || "General",
      salesCount: t.sales_count || 0,
      rating: t.rating || 0,
      reviewCount: t.review_count || 0,
      status: t.status || "active",
      createdAt: t.created_at,
    }))
  } catch (error) {
    console.error("Error fetching marketplace templates:", error)
    return []
  }
}

export async function createTemplate(
  userId: string,
  data: {
    title: string
    description: string
    location: string
    duration: number
    price: number
    category: string
    coverImage?: string
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()
    const { error } = await supabase.from("itinerary_templates").insert({
      creator_id: userId,
      title: data.title,
      description: data.description,
      location: data.location,
      duration: data.duration,
      price: data.price,
      category: data.category,
      cover_image: data.coverImage || null,
      status: "active",
      sales_count: 0,
      rating: 0,
      review_count: 0,
    })

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error("Error creating template:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create template",
    }
  }
}

// ─── Sponsorship Inbox ───────────────────────────────────────

export async function getSponsorshipMessages(userId: string): Promise<SponsorshipMessage[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("sponsorship_messages")
      .select("*")
      .eq("creator_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return (data || []).map((m: any) => ({
      id: m.id,
      brandName: m.brand_name,
      brandLogo: m.brand_logo,
      subject: m.subject,
      message: m.message,
      budget: m.budget || "Not specified",
      status: m.status || "new",
      createdAt: m.created_at,
      campaignType: m.campaign_type || "Collaboration",
    }))
  } catch (error) {
    console.error("Error fetching sponsorship messages:", error)
    return []
  }
}

export async function updateSponsorshipStatus(
  messageId: string,
  userId: string,
  status: SponsorshipMessage["status"]
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from("sponsorship_messages")
      .update({ status })
      .eq("id", messageId)
      .eq("creator_id", userId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error("Error updating sponsorship status:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update status",
    }
  }
}

// ─── 2x Coin Earning Rate ────────────────────────────────────

export function getAdjustedCoinReward(baseCoins: number, userTier: string): number {
  const multiplier = isCreatorTier(userTier) ? 2 : 1
  return baseCoins * multiplier
}

export function getCoinEarningActions(userTier: string) {
  const multiplier = isCreatorTier(userTier) ? 2 : 1
  return COIN_EARNING_ACTIONS.map((action) => ({
    ...action,
    coins: action.coins * multiplier,
    multiplied: multiplier > 1,
  }))
}

// ─── Enhanced Affiliate Commission (70/30) ───────────────────

export function getAffiliateCommission(userTier: string): {
  userShare: number
  platformShare: number
} {
  if (isCreatorTier(userTier)) {
    return { userShare: 70, platformShare: 30 }
  }
  return { userShare: 60, platformShare: 40 }
}

// ─── Business-Lite Listing Tools ─────────────────────────────

export async function getCreatorListings(userId: string) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("promotions")
      .select("*, promotion_metrics(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching creator listings:", error)
    return []
  }
}

export async function createCreatorListing(
  userId: string,
  listing: {
    title: string
    description: string
    category: string
    location: string
    price?: number
    discount?: number
    startDate: string
    endDate: string
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()
    const { error } = await supabase.from("promotions").insert({
      user_id: userId,
      title: listing.title,
      description: listing.description,
      type: "creator_listing",
      category: listing.category,
      location: listing.location,
      price: listing.price || null,
      discount: listing.discount || null,
      start_date: listing.startDate,
      end_date: listing.endDate,
      status: "active",
    })

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error("Error creating listing:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create listing",
    }
  }
}
