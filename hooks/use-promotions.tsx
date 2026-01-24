"use client"

import { useState, useEffect } from "react"
import { getPromotions, recordPromotionClick } from "@/lib/supabase-client"
import type { Database } from "@/lib/database.types"

type Promotion = Database["public"]["Tables"]["promotions"]["Row"]

interface PromotionFilters {
  type?: string
  category?: string
  location?: string
  priceRange?: [number, number]
  dateRange?: [string, string]
}

export function usePromotions(initialFilters?: PromotionFilters) {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [featuredPromotions, setFeaturedPromotions] = useState<Promotion[]>([])
  const [filters, setFilters] = useState<PromotionFilters>(initialFilters || {})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const limit = 12

  // Load promotions based on current filters and pagination
  useEffect(() => {
    async function loadPromotions() {
      try {
        setLoading(true)
        setError(null)

        const data = await getPromotions(limit, (page - 1) * limit, filters)

        if (data && data.length > 0) {
          if (page === 1) {
            setPromotions(data)

            // Set featured promotions (top 2 by rank score)
            const featured = [...data].sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0)).slice(0, 2)
            setFeaturedPromotions(featured)
          } else {
            setPromotions((prev) => [...prev, ...data])
          }

          setHasMore(data.length === limit)
        } else {
          if (page === 1) {
            setPromotions([])
            setFeaturedPromotions([])
          }
          setHasMore(false)
        }
      } catch (err) {
        console.error("Error loading promotions:", err)
        setError("Failed to load promotions. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    loadPromotions()
  }, [filters, page, limit])

  // Handle promotion click
  const handlePromotionClick = async (promotionId: string) => {
    try {
      await recordPromotionClick(promotionId)
    } catch (err) {
      console.error("Error recording promotion click:", err)
    }
  }

  // Update filters
  const updateFilters = (newFilters: Partial<PromotionFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
    setPage(1) // Reset to first page when filters change
  }

  // Load more promotions
  const loadMore = () => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1)
    }
  }

  return {
    promotions,
    featuredPromotions,
    loading,
    error,
    hasMore,
    filters,
    updateFilters,
    loadMore,
    handlePromotionClick,
  }
}
