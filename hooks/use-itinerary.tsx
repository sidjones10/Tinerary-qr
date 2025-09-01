"use client"

import { useState } from "react"
import { ApiClient } from "@/lib/api-client"
import type { Itinerary, Activity, CreateItineraryRequest, UpdateItineraryRequest } from "@/lib/api-types"

export function useItinerary(initialItinerary?: Itinerary) {
  const [itinerary, setItinerary] = useState<Itinerary | null>(initialItinerary || null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchItinerary = async (id: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await ApiClient.getItinerary(id)

      if (response.error) {
        setError(response.error.message)
        return null
      }

      if (response.data) {
        setItinerary(response.data)
        return response.data
      }

      setError("Failed to fetch itinerary")
      return null
    } catch (err) {
      setError("An unexpected error occurred")
      console.error("Fetch itinerary error:", err)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const createItinerary = async (data: CreateItineraryRequest) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await ApiClient.createItinerary(data)

      if (response.error) {
        setError(response.error.message)
        return null
      }

      if (response.data) {
        setItinerary(response.data)
        return response.data
      }

      setError("Failed to create itinerary")
      return null
    } catch (err) {
      setError("An unexpected error occurred")
      console.error("Create itinerary error:", err)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const updateItinerary = async (id: string, updates: UpdateItineraryRequest) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await ApiClient.updateItinerary(id, updates)

      if (response.error) {
        setError(response.error.message)
        return null
      }

      if (response.data) {
        setItinerary(response.data)
        return response.data
      }

      setError("Failed to update itinerary")
      return null
    } catch (err) {
      setError("An unexpected error occurred")
      console.error("Update itinerary error:", err)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const deleteItinerary = async (id: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await ApiClient.deleteItinerary(id)

      if (response.error) {
        setError(response.error.message)
        return false
      }

      setItinerary(null)
      return true
    } catch (err) {
      setError("An unexpected error occurred")
      console.error("Delete itinerary error:", err)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const addActivity = async (itineraryId: string, activity: Omit<Activity, "id" | "itineraryId">) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await ApiClient.addActivity(itineraryId, activity)

      if (response.error) {
        setError(response.error.message)
        return null
      }

      if (response.data && itinerary) {
        // Update local state with new activity
        const updatedItinerary = {
          ...itinerary,
          activities: [...itinerary.activities, response.data],
        }
        setItinerary(updatedItinerary)
        return response.data
      }

      setError("Failed to add activity")
      return null
    } catch (err) {
      setError("An unexpected error occurred")
      console.error("Add activity error:", err)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const updateActivity = async (itineraryId: string, activityId: string, updates: Partial<Activity>) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await ApiClient.updateActivity(itineraryId, activityId, updates)

      if (response.error) {
        setError(response.error.message)
        return null
      }

      if (response.data && itinerary) {
        // Update local state with updated activity
        const updatedActivities = itinerary.activities.map((activity) =>
          activity.id === activityId ? response.data : activity,
        )

        const updatedItinerary = {
          ...itinerary,
          activities: updatedActivities,
        }

        setItinerary(updatedItinerary)
        return response.data
      }

      setError("Failed to update activity")
      return null
    } catch (err) {
      setError("An unexpected error occurred")
      console.error("Update activity error:", err)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const deleteActivity = async (itineraryId: string, activityId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await ApiClient.deleteActivity(itineraryId, activityId)

      if (response.error) {
        setError(response.error.message)
        return false
      }

      if (itinerary) {
        // Update local state by removing the activity
        const updatedActivities = itinerary.activities.filter((activity) => activity.id !== activityId)

        const updatedItinerary = {
          ...itinerary,
          activities: updatedActivities,
        }

        setItinerary(updatedItinerary)
      }

      return true
    } catch (err) {
      setError("An unexpected error occurred")
      console.error("Delete activity error:", err)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const likeItinerary = async (id: string) => {
    try {
      const response = await ApiClient.likeItinerary(id)

      if (response.data && itinerary) {
        // Update local state with new like count
        setItinerary({
          ...itinerary,
          likes: response.data.likes,
        })
        return true
      }

      return false
    } catch (err) {
      console.error("Like itinerary error:", err)
      return false
    }
  }

  const unlikeItinerary = async (id: string) => {
    try {
      const response = await ApiClient.unlikeItinerary(id)

      if (response.data && itinerary) {
        // Update local state with new like count
        setItinerary({
          ...itinerary,
          likes: response.data.likes,
        })
        return true
      }

      return false
    } catch (err) {
      console.error("Unlike itinerary error:", err)
      return false
    }
  }

  return {
    itinerary,
    isLoading,
    error,
    fetchItinerary,
    createItinerary,
    updateItinerary,
    deleteItinerary,
    addActivity,
    updateActivity,
    deleteActivity,
    likeItinerary,
    unlikeItinerary,
  }
}
