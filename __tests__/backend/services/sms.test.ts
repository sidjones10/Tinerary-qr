import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { formatPhoneNumber, generateVerificationCode, sendVerificationSMS } from '@/backend/services/sms'

describe('sms service', () => {
  describe('formatPhoneNumber', () => {
    it('should return the number as-is if it already starts with +', () => {
      expect(formatPhoneNumber('+14155551234')).toBe('+14155551234')
      expect(formatPhoneNumber('+441234567890')).toBe('+441234567890')
    })

    it('should add + to an 11-digit number starting with 1 (US with country code)', () => {
      expect(formatPhoneNumber('14155551234')).toBe('+14155551234')
    })

    it('should add +1 to a 10-digit US number', () => {
      expect(formatPhoneNumber('4155551234')).toBe('+14155551234')
    })

    it('should add + to numbers longer than 10 digits', () => {
      expect(formatPhoneNumber('4412345678901')).toBe('+4412345678901')
    })

    it('should remove non-digit characters before processing', () => {
      expect(formatPhoneNumber('(415) 555-1234')).toBe('+14155551234')
      expect(formatPhoneNumber('415-555-1234')).toBe('+14155551234')
      expect(formatPhoneNumber('415.555.1234')).toBe('+14155551234')
    })

    it('should preserve + when present even with other characters', () => {
      expect(formatPhoneNumber('+1 (415) 555-1234')).toBe('+1 (415) 555-1234')
    })

    it('should return short numbers as-is', () => {
      expect(formatPhoneNumber('12345')).toBe('12345')
      expect(formatPhoneNumber('123456789')).toBe('123456789')
    })

    it('should handle empty string', () => {
      expect(formatPhoneNumber('')).toBe('')
    })

    it('should handle international formats', () => {
      expect(formatPhoneNumber('447911123456')).toBe('+447911123456')
    })
  })

  describe('generateVerificationCode', () => {
    it('should generate a 6-digit code', () => {
      const code = generateVerificationCode()
      expect(code).toMatch(/^\d{6}$/)
    })

    it('should generate codes within range 100000-999999', () => {
      // Run multiple times to check randomness
      for (let i = 0; i < 100; i++) {
        const code = parseInt(generateVerificationCode(), 10)
        expect(code).toBeGreaterThanOrEqual(100000)
        expect(code).toBeLessThan(1000000)
      }
    })

    it('should generate different codes (probabilistically)', () => {
      const codes = new Set<string>()
      for (let i = 0; i < 100; i++) {
        codes.add(generateVerificationCode())
      }
      // Should have at least 90 unique codes out of 100
      expect(codes.size).toBeGreaterThan(90)
    })

    it('should return a string type', () => {
      const code = generateVerificationCode()
      expect(typeof code).toBe('string')
    })
  })

  describe('sendVerificationSMS', () => {
    let consoleLogSpy: ReturnType<typeof vi.spyOn>
    let consoleWarnSpy: ReturnType<typeof vi.spyOn>
    const originalEnv = process.env.NODE_ENV

    beforeEach(() => {
      consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    })

    afterEach(() => {
      consoleLogSpy.mockRestore()
      consoleWarnSpy.mockRestore()
      vi.stubEnv('NODE_ENV', originalEnv)
    })

    it('should return true in development mode', async () => {
      vi.stubEnv('NODE_ENV', 'development')
      const result = await sendVerificationSMS('4155551234', '123456')
      expect(result).toBe(true)
    })

    it('should log the code in development mode', async () => {
      vi.stubEnv('NODE_ENV', 'development')
      await sendVerificationSMS('4155551234', '123456')
      expect(consoleLogSpy).toHaveBeenCalled()
    })

    it('should return true in production mode (stub implementation)', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      const result = await sendVerificationSMS('4155551234', '123456')
      expect(result).toBe(true)
    })

    it('should log a warning in production mode', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      await sendVerificationSMS('4155551234', '123456')
      expect(consoleWarnSpy).toHaveBeenCalled()
    })

    it('should format the phone number before sending', async () => {
      vi.stubEnv('NODE_ENV', 'development')
      await sendVerificationSMS('4155551234', '123456')
      // The formatted phone should be +14155551234
      const logCall = consoleLogSpy.mock.calls.find(call =>
        call.some(arg => typeof arg === 'string' && arg.includes('+14155551234'))
      )
      expect(logCall).toBeDefined()
    })

    it('should handle phone numbers with special characters', async () => {
      vi.stubEnv('NODE_ENV', 'development')
      const result = await sendVerificationSMS('(415) 555-1234', '123456')
      expect(result).toBe(true)
    })
  })
})
