"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "./use-auth"
import { DiscoveryClient } from "@/lib/api-client-discovery"
import type { DiscoveryFeedResponse, DiscoveryFeedRequest } from "@/lib/recommendation-types"

export function useDiscovery() {
  const { user, isAuthenticated } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [discoveryFeed, setDiscoveryFeed] = useState<DiscoveryFeedResponse | null>(null)
  const [filters, setFilters] = useState<DiscoveryFeedRequest["filters"]>({})
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  // Get user's current location
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | undefined>(undefined)

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
        },
        () => {
//           console.log("Unable to retrieve your location")
        },
      )
    }
  }, [])

  // Fetch discovery feed
  const fetchDiscoveryFeed = useCallback(
    async (reset = false) => {
      if (!isAuthenticated || !user) return

      try {
        setIsLoading(true)
        setError(null)

        const currentPage = reset ? 1 : page

        const request: DiscoveryFeedRequest = {
          userId: user.id,
          location: userLocation,
          filters,
          page: currentPage,
          pageSize: 10,
        }

        const response = await DiscoveryClient.getDiscoveryFeed(request)

        if (response.error) {
          setError(response.error.message)
          return
        }

        if (response.data) {
          if (reset || currentPage === 1) {
            setDiscoveryFeed(response.data)
          } else {
            // Merge new items with existing items
            setDiscoveryFeed((prev) => {
              if (!prev) return response.data

              return {
                ...prev,
                personalRecommendations: [...prev.personalRecommendations, ...response.data.personalRecommendations],
                trending: [...prev.trending, ...response.data.trending],
                forYou: [...prev.forYou, ...response.data.forYou],
                nearby: [...prev.nearby, ...response.data.nearby],
                seasonal: [...prev.seasonal, ...response.data.seasonal],
                friendsLiked: [...prev.friendsLiked, ...response.data.friendsLiked],
                similar: [
                  ...prev.similar,
                  ...response.data.similar.filter((s) => !prev.similar.some((ps) => ps.category === s.category)),
                ],
              }
            })
          }

          // Check if there are more items to load
          const hasMoreItems = Object.values(response.data).some(
            (section) => Array.isArray(section) && section.length > 0,
          )
          setHasMore(hasMoreItems)

          if (reset) {
            setPage(1)
          } else {
            setPage(currentPage + 1)
          }
        }
      } catch (err) {
        setError("Failed to fetch discovery feed")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    },
    [isAuthenticated, user, userLocation, filters, page],
  )

  // Initial fetch
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchDiscoveryFeed(true)
    }
  }, [isAuthenticated, user, fetchDiscoveryFeed])

  // Log interaction with an item
  const logInteraction = useCallback(
    async (itemId: string, itemType: string, interactionType: "view" | "like" | "save" | "share" | "book") => {
      if (!isAuthenticated || !user) return

      try {
        await DiscoveryClient.logInteraction(itemId, itemType, interactionType)
      } catch (err) {
        console.error("Failed to log interaction:", err)
      }
    },
    [isAuthenticated, user],
  )

  // Get similar items
  const getSimilarItems = useCallback(
    async (itemId: string, itemType: string) => {
      if (!isAuthenticated || !user) return []

      try {
        const response = await DiscoveryClient.getSimilarItems(itemId, itemType)

        if (response.error) {
          console.error(response.error.message)
          return []
        }

        return response.data || []
      } catch (err) {
        console.error("Failed to get similar items:", err)
        return []
      }
    },
    [isAuthenticated, user],
  )

  // Update filters
  const updateFilters = useCallback(
    (newFilters: DiscoveryFeedRequest["filters"]) => {
      setFilters((prev) => ({
        ...prev,
        ...newFilters,
      }))
      fetchDiscoveryFeed(true)
    },
    [fetchDiscoveryFeed],
  )

  // Load more items
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchDiscoveryFeed()
    }
  }, [isLoading, hasMore, fetchDiscoveryFeed])

  return {
    discoveryFeed,
    isLoading,
    error,
    filters,
    hasMore,
    updateFilters,
    loadMore,
    logInteraction,
    getSimilarItems,
  }
}
