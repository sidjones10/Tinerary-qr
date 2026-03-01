"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { canCreatePromotion, getDefaultTier } from "@/lib/business-plan"
import type { BusinessTierSlug } from "@/lib/tiers"
import { recordAffiliateEarning } from "@/lib/commission"

export async function createDeal(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return redirect("/auth?message=You must be logged in to create a deal")
  }

  try {
    // Find the business owned by this user (include tier)
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id, business_tier")
      .eq("user_id", session.user.id)
      .single()

    if (bizError || !business) {
      return { success: false, error: "No business profile found. Please create a business profile first." }
    }

    // Enforce active promotion limits based on business tier
    const tier = (business.business_tier || getDefaultTier()) as BusinessTierSlug
    const { count: activeCount } = await supabase
      .from("promotions")
      .select("*", { count: "exact", head: true })
      .eq("business_id", business.id)
      .eq("status", "active")

    const check = canCreatePromotion(tier, activeCount || 0)
    if (!check.allowed) {
      return { success: false, error: check.reason }
    }

    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const type = formData.get("type") as string
    const category = formData.get("category") as string
    const location = formData.get("location") as string
    const startDate = formData.get("start_date") as string
    const endDate = formData.get("end_date") as string
    const price = formData.get("price") ? Number.parseFloat(formData.get("price") as string) : null
    const originalPrice = formData.get("original_price") ? Number.parseFloat(formData.get("original_price") as string) : null
    const discount = formData.get("discount") ? Number.parseInt(formData.get("discount") as string) : null
    const currency = (formData.get("currency") as string) || "USD"
    const imageUrl = (formData.get("image_url") as string) || null
    const tagsRaw = formData.get("tags") as string
    const tags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : null

    if (!title || !type || !category || !location || !startDate || !endDate) {
      return { success: false, error: "Please fill in all required fields." }
    }

    const { data, error } = await supabase
      .from("promotions")
      .insert([
        {
          title,
          description,
          type,
          category,
          location,
          start_date: startDate,
          end_date: endDate,
          price,
          original_price: originalPrice,
          discount,
          currency,
          image: imageUrl,
          tags,
          business_id: business.id,
          status: "active",
          is_featured: false,
          rank_score: 0,
        },
      ])
      .select()
      .single()

    if (error) throw error

    revalidatePath("/business-profile")
    revalidatePath("/deals")
    revalidatePath("/deals/manage")
    return { success: true, data }
  } catch (error) {
    console.error("Error creating deal:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function updateDeal(id: string, formData: FormData) {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return redirect("/auth?message=You must be logged in to update a deal")
  }

  try {
    // Verify ownership: promotion -> business -> user
    const { data: promotion, error: fetchError } = await supabase
      .from("promotions")
      .select("business_id, businesses!inner(user_id)")
      .eq("id", id)
      .single()

    if (fetchError) throw fetchError

    const businessUserId = (promotion as any).businesses?.user_id
    if (businessUserId !== session.user.id) {
      return { success: false, error: "You don't have permission to update this deal." }
    }

    const updates: Record<string, any> = {}

    if (formData.has("title")) updates.title = formData.get("title") as string
    if (formData.has("description")) updates.description = formData.get("description") as string
    if (formData.has("type")) updates.type = formData.get("type") as string
    if (formData.has("category")) updates.category = formData.get("category") as string
    if (formData.has("location")) updates.location = formData.get("location") as string
    if (formData.has("start_date")) updates.start_date = formData.get("start_date") as string
    if (formData.has("end_date")) updates.end_date = formData.get("end_date") as string
    if (formData.has("price")) updates.price = Number.parseFloat(formData.get("price") as string) || null
    if (formData.has("original_price")) updates.original_price = Number.parseFloat(formData.get("original_price") as string) || null
    if (formData.has("discount")) updates.discount = Number.parseInt(formData.get("discount") as string) || null
    if (formData.has("currency")) updates.currency = formData.get("currency") as string
    if (formData.has("status")) updates.status = formData.get("status") as string
    if (formData.has("image_url")) updates.image = formData.get("image_url") as string

    const { data, error } = await supabase
      .from("promotions")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    revalidatePath("/business-profile")
    revalidatePath("/deals")
    revalidatePath("/deals/manage")
    revalidatePath(`/promotion/${id}`)
    return { success: true, data }
  } catch (error) {
    console.error("Error updating deal:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function deleteDeal(id: string) {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return redirect("/auth?message=You must be logged in to delete a deal")
  }

  try {
    // Verify ownership
    const { data: promotion, error: fetchError } = await supabase
      .from("promotions")
      .select("business_id, businesses!inner(user_id)")
      .eq("id", id)
      .single()

    if (fetchError) throw fetchError

    const businessUserId = (promotion as any).businesses?.user_id
    if (businessUserId !== session.user.id) {
      return { success: false, error: "You don't have permission to delete this deal." }
    }

    const { error } = await supabase.from("promotions").delete().eq("id", id)

    if (error) throw error

    revalidatePath("/business-profile")
    revalidatePath("/deals")
    revalidatePath("/deals/manage")
    return { success: true }
  } catch (error) {
    console.error("Error deleting deal:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function getBusinessDeals() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { success: true, data: [] }
  }

  try {
    // Find the business owned by this user
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("user_id", session.user.id)
      .single()

    if (!business) {
      return { success: true, data: [] }
    }

    const { data, error } = await supabase
      .from("promotions")
      .select("*, promotion_metrics(*)")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Error fetching business deals:", error)
    return { success: false, error: (error as Error).message, data: [] }
  }
}

export async function getPublicDeals() {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from("promotions")
      .select(`
        *,
        businesses (
          id,
          name,
          logo,
          website,
          rating,
          review_count,
          business_tier,
          enterprise_badge_enabled,
          priority_placement,
          branding_config
        ),
        promotion_metrics (*)
      `)
      .eq("status", "active")
      .order("rank_score", { ascending: false })

    if (error) throw error

    // Apply enterprise priority placement boost:
    // Enterprise businesses with priority_placement get sorted to top
    const deals = data || []
    deals.sort((a: any, b: any) => {
      const aTier = a.businesses?.business_tier || "basic"
      const bTier = b.businesses?.business_tier || "basic"
      const aPriority = a.businesses?.priority_placement ? 1 : 0
      const bPriority = b.businesses?.priority_placement ? 1 : 0

      // Priority placement businesses come first
      if (aPriority !== bPriority) return bPriority - aPriority

      // Among same priority, enterprise > premium > basic
      const tierRank: Record<string, number> = { enterprise: 3, premium: 2, basic: 1 }
      const aTierRank = tierRank[aTier] || 0
      const bTierRank = tierRank[bTier] || 0
      if (aTierRank !== bTierRank) return bTierRank - aTierRank

      // Fall back to rank_score
      return (b.rank_score || 0) - (a.rank_score || 0)
    })

    return { success: true, data: deals }
  } catch (error) {
    console.error("Error fetching public deals:", error)
    return { success: false, error: (error as Error).message, data: [] }
  }
}

export async function getPromotionById(id: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from("promotions")
      .select(`
        *,
        businesses (
          id,
          name,
          logo,
          website,
          rating,
          review_count
        ),
        promotion_metrics (*)
      `)
      .eq("id", id)
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error("Error fetching promotion:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function trackAffiliateLinkClick(code: string, ip: string, userAgent: string) {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from("affiliate_clicks")
      .insert([
        {
          affiliate_code: code,
          ip_address: ip,
          user_agent: userAgent,
          clicked_at: new Date().toISOString(),
        },
      ])

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error("Error tracking affiliate click:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function getUserBusiness() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { success: false, data: null }
  }

  try {
    const { data, error } = await supabase
      .from("businesses")
      .select("*")
      .eq("user_id", session.user.id)
      .single()

    if (error && error.code !== "PGRST116") throw error // PGRST116 = no rows

    return { success: true, data }
  } catch (error) {
    console.error("Error fetching user business:", error)
    return { success: false, error: (error as Error).message, data: null }
  }
}

export async function getBusinessPlanInfo() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { success: false, data: null }
  }

  try {
    const { data: business, error } = await supabase
      .from("businesses")
      .select("id, business_tier")
      .eq("user_id", session.user.id)
      .single()

    if (error && error.code !== "PGRST116") throw error
    if (!business) return { success: true, data: null }

    const tier = (business.business_tier || getDefaultTier()) as BusinessTierSlug

    // Count active promotions
    const { count: activeCount } = await supabase
      .from("promotions")
      .select("*", { count: "exact", head: true })
      .eq("business_id", business.id)
      .eq("status", "active")

    return {
      success: true,
      data: {
        businessId: business.id,
        tier,
        activePromotionCount: activeCount || 0,
      },
    }
  } catch (error) {
    console.error("Error fetching business plan info:", error)
    return { success: false, error: (error as Error).message, data: null }
  }
}

