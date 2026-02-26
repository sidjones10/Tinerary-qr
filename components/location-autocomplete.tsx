"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { MapPin, Loader2, Building2 } from "lucide-react"
import { Input } from "@/components/ui/input"

interface LocationAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  /** Optional city/region to bias results toward (e.g. the itinerary's main location) */
  biasLocation?: string
}

// Popular locations as quick fallback for short queries
const POPULAR_LOCATIONS = [
  "New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX", "Phoenix, AZ",
  "San Antonio, TX", "San Diego, CA", "Dallas, TX", "Austin, TX", "San Francisco, CA",
  "Seattle, WA", "Denver, CO", "Boston, MA", "Miami, FL", "Las Vegas, NV",
  "Nashville, TN", "Atlanta, GA", "Orlando, FL", "New Orleans, LA",
  "London, United Kingdom", "Paris, France", "Tokyo, Japan", "Rome, Italy",
  "Barcelona, Spain", "Amsterdam, Netherlands", "Berlin, Germany", "Sydney, Australia",
  "Dubai, UAE", "Toronto, Canada", "Vancouver, Canada", "Mexico City, Mexico",
]

// Nominatim classes that represent businesses/POIs
const POI_CLASSES = new Set(["amenity", "shop", "tourism", "leisure", "office", "craft"])

interface NominatimResult {
  display_name: string
  type: string
  class: string
  lat: string
  lon: string
  name?: string
  address?: {
    road?: string
    house_number?: string
    city?: string
    town?: string
    village?: string
    state?: string
    country?: string
    postcode?: string
  }
}

interface Suggestion {
  label: string
  isPOI: boolean
}

function formatNominatimResult(result: NominatimResult): Suggestion {
  const isPOI = POI_CLASSES.has(result.class)
  const addr = result.address

  if (isPOI && result.name && addr) {
    // For businesses/POIs: "Starbucks, 123 Main St, Austin, TX"
    const parts: string[] = [result.name]
    if (addr.house_number && addr.road) {
      parts.push(`${addr.house_number} ${addr.road}`)
    } else if (addr.road) {
      parts.push(addr.road)
    }
    const city = addr.city || addr.town || addr.village
    if (city) parts.push(city)
    if (addr.state) parts.push(addr.state)
    return { label: parts.join(", "), isPOI: true }
  }

  // For regular addresses: trim the verbose display_name
  const parts = result.display_name.split(", ")
  if (parts.length <= 3) return { label: result.display_name, isPOI: false }
  const filtered = parts.filter(part => !/^\d{4,}$/.test(part.trim()))
  if (filtered.length <= 4) return { label: filtered.join(", "), isPOI: false }
  return { label: [...filtered.slice(0, 2), ...filtered.slice(-2)].join(", "), isPOI: false }
}

// Cache geocoded bias locations to avoid repeated lookups
const biasCache = new Map<string, { lat: number; lon: number } | null>()

