import { describe, it, expect, vi, beforeEach } from 'vitest'

// Create a chainable mock that returns itself for all methods
const createChainableMock = (finalResult: any, rpcResult?: any) => {
  const mock: any = {
    from: vi.fn(() => mock),
    select: vi.fn(() => mock),
    insert: vi.fn(() => mock),
    delete: vi.fn(() => mock),
    eq: vi.fn(() => mock),
    single: vi.fn(() => Promise.resolve(finalResult)),
    rpc: vi.fn(() => Promise.resolve(rpcResult || finalResult)),
    then: vi.fn((resolve) => Promise.resolve(finalResult).then(resolve)),
  }
  return mock
}

let mockSupabaseClient: ReturnType<typeof createChainableMock>

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}))

import {
  followUser,
  unfollowUser,
  isFollowing,
  getFollowers,
  getFollowing,
  getMutualFollowers,
  getFollowCounts,
  toggleFollow,
} from '@/lib/follow-service'

describe('follow-service', () => {
  describe('followUser', () => {
    it('should prevent self-following', async () => {
      mockSupabaseClient = createChainableMock({ error: null })

      const result = await followUser('user-1', 'user-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('You cannot follow yourself')
    })

    it('should insert a follow relationship', async () => {
      mockSupabaseClient = createChainableMock({ error: null })

      const result = await followUser('user-1', 'user-2')

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_follows')
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
        follower_id: 'user-1',
        following_id: 'user-2',
      })
      expect(result.success).toBe(true)
    })

    it('should return error when already following', async () => {
      mockSupabaseClient = createChainableMock({ error: { code: '23505', message: 'Duplicate' } })

      const result = await followUser('user-1', 'user-2')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Already following this user')
    })

    it('should handle other insert errors', async () => {
      mockSupabaseClient = createChainableMock({ error: { code: '500', message: 'Database error' } })

      const result = await followUser('user-1', 'user-2')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database error')
    })
  })

  describe('unfollowUser', () => {
    it('should delete the follow relationship', async () => {
      mockSupabaseClient = createChainableMock({ error: null })

      const result = await unfollowUser('user-1', 'user-2')

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_follows')
      expect(mockSupabaseClient.delete).toHaveBeenCalled()
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('follower_id', 'user-1')
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('following_id', 'user-2')
      expect(result.success).toBe(true)
    })

    it('should handle delete errors', async () => {
      mockSupabaseClient = createChainableMock({ error: { message: 'Delete failed' } })

      const result = await unfollowUser('user-1', 'user-2')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Delete failed')
    })
  })

  describe('isFollowing', () => {
    it('should call the is_following RPC', async () => {
      mockSupabaseClient = createChainableMock({}, { data: true, error: null })

      const result = await isFollowing('user-1', 'user-2')

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('is_following', {
        p_follower_id: 'user-1',
        p_following_id: 'user-2',
      })
      expect(result.success).toBe(true)
      expect(result.isFollowing).toBe(true)
    })

    it('should return false when not following', async () => {
      mockSupabaseClient = createChainableMock({}, { data: false, error: null })

      const result = await isFollowing('user-1', 'user-2')

      expect(result.isFollowing).toBe(false)
    })

    it('should handle RPC errors', async () => {
      mockSupabaseClient = createChainableMock({}, { data: null, error: { message: 'RPC failed' } })

      const result = await isFollowing('user-1', 'user-2')

      expect(result.success).toBe(false)
      expect(result.error).toBe('RPC failed')
    })
  })

  describe('getFollowers', () => {
    it('should call the get_followers RPC with parameters', async () => {
      const mockFollowers = [
        { id: 'user-2', name: 'User 2', username: 'user2', avatar_url: null },
      ]
      mockSupabaseClient = createChainableMock({}, { data: mockFollowers, error: null })

      const result = await getFollowers('user-1', 20, 10)

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('get_followers', {
        p_user_id: 'user-1',
        p_limit: 20,
        p_offset: 10,
      })
      expect(result.success).toBe(true)
      expect(result.followers).toEqual(mockFollowers)
    })

    it('should use default limit and offset', async () => {
      mockSupabaseClient = createChainableMock({}, { data: [], error: null })

      await getFollowers('user-1')

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('get_followers', {
        p_user_id: 'user-1',
        p_limit: 50,
        p_offset: 0,
      })
    })

    it('should handle errors', async () => {
      mockSupabaseClient = createChainableMock({}, { data: null, error: { message: 'Query failed' } })

      const result = await getFollowers('user-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Query failed')
    })
  })

  describe('getFollowing', () => {
    it('should call the get_following RPC', async () => {
      const mockFollowing = [
        { id: 'user-3', name: 'User 3', username: 'user3', avatar_url: null },
      ]
      mockSupabaseClient = createChainableMock({}, { data: mockFollowing, error: null })

      const result = await getFollowing('user-1', 30, 5)

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('get_following', {
        p_user_id: 'user-1',
        p_limit: 30,
        p_offset: 5,
      })
      expect(result.success).toBe(true)
      expect(result.following).toEqual(mockFollowing)
    })

    it('should handle errors', async () => {
      mockSupabaseClient = createChainableMock({}, { data: null, error: { message: 'Query failed' } })

      const result = await getFollowing('user-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Query failed')
    })
  })

  describe('getMutualFollowers', () => {
    it('should call the get_mutual_followers RPC', async () => {
      const mockMutuals = [
        { id: 'user-3', name: 'Mutual Friend', username: 'mutual', avatar_url: null },
      ]
      mockSupabaseClient = createChainableMock({}, { data: mockMutuals, error: null })

      const result = await getMutualFollowers('user-1', 'user-2')

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('get_mutual_followers', {
        p_user_id: 'user-1',
        p_other_user_id: 'user-2',
      })
      expect(result.success).toBe(true)
      expect(result.mutuals).toEqual(mockMutuals)
    })

    it('should handle errors', async () => {
      mockSupabaseClient = createChainableMock({}, { data: null, error: { message: 'Query failed' } })

      const result = await getMutualFollowers('user-1', 'user-2')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Query failed')
    })
  })

  describe('getFollowCounts', () => {
    it('should fetch counts from profiles table', async () => {
      mockSupabaseClient = createChainableMock({
        data: { followers_count: 100, following_count: 50 },
        error: null,
      })

      const result = await getFollowCounts('user-1')

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles')
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('followers_count, following_count')
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'user-1')
      expect(result.success).toBe(true)
      expect(result.counts).toEqual({ followers: 100, following: 50 })
    })

    it('should default to 0 for null counts', async () => {
      mockSupabaseClient = createChainableMock({
        data: { followers_count: null, following_count: null },
        error: null,
      })

      const result = await getFollowCounts('user-1')

      expect(result.counts).toEqual({ followers: 0, following: 0 })
    })

    it('should handle errors', async () => {
      mockSupabaseClient = createChainableMock({
        data: null,
        error: { message: 'Query failed' },
      })

      const result = await getFollowCounts('user-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Query failed')
    })
  })

  describe('toggleFollow', () => {
    it('should follow when not currently following', async () => {
      // Need to handle both isFollowing (rpc) and followUser (insert)
      const mock = createChainableMock({ error: null }, { data: false, error: null })
      mockSupabaseClient = mock

      const result = await toggleFollow('user-1', 'user-2')

      expect(result.success).toBe(true)
      expect(result.isFollowing).toBe(true)
    })

    it('should unfollow when currently following', async () => {
      const mock = createChainableMock({ error: null }, { data: true, error: null })
      mockSupabaseClient = mock

      const result = await toggleFollow('user-1', 'user-2')

      expect(result.success).toBe(true)
      expect(result.isFollowing).toBe(false)
    })

    it('should return error if status check fails', async () => {
      mockSupabaseClient = createChainableMock({}, {
        data: null,
        error: { message: 'Status check failed' },
      })

      const result = await toggleFollow('user-1', 'user-2')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Status check failed')
    })
  })
})
