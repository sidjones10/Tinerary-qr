"use client"

import { useState, useRef, useEffect } from "react"
import { MapPin } from "lucide-react"
import { Input } from "@/components/ui/input"

interface LocationAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

// Popular locations for autocomplete suggestions organized by type
const LOCATION_DATA = {
  // US Cities with state abbreviations
  cities: [
    "New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX", "Phoenix, AZ",
    "Philadelphia, PA", "San Antonio, TX", "San Diego, CA", "Dallas, TX", "San Jose, CA",
    "Austin, TX", "Jacksonville, FL", "Fort Worth, TX", "Columbus, OH", "Charlotte, NC",
    "San Francisco, CA", "Indianapolis, IN", "Seattle, WA", "Denver, CO", "Boston, MA",
    "Miami, FL", "Las Vegas, NV", "Portland, OR", "Nashville, TN", "Atlanta, GA",
    "Orlando, FL", "New Orleans, LA", "Savannah, GA", "Charleston, SC", "Santa Fe, NM",
  ],
  // US States
  states: [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
    "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
    "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
    "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
    "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
    "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
    "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
    "Wisconsin", "Wyoming",
  ],
  // International Cities
  international: [
    "London, United Kingdom", "Paris, France", "Tokyo, Japan", "Rome, Italy", "Barcelona, Spain",
    "Amsterdam, Netherlands", "Berlin, Germany", "Sydney, Australia", "Dubai, UAE",
    "Singapore", "Hong Kong", "Bangkok, Thailand", "Istanbul, Turkey", "Prague, Czech Republic",
    "Vienna, Austria", "Copenhagen, Denmark", "Dublin, Ireland", "Lisbon, Portugal",
    "Athens, Greece", "Budapest, Hungary", "Warsaw, Poland", "Stockholm, Sweden",
    "Oslo, Norway", "Helsinki, Finland", "Zurich, Switzerland", "Brussels, Belgium",
    "Madrid, Spain", "Munich, Germany", "Venice, Italy", "Florence, Italy", "Milan, Italy",
    "Edinburgh, Scotland", "Dublin, Ireland", "Reykjavik, Iceland", "Montreal, Canada",
    "Toronto, Canada", "Vancouver, Canada", "Mexico City, Mexico", "Cancun, Mexico",
  ],
  // Countries
  countries: [
    "United States", "Canada", "Mexico", "United Kingdom", "France", "Germany", "Italy",
    "Spain", "Japan", "Australia", "Brazil", "Argentina", "Chile", "Peru", "China", "India",
    "Thailand", "Vietnam", "South Korea", "New Zealand", "Greece", "Portugal", "Netherlands",
    "Belgium", "Switzerland", "Austria", "Ireland", "Iceland", "Norway", "Sweden", "Denmark",
    "Finland", "Poland", "Czech Republic", "Hungary", "Croatia", "Turkey", "Egypt", "Morocco",
  ],
  // Popular regions, landmarks, and areas
  regions: [
    "Napa Valley, CA", "Lake Tahoe, CA", "Big Sur, CA", "Yosemite National Park, CA",
    "Yellowstone National Park, WY", "Grand Canyon, AZ", "Sedona, AZ", "Zion National Park, UT",
    "French Riviera, France", "Tuscany, Italy", "Provence, France", "Loire Valley, France",
    "Scottish Highlands, UK", "Swiss Alps, Switzerland", "Amalfi Coast, Italy",
    "Cinque Terre, Italy", "Santorini, Greece", "Mykonos, Greece", "Bali, Indonesia",
    "Maldives", "Hawaii, USA", "Maui, HI", "Oahu, HI", "Kauai, HI", "Iceland",
    "New England, USA", "Pacific Northwest, USA", "Southern California", "Northern California",
    "The Hamptons, NY", "Martha's Vineyard, MA", "Nantucket, MA", "Outer Banks, NC",
  ],
}

// Flatten all locations into a single array for searching
const POPULAR_LOCATIONS = [
  ...LOCATION_DATA.cities,
  ...LOCATION_DATA.states,
  ...LOCATION_DATA.international,
  ...LOCATION_DATA.countries,
  ...LOCATION_DATA.regions,
]

export function LocationAutocomplete({ value, onChange, placeholder, className }: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Filter suggestions based on input
  useEffect(() => {
    if (value.length > 0) {
      const filtered = POPULAR_LOCATIONS.filter((location) =>
        location.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8) // Limit to 8 suggestions

      setSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [value])

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

  const handleSelect = (location: string) => {
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
          placeholder={placeholder || "e.g., San Antonio, Texas or Paris, France"}
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
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion}-${index}`}
              className={`px-3 py-2 cursor-pointer flex items-center gap-2 ${
                index === selectedIndex
                  ? "bg-orange-50 text-orange-900"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => handleSelect(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="text-sm">{suggestion}</span>
            </div>
          ))}
          {value.length > 0 && !suggestions.some(s => s.toLowerCase() === value.toLowerCase()) && (
            <div className="px-3 py-2 text-xs text-muted-foreground border-t bg-gray-50">
              Type any location - not limited to suggestions
            </div>
          )}
        </div>
      )}
    </div>
  )
}
