"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { MapPin, Loader2, Building2, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { searchPlaces, geocodeLocation, type PlaceResult } from "@/lib/geocode"

interface LocationAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  /** Forwarded to the underlying input so a <label htmlFor> can target it. */
  id?: string
  /** Optional city/region to bias results toward (e.g. the itinerary's main location). */
  biasLocation?: string
}

// Popular locations as an instant fallback for short queries / offline.
const POPULAR_LOCATIONS = [
  "New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX", "Phoenix, AZ",
  "San Antonio, TX", "San Diego, CA", "Dallas, TX", "Austin, TX", "San Francisco, CA",
  "Seattle, WA", "Denver, CO", "Boston, MA", "Miami, FL", "Las Vegas, NV",
  "Nashville, TN", "Atlanta, GA", "Orlando, FL", "New Orleans, LA",
  "London, United Kingdom", "Paris, France", "Tokyo, Japan", "Rome, Italy",
  "Barcelona, Spain", "Amsterdam, Netherlands", "Berlin, Germany", "Sydney, Australia",
  "Dubai, UAE", "Toronto, Canada", "Vancouver, Canada", "Mexico City, Mexico",
]

interface Suggestion {
  label: string
  isPOI: boolean
}

function popularMatches(query: string, max: number): Suggestion[] {
  return POPULAR_LOCATIONS.filter((loc) => loc.toLowerCase().includes(query.toLowerCase()))
    .slice(0, max)
    .map((label) => ({ label, isPOI: false }))
}

export function LocationAutocomplete({ value, onChange, placeholder, className, id, biasLocation }: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  const [noResults, setNoResults] = useState(false)
  const [biasCoords, setBiasCoords] = useState<{ lat: number; lon: number } | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const justSelectedRef = useRef(false)

  // Geocode the bias location when it changes.
  useEffect(() => {
    if (!biasLocation || biasLocation.trim().length === 0) {
      setBiasCoords(null)
      return
    }

    let cancelled = false
    geocodeLocation(biasLocation).then((coords) => {
      if (!cancelled) setBiasCoords(coords)
    })
    return () => {
      cancelled = true
    }
  }, [biasLocation])

  const runSearch = useCallback(
    async (query: string) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      const controller = new AbortController()
      abortControllerRef.current = controller
      setIsLoading(true)
      setNoResults(false)

      try {
        const places: PlaceResult[] = await searchPlaces(query, {
          bias: biasCoords,
          signal: controller.signal,
        })

        if (controller.signal.aborted) return

        const formatted: Suggestion[] = places.map((p) => ({ label: p.label, isPOI: p.isPOI }))

        // Blend in any matching popular locations the API didn't return.
        const seen = new Set(formatted.map((s) => s.label.toLowerCase()))
        for (const p of popularMatches(query, 3)) {
          if (!seen.has(p.label.toLowerCase())) {
            formatted.push(p)
            seen.add(p.label.toLowerCase())
          }
        }

        setSuggestions(formatted)
        setShowSuggestions(true)
        setNoResults(formatted.length === 0)
        setSelectedIndex(-1)
      } catch (err: any) {
        if (err?.name === "AbortError") return
        // Network/HTTP failure: fall back to the static list.
        const fallback = popularMatches(query, 6)
        setSuggestions(fallback)
        setShowSuggestions(true)
        setNoResults(fallback.length === 0)
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    },
    [biasCoords]
  )

  // Debounced search driven by the input value.
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
      setNoResults(false)
      setIsLoading(false)
      return
    }

    // For very short input, use the static list immediately (no network).
    if (value.length <= 2) {
      const filtered = popularMatches(value, 6)
      setSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
      setNoResults(false)
      return
    }

    // Show static matches instantly while the debounced API call is pending.
    const staticFiltered = popularMatches(value, 3)
    if (staticFiltered.length > 0) {
      setSuggestions(staticFiltered)
      setShowSuggestions(true)
    }

    debounceTimerRef.current = setTimeout(() => {
      runSearch(value)
    }, 350)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [value, runSearch])

  // Close suggestions on outside click.
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Cleanup on unmount.
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
    setNoResults(false)
    setSelectedIndex(-1)
  }

  const handleClear = () => {
    onChange("")
    setSuggestions([])
    setShowSuggestions(false)
    setNoResults(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Escape") setShowSuggestions(false)
      return
    }

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
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          e.preventDefault()
          handleSelect(suggestions[selectedIndex].label)
        }
        break
      case "Tab":
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
    <div ref={wrapperRef} className={`relative ${className || ""}`}>
      <div className="flex items-center border rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <MapPin className="ml-3 h-4 w-4 text-muted-foreground flex-shrink-0" />
        <Input
          id={id}
          ref={inputRef}
          placeholder={placeholder || "Search a city, address, or place…"}
          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
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
        {isLoading && <Loader2 className="h-4 w-4 text-muted-foreground animate-spin flex-shrink-0" />}
        {!isLoading && value.length > 0 && (
          <button
            type="button"
            aria-label="Clear location"
            onClick={handleClear}
            className="mr-2 ml-1 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted flex-shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {showSuggestions && (suggestions.length > 0 || noResults) && (
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

          {noResults && (
            <div className="px-3 py-3 text-sm text-muted-foreground">
              No matches for &ldquo;{value}&rdquo;. You can still use it as a custom location.
            </div>
          )}

          {suggestions.length > 0 &&
            !suggestions.some((s) => s.label.toLowerCase() === value.toLowerCase()) && (
              <div className="px-3 py-2 text-xs text-muted-foreground border-t bg-gray-50 dark:bg-white/5">
                Search cities, addresses, businesses, or landmarks
              </div>
            )}
        </div>
      )}
    </div>
  )
}
