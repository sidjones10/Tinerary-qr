import Fuse from "fuse.js"

export interface SearchableItinerary {
  id: string
  title: string
  description: string | null
  location: string | null
  destination?: string | null
  host_name?: string | null
  host_username?: string | null
  [key: string]: unknown
}

// Fuse.js options for TikTok-like fuzzy search
const fuseOptions: Fuse.IFuseOptions<SearchableItinerary> = {
  // Include score for ranking
  includeScore: true,
  // Include matches for highlighting
  includeMatches: true,
  // Minimum score threshold (0 = perfect match, 1 = no match)
  // Lower threshold means more strict matching
  threshold: 0.4,
  // Location and distance affect position-based matching
  location: 0,
  distance: 100,
  // Fields to search with weights
  keys: [
    { name: "title", weight: 0.4 },
    { name: "description", weight: 0.2 },
    { name: "location", weight: 0.2 },
    { name: "destination", weight: 0.15 },
    { name: "host_name", weight: 0.05 },
  ],
  // Use extended search for more powerful queries
  useExtendedSearch: true,
  // Ignore location for better fuzzy matching
  ignoreLocation: true,
  // Find all matches
  findAllMatches: true,
  // Minimum characters before search
  minMatchCharLength: 2,
  // Sort by score
  sortFn: (a, b) => a.score - b.score,
}

export interface FuzzySearchResult<T> {
  item: T
  score: number
  matches?: readonly Fuse.FuseResultMatch[]
}

export function createFuzzySearcher<T extends SearchableItinerary>(items: T[]) {
  const fuse = new Fuse(items, fuseOptions)

  return {
    search: (query: string): FuzzySearchResult<T>[] => {
      if (!query.trim()) {
        return items.map((item) => ({ item, score: 0 }))
      }

      const results = fuse.search(query)
      return results.map((result) => ({
        item: result.item,
        score: result.score ?? 0,
        matches: result.matches,
      }))
    },
    // Get suggestions based on partial input
    getSuggestions: (query: string, limit = 5): string[] => {
      if (!query.trim()) return []

      const results = fuse.search(query).slice(0, limit)
      const suggestions = new Set<string>()

      results.forEach((result) => {
        // Add matching titles as suggestions
        if (result.item.title) {
          suggestions.add(result.item.title)
        }
        // Add matching locations as suggestions
        if (result.item.location) {
          suggestions.add(result.item.location)
        }
        if (result.item.destination) {
          suggestions.add(result.item.destination)
        }
      })

      return Array.from(suggestions).slice(0, limit)
    },
  }
}

// Helper to highlight matched text
export function highlightMatches(
  text: string,
  matches: readonly Fuse.FuseResultMatch[] | undefined,
  key: string
): { text: string; highlighted: boolean }[] {
  if (!matches) return [{ text, highlighted: false }]

  const match = matches.find((m) => m.key === key)
  if (!match || !match.indices.length) return [{ text, highlighted: false }]

  const result: { text: string; highlighted: boolean }[] = []
  let lastIndex = 0

  match.indices.forEach(([start, end]) => {
    // Add non-highlighted text before this match
    if (start > lastIndex) {
      result.push({ text: text.slice(lastIndex, start), highlighted: false })
    }
    // Add highlighted match
    result.push({ text: text.slice(start, end + 1), highlighted: true })
    lastIndex = end + 1
  })

  // Add remaining text after last match
  if (lastIndex < text.length) {
    result.push({ text: text.slice(lastIndex), highlighted: false })
  }

  return result
}
