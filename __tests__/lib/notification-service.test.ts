import { describe, it, expect, vi, beforeEach } from 'vitest'

// Create a chainable mock that returns itself for all methods
const createChainableMock = (finalResult: any) => {
  const mock: any = {
    from: vi.fn(() => mock),
    select: vi.fn(() => mock),
    insert: vi.fn(() => mock),
    update: vi.fn(() => mock),
    eq: vi.fn(() => mock),
    in: vi.fn(() => mock),
    order: vi.fn(() => mock),
    limit: vi.fn(() => mock),
    range: vi.fn(() => mock),
    single: vi.fn(() => Promise.resolve(finalResult)),
    then: vi.fn((resolve) => Promise.resolve(finalResult).then(resolve)),
  }
  return mock
}

let mockSupabaseClient: ReturnType<typeof createChainableMock>

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}))

import {
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUserNotifications,
  getUnreadNotificationCount,
} from '@/lib/notification-service'

describe('notification-service', () => {
  describe('createNotification', () => {
    const validNotificationData = {
      userId: 'user-1',
      type: 'booking_confirmation' as const,
      title: 'Booking Confirmed',
      message: 'Your booking has been confirmed',
    }

    it('should insert notification into database', async () => {
      mockSupabaseClient = createChainableMock({
        data: { id: 'notif-1', ...validNotificationData },
        error: null,
      })

      const result = await createNotification(validNotificationData)

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('notifications')
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-1',
          type: 'booking_confirmation',
          title: 'Booking Confirmed',
          message: 'Your booking has been confirmed',
          is_read: false,
        })
      )
      expect(result.success).toBe(true)
      expect(result.notification).toBeDefined()
    })

    it('should include optional fields when provided', async () => {
      const dataWithOptionals = {
        ...validNotificationData,
        linkUrl: 'https://example.com/booking/123',
        imageUrl: 'https://example.com/image.jpg',
        metadata: { bookingId: '123' },
      }

      mockSupabaseClient = createChainableMock({
        data: { id: 'notif-1', ...dataWithOptionals },
        error: null,
      })

      await createNotification(dataWithOptionals)

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          link_url: 'https://example.com/booking/123',
          image_url: 'https://example.com/image.jpg',
          metadata: { bookingId: '123' },
        })
      )
    })

    it('should handle insert errors', async () => {
      mockSupabaseClient = createChainableMock({
        data: null,
        error: { message: 'Insert failed', code: '500' },
      })

      const result = await createNotification(validNotificationData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Insert failed')
    })

    it('should handle error objects without message', async () => {
      mockSupabaseClient = createChainableMock({
        data: null,
        error: { code: '500', hint: 'Database error hint' },
      })

      const result = await createNotification(validNotificationData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('500')
    })

    it('should set created_at timestamp', async () => {
      mockSupabaseClient = createChainableMock({
        data: { id: 'notif-1' },
        error: null,
      })

      await createNotification(validNotificationData)

      const insertCall = mockSupabaseClient.insert.mock.calls[0][0]
      expect(insertCall.created_at).toBeDefined()
      expect(new Date(insertCall.created_at).toISOString()).toBe(insertCall.created_at)
    })
  })

  describe('markNotificationAsRead', () => {
    it('should update notification is_read to true', async () => {
      mockSupabaseClient = createChainableMock({ error: null })

      const result = await markNotificationAsRead('notif-1')

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('notifications')
      expect(mockSupabaseClient.update).toHaveBeenCalledWith({ is_read: true })
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'notif-1')
      expect(result.success).toBe(true)
    })

    it('should handle update errors', async () => {
      mockSupabaseClient = createChainableMock({ error: { message: 'Update failed' } })

      const result = await markNotificationAsRead('notif-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Update failed')
    })
  })

  describe('markAllNotificationsAsRead', () => {
    it('should update all unread notifications for user', async () => {
      mockSupabaseClient = createChainableMock({ error: null })

      const result = await markAllNotificationsAsRead('user-1')

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('notifications')
      expect(mockSupabaseClient.update).toHaveBeenCalledWith({ is_read: true })
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('user_id', 'user-1')
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('is_read', false)
      expect(result.success).toBe(true)
    })

    it('should handle update errors', async () => {
      mockSupabaseClient = createChainableMock({ error: { message: 'Bulk update failed' } })

      const result = await markAllNotificationsAsRead('user-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Bulk update failed')
    })
  })

  describe('getUserNotifications', () => {
    it('should fetch notifications for user', async () => {
      const mockNotifications = [
        { id: 'notif-1', title: 'Notification 1', is_read: false },
        { id: 'notif-2', title: 'Notification 2', is_read: true },
      ]
      mockSupabaseClient = createChainableMock({ data: mockNotifications, error: null, count: 2 })

      const result = await getUserNotifications('user-1')

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('notifications')
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*')
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('user_id', 'user-1')
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(result.success).toBe(true)
      expect(result.notifications).toEqual(mockNotifications)
    })

    it('should filter by unreadOnly when specified', async () => {
      mockSupabaseClient = createChainableMock({ data: [], error: null, count: 0 })

      await getUserNotifications('user-1', { unreadOnly: true })

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('is_read', false)
    })

    it('should filter by single notification type', async () => {
      mockSupabaseClient = createChainableMock({ data: [], error: null, count: 0 })

      await getUserNotifications('user-1', { type: 'like' })

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('type', 'like')
    })

    it('should filter by multiple notification types', async () => {
      mockSupabaseClient = createChainableMock({ data: [], error: null, count: 0 })

      await getUserNotifications('user-1', { type: ['like', 'follower', 'comment_reply'] })

      expect(mockSupabaseClient.in).toHaveBeenCalledWith('type', ['like', 'follower', 'comment_reply'])
    })

    it('should apply limit when specified', async () => {
      mockSupabaseClient = createChainableMock({ data: [], error: null, count: 0 })

      await getUserNotifications('user-1', { limit: 10 })

      expect(mockSupabaseClient.limit).toHaveBeenCalledWith(10)
    })

    it('should return empty array on error', async () => {
      mockSupabaseClient = createChainableMock({ data: null, error: { message: 'Query failed' }, count: 0 })

      const result = await getUserNotifications('user-1')

      expect(result.success).toBe(false)
      expect(result.notifications).toEqual([])
      expect(result.count).toBe(0)
      expect(result.error).toBe('Query failed')
    })

    it('should handle null data gracefully', async () => {
      mockSupabaseClient = createChainableMock({ data: null, error: null, count: null })

      const result = await getUserNotifications('user-1')

      expect(result.notifications).toEqual([])
      expect(result.count).toBe(0)
    })
  })

  describe('getUnreadNotificationCount', () => {
    it('should count unread notifications', async () => {
      mockSupabaseClient = createChainableMock({ count: 5, error: null })

      const result = await getUnreadNotificationCount('user-1')

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('notifications')
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*', { count: 'exact', head: true })
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('user_id', 'user-1')
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('is_read', false)
      expect(result.success).toBe(true)
      expect(result.count).toBe(5)
    })

    it('should return 0 when count is null', async () => {
      mockSupabaseClient = createChainableMock({ count: null, error: null })

      const result = await getUnreadNotificationCount('user-1')

      expect(result.count).toBe(0)
    })

    it('should handle count errors', async () => {
      mockSupabaseClient = createChainableMock({ count: null, error: { message: 'Count failed' } })

      const result = await getUnreadNotificationCount('user-1')

      expect(result.success).toBe(false)
      expect(result.count).toBe(0)
      expect(result.error).toBe('Count failed')
    })
  })
})
