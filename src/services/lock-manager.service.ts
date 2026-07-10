/**
 * Distributed Lock Manager
 * 
 * Prevents race conditions during booking creation using Redis
 * Implements distributed locking pattern with automatic expiration
 */

import { getRedisClient } from '@/config/redis';
import * as crypto from 'crypto';

/**
 * Lock Manager Class
 */
export class LockManager {
  private redis = getRedisClient();
  private defaultTTL = 10; // 10 seconds default TTL
  private maxRetries = 3;
  private retryDelay = 100; // milliseconds

  /**
   * Acquire a distributed lock
   * 
   * @param key - Lock key (e.g., "slot:business123:service456:2024-01-15T10:00")
   * @param ttl - Time-to-live in seconds
   * @returns Lock token if acquired, null if failed
   */
  async acquireLock(
    key: string,
    ttl: number = this.defaultTTL
  ): Promise<string | null> {
    const lockKey = `lock:${key}`;
    const token = crypto.randomBytes(16).toString('hex');

    console.log(`[Lock Manager] Attempting to acquire lock: ${lockKey}`);

    // Try to set lock with NX (only if not exists) and EX (expiration)
    // Redis SETNX: SET if Not eXists
    const result = await this.redis.set(lockKey, token, 'EX', ttl, 'NX');

    if (result === 'OK') {
      console.log(`[Lock Manager] Lock acquired: ${lockKey}`);
      return token;
    }

    console.log(`[Lock Manager] Lock acquisition failed: ${lockKey}`);
    return null;
  }

  /**
   * Try to acquire lock with retries
   * 
   * @param key - Lock key
   * @param ttl - Time-to-live in seconds
   * @param retries - Number of retry attempts
   * @returns Lock token if acquired, null if failed
   */
  async acquireLockWithRetry(
    key: string,
    ttl: number = this.defaultTTL,
    retries: number = this.maxRetries
  ): Promise<string | null> {
    for (let attempt = 0; attempt < retries; attempt++) {
      const token = await this.acquireLock(key, ttl);
      
      if (token) {
        return token;
      }

      // Wait before retry (exponential backoff)
      const delay = this.retryDelay * Math.pow(2, attempt);
      console.log(`[Lock Manager] Retry ${attempt + 1}/${retries} after ${delay}ms`);
      await this.sleep(delay);
    }

    return null;
  }

  /**
   * Release a lock
   * 
   * @param key - Lock key
   * @param token - Lock token (must match to release)
   * @returns True if released, false if lock doesn't exist or token mismatch
   */
  async releaseLock(key: string, token: string): Promise<boolean> {
    const lockKey = `lock:${key}`;

    console.log(`[Lock Manager] Attempting to release lock: ${lockKey}`);

    // Use Lua script for atomic check-and-delete
    // Only delete if the token matches (prevents releasing someone else's lock)
    const luaScript = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    try {
      const result = await this.redis.eval(luaScript, 1, lockKey, token);

      if (result === 1) {
        console.log(`[Lock Manager] Lock released: ${lockKey}`);
        return true;
      } else {
        console.log(`[Lock Manager] Lock release failed (token mismatch or expired): ${lockKey}`);
        return false;
      }
    } catch (error) {
      console.error(`[Lock Manager] Error releasing lock:`, error);
      return false;
    }
  }

  /**
   * Check if a lock exists
   * 
   * @param key - Lock key
   * @returns True if lock exists, false otherwise
   */
  async isLocked(key: string): Promise<boolean> {
    const lockKey = `lock:${key}`;
    const exists = await this.redis.exists(lockKey);
    return exists === 1;
  }

  /**
   * Get remaining TTL of a lock
   * 
   * @param key - Lock key
   * @returns Remaining seconds, or -1 if key doesn't exist, -2 if no expiry
   */
  async getLockTTL(key: string): Promise<number> {
    const lockKey = `lock:${key}`;
    return await this.redis.ttl(lockKey);
  }

  /**
   * Extend lock expiration
   * 
   * @param key - Lock key
   * @param token - Lock token (must match to extend)
   * @param additionalTTL - Additional seconds to add
   * @returns True if extended, false if lock doesn't exist or token mismatch
   */
  async extendLock(
    key: string,
    token: string,
    additionalTTL: number
  ): Promise<boolean> {
    const lockKey = `lock:${key}`;

    // Lua script for atomic check-and-extend
    const luaScript = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("expire", KEYS[1], ARGV[2])
      else
        return 0
      end
    `;

    try {
      const currentTTL = await this.getLockTTL(key);
      const newTTL = currentTTL + additionalTTL;

      const result = await this.redis.eval(luaScript, 1, lockKey, token, newTTL);

      return result === 1;
    } catch (error) {
      console.error(`[Lock Manager] Error extending lock:`, error);
      return false;
    }
  }

  /**
   * Execute a function with automatic lock acquisition and release
   * 
   * @param key - Lock key
   * @param fn - Function to execute while holding the lock
   * @param ttl - Lock TTL in seconds
   * @returns Function result
   */
  async withLock<T>(
    key: string,
    fn: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    const token = await this.acquireLockWithRetry(key, ttl);

    if (!token) {
      throw new Error(`Failed to acquire lock: ${key}`);
    }

    try {
      // Execute function while holding lock
      const result = await fn();
      return result;
    } finally {
      // Always release lock, even if function throws
      await this.releaseLock(key, token);
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate lock key for booking slot
   * 
   * @param businessId - Business ID
   * @param serviceId - Service ID
   * @param slotTime - Slot time
   * @returns Lock key
   */
  static generateSlotLockKey(
    businessId: string,
    serviceId: string,
    slotTime: Date
  ): string {
    const timeStr = slotTime.toISOString();
    return `booking:${businessId}:${serviceId}:${timeStr}`;
  }
}

// Export singleton instance
export const lockManager = new LockManager();
