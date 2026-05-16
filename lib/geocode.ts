// Shared geocoding service backed by OpenStreetMap Nominatim.
// Centralizes forward search, bias geocoding, and reverse geocoding so
// location search behaves consistently everywhere it's used.

const NOMINATIM = "https://nominatim.openstreetmap.org"

// Nominatim classes that represent businesses / points of interest.
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
    hamlet?: string
    state?: string
    country?: string
    postcode?: string
  }
}

export interface PlaceResult {
  /** Human-readable, trimmed label suitable for display and storage. */
  label: string
  /** True when the result is a business / point of interest. */
  isPOI: boolean
  lat: number
  lon: number
}

export interface SearchOptions {
  /** Coordinates to bias results toward (e.g. the itinerary's main location). */
  bias?: { lat: number; lon: number } | null
  /** Abort signal so in-flight requests can be cancelled. */
  signal?: AbortSignal
  /** Max number of results (default 8). */
  limit?: number
}

function buildLabel(result: NominatimResult): { label: string; isPOI: boolean } {
  const isPOI = POI_CLASSES.has(result.class)
  const addr = result.address

  if (isPOI && result.name && addr) {
    // Businesses / POIs: "Starbucks, 123 Main St, Austin, TX"
    const parts: string[] = [result.name]
    if (addr.house_number && addr.road) {
      parts.push(`${addr.house_number} ${addr.road}`)
    } else if (addr.road) {
      parts.push(addr.road)
    }
    const city = addr.city || addr.town || addr.village || addr.hamlet
    if (city) parts.push(city)
    if (addr.state) parts.push(addr.state)
    return { label: parts.join(", "), isPOI: true }
  }

  // Regular addresses: trim the verbose display_name down to something usable.
  const parts = result.display_name.split(", ")
  if (parts.length <= 3) return { label: result.display_name, isPOI: false }
  const filtered = parts.filter((part) => !/^\d{4,}$/.test(part.trim()))
  if (filtered.length <= 4) return { label: filtered.join(", "), isPOI: false }
  return { label: [...filtered.slice(0, 2), ...filtered.slice(-2)].join(", "), isPOI: false }
}

// Small bounded cache so repeated queries don't re-hit Nominatim (which
// rate-limits to ~1 req/sec) and results feel instant on retype.
const searchCache = new Map<string, PlaceResult[]>()
const SEARCH_CACHE_LIMIT = 60

function cacheGet(key: string): PlaceResult[] | undefined {
  const hit = searchCache.get(key)
  if (hit) {
    // Refresh recency.
    searchCache.delete(key)
    searchCache.set(key, hit)
  }
  return hit
}

function cacheSet(key: string, value: PlaceResult[]) {
  searchCache.set(key, value)
  if (searchCache.size > SEARCH_CACHE_LIMIT) {
    const oldest = searchCache.keys().next().value
    if (oldest !== undefined) searchCache.delete(oldest)
  }
}

/**
 * Search for places (addresses, cities, and businesses/POIs) matching a query.
 * Throws on network/HTTP errors so callers can fall back gracefully.
 */
export async function searchPlaces(query: string, opts: SearchOptions = {}): Promise<PlaceResult[]> {
  const q = query.trim()
  if (q.length === 0) return []

  const { bias, signal, limit = 8 } = opts
  const cacheKey = `${q.toLowerCase()}|${bias ? `${bias.lat.toFixed(2)},${bias.lon.toFixed(2)}` : ""}|${limit}`
  const cached = cacheGet(cacheKey)
  if (cached) return cached

  const params = new URLSearchParams({
    q,
    format: "json",
    limit: String(limit),
    addressdetails: "1",
    dedupe: "1",
  })

  if (bias) {
    // ~50km viewbox around the bias location. bounded=0 keeps it a soft
    // preference rather than a hard filter.
    const offset = 0.45
    params.set("viewbox", `${bias.lon - offset},${bias.lat + offset},${bias.lon + offset},${bias.lat - offset}`)
    params.set("bounded", "0")
  }

  const response = await fetch(`${NOMINATIM}/search?${params.toString()}`, {
    signal,
    headers: { Accept: "application/json", "Accept-Language": "en" },
  })

  if (!response.ok) throw new Error(`Nominatim search failed: ${response.status}`)

  const results: NominatimResult[] = await response.json()

  const seen = new Set<string>()
  const places: PlaceResult[] = []
  for (const result of results) {
    const { label, isPOI } = buildLabel(result)
    if (seen.has(label)) continue
    seen.add(label)
    places.push({ label, isPOI, lat: parseFloat(result.lat), lon: parseFloat(result.lon) })
  }

  cacheSet(cacheKey, places)
  return places
}

// Cache forward-geocode lookups (used for biasing) to avoid repeated work.
const geocodeCache = new Map<string, { lat: number; lon: number } | null>()

/** Resolve a free-text location to coordinates. Returns null if not found. */
export async function geocodeLocation(location: string): Promise<{ lat: number; lon: number } | null> {
  const key = location.toLowerCase().trim()
  if (key.length === 0) return null
  if (geocodeCache.has(key)) return geocodeCache.get(key)!

  try {
    const params = new URLSearchParams({ q: location, format: "json", limit: "1" })
    const response = await fetch(`${NOMINATIM}/search?${params.toString()}`, {
      headers: { Accept: "application/json", "Accept-Language": "en" },
    })
    if (!response.ok) throw new Error("Geocoding failed")
    const data = await response.json()
    if (Array.isArray(data) && data.length > 0) {
      const coords = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
      geocodeCache.set(key, coords)
      return coords
    }
  } catch {
    // Fall through to null.
  }
  geocodeCache.set(key, null)
  return null
}

/**
 * Turn coordinates (e.g. from the browser Geolocation API) into a readable
 * place label like "Brooklyn, New York" instead of raw lat/lon.
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lon),
      format: "json",
      zoom: "14",
      addressdetails: "1",
    })
    const response = await fetch(`${NOMINATIM}/reverse?${params.toString()}`, {
      headers: { Accept: "application/json", "Accept-Language": "en" },
    })
    if (!response.ok) throw new Error("Reverse geocoding failed")
    const data = await response.json()
    if (!data) return null

    const addr = data.address as NominatimResult["address"] | undefined
    if (addr) {
      const city = addr.city || addr.town || addr.village || addr.hamlet
      const region = addr.state || addr.country
      if (city && region) return `${city}, ${region}`
      if (city) return city
      if (region) return region
    }
    return typeof data.display_name === "string" ? data.display_name : null
  } catch {
    return null
  }
}
