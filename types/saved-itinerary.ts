/**
 * Row shapes for the `saved_itineraries` join queries used by /saved and /liked.
 *
 * PostgREST returns a nested object for a to-one relation, but the generated
 * types widen it to an array. These interfaces describe the runtime shape;
 * callers that also handle the array form should keep their `Array.isArray`
 * guards.
 */

export interface SavedItineraryMetrics {
  like_count?: number | null
  save_count?: number | null
  view_count?: number | null
}

export interface SavedItineraryAuthor {
  name?: string | null
  username?: string | null
  avatar_url?: string | null
}

export interface SavedItinerarySummary {
  id: string
  title?: string | null
  description?: string | null
  location?: string | null
  start_date?: string | null
  end_date?: string | null
  image_url?: string | null
  is_public?: boolean | null
  user_id?: string | null
  profiles?: SavedItineraryAuthor | SavedItineraryAuthor[] | null
  itinerary_metrics?: SavedItineraryMetrics | SavedItineraryMetrics[] | null
}

/** One row of `saved_itineraries` with its joined itinerary. */
export interface SavedItineraryRow {
  id: string
  created_at?: string | null
  /** "like" | "save" — present on the /liked query, absent on /saved. */
  type?: string | null
  itineraries?: SavedItinerarySummary | null
}
