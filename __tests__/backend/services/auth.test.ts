import { describe, it, expect, vi, beforeEach } from 'vitest'

// Use vi.hoisted to define mocks before vi.mock hoisting
const { mockSupabaseClient, mockFormatPhoneNumber, mockGenerateVerificationCode, mockSendVerificationSMS } = vi.hoisted(() => {
  const mockSupabaseClient: any = {
    from: vi.fn(),
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    single: vi.fn(),
    auth: {
      admin: {
        createUser: vi.fn(),
        generateLink: vi.fn(),
      },
    },
  }

  return {
    mockSupabaseClient,
    mockFormatPhoneNumber: vi.fn(),
    mockGenerateVerificationCode: vi.fn(),
    mockSendVerificationSMS: vi.fn(),
  }
})

// Mock the dependencies
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}))

vi.mock('@/lib/env-validation', () => ({
  getEnv: () => ({
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  }),
  getSiteUrl: () => 'https://test.tinerary.app',
}))

vi.mock('@/lib/config', () => ({
  PHONE_VERIFICATION_CONFIG: {
    CODE_EXPIRY_MINUTES: 15,
    MAX_VERIFICATION_ATTEMPTS: 3,
  },
}))

vi.mock('@/backend/services/sms', () => ({
  formatPhoneNumber: (phone: string) => mockFormatPhoneNumber(phone),
  generateVerificationCode: () => mockGenerateVerificationCode(),
  sendVerificationSMS: (phone: string, code: string) => mockSendVerificationSMS(phone, code),
}))

// Import after mocks are set up
import { startPhoneVerification, verifyPhoneCode, createUserSession } from '@/backend/services/auth'

