"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { LocationAutocomplete } from "@/components/location-autocomplete"
import { reverseGeocode } from "@/lib/geocode"
import { Navigation } from "lucide-react"

interface StepLocationProps {
  formData: {
    location: string
  }
  onChange: (field: string, value: any) => void
  errors?: Record<string, string>
}

export function StepLocation({ formData, onChange, errors }: StepLocationProps) {
  const [isGettingLocation, setIsGettingLocation] = useState(false)

  const handleUseCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      alert("Geolocation is not supported by your browser")
      return
    }

    setIsGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        const place = await reverseGeocode(latitude, longitude)
        // Fall back to coordinates only if reverse geocoding fails.
        onChange("location", place || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
        setIsGettingLocation(false)
      },
      (error) => {
        console.error("Error getting location:", error)
        setIsGettingLocation(false)
        alert("Could not get your location. Please search for it manually.")
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div className="space-y-6">
      {/* Location search */}
      <div className="space-y-2">
        <Label htmlFor="location" className="text-base font-semibold">
          Where is this happening?
          <span className="text-red-500 ml-1">*</span>
        </Label>
        <LocationAutocomplete
          id="location"
          value={formData.location}
          onChange={(value) => onChange("location", value)}
          placeholder="Search a city, address, or place…"
        />
        {errors?.location && <p className="text-sm text-red-500">{errors.location}</p>}
      </div>

      {/* Use current location */}
      <div className="flex items-center justify-center">
        <Button
          type="button"
          variant="outline"
          onClick={handleUseCurrentLocation}
          disabled={isGettingLocation}
          className="gap-2"
        >
          <Navigation className="h-4 w-4" />
          {isGettingLocation ? "Getting location..." : "Use my current location"}
        </Button>
      </div>

      {/* Popular locations */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Quick Select:</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            "New York, NY",
            "Los Angeles, CA",
            "Chicago, IL",
            "Miami, FL",
            "Las Vegas, NV",
            "San Francisco, CA",
          ].map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => onChange("location", loc)}
              className={`px-3 py-2 text-sm rounded-lg border-2 transition-all hover:border-orange-300 ${
                formData.location === loc
                  ? "border-orange-500 bg-orange-50 text-orange-700 font-medium"
                  : "border-gray-200 dark:border-border hover:bg-gray-50 dark:hover:bg-white/5"
              }`}
            >
              {loc}
            </button>
          ))}
        </div>
      </div>

      {/* Helper text */}
      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 rounded-lg p-4">
        <p className="text-sm text-purple-800">
          <strong>Tip:</strong> Start typing to search for a city, address, or specific
          venue. Pick a suggestion for the most accurate location.
        </p>
      </div>
    </div>
  )
}
