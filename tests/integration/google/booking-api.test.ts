/**
 * Booking API Integration Tests
 * 
 * Tests for availability calculation and booking creation with race conditions
 */

import request from 'supertest';
import express from 'express';
import bookingRoutes from '@/routes/booking.routes';
import { getAdminFirestore } from '@/config/firebase-admin';
import { getRedisClient } from '@/config/redis';
import { lockManager } from '@/services/lock-manager.service';

// Mock dependencies
jest.mock('@/config/firebase-admin');
jest.mock('@/config/redis');

// Create test Express app
const app = express();
app.use(express.json());
app.use('/api/v1', bookingRoutes);

describe('Booking API Integration Tests', () => {
  let mockFirestore: any;
  let mockRedis: any;

  beforeEach(() => {
    // Setup mocks
    mockFirestore = {
      collection: jest.fn().mockReturnThis(),
      doc: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn(),
      add: jest.fn(),
      set: jest.fn(),
      update: jest.fn(),
    };

    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      ttl: jest.fn(),
      eval: jest.fn(),
    };

    (getAdminFirestore as jest.Mock).mockReturnValue(mockFirestore);
    (getRedisClient as jest.Mock).mockReturnValue(mockRedis);

    jest.clearAllMocks();
  });

  describe('GET /api/v1/booking/availability', () => {
    it('should return cached availability if exists', async () => {
      const cachedSlots = [
        {
          slotId: '2024-01-15-10-00',
          startTime: '2024-01-15T10:00:00Z',
          endTime: '2024-01-15T10:30:00Z',
          duration: 30,
          availableSpots: 1,
        },
      ];

      mockRedis.get.mockResolvedValue(JSON.stringify(cachedSlots));

      const response = await request(app)
        .get('/api/v1/booking/availability')
        .query({
          businessId: 'test-business',
          serviceId: 'test-service',
          date: '2024-01-15',
        })
        .expect(200);

      expect(response.body.slots).toEqual(cachedSlots);
      expect(mockRedis.get).toHaveBeenCalledWith(
        'availability:test-business:test-service:2024-01-15'
      );
    });

    it('should calculate and cache availability if not cached', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRedis.setex.mockResolvedValue('OK');

      // Mock Firestore responses for availability calculation
      mockFirestore.get.mockResolvedValue({
        exists: true,
        data: () => ({
          workingHours: [
            {
              dayOfWeek: 1, // Monday
              openTime: '09:00',
              closeTime: '18:00',
              isOpen: true,
            },
          ],
        }),
      });

      const response = await request(app)
        .get('/api/v1/booking/availability')
        .query({
          businessId: 'test-business',
          serviceId: 'test-service',
          date: '2024-01-15', // Monday
          duration: 30,
        })
        .expect(200);

      expect(response.body.slots).toBeDefined();
      expect(Array.isArray(response.body.slots)).toBe(true);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'availability:test-business:test-service:2024-01-15',
        300, // 5 minutes
        expect.any(String)
      );
    });

    it('should return 400 if required parameters missing', async () => {
      const response = await request(app)
        .get('/api/v1/booking/availability')
        .query({ businessId: 'test-business' })
        .expect(400);

      expect(response.body.error).toBe('MISSING_PARAMETERS');
    });
  });

  describe('POST /api/v1/booking/create', () => {
    it('should create booking successfully with distributed lock', async () => {
      // Mock service lookup
      mockFirestore.get.mockResolvedValue({
        exists: true,
        data: () => ({
          name: 'Test Service',
          duration: 30,
        }),
      });

      // Mock availability check
      mockFirestore.get.mockResolvedValueOnce({
        exists: true,
        data: () => ({ name: 'Test Service', duration: 30 }),
      });

      // Mock booking creation
      mockFirestore.add.mockResolvedValue({
        id: 'booking-123',
      });

      // Mock Redis lock
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.eval.mockResolvedValue(1); // Lock release success
      mockRedis.del.mockResolvedValue(1);

      const response = await request(app)
        .post('/api/v1/booking/create')
        .send({
          businessId: 'test-business',
          serviceId: 'test-service',
          slotTime: '2024-01-15T10:00:00Z',
          customerInfo: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '+1234567890',
          },
          source: 'google_appointment_url',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.bookingId).toBeDefined();
      expect(response.body.confirmationCode).toBeDefined();
      expect(mockFirestore.add).toHaveBeenCalled();
    });

    it('should return 409 if slot no longer available', async () => {
      // Mock service lookup
      mockFirestore.get.mockResolvedValue({
        exists: true,
        data: () => ({
          name: 'Test Service',
          duration: 30,
        }),
      });

      // Mock slot already booked
      mockFirestore.get.mockResolvedValueOnce({
        empty: false,
        docs: [{
          data: () => ({
            appointmentTime: { toDate: () => new Date('2024-01-15T10:00:00Z') },
            duration: 30,
            status: 'confirmed',
          }),
        }],
      });

      // Mock Redis lock
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.eval.mockResolvedValue(1);

      const response = await request(app)
        .post('/api/v1/booking/create')
        .send({
          businessId: 'test-business',
          serviceId: 'test-service',
          slotTime: '2024-01-15T10:00:00Z',
          customerInfo: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '+1234567890',
          },
        })
        .expect(409);

      expect(response.body.error).toBe('SLOT_UNAVAILABLE');
      expect(response.body.alternatives).toBeDefined();
    });

    it('should return 503 if lock cannot be acquired', async () => {
      // Mock Redis lock failure (always returns null)
      mockRedis.set.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/booking/create')
        .send({
          businessId: 'test-business',
          serviceId: 'test-service',
          slotTime: '2024-01-15T10:00:00Z',
          customerInfo: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '+1234567890',
          },
        })
        .expect(503);

      expect(response.body.error).toBe('SERVICE_BUSY');
    });

    it('should return 400 if required fields missing', async () => {
      const response = await request(app)
        .post('/api/v1/booking/create')
        .send({
          businessId: 'test-business',
          // Missing serviceId, slotTime, customerInfo
        })
        .expect(400);

      expect(response.body.error).toBe('MISSING_REQUIRED_FIELDS');
    });

    it('should return 400 if customer info invalid', async () => {
      const response = await request(app)
        .post('/api/v1/booking/create')
        .send({
          businessId: 'test-business',
          serviceId: 'test-service',
          slotTime: '2024-01-15T10:00:00Z',
          customerInfo: {
            firstName: 'John',
            // Missing lastName, email, phone
          },
        })
        .expect(400);

      expect(response.body.error).toBe('INVALID_CUSTOMER_INFO');
    });
  });

  describe('Race Condition Prevention', () => {
    it('should handle simultaneous booking requests gracefully', async () => {
      // This test simulates two users trying to book the same slot simultaneously
      // Only one should succeed, the other should get 409 conflict

      // Mock service
      mockFirestore.get.mockResolvedValue({
        exists: true,
        data: () => ({ name: 'Test Service', duration: 30 }),
      });

      // Mock availability (initially available)
      let bookingCount = 0;
      mockFirestore.add.mockImplementation(() => {
        bookingCount++;
        return Promise.resolve({ id: `booking-${bookingCount}` });
      });

      // Mock Redis lock (first succeeds, second fails)
      let lockAttempt = 0;
      mockRedis.set.mockImplementation(() => {
        lockAttempt++;
        return Promise.resolve(lockAttempt === 1 ? 'OK' : null);
      });

      mockRedis.eval.mockResolvedValue(1);
      mockRedis.del.mockResolvedValue(1);

      const bookingData = {
        businessId: 'test-business',
        serviceId: 'test-service',
        slotTime: '2024-01-15T10:00:00Z',
        customerInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
        },
      };

      // Send two requests simultaneously
      const [response1, response2] = await Promise.all([
        request(app).post('/api/v1/booking/create').send(bookingData),
        request(app).post('/api/v1/booking/create').send(bookingData),
      ]);

      // One should succeed (200), other should fail (503 - lock timeout)
      const statuses = [response1.status, response2.status].sort();
      expect(statuses).toEqual([200, 503]);

      // Only one booking should be created
      expect(bookingCount).toBeLessThanOrEqual(1);
    });
  });
});
