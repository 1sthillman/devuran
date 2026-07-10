/**
 * Unit Tests for Configuration Modules
 * Tests Firebase Admin, Redis, and Encryption setup
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

describe('Firebase Admin Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize Firebase Admin SDK', () => {
    // This test will run with mocked firebase-admin (see tests/setup.ts)
    const { initializeFirebaseAdmin } = require('@/config/firebase-admin');
    
    expect(() => initializeFirebaseAdmin()).not.toThrow();
  });

  it('should return singleton instance on multiple calls', () => {
    const { initializeFirebaseAdmin } = require('@/config/firebase-admin');
    
    const instance1 = initializeFirebaseAdmin();
    const instance2 = initializeFirebaseAdmin();
    
    expect(instance1).toBe(instance2);
  });
});

describe('Redis Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize Redis connection', () => {
    const { initializeRedis } = require('@/config/redis');
    
    expect(() => initializeRedis()).not.toThrow();
  });

  it('should return singleton instance', () => {
    const { getRedisClient } = require('@/config/redis');
    
    const client1 = getRedisClient();
    const client2 = getRedisClient();
    
    expect(client1).toBe(client2);
  });

  it('should perform health check', async () => {
    const { checkRedisHealth, getRedisClient } = require('@/config/redis');
    const client = getRedisClient();
    
    // Mock PING response
    client.ping = jest.fn().mockResolvedValue('PONG');
    
    const isHealthy = await checkRedisHealth();
    expect(isHealthy).toBe(true);
  });
});

describe('Encryption Service', () => {
  it('should encrypt and decrypt data correctly', async () => {
    // Set test encryption key
    process.env.ENCRYPTION_KEY = require('crypto').randomBytes(32).toString('hex');
    
    const { encryptionService } = require('@/services/google/encryption.service');
    
    const plaintext = 'test-oauth-token';
    
    // Encrypt
    const encrypted = await encryptionService.encrypt(plaintext);
    
    expect(encrypted).toHaveProperty('encryptedData');
    expect(encrypted).toHaveProperty('iv');
    expect(encrypted).toHaveProperty('authTag');
    expect(encrypted.encryptedData).not.toBe(plaintext);
    
    // Decrypt
    const decrypted = await encryptionService.decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('should fail decryption with wrong auth tag', async () => {
    process.env.ENCRYPTION_KEY = require('crypto').randomBytes(32).toString('hex');
    
    const { encryptionService } = require('@/services/google/encryption.service');
    
    const plaintext = 'test-token';
    const encrypted = await encryptionService.encrypt(plaintext);
    
    // Tamper with auth tag
    encrypted.authTag = Buffer.from('wrong-tag-value').toString('base64');
    
    await expect(encryptionService.decrypt(encrypted)).rejects.toThrow();
  });

  it('should generate valid encryption key', () => {
    const { EncryptionService } = require('@/services/google/encryption.service');
    
    const key = EncryptionService.generateKey();
    
    expect(key).toHaveLength(64); // 32 bytes = 64 hex characters
    expect(/^[0-9a-f]{64}$/.test(key)).toBe(true);
  });
});
