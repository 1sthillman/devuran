/**
 * OAuth 2.0 Type Definitions
 * 
 * All types related to Google OAuth integration
 */

import { Timestamp } from 'firebase/firestore';

/**
 * OAuth tokens stored in Firestore (encrypted)
 */
export interface OAuthTokens {
  accessToken: string; // AES-256-GCM encrypted
  refreshToken: string; // AES-256-GCM encrypted
  expiresAt: Timestamp;
  scope: string[];
  tokenType: 'Bearer';
}

/**
 * OAuth state for CSRF protection
 * Stored temporarily during OAuth flow
 */
export interface OAuthState {
  state: string; // Random string for CSRF protection
  businessId: string;
  createdAt: Timestamp;
  expiresAt: Timestamp; // State expires in 10 minutes
}

/**
 * OAuth authorization URL response
 */
export interface OAuthAuthorizationResponse {
  authorizationUrl: string;
  state: string;
}

/**
 * OAuth callback parameters (from Google redirect)
 */
export interface OAuthCallbackParams {
  code: string;
  state: string;
  error?: string;
  error_description?: string;
}

/**
 * OAuth token exchange response (from Google)
 */
export interface GoogleTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number; // seconds
  scope: string;
  token_type: 'Bearer';
}

/**
 * OAuth token refresh response (from Google)
 */
export interface GoogleTokenRefreshResponse {
  access_token: string;
  expires_in: number; // seconds
  scope: string;
  token_type: 'Bearer';
}

/**
 * OAuth error response
 */
export interface OAuthError {
  error: string;
  error_description?: string;
  error_uri?: string;
}

/**
 * Required Google API scopes
 */
export const GOOGLE_OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/business.manage', // GBP full access
] as const;

/**
 * OAuth endpoints
 */
export const GOOGLE_OAUTH_ENDPOINTS = {
  AUTHORIZATION: 'https://accounts.google.com/o/oauth2/v2/auth',
  TOKEN: 'https://oauth2.googleapis.com/token',
  REVOKE: 'https://oauth2.googleapis.com/revoke',
  USERINFO: 'https://www.googleapis.com/oauth2/v2/userinfo',
} as const;
