import { describe, it, expect, beforeEach } from 'bun:test';
import { loginRateLimiter } from '../../../src/middleware/rate-limiter';

describe('Rate Limiter', () => {
  beforeEach(() => {
    // Reset rate limiter for each test
    loginRateLimiter.reset('test-user-1');
    loginRateLimiter.reset('test-user-2');
  });

  describe('isRateLimited', () => {
    it('should not rate limit first request', () => {
      const isLimited = loginRateLimiter.isRateLimited('test-user-1');
      expect(isLimited).toBe(false);
    });

    it('should not rate limit up to max attempts', () => {
      for (let i = 0; i < 5; i++) {
        const isLimited = loginRateLimiter.isRateLimited('test-user-1');
        expect(isLimited).toBe(false);
      }
    });

    it('should rate limit after max attempts exceeded', () => {
      // Use up all attempts
      for (let i = 0; i < 5; i++) {
        loginRateLimiter.isRateLimited('test-user-1');
      }

      // Next request should be rate limited
      const isLimited = loginRateLimiter.isRateLimited('test-user-1');
      expect(isLimited).toBe(true);
    });

    it('should track attempts per identifier independently', () => {
      // Use up attempts for user 1
      for (let i = 0; i < 5; i++) {
        loginRateLimiter.isRateLimited('test-user-1');
      }

      // User 1 should be rate limited
      expect(loginRateLimiter.isRateLimited('test-user-1')).toBe(true);

      // User 2 should not be rate limited
      expect(loginRateLimiter.isRateLimited('test-user-2')).toBe(false);
    });
  });

  describe('getRemainingAttempts', () => {
    it('should return max attempts before any requests', () => {
      const remaining = loginRateLimiter.getRemainingAttempts('test-user-1');
      expect(remaining).toBe(5);
    });

    it('should decrement remaining attempts after each request', () => {
      loginRateLimiter.isRateLimited('test-user-1');
      let remaining = loginRateLimiter.getRemainingAttempts('test-user-1');
      expect(remaining).toBe(4);

      loginRateLimiter.isRateLimited('test-user-1');
      remaining = loginRateLimiter.getRemainingAttempts('test-user-1');
      expect(remaining).toBe(3);
    });

    it('should return 0 when rate limited', () => {
      // Use up all attempts
      for (let i = 0; i < 5; i++) {
        loginRateLimiter.isRateLimited('test-user-1');
      }

      const remaining = loginRateLimiter.getRemainingAttempts('test-user-1');
      expect(remaining).toBe(0);
    });
  });

  describe('getResetTime', () => {
    it('should return 0 before any requests', () => {
      const resetTime = loginRateLimiter.getResetTime('test-user-1');
      expect(resetTime).toBe(0);
    });

    it('should return time until reset after requests', () => {
      loginRateLimiter.isRateLimited('test-user-1');
      const resetTime = loginRateLimiter.getResetTime('test-user-1');

      // Should be close to 15 minutes (900000 ms)
      expect(resetTime).toBeGreaterThan(890000);
      expect(resetTime).toBeLessThanOrEqual(900000);
    });
  });

  describe('getInfo', () => {
    it('should return correct info before any requests', () => {
      const info = loginRateLimiter.getInfo('test-user-1');

      expect(info.remaining).toBe(5);
      expect(info.resetInMs).toBe(0);
      expect(info.isLimited).toBe(false);
    });

    it('should return correct info after some requests', () => {
      loginRateLimiter.isRateLimited('test-user-1');
      loginRateLimiter.isRateLimited('test-user-1');

      const info = loginRateLimiter.getInfo('test-user-1');

      expect(info.remaining).toBe(3);
      expect(info.resetInMs).toBeGreaterThan(0);
      expect(info.isLimited).toBe(false);
    });

    it('should return correct info when rate limited', () => {
      // Use up all attempts
      for (let i = 0; i < 5; i++) {
        loginRateLimiter.isRateLimited('test-user-1');
      }

      const info = loginRateLimiter.getInfo('test-user-1');

      expect(info.remaining).toBe(0);
      expect(info.resetInMs).toBeGreaterThan(0);
      expect(info.isLimited).toBe(true);
    });
  });

  describe('reset', () => {
    it('should reset rate limit for identifier', () => {
      // Use up all attempts
      for (let i = 0; i < 5; i++) {
        loginRateLimiter.isRateLimited('test-user-1');
      }

      // Should be rate limited
      expect(loginRateLimiter.isRateLimited('test-user-1')).toBe(true);

      // Reset
      loginRateLimiter.reset('test-user-1');

      // Should no longer be rate limited
      expect(loginRateLimiter.isRateLimited('test-user-1')).toBe(false);
    });

    it('should not affect other identifiers', () => {
      // Use up attempts for both users
      for (let i = 0; i < 5; i++) {
        loginRateLimiter.isRateLimited('test-user-1');
        loginRateLimiter.isRateLimited('test-user-2');
      }

      // Reset only user 1
      loginRateLimiter.reset('test-user-1');

      // User 1 should not be rate limited
      expect(loginRateLimiter.isRateLimited('test-user-1')).toBe(false);

      // User 2 should still be rate limited
      expect(loginRateLimiter.isRateLimited('test-user-2')).toBe(true);
    });
  });
});
