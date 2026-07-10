/**
 * Lock Manager Unit Tests
 * 
 * Tests for distributed locking with Redis
 */

import { LockManager } from '@/services/lock-manager.service';
import { getRedisClient } from '@/config/redis';

// Mock Redis
jest.mock('@/config/redis');

describe('Lock Manager', () => {
  let lockManager: LockManager;
  let mockRedis: any;

  beforeEach(() => {
    mockRedis = {
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      ttl: jest.fn(),
      eval: jest.fn(),
    };

    (getRedisClient as jest.Mock).mockReturnValue(mockRedis);
    lockManager = new LockManager();

    jest.clearAllMocks();
  });

  describe('acquireLock', () => {
    it('should acquire lock successfully when available', async () => {
      mockRedis.set.mockResolvedValue('OK');

      const token = await lockManager.acquireLock('test-key', 10);

      expect(token).toBeTruthy();
      expect(token).toHaveLength(32); // 16 bytes = 32 hex chars
      expect(mockRedis.set).toHaveBeenCalledWith(
        'lock:test-key',
        expect.any(String),
        'EX',
        10,
        'NX'
      );
    });

    it('should return null when lock already held', async () => {
      mockRedis.set.mockResolvedValue(null); // Lock already exists

      const token = await lockManager.acquireLock('test-key', 10);

      expect(token).toBeNull();
      expect(mockRedis.set).toHaveBeenCalled();
    });

    it('should use default TTL when not specified', async () => {
      mockRedis.set.mockResolvedValue('OK');

      await lockManager.acquireLock('test-key');

      expect(mockRedis.set).toHaveBeenCalledWith(
        'lock:test-key',
        expect.any(String),
        'EX',
        10, // default TTL
        'NX'
      );
    });
  });

  describe('acquireLockWithRetry', () => {
    it('should retry on failure and eventually succeed', async () => {
      mockRedis.set
        .mockResolvedValueOnce(null) // First attempt fails
        .mockResolvedValueOnce(null) // Second attempt fails
        .mockResolvedValueOnce('OK'); // Third attempt succeeds

      const token = await lockManager.acquireLockWithRetry('test-key', 10, 3);

      expect(token).toBeTruthy();
      expect(mockRedis.set).toHaveBeenCalledTimes(3);
    });

    it('should return null after max retries', async () => {
      mockRedis.set.mockResolvedValue(null); // Always fails

      const token = await lockManager.acquireLockWithRetry('test-key', 10, 3);

      expect(token).toBeNull();
      expect(mockRedis.set).toHaveBeenCalledTimes(3);
    });
  });

  describe('releaseLock', () => {
    it('should release lock successfully with correct token', async () => {
      mockRedis.eval.mockResolvedValue(1); // Lua script returns 1 (deleted)

      const result = await lockManager.releaseLock('test-key', 'valid-token');

      expect(result).toBe(true);
      expect(mockRedis.eval).toHaveBeenCalledWith(
        expect.any(String), // Lua script
        1,
        'lock:test-key',
        'valid-token'
      );
    });

    it('should fail to release lock with wrong token', async () => {
      mockRedis.eval.mockResolvedValue(0); // Lua script returns 0 (not deleted)

      const result = await lockManager.releaseLock('test-key', 'wrong-token');

      expect(result).toBe(false);
      expect(mockRedis.eval).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockRedis.eval.mockRejectedValue(new Error('Redis error'));

      const result = await lockManager.releaseLock('test-key', 'some-token');

      expect(result).toBe(false);
    });
  });

  describe('isLocked', () => {
    it('should return true if lock exists', async () => {
      mockRedis.exists.mockResolvedValue(1);

      const result = await lockManager.isLocked('test-key');

      expect(result).toBe(true);
      expect(mockRedis.exists).toHaveBeenCalledWith('lock:test-key');
    });

    it('should return false if lock does not exist', async () => {
      mockRedis.exists.mockResolvedValue(0);

      const result = await lockManager.isLocked('test-key');

      expect(result).toBe(false);
    });
  });

  describe('getLockTTL', () => {
    it('should return remaining TTL', async () => {
      mockRedis.ttl.mockResolvedValue(5); // 5 seconds remaining

      const ttl = await lockManager.getLockTTL('test-key');

      expect(ttl).toBe(5);
      expect(mockRedis.ttl).toHaveBeenCalledWith('lock:test-key');
    });

    it('should return -1 if key does not exist', async () => {
      mockRedis.ttl.mockResolvedValue(-1);

      const ttl = await lockManager.getLockTTL('test-key');

      expect(ttl).toBe(-1);
    });
  });

  describe('extendLock', () => {
    it('should extend lock with correct token', async () => {
      mockRedis.ttl.mockResolvedValue(5); // Current TTL
      mockRedis.eval.mockResolvedValue(1); // Lua script success

      const result = await lockManager.extendLock('test-key', 'valid-token', 10);

      expect(result).toBe(true);
      expect(mockRedis.eval).toHaveBeenCalledWith(
        expect.any(String),
        1,
        'lock:test-key',
        'valid-token',
        15 // 5 + 10
      );
    });

    it('should fail to extend lock with wrong token', async () => {
      mockRedis.ttl.mockResolvedValue(5);
      mockRedis.eval.mockResolvedValue(0); // Token mismatch

      const result = await lockManager.extendLock('test-key', 'wrong-token', 10);

      expect(result).toBe(false);
    });
  });

  describe('withLock', () => {
    it('should execute function with lock and release afterwards', async () => {
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.eval.mockResolvedValue(1); // Release success

      const mockFn = jest.fn().mockResolvedValue('result');

      const result = await lockManager.withLock('test-key', mockFn, 10);

      expect(result).toBe('result');
      expect(mockFn).toHaveBeenCalled();
      expect(mockRedis.set).toHaveBeenCalled(); // Acquire
      expect(mockRedis.eval).toHaveBeenCalled(); // Release
    });

    it('should release lock even if function throws', async () => {
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.eval.mockResolvedValue(1);

      const mockFn = jest.fn().mockRejectedValue(new Error('Function error'));

      await expect(lockManager.withLock('test-key', mockFn, 10)).rejects.toThrow(
        'Function error'
      );

      expect(mockRedis.eval).toHaveBeenCalled(); // Lock still released
    });

    it('should throw if lock cannot be acquired', async () => {
      mockRedis.set.mockResolvedValue(null); // Lock acquisition fails

      const mockFn = jest.fn();

      await expect(lockManager.withLock('test-key', mockFn, 10)).rejects.toThrow(
        'Failed to acquire lock'
      );

      expect(mockFn).not.toHaveBeenCalled();
    });
  });

  describe('generateSlotLockKey', () => {
    it('should generate correct lock key format', () => {
      const slotTime = new Date('2024-01-15T10:30:00Z');

      const key = LockManager.generateSlotLockKey(
        'business-123',
        'service-456',
        slotTime
      );

      expect(key).toBe('booking:business-123:service-456:2024-01-15T10:30:00.000Z');
    });

    it('should generate unique keys for different slots', () => {
      const slot1 = new Date('2024-01-15T10:00:00Z');
      const slot2 = new Date('2024-01-15T10:30:00Z');

      const key1 = LockManager.generateSlotLockKey('business-123', 'service-456', slot1);
      const key2 = LockManager.generateSlotLockKey('business-123', 'service-456', slot2);

      expect(key1).not.toBe(key2);
    });
  });

  describe('Concurrency Scenarios', () => {
    it('should prevent race condition with proper locking', async () => {
      let lockHolder: string | null = null;

      // Simulate two concurrent requests
      mockRedis.set.mockImplementation(() => {
        if (lockHolder === null) {
          lockHolder = 'token-1';
          return Promise.resolve('OK');
        }
        return Promise.resolve(null); // Lock already held
      });

      mockRedis.eval.mockImplementation(() => {
        lockHolder = null;
        return Promise.resolve(1);
      });

      const [token1, token2] = await Promise.all([
        lockManager.acquireLock('test-key'),
        lockManager.acquireLock('test-key'),
      ]);

      // Only one should succeed
      expect([token1, token2].filter(t => t !== null)).toHaveLength(1);
    });
  });

  describe('Lock Lifecycle', () => {
    it('should complete full lock lifecycle: acquire → use → release', async () => {
      const operations: string[] = [];

      mockRedis.set.mockImplementation(() => {
        operations.push('acquire');
        return Promise.resolve('OK');
      });

      mockRedis.eval.mockImplementation(() => {
        operations.push('release');
        return Promise.resolve(1);
      });

      await lockManager.withLock('test-key', async () => {
        operations.push('execute');
        return 'done';
      });

      expect(operations).toEqual(['acquire', 'execute', 'release']);
    });
  });
});
