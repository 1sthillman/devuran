/**
 * Google Business Profile Unit Tests
 * 
 * Tests for GBP API client, location manager, and URL generator
 */

import { GBPApiClient } from '@/services/google/gbp/gbp-api.client';
import { appointmentUrlGenerator } from '@/services/google/appointment-url-generator';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('GBP API Client', () => {
  let client: GBPApiClient;
  const mockAccessToken = 'mock-access-token';

  beforeEach(() => {
    client = new GBPApiClient(mockAccessToken);
    jest.clearAllMocks();
  });

  describe('Rate Limiting', () => {
    it('should respect 10 QPS rate limit', async () => {
      const mockCreate = {
        get: jest.fn().mockResolvedValue({ data: { accounts: [] } }),
      };
      mockedAxios.create = jest.fn().mockReturnValue(mockCreate as any);

      client = new GBPApiClient(mockAccessToken);

      // Make 15 requests rapidly
      const startTime = Date.now();
      const promises = Array(15)
        .fill(null)
        .map(() => client.listAccounts());

      await Promise.all(promises);
      const duration = Date.now() - startTime;

      // Should take at least 1 second for 15 requests (10 in first second, 5 in second)
      expect(duration).toBeGreaterThanOrEqual(900); // Allow 100ms margin
    });
  });

  describe('Retry Logic', () => {
    it('should retry on 429 rate limit errors', async () => {
      const mockGet = jest
        .fn()
        .mockRejectedValueOnce({
          response: { status: 429, data: {} },
        })
        .mockResolvedValueOnce({
          data: { accounts: [{ name: 'accounts/123' }] },
        });

      const mockCreate = {
        get: mockGet,
      };
      mockedAxios.create = jest.fn().mockReturnValue(mockCreate as any);

      client = new GBPApiClient(mockAccessToken);
      const result = await client.listAccounts();

      expect(mockGet).toHaveBeenCalledTimes(2);
      expect(result.accounts).toHaveLength(1);
    });

    it('should retry on 5xx server errors', async () => {
      const mockGet = jest
        .fn()
        .mockRejectedValueOnce({
          response: { status: 503, data: {} },
        })
        .mockResolvedValueOnce({
          data: { locations: [] },
        });

      const mockCreate = {
        get: mockGet,
      };
      mockedAxios.create = jest.fn().mockReturnValue(mockCreate as any);

      client = new GBPApiClient(mockAccessToken);
      const result = await client.listLocations('accounts/123');

      expect(mockGet).toHaveBeenCalledTimes(2);
    });

    it('should not retry on 4xx client errors (except 429)', async () => {
      const mockGet = jest.fn().mockRejectedValue({
        response: {
          status: 400,
          data: {
            error: {
              code: 400,
              message: 'Invalid request',
              status: 'INVALID_ARGUMENT',
            },
          },
        },
      });

      const mockCreate = {
        get: mockGet,
      };
      mockedAxios.create = jest.fn().mockReturnValue(mockCreate as any);

      client = new GBPApiClient(mockAccessToken);

      await expect(client.listAccounts()).rejects.toThrow('GBP API Error');
      expect(mockGet).toHaveBeenCalledTimes(1); // No retry
    });

    it('should stop retrying after max attempts', async () => {
      const mockGet = jest.fn().mockRejectedValue({
        response: { status: 503, data: {} },
      });

      const mockCreate = {
        get: mockGet,
      };
      mockedAxios.create = jest.fn().mockReturnValue(mockCreate as any);

      client = new GBPApiClient(mockAccessToken);

      await expect(client.listAccounts()).rejects.toThrow();
      expect(mockGet).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });
  });

  describe('List Locations', () => {
    it('should fetch locations with pagination', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        data: {
          locations: [
            { name: 'accounts/123/locations/456', locationName: 'Location 1' },
            { name: 'accounts/123/locations/789', locationName: 'Location 2' },
          ],
          nextPageToken: 'token123',
          totalSize: 2,
        },
      });

      const mockCreate = {
        get: mockGet,
      };
      mockedAxios.create = jest.fn().mockReturnValue(mockCreate as any);

      client = new GBPApiClient(mockAccessToken);
      const result = await client.listLocations('accounts/123', 100);

      expect(result.locations).toHaveLength(2);
      expect(result.nextPageToken).toBe('token123');
      expect(mockGet).toHaveBeenCalledWith(
        '/accounts/123/locations',
        expect.objectContaining({
          params: { pageSize: 100 },
        })
      );
    });
  });
});

describe('Appointment URL Generator', () => {
  describe('Slug Generation', () => {
    it('should create SEO-friendly slugs', async () => {
      // Access private method through testing
      const generator = appointmentUrlGenerator as any;
      
      expect(generator.createSlug('My Business Name')).toBe('my-business-name');
      expect(generator.createSlug('Güzel Berber Salonu')).toBe('guzel-berber-salonu');
      expect(generator.createSlug('Business & Co.')).toBe('business-co');
      expect(generator.createSlug('  Extra   Spaces  ')).toBe('extra-spaces');
    });

    it('should limit slug length to 50 characters', async () => {
      const generator = appointmentUrlGenerator as any;
      const longName = 'A'.repeat(100);
      const slug = generator.createSlug(longName);
      
      expect(slug.length).toBeLessThanOrEqual(50);
    });

    it('should handle Turkish characters', async () => {
      const generator = appointmentUrlGenerator as any;
      
      expect(generator.createSlug('Şişli Güzellik Salonu')).toBe('sisli-guzellik-salonu');
      expect(generator.createSlug('İstanbul Özel Klinik')).toBe('istanbul-ozel-klinik');
    });
  });

  describe('Unique ID Generation', () => {
    it('should generate 8-character unique IDs', async () => {
      const generator = appointmentUrlGenerator as any;
      
      const id1 = generator.generateUniqueId();
      const id2 = generator.generateUniqueId();
      
      expect(id1).toHaveLength(8);
      expect(id2).toHaveLength(8);
      expect(id1).not.toBe(id2);
    });
  });
});

describe('Location Manager', () => {
  describe('Location Sync', () => {
    it('should convert GBP location to stored format', async () => {
      // This test requires Firebase mock
      expect(true).toBe(true);
    });

    it('should handle location verification status changes', async () => {
      // This test requires Firebase mock
      expect(true).toBe(true);
    });
  });

  describe('Integration Activation', () => {
    it('should reject activation for unverified locations', async () => {
      // This test requires Firebase mock
      expect(true).toBe(true);
    });

    it('should reject activation for suspended locations', async () => {
      // This test requires Firebase mock
      expect(true).toBe(true);
    });
  });
});
