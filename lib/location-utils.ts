/**
 * Location normalization utilities
 * Maps abbreviations to full names and vice versa for better search matching
 */

// US State abbreviations and full names
export const US_STATES: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
  DC: "Washington D.C.",
}

// Reverse mapping: full names to abbreviations
export const STATE_ABBREVIATIONS: Record<string, string> = Object.entries(US_STATES).reduce(
  (acc, [abbr, name]) => {
    acc[name.toLowerCase()] = abbr
    return acc
  },
  {} as Record<string, string>
)

// Common city name variations and aliases
export const CITY_ALIASES: Record<string, string[]> = {
  "new york": ["nyc", "new york city", "manhattan", "the big apple"],
  "los angeles": ["la", "l.a.", "hollywood"],
  "san francisco": ["sf", "san fran", "the bay", "bay area"],
  "las vegas": ["vegas"],
  "new orleans": ["nola", "the big easy"],
  "washington d.c.": ["dc", "d.c.", "washington dc", "the district"],
  "philadelphia": ["philly"],
  "fort worth": ["ft worth", "ft. worth"],
  "saint louis": ["st louis", "st. louis"],
  "saint paul": ["st paul", "st. paul"],
  "fort lauderdale": ["ft lauderdale", "ft. lauderdale"],
}

// Country abbreviations
export const COUNTRY_CODES: Record<string, string> = {
  US: "United States",
  USA: "United States",
  UK: "United Kingdom",
  GB: "United Kingdom",
  UAE: "United Arab Emirates",
  NZ: "New Zealand",
}

/**
 * Normalize a location string by expanding abbreviations
 * @param location - The location string to normalize
 * @returns An array of possible location variations to search for
 */
export function normalizeLocation(location: string): string[] {
  if (!location) return []

  const normalized = location.trim().toLowerCase()
  const variations: Set<string> = new Set([normalized])

  // Check if it's a state abbreviation (e.g., "TX")
  const upperLocation = location.toUpperCase().trim()
  if (US_STATES[upperLocation]) {
    variations.add(US_STATES[upperLocation].toLowerCase())
    variations.add(upperLocation.toLowerCase())
  }

  // Check if it's a full state name
  if (STATE_ABBREVIATIONS[normalized]) {
    variations.add(STATE_ABBREVIATIONS[normalized].toLowerCase())
  }

  // Check for city aliases
  for (const [city, aliases] of Object.entries(CITY_ALIASES)) {
    if (normalized === city || aliases.includes(normalized)) {
      variations.add(city)
      aliases.forEach(alias => variations.add(alias))
    }
  }

  // Check for country codes
  if (COUNTRY_CODES[upperLocation]) {
    variations.add(COUNTRY_CODES[upperLocation].toLowerCase())
  }

  // Handle "City, STATE" format (e.g., "Austin, TX" or "Austin, Texas")
  const parts = location.split(",").map(p => p.trim())
  if (parts.length === 2) {
    const [city, stateOrCountry] = parts
    const cityLower = city.toLowerCase()
    const stateUpper = stateOrCountry.toUpperCase()

    // If second part is a state abbreviation
    if (US_STATES[stateUpper]) {
      variations.add(`${cityLower}, ${US_STATES[stateUpper].toLowerCase()}`)
      variations.add(`${cityLower}, ${stateUpper.toLowerCase()}`)
    }

    // If second part is a full state name
    const stateLower = stateOrCountry.toLowerCase()
    if (STATE_ABBREVIATIONS[stateLower]) {
      variations.add(`${cityLower}, ${STATE_ABBREVIATIONS[stateLower].toLowerCase()}`)
      variations.add(`${cityLower}, ${stateLower}`)
    }
  }

  return Array.from(variations)
}

/**
 * Check if two locations match (considering abbreviations and variations)
 * @param location1 - First location
 * @param location2 - Second location
 * @returns Whether the locations match
 */
export function locationsMatch(location1: string, location2: string): boolean {
  if (!location1 || !location2) return false

  const variations1 = normalizeLocation(location1)
  const variations2 = normalizeLocation(location2)

  // Check for any overlap
  for (const v1 of variations1) {
    for (const v2 of variations2) {
      if (v1.includes(v2) || v2.includes(v1)) {
        return true
      }
    }
  }

  return false
}

/**
 * Search locations with normalization support
 * Returns true if the search term matches the location
 * @param searchTerm - What the user searched for
 * @param location - The location to check against
 * @returns Whether there's a match
 */
export function locationMatchesSearch(searchTerm: string, location: string): boolean {
  if (!searchTerm || !location) return false

  const searchVariations = normalizeLocation(searchTerm)
  const locationLower = location.toLowerCase()

  // Check if any variation of the search term is in the location
  for (const variation of searchVariations) {
    if (locationLower.includes(variation)) {
      return true
    }
  }

  // Also check if the location matches any variation
  const locationVariations = normalizeLocation(location)
  const searchLower = searchTerm.toLowerCase()

  for (const variation of locationVariations) {
    if (variation.includes(searchLower)) {
      return true
    }
  }

  return false
}

/**
 * Get display format for a location (standardized)
 * @param location - Raw location string
 * @returns Formatted location for display
 */
export function formatLocationForDisplay(location: string): string {
  if (!location) return ""

  const parts = location.split(",").map(p => p.trim())

  if (parts.length === 2) {
    const [city, stateOrCountry] = parts
    const stateUpper = stateOrCountry.toUpperCase()

    // If it's a state abbreviation, keep it as abbreviation for display
    if (US_STATES[stateUpper]) {
      return `${city}, ${stateUpper}`
    }

    // If it's a full state name, convert to abbreviation for cleaner display
    const stateLower = stateOrCountry.toLowerCase()
    if (STATE_ABBREVIATIONS[stateLower]) {
      return `${city}, ${STATE_ABBREVIATIONS[stateLower]}`
    }
  }

  return location
}

/**
 * Extract state/region from a location string
 * @param location - Location string (e.g., "Austin, TX" or "Austin, Texas")
 * @returns The state/region name or null
 */
export function extractState(location: string): string | null {
  if (!location) return null

  const parts = location.split(",").map(p => p.trim())

  if (parts.length >= 2) {
    const stateOrCountry = parts[1]
    const stateUpper = stateOrCountry.toUpperCase()

    // If it's a state abbreviation
    if (US_STATES[stateUpper]) {
      return US_STATES[stateUpper]
    }

    // If it's a full state name
    const stateLower = stateOrCountry.toLowerCase()
    if (STATE_ABBREVIATIONS[stateLower]) {
      return stateOrCountry
    }

    return stateOrCountry
  }

  // Check if the whole string is a state
  const upper = location.toUpperCase().trim()
  if (US_STATES[upper]) {
    return US_STATES[upper]
  }

  const lower = location.toLowerCase().trim()
  if (STATE_ABBREVIATIONS[lower]) {
    return location
  }

  return null
}

/**
 * Get all locations in the same state/region
 * Useful for "similar locations" features
 * @param location - Reference location
 * @param allLocations - Array of all available locations
 * @returns Locations in the same state/region
 */
export function getSameStateLocations(location: string, allLocations: string[]): string[] {
  const state = extractState(location)
  if (!state) return []

  return allLocations.filter(loc => {
    const locState = extractState(loc)
    return locState && locState.toLowerCase() === state.toLowerCase() && loc !== location
  })
}