describe('auth service', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mock implementations
    mockSupabaseClient.from.mockReturnValue(mockSupabaseClient)
    mockSupabaseClient.select.mockReturnValue(mockSupabaseClient)
    mockSupabaseClient.insert.mockReturnValue(mockSupabaseClient)
    mockSupabaseClient.update.mockReturnValue(mockSupabaseClient)
    mockSupabaseClient.delete.mockReturnValue(mockSupabaseClient)
    mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient)
    mockSupabaseClient.order.mockReturnValue(mockSupabaseClient)
    mockSupabaseClient.limit.mockReturnValue(mockSupabaseClient)
    mockSupabaseClient.single.mockResolvedValue({ data: null, error: null })
    mockSupabaseClient.auth.admin.createUser.mockResolvedValue({ data: { user: { id: 'auth-user-id' } }, error: null })
    mockSupabaseClient.auth.admin.generateLink.mockResolvedValue({ data: { token: 'test-token' }, error: null })

    // Setup SMS mocks
    mockFormatPhoneNumber.mockImplementation((phone) => {
      const digitsOnly = phone.replace(/\D/g, '')
      if (phone.startsWith('+')) return phone
      if (digitsOnly.length === 10) return `+1${digitsOnly}`
      if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) return `+${digitsOnly}`
      return phone
    })
    mockGenerateVerificationCode.mockReturnValue('123456')
    mockSendVerificationSMS.mockResolvedValue(true)
  })

  describe('startPhoneVerification', () => {
    it('should return error for invalid phone number format', async () => {
      mockFormatPhoneNumber.mockReturnValueOnce('12345') // Too short

      const result = await startPhoneVerification('12345')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid phone number format')
    })

    it('should format the phone number', async () => {
      await startPhoneVerification('4155551234')

      expect(mockFormatPhoneNumber).toHaveBeenCalledWith('4155551234')
    })

    it('should generate a verification code', async () => {
      await startPhoneVerification('+14155551234')

      expect(mockGenerateVerificationCode).toHaveBeenCalled()
    })

    it('should delete existing verification codes for the phone', async () => {
      await startPhoneVerification('+14155551234')

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('verification_codes')
      expect(mockSupabaseClient.delete).toHaveBeenCalled()
    })

    it('should insert a new verification code', async () => {
      await startPhoneVerification('+14155551234')

      expect(mockSupabaseClient.insert).toHaveBeenCalled()
    })

    it('should return error if insert fails', async () => {
      mockSupabaseClient.insert.mockReturnValueOnce({
        error: { message: 'Insert failed' },
      })

      const result = await startPhoneVerification('+14155551234')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to create verification code')
    })

    it('should send SMS after storing the code', async () => {
      await startPhoneVerification('+14155551234')

      expect(mockSendVerificationSMS).toHaveBeenCalledWith('+14155551234', '123456')
    })

    it('should return error if SMS sending fails', async () => {
      mockSendVerificationSMS.mockResolvedValueOnce(false)

      const result = await startPhoneVerification('+14155551234')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to send verification code')
    })

    it('should return success with formatted phone number', async () => {
      const result = await startPhoneVerification('4155551234')

      expect(result.success).toBe(true)
      expect(result.phoneNumber).toBe('+14155551234')
    })
  })

  describe('verifyPhoneCode', () => {
    const validVerificationRecord = {
      id: 'ver-1',
      phone: '+14155551234',
      code: '123456',
      expires_at: new Date(Date.now() + 600000).toISOString(),
      attempts: 0,
      verified: false,
    }

    it('should return error when no verification code found', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      })

      const result = await verifyPhoneCode('+14155551234', '123456')

      expect(result.success).toBe(false)
      expect(result.message).toBe('No verification code found. Please request a new code.')
    })

    it('should return error when code has expired', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: {
          ...validVerificationRecord,
          expires_at: new Date(Date.now() - 60000).toISOString(),
        },
        error: null,
      })

      const result = await verifyPhoneCode('+14155551234', '123456')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Verification code has expired. Please request a new code.')
    })

    it('should return error when max attempts exceeded', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: {
          ...validVerificationRecord,
          attempts: 3,
        },
        error: null,
      })

      const result = await verifyPhoneCode('+14155551234', '123456')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Too many failed attempts. Please request a new code.')
    })

    it('should return error and increment attempts for wrong code', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: validVerificationRecord,
        error: null,
      })

      const result = await verifyPhoneCode('+14155551234', '000000')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Invalid verification code. Please try again.')
      expect(mockSupabaseClient.update).toHaveBeenCalled()
    })

    it('should return success for valid code with existing user', async () => {
      mockSupabaseClient.single
        .mockResolvedValueOnce({
          data: validVerificationRecord,
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: 'existing-user', phone: '+14155551234' },
          error: null,
        })

      const result = await verifyPhoneCode('+14155551234', '123456')

      expect(result.success).toBe(true)
      expect(result.phoneNumber).toBe('+14155551234')
      expect(result.message).toBe('Phone verified successfully')
    })

    it('should create new user if not exists', async () => {
      mockSupabaseClient.single
        .mockResolvedValueOnce({
          data: validVerificationRecord,
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Not found' },
        })
        .mockResolvedValueOnce({
          data: { id: 'new-user-id' },
          error: null,
        })

      await verifyPhoneCode('+14155551234', '123456')

      expect(mockSupabaseClient.auth.admin.createUser).toHaveBeenCalled()
    })
  })

  describe('createUserSession', () => {
    it('should return error when user not found', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      })

      const result = await createUserSession('+14155551234')

      expect(result.success).toBe(false)
      expect(result.error).toBe('User not found')
    })

    it('should generate a magic link for the user', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: 'user-1', phone: '+14155551234' },
        error: null,
      })

      await createUserSession('+14155551234')

      expect(mockSupabaseClient.auth.admin.generateLink).toHaveBeenCalled()
    })

    it('should return success with user and session data', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: 'user-1', phone: '+14155551234' },
        error: null,
      })

      const result = await createUserSession('+14155551234')

      expect(result.success).toBe(true)
      expect(result.user).toEqual({ id: 'user-1', phone: '+14155551234' })
      expect(result.session).toBeDefined()
    })

    it('should return error when session generation fails', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: 'user-1', phone: '+14155551234' },
        error: null,
      })
      mockSupabaseClient.auth.admin.generateLink.mockResolvedValueOnce({
        data: null,
        error: { message: 'Session error' },
      })

      const result = await createUserSession('+14155551234')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to create session')
    })

    it('should format phone number before lookup', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: 'user-1', phone: '+14155551234' },
        error: null,
      })

      await createUserSession('4155551234')

      expect(mockFormatPhoneNumber).toHaveBeenCalledWith('4155551234')
    })
  })
})
