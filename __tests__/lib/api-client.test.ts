import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
vi.stubGlobal('localStorage', localStorageMock)

// Mock fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Mock config
vi.mock('@/lib/config', () => ({
  config: {
    apiUrl: 'https://api.test.com',
  },
}))

import { ApiClient, apiClient } from '@/lib/api-client'

describe('api-client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  describe('ApiClient', () => {
    describe('login', () => {
      it('should call login endpoint with credentials', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ token: 'test-token', user: { id: 'user-1' } }),
        })

        await ApiClient.login({ email: 'test@example.com', password: 'password123' })

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/auth/login'),
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
          })
        )
      })

      it('should store token on successful login', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ token: 'test-token', user: { id: 'user-1' } }),
        })

        await ApiClient.login({ email: 'test@example.com', password: 'password123' })

        expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'test-token')
      })

      it('should not store token on failed login', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          json: () => Promise.resolve({ message: 'Invalid credentials' }),
        })

        await ApiClient.login({ email: 'test@example.com', password: 'wrong' })

        expect(localStorageMock.setItem).not.toHaveBeenCalled()
      })

      it('should return error response on failure', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          json: () => Promise.resolve({ code: 'AUTH_ERROR', message: 'Invalid credentials' }),
        })

        const result = await ApiClient.login({ email: 'test@example.com', password: 'wrong' })

        expect(result.error).toBeDefined()
        expect(result.error?.message).toBe('Invalid credentials')
      })
    })

    describe('register', () => {
      it('should call register endpoint', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: () => Promise.resolve({ token: 'new-token', user: { id: 'new-user' } }),
        })

        await ApiClient.register({
          email: 'new@example.com',
          password: 'password123',
          name: 'New User',
        })

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/auth/register'),
          expect.objectContaining({
            method: 'POST',
          })
        )
      })

      it('should store token on successful registration', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: () => Promise.resolve({ token: 'new-token', user: { id: 'new-user' } }),
        })

        await ApiClient.register({
          email: 'new@example.com',
          password: 'password123',
          name: 'New User',
        })

        expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'new-token')
      })
    })

    describe('logout', () => {
      it('should remove token from localStorage', async () => {
        mockFetch.mockResolvedValueOnce({ ok: true, status: 200 })

        await ApiClient.logout()

        expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token')
      })

      it('should call logout endpoint', async () => {
        mockFetch.mockResolvedValueOnce({ ok: true, status: 200 })

        await ApiClient.logout()

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/auth/logout'),
          expect.objectContaining({ method: 'POST' })
        )
      })
    })

    describe('getCurrentUser', () => {
      it('should call /auth/me with auth headers', async () => {
        localStorageMock.getItem.mockReturnValue('test-token')
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ id: 'user-1', email: 'test@example.com' }),
        })

        await ApiClient.getCurrentUser()

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/auth/me'),
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: 'Bearer test-token',
            }),
          })
        )
      })
    })

    describe('Itinerary APIs', () => {
      beforeEach(() => {
        localStorageMock.getItem.mockReturnValue('test-token')
      })

      it('getItineraries should call correct endpoint with pagination', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve([]),
        })

        await ApiClient.getItineraries(2, 20)

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/itineraries?page=2&pageSize=20'),
          expect.any(Object)
        )
      })

      it('getItinerary should call correct endpoint with id', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ id: 'itin-1' }),
        })

        await ApiClient.getItinerary('itin-1')

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/itineraries/itin-1'),
          expect.any(Object)
        )
      })

      it('createItinerary should POST to correct endpoint', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: () => Promise.resolve({ id: 'new-itin' }),
        })

        await ApiClient.createItinerary({
          title: 'New Trip',
          description: 'A new trip',
          isPublic: true,
        })

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/itineraries'),
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('New Trip'),
          })
        )
      })

      it('updateItinerary should PATCH to correct endpoint', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ id: 'itin-1' }),
        })

        await ApiClient.updateItinerary('itin-1', { title: 'Updated Title' })

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/itineraries/itin-1'),
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify({ title: 'Updated Title' }),
          })
        )
      })

      it('deleteItinerary should DELETE to correct endpoint', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 204,
        })

        await ApiClient.deleteItinerary('itin-1')

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/itineraries/itin-1'),
          expect.objectContaining({ method: 'DELETE' })
        )
      })
    })

    describe('Activity APIs', () => {
      beforeEach(() => {
        localStorageMock.getItem.mockReturnValue('test-token')
      })

      it('addActivity should POST to correct endpoint', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: () => Promise.resolve({ id: 'activity-1' }),
        })

        await ApiClient.addActivity('itin-1', { title: 'Visit Museum', day: 1 })

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/itineraries/itin-1/activities'),
          expect.objectContaining({ method: 'POST' })
        )
      })

      it('updateActivity should PATCH to correct endpoint', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ id: 'activity-1' }),
        })

        await ApiClient.updateActivity('itin-1', 'activity-1', { title: 'Updated Activity' })

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/itineraries/itin-1/activities/activity-1'),
          expect.objectContaining({ method: 'PATCH' })
        )
      })

      it('deleteActivity should DELETE to correct endpoint', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 204,
        })

        await ApiClient.deleteActivity('itin-1', 'activity-1')

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/itineraries/itin-1/activities/activity-1'),
          expect.objectContaining({ method: 'DELETE' })
        )
      })

      it('respondToActivity should POST RSVP', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ id: 'activity-1' }),
        })

        await ApiClient.respondToActivity('itin-1', 'activity-1', 'yes')

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/itineraries/itin-1/activities/activity-1/rsvp'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ response: 'yes' }),
          })
        )
      })
    })

    describe('Social APIs', () => {
      beforeEach(() => {
        localStorageMock.getItem.mockReturnValue('test-token')
      })

      it('likeItinerary should POST to like endpoint', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ likes: 10 }),
        })

        const result = await ApiClient.likeItinerary('itin-1')

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/itineraries/itin-1/like'),
          expect.objectContaining({ method: 'POST' })
        )
        expect(result.data?.likes).toBe(10)
      })

      it('unlikeItinerary should DELETE to like endpoint', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ likes: 9 }),
        })

        await ApiClient.unlikeItinerary('itin-1')

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/itineraries/itin-1/like'),
          expect.objectContaining({ method: 'DELETE' })
        )
      })

      it('saveItinerary should POST to save endpoint', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ saves: 5 }),
        })

        await ApiClient.saveItinerary('itin-1')

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/itineraries/itin-1/save'),
          expect.objectContaining({ method: 'POST' })
        )
      })
    })

    describe('Search API', () => {
      it('should build query params correctly', async () => {
        localStorageMock.getItem.mockReturnValue('test-token')
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ results: [] }),
        })

        await ApiClient.search({
          query: 'beach vacation',
          filters: { type: 'itinerary', location: 'Miami' },
          page: 2,
          pageSize: 20,
        })

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('query=beach+vacation'),
          expect.any(Object)
        )
      })
    })

    describe('Error handling', () => {
      it('should handle 204 No Content responses', async () => {
        localStorageMock.getItem.mockReturnValue('test-token')
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 204,
        })

        const result = await ApiClient.deleteItinerary('itin-1')

        expect(result.error).toBeUndefined()
      })

      it('should handle JSON parse errors in error responses', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: () => Promise.reject(new Error('Invalid JSON')),
        })

        const result = await ApiClient.login({ email: 'test@example.com', password: 'pass' })

        expect(result.error?.code).toBe('500')
        expect(result.error?.message).toBe('Internal Server Error')
      })

      it('should include auth header when token exists', async () => {
        localStorageMock.getItem.mockReturnValue('my-token')
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve([]),
        })

        await ApiClient.getItineraries()

        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: 'Bearer my-token',
            }),
          })
        )
      })

      it('should have empty Authorization when no token', async () => {
        localStorageMock.getItem.mockReturnValue(null)
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve([]),
        })

        await ApiClient.getItineraries()

        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: '',
            }),
          })
        )
      })
    })
  })

  describe('apiClient (simple client)', () => {
    describe('get', () => {
      it('should make GET request to correct URL', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: 'test' }),
        })

        await apiClient.get('/endpoint')

        expect(mockFetch).toHaveBeenCalledWith('https://api.test.com/endpoint')
      })

      it('should handle endpoint without leading slash', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: 'test' }),
        })

        await apiClient.get('endpoint')

        expect(mockFetch).toHaveBeenCalledWith('https://api.test.com/endpoint')
      })

      it('should throw on non-ok response', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: 'Not Found',
        })

        await expect(apiClient.get('/not-found')).rejects.toThrow('API error: 404 Not Found')
      })
    })

    describe('post', () => {
      it('should make POST request with JSON body', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: '1' }),
        })

        await apiClient.post('/create', { name: 'Test' })

        expect(mockFetch).toHaveBeenCalledWith(
          'https://api.test.com/create',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Test' }),
          })
        )
      })
    })

    describe('put', () => {
      it('should make PUT request with JSON body', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: '1' }),
        })

        await apiClient.put('/update/1', { name: 'Updated' })

        expect(mockFetch).toHaveBeenCalledWith(
          'https://api.test.com/update/1',
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify({ name: 'Updated' }),
          })
        )
      })
    })

    describe('delete', () => {
      it('should make DELETE request', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        })

        await apiClient.delete('/remove/1')

        expect(mockFetch).toHaveBeenCalledWith(
          'https://api.test.com/remove/1',
          expect.objectContaining({ method: 'DELETE' })
        )
      })
    })
  })
})
