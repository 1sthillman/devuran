/**
 * OAuth Routes Unit Tests
 * 
 * Tests for OAuth 2.0 endpoints
 */

import request from 'supertest';
import express from 'express';
import oauthRoutes from '@/routes/google/oauth.routes';
import { tokenManager } from '@/services/google/oauth/token-manager';

// Mock dependencies
jest.mock('@/services/google/oauth/token-manager');
jest.mock('@/config/firebase-admin');

// Create test Express app
const app = express();
app.use(express.json());
app.use('/oauth', oauthRoutes);

describe('OAuth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /oauth/initiate', () => {
    it('should generate authorization URL successfully', async () => {
      const mockResponse = {
        authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=test',
        state: 'mock-state-123',
      };

      (tokenManager.generateAuthorizationUrl as jest.Mock).mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/oauth/initiate')
        .send({ businessId: 'test-business' })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        ...mockResponse,
      });

      expect(tokenManager.generateAuthorizationUrl).toHaveBeenCalledWith('test-business');
    });

    it('should return 400 if businessId is missing', async () => {
      const response = await request(app)
        .post('/oauth/initiate')
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        error: 'MISSING_BUSINESS_ID',
        message: 'Business ID is required',
      });
    });

    it('should return 500 if authorization URL generation fails', async () => {
      (tokenManager.generateAuthorizationUrl as jest.Mock).mockRejectedValue(
        new Error('Failed to generate URL')
      );

      const response = await request(app)
        .post('/oauth/initiate')
        .send({ businessId: 'test-business' })
        .expect(500);

      expect(response.body).toMatchObject({
        error: 'OAUTH_INIT_FAILED',
      });
    });
  });

  describe('GET /oauth/callback', () => {
    it('should handle successful OAuth callback', async () => {
      const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600,
      };

      (tokenManager.exchangeCodeForTokens as jest.Mock).mockResolvedValue(mockTokens);
      (tokenManager.encryptAndStoreTokens as jest.Mock).mockResolvedValue(undefined);

      // Mock Firestore state doc
      const mockFirestore = {
        collection: jest.fn().mockReturnThis(),
        doc: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
          data: () => ({ businessId: 'test-business' }),
        }),
      };

      jest.spyOn(require('@/config/firebase-admin'), 'getAdminFirestore').mockReturnValue(mockFirestore);

      const response = await request(app)
        .get('/oauth/callback')
        .query({
          code: 'mock-auth-code',
          state: 'mock-state',
        })
        .expect(302); // Redirect

      expect(response.header.location).toContain('/integrations/google-maps?status=success');
      expect(tokenManager.exchangeCodeForTokens).toHaveBeenCalledWith('mock-auth-code', 'mock-state');
      expect(tokenManager.encryptAndStoreTokens).toHaveBeenCalled();
    });

    it('should redirect with error if OAuth error provided', async () => {
      const response = await request(app)
        .get('/oauth/callback')
        .query({
          error: 'access_denied',
          error_description: 'User denied access',
        })
        .expect(302);

      expect(response.header.location).toContain('status=error');
      expect(response.header.location).toContain('access_denied');
    });

    it('should redirect with error if code or state missing', async () => {
      const response = await request(app)
        .get('/oauth/callback')
        .query({ code: 'only-code' })
        .expect(302);

      expect(response.header.location).toContain('status=error');
      expect(response.header.location).toContain('MISSING_PARAMETERS');
    });
  });

  describe('POST /oauth/revoke', () => {
    it('should revoke tokens successfully', async () => {
      (tokenManager.revokeTokens as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/oauth/revoke')
        .send({ businessId: 'test-business' })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Google account disconnected successfully',
      });

      expect(tokenManager.revokeTokens).toHaveBeenCalledWith('test-business');
    });

    it('should return 400 if businessId is missing', async () => {
      const response = await request(app)
        .post('/oauth/revoke')
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        error: 'MISSING_BUSINESS_ID',
        message: 'Business ID is required',
      });
    });

    it('should return 500 if revocation fails', async () => {
      (tokenManager.revokeTokens as jest.Mock).mockRejectedValue(
        new Error('Revocation failed')
      );

      const response = await request(app)
        .post('/oauth/revoke')
        .send({ businessId: 'test-business' })
        .expect(500);

      expect(response.body).toMatchObject({
        error: 'REVOKE_FAILED',
      });
    });
  });

  describe('GET /oauth/status', () => {
    it('should return connection status when connected', async () => {
      const mockTokens = {
        accessToken: 'mock-token',
        refreshToken: 'mock-refresh',
        expiresAt: new Date('2026-12-31'),
      };

      (tokenManager.retrieveAndDecryptTokens as jest.Mock).mockResolvedValue(mockTokens);
      (tokenManager.isTokenExpired as jest.Mock).mockReturnValue(false);

      const response = await request(app)
        .get('/oauth/status')
        .query({ businessId: 'test-business' })
        .expect(200);

      expect(response.body).toEqual({
        connected: true,
        expiresAt: '2026-12-31T00:00:00.000Z',
        isExpired: false,
      });
    });

    it('should return not connected if no tokens found', async () => {
      (tokenManager.retrieveAndDecryptTokens as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/oauth/status')
        .query({ businessId: 'test-business' })
        .expect(200);

      expect(response.body).toEqual({
        connected: false,
      });
    });

    it('should return 400 if businessId is missing', async () => {
      const response = await request(app)
        .get('/oauth/status')
        .expect(400);

      expect(response.body).toEqual({
        error: 'MISSING_BUSINESS_ID',
        message: 'Business ID is required',
      });
    });
  });
});
