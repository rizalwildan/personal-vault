/**
 * Simple in-memory rate limiter for authentication endpoints
 *
 * NOTE: This is a basic implementation suitable for development and single-server deployments.
 * For production with multiple servers, use Redis-based rate limiting (e.g., @elysiajs/rate-limit with Redis adapter).
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private readonly attempts: Map<string, RateLimitEntry> = new Map();
  private readonly windowMs: number;
  private readonly maxAttempts: number;

  constructor(windowMs: number = 15 * 60 * 1000, maxAttempts: number = 5) {
    this.windowMs = windowMs;
    this.maxAttempts = maxAttempts;

    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  /**
   * Check if the request should be rate limited
   * @param identifier - Unique identifier (e.g., IP address, email)
   * @returns true if rate limit exceeded, false otherwise
   */
  isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const entry = this.attempts.get(identifier);

    if (!entry || now > entry.resetAt) {
      // No entry or expired, reset counter
      this.attempts.set(identifier, {
        count: 1,
        resetAt: now + this.windowMs,
      });
      return false;
    }

    if (entry.count >= this.maxAttempts) {
      return true;
    }

    // Increment counter
    entry.count++;
    return false;
  }

  /**
   * Get remaining attempts for an identifier
   */
  getRemainingAttempts(identifier: string): number {
    const now = Date.now();
    const entry = this.attempts.get(identifier);

    if (!entry || now > entry.resetAt) {
      return this.maxAttempts;
    }

    return Math.max(0, this.maxAttempts - entry.count);
  }

  /**
   * Get time until reset in milliseconds
   */
  getResetTime(identifier: string): number {
    const now = Date.now();
    const entry = this.attempts.get(identifier);

    if (!entry || now > entry.resetAt) {
      return 0;
    }

    return entry.resetAt - now;
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.attempts.entries()) {
      if (now > entry.resetAt) {
        this.attempts.delete(key);
      }
    }
  }

  /**
   * Reset rate limit for an identifier (useful for testing or manual overrides)
   */
  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }

  /**
   * Get rate limit info for an identifier
   */
  getInfo(identifier: string): {
    remaining: number;
    resetInMs: number;
    isLimited: boolean;
  } {
    const now = Date.now();
    const entry = this.attempts.get(identifier);

    if (!entry || now > entry.resetAt) {
      return {
        remaining: this.maxAttempts,
        resetInMs: 0,
        isLimited: false,
      };
    }

    return {
      remaining: Math.max(0, this.maxAttempts - entry.count),
      resetInMs: entry.resetAt - now,
      isLimited: entry.count >= this.maxAttempts,
    };
  }
}

// Export singleton instance for login rate limiting
// 5 attempts per 15 minutes per IP address
export const loginRateLimiter = new RateLimiter(15 * 60 * 1000, 5);
