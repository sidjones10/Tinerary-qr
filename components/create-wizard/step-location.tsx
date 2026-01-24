"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MapPin, Navigation } from "lucide-react"

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
    if ("geolocation" in navigator) {
      setIsGettingLocation(true)
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          // Reverse geocode to get address
          // For now, just use coordinates
          const location = `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`
          onChange("location", location)
          setIsGettingLocation(false)
        },
        (error) => {
          console.error("Error getting location:", error)
          setIsGettingLocation(false)
          alert("Could not get your location. Please enter it manually.")
        }
      )
    } else {
      alert("Geolocation is not supported by your browser")
    }
  }

  return (
    <div className="space-y-6">
      {/* Location Input */}
      <div className="space-y-2">
        <Label htmlFor="location" className="text-base font-semibold">
          Where is this {formData.location ? "located" : "happening"}?
          <span className="text-red-500 ml-1">*</span>
        </Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            id="location"
            placeholder="e.g., New York, NY or 123 Main St, City, State"
            value={formData.location}
            onChange={(e) => onChange("location", e.target.value)}
            className="text-lg h-12 pl-11"
          />
        </div>
        {errors?.location && <p className="text-sm text-red-500">{errors.location}</p>}
      </div>

      {/* Use Current Location */}
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

      {/* Popular Locations */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-600">Quick Select:</Label>
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
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              {loc}
            </button>
          ))}
        </div>
      </div>

      {/* Helper text */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <p className="text-sm text-purple-800">
          <strong>Tip:</strong> Be as specific as possible! Include city and state, or even a full address for precise
          location.
        </p>
      </div>
    </div>
  )
}