async function geocodeBiasLocation(location: string): Promise<{ lat: number; lon: number } | null> {
  const key = location.toLowerCase().trim()
  if (biasCache.has(key)) return biasCache.get(key)!

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`,
      { headers: { "Accept": "application/json" } }
    )
    if (!response.ok) throw new Error("Geocoding failed")
    const data = await response.json()
    if (data && data.length > 0) {
      const coords = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
      biasCache.set(key, coords)
      return coords
    }
  } catch {
    // Silently fail
  }
  biasCache.set(key, null)
  return null
}

export function LocationAutocomplete({ value, onChange, placeholder, className, biasLocation }: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  const [biasCoords, setBiasCoords] = useState<{ lat: number; lon: number } | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const justSelectedRef = useRef(false)

  // Geocode the bias location when it changes
  useEffect(() => {
    if (!biasLocation || biasLocation.trim().length === 0) {
      setBiasCoords(null)
      return
    }

    let cancelled = false
    geocodeBiasLocation(biasLocation).then((coords) => {
      if (!cancelled) setBiasCoords(coords)
    })
    return () => { cancelled = true }
  }, [biasLocation])

  const searchNominatim = useCallback(async (query: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller
    setIsLoading(true)

    try {
      // Build the Nominatim URL with optional viewbox bias
      let url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=1`

      if (biasCoords) {
        // Create a ~50km viewbox around the bias location
        const offset = 0.45 // roughly 50km in degrees
        const west = biasCoords.lon - offset
        const east = biasCoords.lon + offset
        const south = biasCoords.lat - offset
        const north = biasCoords.lat + offset
        url += `&viewbox=${west},${north},${east},${south}&bounded=0`
      }

      const response = await fetch(url, {
        signal: controller.signal,
        headers: { "Accept": "application/json" },
      })

      if (!response.ok) throw new Error("Nominatim request failed")

      const results: NominatimResult[] = await response.json()
      const formatted = results.map(formatNominatimResult)
      // Deduplicate by label
      const seen = new Set<string>()
      const unique = formatted.filter(s => {
        if (seen.has(s.label)) return false
        seen.add(s.label)
        return true
      })

      if (!controller.signal.aborted) {
        setSuggestions(unique)
        setShowSuggestions(unique.length > 0)
        setSelectedIndex(-1)
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        const filtered = POPULAR_LOCATIONS.filter((loc) =>
          loc.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 6).map(label => ({ label, isPOI: false }))
        setSuggestions(filtered)
        setShowSuggestions(filtered.length > 0)
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false)
      }
    }
  }, [biasCoords])

  // Filter suggestions based on input with debounced Nominatim search
  useEffect(() => {
    if (justSelectedRef.current) {
      justSelectedRef.current = false
      return
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (value.length === 0) {
      setSuggestions([])
      setShowSuggestions(false)
      setIsLoading(false)
      return
    }

    // For short input (1-2 chars), use static list immediately
    if (value.length <= 2) {
      const filtered = POPULAR_LOCATIONS.filter((loc) =>
        loc.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 6).map(label => ({ label, isPOI: false }))
      setSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
      return
    }

    // Show static results instantly while waiting for Nominatim
    const staticFiltered = POPULAR_LOCATIONS.filter((loc) =>
      loc.toLowerCase().includes(value.toLowerCase())
    ).slice(0, 3).map(label => ({ label, isPOI: false }))
    if (staticFiltered.length > 0) {
      setSuggestions(staticFiltered)
      setShowSuggestions(true)
    }

    // Debounce the Nominatim API call (400ms)
    debounceTimerRef.current = setTimeout(() => {
      searchNominatim(value)
    }, 400)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [value, searchNominatim])

  // Handle click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const handleSelect = (location: string) => {
    justSelectedRef.current = true
    onChange(location)
    setShowSuggestions(false)
    setSelectedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case "Enter":
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelect(suggestions[selectedIndex].label)
        }
        break
      case "Escape":
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="flex items-center border rounded-md">
        <MapPin className="ml-3 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder={placeholder || "e.g., Starbucks, 123 Main St, or Paris, France"}
          className="border-0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true)
            }
          }}
          autoComplete="off"
        />
        {isLoading && (
          <Loader2 className="mr-3 h-4 w-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-card border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.label}-${index}`}
              className={`px-3 py-2 cursor-pointer flex items-center gap-2 ${
                index === selectedIndex
                  ? "bg-orange-50 dark:bg-orange-900/20 text-orange-900 dark:text-orange-200"
                  : "hover:bg-gray-50 dark:hover:bg-white/5"
              }`}
              onClick={() => handleSelect(suggestion.label)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {suggestion.isPOI ? (
                <Building2 className="h-3 w-3 text-purple-500 flex-shrink-0" />
              ) : (
                <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              )}
              <span className="text-sm truncate">{suggestion.label}</span>
            </div>
          ))}
          {value.length > 0 && !suggestions.some(s => s.label.toLowerCase() === value.toLowerCase()) && (
            <div className="px-3 py-2 text-xs text-muted-foreground border-t bg-gray-50 dark:bg-white/5">
              Search addresses, businesses, or landmarks
            </div>
          )}
        </div>
      )}
    </div>
  )
}
