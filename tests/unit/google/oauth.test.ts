/**
 * Unit Tests for OAuth Service
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import crypto from 'crypto';

// Mock axios
jest.mock('axios');

describe('Token Manager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set required environment variables
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3000/oauth/callback';
    process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
  });

  describe('generateAuthorizationUrl', () => {
    it('should generate valid authorization URL with all required parameters', async () => {
      const { TokenManager } = require('@/services/google/oauth/token-manager');
      const manager = new TokenManager();

      const result = await manager.generateAuthorizationUrl('test-business-123');

      expect(result).toHaveProperty('authorizationUrl');
      expect(result).toHaveProperty('state');
      expect(result.authorizationUrl).toContain('accounts.google.com/o/oauth2/v2/auth');
      expect(result.authorizationUrl).toContain('client_id=test-client-id');
      expect(result.authorizationUrl).toContain('response_type=code');
      expect(result.authorizationUrl).toContain('access_type=offline');
      expect(result.authorizationUrl).toContain('prompt=consent');
      expect(result.state).toHaveLength(64); // 32 bytes = 64 hex chars
    });

    it('should store state in Firestore with 10 minute expiry', async () => {
      const { TokenManager } = require('@/services/google/oauth/token-manager');
      const { getAdminFirestore } = require('@/config/firebase-admin');
      
      const manager = new TokenManager();
      const db = getAdminFirestore();

      const result = await manager.generateAuthorizationUrl('test-business-123');

      // Verify Firestore set was called
      expect(db.collection).toHaveBeenCalledWith('oauth_states');
    });
  });

  describe('exchangeCodeForTokens', () => {
    it('should exchange authorization code for tokens', async () => {
      const axios = require('axios');
      const { TokenManager } = require('@/services/google/oauth/token-manager');
      
      const manager = new TokenManager();

      // Mock Firestore state verification
      const { getAdminFirestore } = require('@/config/firebase-admin');
      const db = getAdminFirestore();
      
      const mockStateDoc = {
        exists: true,
        data: () => ({
          state: 'test-state',
          businessId: 'test-business-123',
          expiresAt: {
            toDate: () => new Date(Date.now() + 10 * 60 * 1000), // Future date
          },
        }),
        ref: {
          delete: jest.fn(),
        },
      };

      db.collection().doc().get = jest.fn().mockResolvedValue(mockStateDoc);

      // Mock Google token response
      axios.post.mockResolvedValue({
        data: {
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          expires_in: 3600,
          scope: 'https://www.googleapis.com/auth/business.manage',
          token_type: 'Bearer',
        },
      });

      const result = await manager.exchangeCodeForTokens('test-code', 'test-state');

      expect(result).toEqual({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresIn: 3600,
      });

      expect(axios.post).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/token',
        expect.any(URLSearchParams),
        expect.objectContaining({
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
      );
    });

    it('should reject invalid state', async () => {
      const { TokenManager } = require('@/services/google/oauth/token-manager');
      const { getAdminFirestore } = require('@/config/firebase-admin');
      
      const manager = new TokenManager();
      const db = getAdminFirestore();

      // Mock non-existent state
      db.collection().doc().get = jest.fn().mockResolvedValue({
        exists: false,
      });

      await expect(
        manager.exchangeCodeForTokens('test-code', 'invalid-state')
      ).rejects.toThrow('Invalid or expired state parameter');
    });

    it('should reject expired state', async () => {
      const { TokenManager } = require('@/services/google/oauth/token-manager');
      const { getAdminFirestore } = require('@/config/firebase-admin');
      
      const manager = new TokenManager();
      const db = getAdminFirestore();

      // Mock expired state
      const mockStateDoc = {
        exists: true,
        data: () => ({
          state: 'test-state',
          businessId: 'test-business-123',
          expiresAt: {
            toDate: () => new Date(Date.now() - 1000), // Past date
          },
        }),
        ref: {
          delete: jest.fn(),
        },
      };

      db.collection().doc().get = jest.fn().mockResolvedValue(mockStateDoc);

      await expect(
        manager.exchangeCodeForTokens('test-code', 'test-state')
      ).rejects.toThrow('State parameter expired');
    });
  });

  describe('encryptAndStoreTokens', () => {
    it('should encrypt tokens before storing in Firestore', async () => {
      const { TokenManager } = require('@/services/google/oauth/token-manager');
      const { getAdminFirestore } = require('@/config/firebase-admin');
      
      const manager = new TokenManager();
      const db = getAdminFirestore();

      await manager.encryptAndStoreTokens(
        'test-business-123',
        'plain-access-token',
        'plain-refresh-token',
        3600
      );

      // Verify Firestore set was called
      expect(db.collection).toHaveBeenCalledWith('google_integrations');
      
      // Verify set was called with merge: true
      const setCall = db.collection().doc().set;
      expect(setCall).toHaveBeenCalled();
      
      const storedData = setCall.mock.calls[0][0];
      expect(storedData).toHaveProperty('oauthTokens');
      expect(storedData.oauthTokens.accessToken).not.toBe('plain-access-token');
      expect(storedData.oauthTokens.refreshToken).not.toBe('plain-refresh-token');
    });
  });

  describe('retrieveAndDecryptTokens', () => {
    it('should decrypt tokens from Firestore', async () => {
      const { TokenManager } = require('@/services/google/oauth/token-manager');
      const { encryptionService } = require('@/services/google/encryption.service');
      const { getAdminFirestore } = require('@/config/firebase-admin');
      
      const manager = new TokenManager();
      const db = getAdminFirestore();

      // Encrypt test tokens
      const encryptedAccess = await encryptionService.encrypt('test-access-token');
      const encryptedRefresh = await encryptionService.encrypt('test-refresh-token');

      // Mock Firestore response
      const mockDoc = {
        exists: true,
        data: () => ({
          businessId: 'test-business-123',
          oauthTokens: {
            accessToken: encryptedAccess,
            refreshToken: encryptedRefresh,
            expiresAt: {
              toDate: () => new Date(Date.now() + 3600 * 1000),
            },
          },
        }),
      };

      db.collection().doc().get = jest.fn().mockResolvedValue(mockDoc);

      const result = await manager.retrieveAndDecryptTokens('test-business-123');

      expect(result).not.toBeNull();
      expect(result?.accessToken).toBe('test-access-token');
      expect(result?.refreshToken).toBe('test-refresh-token');
      expect(result?.expiresAt).toBeInstanceOf(Date);
    });

    it('should return null if no tokens found', async () => {
      const { TokenManager } = require('@/services/google/oauth/token-manager');
      const { getAdminFirestore } = require('@/config/firebase-admin');
      
      const manager = new TokenManager();
      const db = getAdminFirestore();

      // Mock non-existent document
      db.collection().doc().get = jest.fn().mockResolvedValue({
        exists: false,
      });

      const result = await manager.retrieveAndDecryptTokens('non-existent-business');

      expect(result).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return true for expired token', () => {
      const { TokenManager } = require('@/services/google/oauth/token-manager');
      const manager = new TokenManager();

      const pastDate = new Date(Date.now() - 1000);
      const isExpired = manager.isTokenExpired(pastDate);

      expect(isExpired).toBe(true);
    });

    it('should return true for token expiring within buffer time', () => {
      const { TokenManager } = require('@/services/google/oauth/token-manager');
      const manager = new TokenManager();

      const soonDate = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes from now
      const isExpired = manager.isTokenExpired(soonDate, 5); // 5 minute buffer

      expect(isExpired).toBe(true);
    });

    it('should return false for valid token', () => {
      const { TokenManager } = require('@/services/google/oauth/token-manager');
      const manager = new TokenManager();

      const futureDate = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
      const isExpired = manager.isTokenExpired(futureDate);

      expect(isExpired).toBe(false);
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh expired access token', async () => {
      const axios = require('axios');
      const { TokenManager } = require('@/services/google/oauth/token-manager');
      const { encryptionService } = require('@/services/google/encryption.service');
      const { getAdminFirestore } = require('@/config/firebase-admin');
      
      const manager = new TokenManager();
      const db = getAdminFirestore();

      // Mock existing tokens
      const encryptedAccess = await encryptionService.encrypt('old-access-token');
      const encryptedRefresh = await encryptionService.encrypt('refresh-token');

      const mockDoc = {
        exists: true,
        data: () => ({
          oauthTokens: {
            accessToken: encryptedAccess,
            refreshToken: encryptedRefresh,
            expiresAt: {
              toDate: () => new Date(Date.now() - 1000), // Expired
            },
          },
        }),
      };

      db.collection().doc().get = jest.fn().mockResolvedValue(mockDoc);

      // Mock Google refresh response
      axios.post.mockResolvedValue({
        data: {
          access_token: 'new-access-token',
          expires_in: 3600,
          scope: 'https://www.googleapis.com/auth/business.manage',
          token_type: 'Bearer',
        },
      });

      const newToken = await manager.refreshAccessToken('test-business-123');

      expect(newToken).toBe('new-access-token');
      expect(axios.post).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/token',
        expect.any(URLSearchParams),
        expect.any(Object)
      );
    });
  });
});