export async function getBusinessAnalytics() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { success: false, data: null }
  }

  try {
    const { data: business } = await supabase
      .from("businesses")
      .select("id, business_tier")
      .eq("user_id", session.user.id)
      .single()

    if (!business) return { success: true, data: null }

    // Get all promotions with metrics
    const { data: promotions } = await supabase
      .from("promotions")
      .select("*, promotion_metrics(*)")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })

    const allPromos: any[] = promotions || []
    const activePromos = allPromos.filter((p: any) => p.status === "active")
    const expiredPromos = allPromos.filter((p: any) => p.status !== "active")

    // Aggregate metrics
    const totalViews = allPromos.reduce(
      (sum: number, p: any) => sum + (p.promotion_metrics?.views || 0),
      0
    )
    const totalClicks = allPromos.reduce(
      (sum: number, p: any) => sum + (p.promotion_metrics?.clicks || 0),
      0
    )
    const totalSaves = allPromos.reduce(
      (sum: number, p: any) => sum + (p.promotion_metrics?.saves || 0),
      0
    )

    const clickThroughRate =
      totalViews > 0 ? Math.round((totalClicks / totalViews) * 10000) / 100 : 0

    // Per-promotion performance
    const promotionPerformance = allPromos.map((p: any) => ({
      id: p.id,
      title: p.title,
      status: p.status,
      views: p.promotion_metrics?.views || 0,
      clicks: p.promotion_metrics?.clicks || 0,
      saves: p.promotion_metrics?.saves || 0,
      ctr:
        (p.promotion_metrics?.views || 0) > 0
          ? Math.round(
              ((p.promotion_metrics?.clicks || 0) /
                (p.promotion_metrics?.views || 0)) *
                10000
            ) / 100
          : 0,
    }))

    return {
      success: true,
      data: {
        tier: (business.business_tier || "basic") as BusinessTierSlug,
        summary: {
          totalPromotions: allPromos.length,
          activePromotions: activePromos.length,
          expiredPromotions: expiredPromos.length,
          totalViews,
          totalClicks,
          totalSaves,
          clickThroughRate,
        },
        promotionPerformance,
      },
    }
  } catch (error) {
    console.error("Error fetching business analytics:", error)
    return { success: false, error: (error as Error).message, data: null }
  }
}

