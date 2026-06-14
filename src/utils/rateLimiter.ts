/**
 * Client-side rate limiting to prevent abuse
 * Note: This is not a replacement for server-side rate limiting
 * but provides an additional layer of protection
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private configs: Map<string, RateLimitConfig> = new Map();

  /**
   * Configure rate limit for a specific action
   */
  configure(action: string, maxRequests: number, windowMs: number) {
    this.configs.set(action, { maxRequests, windowMs });
  }

  /**
   * Check if action is allowed
   * 
   * ✅ GÜVENLİK: Race condition düzeltildi - entry referansı korunuyor
   */
  isAllowed(action: string, identifier: string = 'default'): boolean {
    const config = this.configs.get(action);
    if (!config) {
      // If not configured, allow by default
      return true;
    }

    const key = `${action}:${identifier}`;
    const now = Date.now();
    const entry = this.limits.get(key);

    // If no entry or window expired, create new entry
    if (!entry || now > entry.resetTime) {
      this.limits.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      });
      return true;
    }

    // Check if limit exceeded
    if (entry.count >= config.maxRequests) {
      return false;
    }

    // ✅ GÜVENLİK: Increment count (map referansı aynı kalıyor)
    entry.count++;
    // Not: entry.count++ zaten map'teki referansı günceller
    // this.limits.set(key, entry) gereksiz (zaten aynı obje)
    return true;
  }

  /**
   * Get remaining requests for an action
   */
  getRemaining(action: string, identifier: string = 'default'): number {
    const config = this.configs.get(action);
    if (!config) return Infinity;

    const key = `${action}:${identifier}`;
    const entry = this.limits.get(key);
    const now = Date.now();

    if (!entry || now > entry.resetTime) {
      return config.maxRequests;
    }

    return Math.max(0, config.maxRequests - entry.count);
  }

  /**
   * Get time until reset (in ms)
   */
  getResetTime(action: string, identifier: string = 'default'): number {
    const key = `${action}:${identifier}`;
    const entry = this.limits.get(key);
    const now = Date.now();

    if (!entry || now > entry.resetTime) {
      return 0;
    }

    return entry.resetTime - now;
  }

  /**
   * Clear rate limit for an action
   */
  clear(action: string, identifier: string = 'default') {
    const key = `${action}:${identifier}`;
    this.limits.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clearAll() {
    this.limits.clear();
  }
}

// Create singleton instance
export const rateLimiter = new RateLimiter();

// Configure default rate limits
rateLimiter.configure('reservation:create', 5, 60000); // 5 requests per minute
rateLimiter.configure('login:attempt', 5, 300000); // 5 attempts per 5 minutes
rateLimiter.configure('review:create', 3, 3600000); // 3 reviews per hour
rateLimiter.configure('queue:join', 3, 60000); // 3 queue joins per minute
rateLimiter.configure('search', 30, 60000); // 30 searches per minute
rateLimiter.configure('upload:image', 10, 60000); // 10 uploads per minute

/**
 * Hook for using rate limiter in components
 */
export function useRateLimit(action: string, identifier?: string) {
  const check = () => rateLimiter.isAllowed(action, identifier);
  const remaining = () => rateLimiter.getRemaining(action, identifier);
  const resetTime = () => rateLimiter.getResetTime(action, identifier);

  return {
    isAllowed: check,
    remaining,
    resetTime
  };
}
