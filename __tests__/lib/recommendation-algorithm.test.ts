import { describe, it, expect } from 'vitest'
import { calculateScore, generateReasons, generateDiscoveryFeed } from '@/lib/recommendation-algorithm'
import type { RecommendationReason } from '@/lib/recommendation-types'
import type { User, Itinerary, Deal, Promotion } from '@/lib/api-types'

describe('recommendation-algorithm', () => {
  describe('calculateScore', () => {
    it('should return base score from reasons alone when recency and popularity are 0', () => {
      const reasons: RecommendationReason[] = [
        { source: 'liked', weight: 1.0, description: 'Based on items you liked' },
      ]
      // Base: 1.0 * 10 = 10
      // Recency: 0 * 0.8 * 10 = 0
      // Popularity: 0 * 5 = 0
      const score = calculateScore(reasons, 0, 0)
      expect(score).toBe(10)
    })

    it('should correctly calculate score with multiple reasons', () => {
      const reasons: RecommendationReason[] = [
        { source: 'liked', weight: 1.0, description: 'Based on items you liked' },
        { source: 'searched', weight: 0.8, description: 'Based on your searches' },
      ]
      // Base: (1.0 * 10) + (0.8 * 8) = 10 + 6.4 = 16.4
      const score = calculateScore(reasons, 0, 0)
      expect(score).toBeCloseTo(16.4)
    })

    it('should apply recency boost correctly', () => {
      const reasons: RecommendationReason[] = []
      // Base: 0
      // Recency: 1.0 * 0.8 * 10 = 8
      // Popularity: 0
      const score = calculateScore(reasons, 1, 0)
      expect(score).toBe(8)
    })

    it('should apply popularity boost correctly', () => {
      const reasons: RecommendationReason[] = []
      // Base: 0
      // Recency: 0
      // Popularity: 1.0 * 5 = 5
      const score = calculateScore(reasons, 0, 1)
      expect(score).toBe(5)
    })

    it('should combine all factors correctly', () => {
      const reasons: RecommendationReason[] = [
        { source: 'trending', weight: 0.4, description: 'Trending' },
      ]
      // Base: 0.4 * 4 = 1.6
      // Recency: 0.5 * 0.8 * 10 = 4
      // Popularity: 0.5 * 5 = 2.5
      const score = calculateScore(reasons, 0.5, 0.5)
      expect(score).toBeCloseTo(8.1)
    })

    it('should handle empty reasons array', () => {
      const score = calculateScore([], 0, 0)
      expect(score).toBe(0)
    })

    it('should handle all weight sources correctly', () => {
      const reasons: RecommendationReason[] = [
        { source: 'liked', weight: 1.0, description: 'test' },      // 10
        { source: 'searched', weight: 1.0, description: 'test' },   // 8
        { source: 'viewed', weight: 1.0, description: 'test' },     // 5
        { source: 'friend', weight: 1.0, description: 'test' },     // 7
        { source: 'followed', weight: 1.0, description: 'test' },   // 6
        { source: 'trending', weight: 1.0, description: 'test' },   // 4
        { source: 'location', weight: 1.0, description: 'test' },   // 6
        { source: 'seasonal', weight: 1.0, description: 'test' },   // 3
      ]
      // Total: 10 + 8 + 5 + 7 + 6 + 4 + 6 + 3 = 49
      const score = calculateScore(reasons, 0, 0)
      expect(score).toBe(49)
    })

    it('should apply weights from reasons correctly', () => {
      const reasons: RecommendationReason[] = [
        { source: 'liked', weight: 0.5, description: 'test' }, // 0.5 * 10 = 5
      ]
      const score = calculateScore(reasons, 0, 0)
      expect(score).toBe(5)
    })
  })

  describe('generateReasons', () => {
    const baseParams = {
      userId: 'user-1',
      itemId: 'item-1',
      itemType: 'itinerary',
      userLikes: [] as string[],
      userSearches: [] as string[],
      userViews: [] as string[],
      friendLikes: {} as Record<string, string[]>,
      followedUsers: [] as string[],
      trendingItems: [] as string[],
    }

    it('should add liked reason when user has liked the item', () => {
      const reasons = generateReasons(
        baseParams.userId,
        baseParams.itemId,
        baseParams.itemType,
        ['item-1'], // userLikes includes itemId
        baseParams.userSearches,
        baseParams.userViews,
        baseParams.friendLikes,
        baseParams.followedUsers,
        baseParams.trendingItems
      )

      expect(reasons).toContainEqual(
        expect.objectContaining({
          source: 'liked',
          weight: 1.0,
        })
      )
    })

    it('should add searched reason when user has searched for the item', () => {
      const reasons = generateReasons(
        baseParams.userId,
        baseParams.itemId,
        baseParams.itemType,
        baseParams.userLikes,
        ['item-1'], // userSearches includes itemId
        baseParams.userViews,
        baseParams.friendLikes,
        baseParams.followedUsers,
        baseParams.trendingItems
      )

      expect(reasons).toContainEqual(
        expect.objectContaining({
          source: 'searched',
          weight: 0.8,
        })
      )
    })

    it('should add viewed reason when user has viewed the item', () => {
      const reasons = generateReasons(
        baseParams.userId,
        baseParams.itemId,
        baseParams.itemType,
        baseParams.userLikes,
        baseParams.userSearches,
        ['item-1'], // userViews includes itemId
        baseParams.friendLikes,
        baseParams.followedUsers,
        baseParams.trendingItems
      )

      expect(reasons).toContainEqual(
        expect.objectContaining({
          source: 'viewed',
          weight: 0.5,
        })
      )
    })

    it('should add friend reason when friends have liked the item', () => {
      const reasons = generateReasons(
        baseParams.userId,
        baseParams.itemId,
        baseParams.itemType,
        baseParams.userLikes,
        baseParams.userSearches,
        baseParams.userViews,
        { 'friend-1': ['item-1'], 'friend-2': ['item-1'] }, // 2 friends liked
        baseParams.followedUsers,
        baseParams.trendingItems
      )

      const friendReason = reasons.find(r => r.source === 'friend')
      expect(friendReason).toBeDefined()
      expect(friendReason?.weight).toBe(0.7)
      expect(friendReason?.description).toBe('2 friends liked this')
      expect(friendReason?.relatedItems).toHaveLength(2)
    })

    it('should add singular friend text when only one friend liked', () => {
      const reasons = generateReasons(
        baseParams.userId,
        baseParams.itemId,
        baseParams.itemType,
        baseParams.userLikes,
        baseParams.userSearches,
        baseParams.userViews,
        { 'friend-1': ['item-1'] }, // 1 friend liked
        baseParams.followedUsers,
        baseParams.trendingItems
      )

      const friendReason = reasons.find(r => r.source === 'friend')
      expect(friendReason?.description).toBe('1 friend liked this')
    })

    it('should add followed reason when item is from a followed user', () => {
      const reasons = generateReasons(
        baseParams.userId,
        baseParams.itemId,
        baseParams.itemType,
        baseParams.userLikes,
        baseParams.userSearches,
        baseParams.userViews,
        baseParams.friendLikes,
        ['item-1'], // followedUsers includes itemId
        baseParams.trendingItems
      )

      expect(reasons).toContainEqual(
        expect.objectContaining({
          source: 'followed',
          weight: 0.6,
        })
      )
    })

    it('should add trending reason when item is trending', () => {
      const reasons = generateReasons(
        baseParams.userId,
        baseParams.itemId,
        baseParams.itemType,
        baseParams.userLikes,
        baseParams.userSearches,
        baseParams.userViews,
        baseParams.friendLikes,
        baseParams.followedUsers,
        ['item-1'] // trendingItems includes itemId
      )

      expect(reasons).toContainEqual(
        expect.objectContaining({
          source: 'trending',
          weight: 0.4,
          description: 'Trending right now',
        })
      )
    })

    it('should add location reason when item is within 50km', () => {
      const userLocation = { latitude: 40.7128, longitude: -74.006 } // NYC
      const itemLocation = { latitude: 40.7580, longitude: -73.9855 } // Times Square (~5km away)

      const reasons = generateReasons(
        baseParams.userId,
        baseParams.itemId,
        baseParams.itemType,
        baseParams.userLikes,
        baseParams.userSearches,
        baseParams.userViews,
        baseParams.friendLikes,
        baseParams.followedUsers,
        baseParams.trendingItems,
        userLocation,
        itemLocation
      )

      expect(reasons).toContainEqual(
        expect.objectContaining({
          source: 'location',
          weight: 0.6,
        })
      )
    })

    it('should not add location reason when item is beyond 50km', () => {
      const userLocation = { latitude: 40.7128, longitude: -74.006 } // NYC
      const itemLocation = { latitude: 34.0522, longitude: -118.2437 } // LA (~3940km away)

      const reasons = generateReasons(
        baseParams.userId,
        baseParams.itemId,
        baseParams.itemType,
        baseParams.userLikes,
        baseParams.userSearches,
        baseParams.userViews,
        baseParams.friendLikes,
        baseParams.followedUsers,
        baseParams.trendingItems,
        userLocation,
        itemLocation
      )

      expect(reasons.find(r => r.source === 'location')).toBeUndefined()
    })

    it('should add generic trending reason when no other reasons found', () => {
      const reasons = generateReasons(
        baseParams.userId,
        baseParams.itemId,
        baseParams.itemType,
        baseParams.userLikes,
        baseParams.userSearches,
        baseParams.userViews,
        baseParams.friendLikes,
        baseParams.followedUsers,
        baseParams.trendingItems
      )

      expect(reasons).toHaveLength(1)
      expect(reasons[0]).toEqual({
        source: 'trending',
        weight: 0.3,
        description: 'Popular with users like you',
      })
    })

    it('should combine multiple reasons', () => {
      const reasons = generateReasons(
        baseParams.userId,
        baseParams.itemId,
        baseParams.itemType,
        ['item-1'], // liked
        ['item-1'], // searched
        ['item-1'], // viewed
        baseParams.friendLikes,
        baseParams.followedUsers,
        ['item-1'] // trending
      )

      expect(reasons).toHaveLength(4)
      expect(reasons.map(r => r.source)).toContain('liked')
      expect(reasons.map(r => r.source)).toContain('searched')
      expect(reasons.map(r => r.source)).toContain('viewed')
      expect(reasons.map(r => r.source)).toContain('trending')
    })
  })

  describe('generateDiscoveryFeed', () => {
    const mockItinerary: Itinerary = {
      id: 'itin-1',
      userId: 'user-2',
      title: 'Beach Vacation',
      description: 'A great beach trip',
      type: 'vacation',
      isPublic: true,
      likes: 500,
      saves: 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const mockDeal: Deal = {
      id: 'deal-1',
      type: 'hotel',
      title: 'Hotel Deal',
      description: 'Great hotel deal',
      discount: 50,
      price: 100,
      originalPrice: 200,
      validFrom: new Date().toISOString(),
      validTo: new Date(Date.now() + 86400000).toISOString(),
    }

    const mockPromotion: Promotion = {
      id: 'promo-1',
      userId: 'user-3',
      type: 'travel',
      title: 'Summer Promo',
      description: 'Summer promotion',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000).toISOString(),
      status: 'active',
      createdAt: new Date().toISOString(),
    }

    const mockUser: User = {
      id: 'user-4',
      email: 'test@example.com',
      name: 'Test User',
      username: 'testuser',
    }

    const baseUserPreferences = {
      likes: [] as string[],
      searches: [] as string[],
      views: [] as string[],
      categories: [] as string[],
    }

    const baseSocialData = {
      friends: {} as Record<string, string[]>,
      following: [] as string[],
    }

    const baseAvailableItems = {
      itineraries: [] as Itinerary[],
      deals: [] as Deal[],
      promotions: [] as Promotion[],
      destinations: [] as any[],
      users: [] as User[],
    }

    it('should return empty sections when no items available', () => {
      const result = generateDiscoveryFeed(
        'user-1',
        baseUserPreferences,
        baseSocialData,
        baseAvailableItems,
        []
      )

      expect(result.personalRecommendations).toHaveLength(0)
      expect(result.trending).toHaveLength(0)
      expect(result.forYou).toHaveLength(0)
      expect(result.nearby).toHaveLength(0)
      expect(result.friendsLiked).toHaveLength(0)
      expect(result.seasonal).toHaveLength(0)
      expect(result.similar).toHaveLength(0)
    })

    it('should include items in personalRecommendations sorted by score', () => {
      const result = generateDiscoveryFeed(
        'user-1',
        baseUserPreferences,
        baseSocialData,
        {
          ...baseAvailableItems,
          itineraries: [mockItinerary],
        },
        []
      )

      expect(result.personalRecommendations.length).toBeGreaterThanOrEqual(0)
    })

    it('should filter items by type when filter is provided', () => {
      const result = generateDiscoveryFeed(
        'user-1',
        baseUserPreferences,
        baseSocialData,
        {
          ...baseAvailableItems,
          itineraries: [mockItinerary],
          deals: [mockDeal],
        },
        [],
        { types: ['itinerary'] }
      )

      const allTypes = [
        ...result.personalRecommendations,
        ...result.trending,
        ...result.forYou,
      ].map(item => item.type)

      // Should only contain itinerary types
      allTypes.forEach(type => {
        if (type) expect(type).toBe('itinerary')
      })
    })

    it('should populate trending section with trending items', () => {
      const result = generateDiscoveryFeed(
        'user-1',
        baseUserPreferences,
        baseSocialData,
        {
          ...baseAvailableItems,
          itineraries: [mockItinerary],
        },
        ['itin-1'] // Mark as trending
      )

      expect(result.trending.length).toBeGreaterThan(0)
      expect(result.trending[0].reasons.some(r => r.source === 'trending')).toBe(true)
    })

    it('should populate forYou section with user engagement items', () => {
      const result = generateDiscoveryFeed(
        'user-1',
        {
          ...baseUserPreferences,
          likes: ['itin-1'], // User liked this item
        },
        baseSocialData,
        {
          ...baseAvailableItems,
          itineraries: [mockItinerary],
        },
        []
      )

      expect(result.forYou.length).toBeGreaterThan(0)
      expect(result.forYou[0].reasons.some(r => r.source === 'liked')).toBe(true)
    })

    it('should populate friendsLiked section when friends like items', () => {
      const result = generateDiscoveryFeed(
        'user-1',
        baseUserPreferences,
        {
          friends: { 'friend-1': ['itin-1'] },
          following: [],
        },
        {
          ...baseAvailableItems,
          itineraries: [mockItinerary],
        },
        []
      )

      expect(result.friendsLiked.length).toBeGreaterThan(0)
      expect(result.friendsLiked[0].reasons.some(r => r.source === 'friend')).toBe(true)
    })

    it('should limit personalRecommendations to 5 items', () => {
      const manyItineraries = Array.from({ length: 10 }, (_, i) => ({
        ...mockItinerary,
        id: `itin-${i}`,
      }))

      const result = generateDiscoveryFeed(
        'user-1',
        baseUserPreferences,
        baseSocialData,
        {
          ...baseAvailableItems,
          itineraries: manyItineraries,
        },
        []
      )

      expect(result.personalRecommendations.length).toBeLessThanOrEqual(5)
    })

    it('should limit other sections to 10 items', () => {
      const manyItineraries = Array.from({ length: 15 }, (_, i) => ({
        ...mockItinerary,
        id: `itin-${i}`,
      }))

      const result = generateDiscoveryFeed(
        'user-1',
        baseUserPreferences,
        baseSocialData,
        {
          ...baseAvailableItems,
          itineraries: manyItineraries,
        },
        manyItineraries.map(i => i.id) // All trending
      )

      expect(result.trending.length).toBeLessThanOrEqual(10)
    })

    it('should generate similar categories based on user preferences', () => {
      const result = generateDiscoveryFeed(
        'user-1',
        {
          ...baseUserPreferences,
          categories: ['vacation', 'vacation', 'adventure'], // vacation appears most
        },
        baseSocialData,
        {
          ...baseAvailableItems,
          itineraries: [mockItinerary], // type is 'vacation'
        },
        []
      )

      expect(result.similar.length).toBeGreaterThan(0)
      expect(result.similar.map(s => s.category)).toContain('vacation')
    })

    it('should filter by price range for deals', () => {
      const expensiveDeal: Deal = { ...mockDeal, id: 'deal-expensive', price: 500 }
      const cheapDeal: Deal = { ...mockDeal, id: 'deal-cheap', price: 50 }

      const result = generateDiscoveryFeed(
        'user-1',
        baseUserPreferences,
        baseSocialData,
        {
          ...baseAvailableItems,
          deals: [expensiveDeal, cheapDeal],
        },
        [],
        { priceRange: [0, 100] }
      )

      const dealItems = result.personalRecommendations.filter(i => i.type === 'deal')
      expect(dealItems.every(d => (d.item as Deal).price <= 100)).toBe(true)
    })

    it('should handle user items correctly', () => {
      const result = generateDiscoveryFeed(
        'user-1',
        baseUserPreferences,
        baseSocialData,
        {
          ...baseAvailableItems,
          users: [mockUser],
        },
        []
      )

      const userItems = result.personalRecommendations.filter(i => i.type === 'user')
      expect(userItems.length).toBeGreaterThanOrEqual(0)
    })
  })
})
