import { describe, it, expect, vi, beforeEach } from 'vitest'

// Create a chainable mock that returns itself for all methods
const createChainableMock = (finalResult: any) => {
  const mock: any = {
    from: vi.fn(() => mock),
    select: vi.fn(() => mock),
    insert: vi.fn(() => mock),
    eq: vi.fn(() => mock),
    or: vi.fn(() => mock),
    ilike: vi.fn(() => mock),
    gte: vi.fn(() => mock),
    lte: vi.fn(() => mock),
    limit: vi.fn(() => mock),
    order: vi.fn(() => mock),
    // Make it thenable (awaitable) to resolve to final result
    then: vi.fn((resolve) => Promise.resolve(finalResult).then(resolve)),
  }
  return mock
}

let mockSupabaseClient: ReturnType<typeof createChainableMock>

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}))

import { searchContent, getPopularSearches, saveSearchHistory, getSearchSuggestions } from '@/lib/search-service'

describe('search-service', () => {
  describe('searchContent', () => {
    it('should return empty results for empty query', async () => {
      mockSupabaseClient = createChainableMock({ data: [], error: null })
      const results = await searchContent('')
      expect(results.itineraries).toHaveLength(0)
      expect(results.users).toHaveLength(0)
      expect(results.totalCount).toBe(0)
    })

    it('should return empty results for whitespace-only query', async () => {
      mockSupabaseClient = createChainableMock({ data: [], error: null })
      const results = await searchContent('   ')
      expect(results.totalCount).toBe(0)
    })

    it('should search itineraries and return mapped results', async () => {
      const mockItineraryData = [{
        id: 'itin-1',
        title: 'Beach Trip',
        description: 'Fun beach trip',
        location: 'Miami',
        image_url: 'https://example.com/beach.jpg',
        start_date: '2024-06-01',
        end_date: '2024-06-07',
        created_at: '2024-01-01',
        profiles: { username: 'user1', name: 'User One', avatar_url: null },
      }]

      mockSupabaseClient = createChainableMock({ data: mockItineraryData, error: null })

      const results = await searchContent('beach')

      expect(results.itineraries).toHaveLength(1)
      expect(results.itineraries[0].type).toBe('itinerary')
      expect(results.itineraries[0].title).toBe('Beach Trip')
      expect(results.itineraries[0].id).toBe('itin-1')
    })

    it('should search users when type filter is "user"', async () => {
      const mockUserData = [{
        id: 'user-1',
        username: 'beachlover',
        name: 'Beach Lover',
        bio: 'I love beaches',
        avatar_url: null,
        created_at: '2024-01-01',
      }]

      mockSupabaseClient = createChainableMock({ data: mockUserData, error: null })

      const results = await searchContent('beach', { type: 'user' })

      expect(results.users).toHaveLength(1)
      expect(results.users[0].type).toBe('user')
      expect(results.users[0].username).toBe('beachlover')
    })

    it('should call from with correct tables', async () => {
      mockSupabaseClient = createChainableMock({ data: [], error: null })

      await searchContent('beach', { type: 'itinerary' })
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('itineraries')
    })

    it('should call from with profiles table for user search', async () => {
      mockSupabaseClient = createChainableMock({ data: [], error: null })

      await searchContent('beach', { type: 'user' })
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles')
    })

    it('should set is_public filter for itineraries', async () => {
      mockSupabaseClient = createChainableMock({ data: [], error: null })

      await searchContent('trip', { type: 'itinerary' })
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('is_public', true)
    })

    it('should respect the limit parameter', async () => {
      mockSupabaseClient = createChainableMock({ data: [], error: null })

      await searchContent('trip', undefined, 5)
      expect(mockSupabaseClient.limit).toHaveBeenCalledWith(5)
    })

    it('should handle search errors gracefully', async () => {
      mockSupabaseClient = createChainableMock({ data: null, error: { message: 'Search failed' } })

      const results = await searchContent('beach')

      // Should return empty results instead of throwing
      expect(results.totalCount).toBe(0)
    })

    it('should map itinerary results correctly', async () => {
      const mockItineraryData = [{
        id: 'itin-1',
        title: 'Beach Vacation',
        description: 'A fun trip',
        image_url: 'https://example.com/image.jpg',
        location: 'Miami, FL',
        start_date: '2024-06-01',
        end_date: '2024-06-07',
        created_at: '2024-01-01',
        profiles: {
          username: 'traveler',
          name: 'John Traveler',
          avatar_url: 'https://example.com/avatar.jpg',
        },
      }]

      mockSupabaseClient = createChainableMock({ data: mockItineraryData, error: null })

      const results = await searchContent('beach', { type: 'itinerary' })

      expect(results.itineraries[0]).toEqual({
        id: 'itin-1',
        type: 'itinerary',
        title: 'Beach Vacation',
        description: 'A fun trip',
        image_url: 'https://example.com/image.jpg',
        location: 'Miami, FL',
        start_date: '2024-06-01',
        end_date: '2024-06-07',
        created_at: '2024-01-01',
        username: 'traveler',
        name: 'John Traveler',
        avatar_url: 'https://example.com/avatar.jpg',
      })
    })

    it('should map user results correctly', async () => {
      const mockUserData = [{
        id: 'user-1',
        username: 'beachlover',
        name: 'Beach Lover',
        bio: 'I love the ocean',
        avatar_url: 'https://example.com/avatar.jpg',
        created_at: '2024-01-01',
      }]

      mockSupabaseClient = createChainableMock({ data: mockUserData, error: null })

      const results = await searchContent('beach', { type: 'user' })

      expect(results.users[0]).toEqual({
        id: 'user-1',
        type: 'user',
        username: 'beachlover',
        name: 'Beach Lover',
        bio: 'I love the ocean',
        avatar_url: 'https://example.com/avatar.jpg',
        created_at: '2024-01-01',
        title: 'Beach Lover',
        description: 'I love the ocean',
      })
    })

    it('should use username as title fallback when name is missing', async () => {
      const mockUserData = [{
        id: 'user-1',
        username: 'beachlover',
        name: null,
        bio: null,
        avatar_url: null,
        created_at: '2024-01-01',
      }]

      mockSupabaseClient = createChainableMock({ data: mockUserData, error: null })

      const results = await searchContent('beach', { type: 'user' })

      expect(results.users[0].title).toBe('beachlover')
    })

    it('should use "Unknown User" when both name and username are missing', async () => {
      const mockUserData = [{
        id: 'user-1',
        username: null,
        name: null,
        bio: null,
        avatar_url: null,
        created_at: '2024-01-01',
      }]

      mockSupabaseClient = createChainableMock({ data: mockUserData, error: null })

      const results = await searchContent('beach', { type: 'user' })

      expect(results.users[0].title).toBe('Unknown User')
    })
  })

  describe('getPopularSearches', () => {
    it('should return default popular searches', async () => {
      const searches = await getPopularSearches()
      expect(searches).toContain('Weekend getaway')
      expect(searches).toContain('Beach vacation')
      expect(searches).toContain('City tour')
    })

    it('should respect the limit parameter', async () => {
      const searches = await getPopularSearches(3)
      expect(searches).toHaveLength(3)
    })

    it('should return at most 8 items by default', async () => {
      const searches = await getPopularSearches(100)
      expect(searches.length).toBeLessThanOrEqual(8)
    })
  })

  describe('saveSearchHistory', () => {
    beforeEach(() => {
      mockSupabaseClient = createChainableMock({ error: null })
    })

    it('should not save empty queries', async () => {
      await saveSearchHistory('user-1', '')
      expect(mockSupabaseClient.from).not.toHaveBeenCalled()
    })

    it('should not save whitespace-only queries', async () => {
      await saveSearchHistory('user-1', '   ')
      expect(mockSupabaseClient.from).not.toHaveBeenCalled()
    })

    it('should save valid search queries', async () => {
      await saveSearchHistory('user-1', 'beach vacation')

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_interactions')
      expect(mockSupabaseClient.insert).toHaveBeenCalled()
    })
  })

  describe('getSearchSuggestions', () => {
    it('should return empty array for empty query', async () => {
      mockSupabaseClient = createChainableMock({ data: [], error: null })
      const suggestions = await getSearchSuggestions('')
      expect(suggestions).toEqual([])
    })

    it('should return empty array for whitespace-only query', async () => {
      mockSupabaseClient = createChainableMock({ data: [], error: null })
      const suggestions = await getSearchSuggestions('   ')
      expect(suggestions).toEqual([])
    })

    it('should query itineraries for suggestions', async () => {
      mockSupabaseClient = createChainableMock({
        data: [
          { title: 'Beach Trip', location: 'Miami' },
          { title: 'Beach Vacation', location: 'California' },
        ],
        error: null,
      })

      await getSearchSuggestions('bea')

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('itineraries')
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('is_public', true)
    })

    it('should return matching titles and locations', async () => {
      mockSupabaseClient = createChainableMock({
        data: [
          { title: 'Beach Trip', location: 'Miami' },
          { title: 'Beach Party', location: 'Beachwood' },
        ],
        error: null,
      })

      const suggestions = await getSearchSuggestions('beach')

      expect(suggestions).toContain('Beach Trip')
      expect(suggestions).toContain('Beach Party')
    })

    it('should filter suggestions by prefix match', async () => {
      mockSupabaseClient = createChainableMock({
        data: [
          { title: 'Beach Trip', location: 'Miami' },
          { title: 'Great Beach', location: 'Beach City' },
        ],
        error: null,
      })

      const suggestions = await getSearchSuggestions('beach')

      expect(suggestions).toContain('Beach Trip')
      expect(suggestions).toContain('Beach City')
      expect(suggestions).not.toContain('Great Beach')
    })

    it('should return unique suggestions', async () => {
      mockSupabaseClient = createChainableMock({
        data: [
          { title: 'Beach Trip', location: 'Beach Trip' },
        ],
        error: null,
      })

      const suggestions = await getSearchSuggestions('beach')

      const uniqueSuggestions = new Set(suggestions)
      expect(suggestions.length).toBe(uniqueSuggestions.size)
    })

    it('should handle query errors gracefully', async () => {
      mockSupabaseClient = createChainableMock({
        data: null,
        error: { message: 'Query failed' },
      })

      const suggestions = await getSearchSuggestions('beach')

      expect(suggestions).toEqual([])
    })

    it('should be case-insensitive for prefix matching', async () => {
      mockSupabaseClient = createChainableMock({
        data: [
          { title: 'BEACH TRIP', location: 'Miami' },
          { title: 'beach vacation', location: 'California' },
        ],
        error: null,
      })

      const suggestions = await getSearchSuggestions('Beach')

      expect(suggestions).toContain('BEACH TRIP')
      expect(suggestions).toContain('beach vacation')
    })
  })
})