export async function processBooking(formData: FormData) {
  const supabase = await createClient()

  try {
    const promotionId = formData.get("promotionId") as string
    const userId = formData.get("userId") as string
    const quantity = Number.parseInt(formData.get("quantity") as string) || 1
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const affiliateCode = formData.get("affiliateCode") as string | null

    if (!promotionId || !name || !email) {
      return { success: false, error: "Missing required booking information." }
    }

    // Get the promotion details to calculate total price
    const { data: promotion, error: promotionError } = await supabase
      .from("promotions")
      .select("price, currency, business_id")
      .eq("id", promotionId)
      .single()

    if (promotionError || !promotion) {
      return { success: false, error: "Promotion not found." }
    }

    const totalPrice = (promotion.price || 0) * quantity

    // Determine the user_id: use the authenticated user if available, otherwise use the provided userId
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const bookingUserId = session?.user?.id || userId

    const { data: booking, error } = await supabase
      .from("bookings")
      .insert([
        {
          user_id: bookingUserId,
          promotion_id: promotionId,
          quantity,
          total_price: totalPrice,
          currency: promotion.currency,
          attendee_names: name,
          attendee_emails: email,
          status: "confirmed",
        },
      ])
      .select()
      .single()

    if (error) throw error

    // Track affiliate conversion if code is present
    if (affiliateCode) {
      await supabase
        .from("affiliate_clicks")
        .insert([
          {
            affiliate_code: affiliateCode,
            clicked_at: new Date().toISOString(),
          },
        ])

      // Look up who owns this affiliate code and record their earning
      const { data: affiliateLink } = await supabase
        .from("affiliate_links")
        .select("user_id")
        .eq("affiliate_code", affiliateCode)
        .single()

      if (affiliateLink?.user_id) {
        // Determine user tier for commission split
        const { data: profile } = await supabase
          .from("profiles")
          .select("account_tier")
          .eq("id", affiliateLink.user_id)
          .single()

        const userTier = (profile?.account_tier as "user" | "creator" | "business") || "user"

        await recordAffiliateEarning({
          userId: affiliateLink.user_id,
          affiliateCode,
          grossAmount: totalPrice,
          userTier,
          bookingId: booking.id,
          supabaseClient: supabase,
        })
      }
    }

    revalidatePath(`/promotion/${promotionId}`)
    revalidatePath("/tickets")
    return { success: true, data: booking }
  } catch (error) {
    console.error("Error processing booking:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function generateAffiliateLink(formData: FormData) {
  const supabase = await createClient()

  try {
    const userId = formData.get("userId") as string
    const type = formData.get("type") as "promotion" | "itinerary" | "external"
    const externalUrl = formData.get("externalUrl") as string | null
    const promotionId = formData.get("promotionId") as string | null

    if (!userId) {
      return { success: false, error: "User ID is required." }
    }

    // Build the target URL based on link type
    let targetUrl: string

    if (type === "external") {
      if (!externalUrl) {
        return { success: false, error: "External URL is required." }
      }
      targetUrl = externalUrl
    } else if (type === "promotion") {
      if (!promotionId) {
        return { success: false, error: "Promotion ID is required." }
      }
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tinerary.app"
      targetUrl = `${appUrl}/promotion/${promotionId}`
    } else if (type === "itinerary") {
      if (!promotionId) {
        return { success: false, error: "Itinerary ID is required." }
      }
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tinerary.app"
      targetUrl = `${appUrl}/trip/${promotionId}`
    } else {
      return { success: false, error: "Invalid link type." }
    }

    // Generate a unique affiliate code: short user prefix + random suffix
    const userPrefix = userId.substring(0, 8)
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const affiliateCode = `${userPrefix}-${randomSuffix}`

    // Store the affiliate link
    const { error: insertError } = await supabase
      .from("affiliate_links")
      .insert({
        user_id: userId,
        affiliate_code: affiliateCode,
        type,
        target_url: targetUrl,
        promotion_id: type === "promotion" ? promotionId : null,
        created_at: new Date().toISOString(),
      })

    // If the table doesn't exist yet, still return the link (it will work via click tracking)
    if (insertError) {
      console.warn("Could not store affiliate link (table may not exist yet):", insertError.message)
    }

    // Build the affiliate tracking URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tinerary.app"
    const affiliateUrl = `${appUrl}/api/affiliate/track?code=${encodeURIComponent(affiliateCode)}&url=${encodeURIComponent(targetUrl)}`

    return {
      success: true,
      affiliateUrl,
      affiliateCode,
    }
  } catch (error) {
    console.error("Error generating affiliate link:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function getAffiliateLinksByUser(userId: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from("affiliate_links")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      // Table may not exist yet
      console.warn("Could not fetch affiliate links:", error.message)
      return { success: true, data: [] }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Error fetching affiliate links:", error)
    return { success: false, error: (error as Error).message, data: [] }
  }
}

export async function getAffiliateStats(userId: string) {
  const supabase = await createClient()

  try {
    // Get all affiliate links for this user
    const { data: links } = await supabase
      .from("affiliate_links")
      .select("affiliate_code")
      .eq("user_id", userId)

    const codes = (links || []).map((l: any) => l.affiliate_code)

    if (codes.length === 0) {
      return {
        success: true,
        data: {
          totalLinks: 0,
          totalClicks: 0,
          totalConversions: 0,
          totalRevenue: 0,
        },
      }
    }

    // Count clicks across all affiliate codes
    const { count: totalClicks } = await supabase
      .from("affiliate_clicks")
      .select("*", { count: "exact", head: true })
      .in("affiliate_code", codes)

    // Count earnings
    const { data: earnings } = await supabase
      .from("affiliate_earnings")
      .select("user_commission, status")
      .eq("user_id", userId)

    const totalRevenue = (earnings || []).reduce(
      (sum: number, e: any) => sum + (e.user_commission || 0),
      0
    )
    const totalConversions = (earnings || []).filter(
      (e: any) => e.status === "approved" || e.status === "paid"
    ).length

    return {
      success: true,
      data: {
        totalLinks: codes.length,
        totalClicks: totalClicks || 0,
        totalConversions,
        totalRevenue,
      },
    }
  } catch (error) {
    // Tables may not exist yet — return zeroes
    console.warn("Could not fetch affiliate stats:", error)
    return {
      success: true,
      data: {
        totalLinks: 0,
        totalClicks: 0,
        totalConversions: 0,
        totalRevenue: 0,
      },
    }
  }
}

export async function generatePerformanceReport() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    const { data: business } = await supabase
      .from("businesses")
      .select("id, name, business_tier")
      .eq("user_id", session.user.id)
      .single()

    if (!business) {
      return { success: false, error: "No business profile found" }
    }

    // Get promotions with metrics
    const { data: promotions } = await supabase
      .from("promotions")
      .select("*, promotion_metrics(*)")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })

    const allPromos: any[] = promotions || []
    const activePromos = allPromos.filter((p: any) => p.status === "active")

    const totalViews = allPromos.reduce(
      (sum: number, p: any) => sum + (p.promotion_metrics?.views || 0),
      0
    )
    const totalClicks = allPromos.reduce(
      (sum: number, p: any) => sum + (p.promotion_metrics?.clicks || 0),
      0
    )
    const totalSaves = allPromos.reduce(
      (sum: number, p: any) => sum + (p.promotion_metrics?.saves || 0),
      0
    )

    const topPromotion = allPromos.reduce(
      (top: { title: string; views: number }, p: any) => {
        const views = p.promotion_metrics?.views || 0
        return views > top.views ? { title: p.title, views } : top
      },
      { title: "N/A", views: 0 }
    )

    return {
      success: true,
      data: {
        businessName: business.name,
        tier: business.business_tier || "basic",
        generatedAt: new Date().toISOString(),
        period: "Last 30 days",
        metrics: {
          totalPromotions: allPromos.length,
          activePromotions: activePromos.length,
          totalViews,
          totalClicks,
          totalSaves,
          clickThroughRate:
            totalViews > 0
              ? Math.round((totalClicks / totalViews) * 10000) / 100
              : 0,
          topPromotion: topPromotion.title,
        },
      },
    }
  } catch (error) {
    console.error("Error generating performance report:", error)
    return { success: false, error: (error as Error).message }
  }
}
