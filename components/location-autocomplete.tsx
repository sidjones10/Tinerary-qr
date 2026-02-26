"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { MapPin, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"

interface LocationAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
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

interface NominatimResult {
  display_name: string
  type: string
  class: string
}

function formatNominatimResult(result: NominatimResult): string {
  // Nominatim returns verbose display_name like "123 Main St, Springfield, Sangamon County, Illinois, 62701, United States"
  // Trim to keep it readable: remove country code-like suffixes, keep up to 3-4 meaningful parts
  const parts = result.display_name.split(", ")
  // For addresses, keep street + city + state (+ country if international)
  if (parts.length <= 3) return result.display_name
  // Remove overly specific parts like county, ZIP codes
  const filtered = parts.filter(part => !/^\d{4,}$/.test(part.trim()))
  if (filtered.length <= 4) return filtered.join(", ")
  // Keep first 2 parts (street/place + city) and last 2 (state + country)
  return [...filtered.slice(0, 2), ...filtered.slice(-2)].join(", ")
}

export function LocationAutocomplete({ value, onChange, placeholder, className }: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  // Track if onChange was triggered by selecting a suggestion
  const justSelectedRef = useRef(false)

  const searchNominatim = useCallback(async (query: string) => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller
    setIsLoading(true)

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=1`,
        {
          signal: controller.signal,
          headers: { "Accept": "application/json" },
        }
      )

      if (!response.ok) throw new Error("Nominatim request failed")

      const results: NominatimResult[] = await response.json()
      const formatted = results.map(formatNominatimResult)
      // Deduplicate
      const unique = [...new Set(formatted)]

      if (!controller.signal.aborted) {
        setSuggestions(unique)
        setShowSuggestions(unique.length > 0)
        setSelectedIndex(-1)
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        // On API failure, fall back to static list
        const filtered = POPULAR_LOCATIONS.filter((loc) =>
          loc.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 6)
        setSuggestions(filtered)
        setShowSuggestions(filtered.length > 0)
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false)
      }
    }
  }, [])

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
      ).slice(0, 6)
      setSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
      return
    }

    // Show static results instantly while waiting for Nominatim
    const staticFiltered = POPULAR_LOCATIONS.filter((loc) =>
      loc.toLowerCase().includes(value.toLowerCase())
    ).slice(0, 3)
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
          handleSelect(suggestions[selectedIndex])
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
          placeholder={placeholder || "e.g., 123 Main St, Austin, TX or Paris, France"}
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
              key={`${suggestion}-${index}`}
              className={`px-3 py-2 cursor-pointer flex items-center gap-2 ${
                index === selectedIndex
                  ? "bg-orange-50 dark:bg-orange-900/20 text-orange-900 dark:text-orange-200"
                  : "hover:bg-gray-50 dark:hover:bg-white/5"
              }`}
              onClick={() => handleSelect(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="text-sm truncate">{suggestion}</span>
            </div>
          ))}
          {value.length > 0 && !suggestions.some(s => s.toLowerCase() === value.toLowerCase()) && (
            <div className="px-3 py-2 text-xs text-muted-foreground border-t bg-gray-50 dark:bg-white/5">
              Type any address - suggestions powered by OpenStreetMap
            </div>
          )}
        </div>
      )}
    </div>
  )
}
