/**
 * Availability Engine Unit Tests
 * 
 * Tests for slot calculation logic
 */

import { AvailabilityEngine } from '@/services/availability-engine.service';
import { getAdminFirestore } from '@/config/firebase-admin';

// Mock Firestore
jest.mock('@/config/firebase-admin');

describe('Availability Engine', () => {
  let availabilityEngine: AvailabilityEngine;
  let mockFirestore: any;

  beforeEach(() => {
    mockFirestore = {
      collection: jest.fn().mockReturnThis(),
      doc: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn(),
    };

    (getAdminFirestore as jest.Mock).mockReturnValue(mockFirestore);
    availabilityEngine = new AvailabilityEngine();

    jest.clearAllMocks();
  });

  describe('calculateAvailability', () => {
    it('should return empty array if business is closed', async () => {
      // Mock business with closed status for the day
      mockFirestore.get.mockResolvedValue({
        exists: true,
        data: () => ({
          workingHours: [
            {
              dayOfWeek: 1, // Monday
              openTime: '09:00',
              closeTime: '18:00',
              isOpen: false, // Closed
            },
          ],
        }),
      });

      const slots = await availabilityEngine.calculateAvailability(
        'business-123',
        'service-456',
        '2024-01-15', // Monday
        30
      );

      expect(slots).toEqual([]);
    });

    it('should return empty array if date is a holiday', async () => {
      // Mock business working hours
      mockFirestore.get.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          workingHours: [
            {
              dayOfWeek: 1,
              openTime: '09:00',
              closeTime: '18:00',
              isOpen: true,
            },
          ],
        }),
      });

      // Mock holiday check
      mockFirestore.get.mockResolvedValueOnce({
        empty: false, // Holiday exists
      });

      const slots = await availabilityEngine.calculateAvailability(
        'business-123',
        'service-456',
        '2024-01-01', // New Year's Day
        30
      );

      expect(slots).toEqual([]);
    });

    it('should generate slots within working hours', async () => {
      // Mock business working hours (9 AM - 12 PM)
      mockFirestore.get.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          workingHours: [
            {
              dayOfWeek: 1,
              openTime: '09:00',
              closeTime: '12:00',
              isOpen: true,
            },
          ],
        }),
      });

      // Mock no holidays
      mockFirestore.get.mockResolvedValueOnce({
        empty: true,
      });

      // Mock no existing bookings
      mockFirestore.get.mockResolvedValueOnce({
        empty: true,
        docs: [],
      });

      // Mock staff
      mockFirestore.get.mockResolvedValueOnce({
        exists: true,
        data: () => ({ staffIds: [] }),
      });

      mockFirestore.get.mockResolvedValueOnce({
        docs: [
          {
            id: 'staff-1',
            data: () => ({ name: 'Staff 1', isActive: true }),
          },
        ],
      });

      const slots = await availabilityEngine.calculateAvailability(
        'business-123',
        'service-456',
        '2024-01-15',
        30
      );

      expect(slots.length).toBeGreaterThan(0);
      
      // Check all slots are within working hours
      slots.forEach(slot => {
        const hour = slot.startTime.getHours();
        expect(hour).toBeGreaterThanOrEqual(9);
        expect(hour).toBeLessThan(12);
      });
    });

    it('should exclude slots with existing bookings', async () => {
      // Mock working hours
      mockFirestore.get.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          workingHours: [
            {
              dayOfWeek: 1,
              openTime: '09:00',
              closeTime: '12:00',
              isOpen: true,
            },
          ],
        }),
      });

      // Mock no holidays
      mockFirestore.get.mockResolvedValueOnce({
        empty: true,
      });

      // Mock existing booking at 10:00
      const bookingTime = new Date('2024-01-15T10:00:00Z');
      mockFirestore.get.mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            data: () => ({
              appointmentTime: { toDate: () => bookingTime },
              duration: 30,
              status: 'confirmed',
            }),
          },
        ],
      });

      // Mock service and staff
      mockFirestore.get.mockResolvedValueOnce({
        exists: true,
        data: () => ({ staffIds: [] }),
      });

      mockFirestore.get.mockResolvedValueOnce({
        docs: [
          {
            id: 'staff-1',
            data: () => ({ name: 'Staff 1', isActive: true }),
          },
        ],
      });

      const slots = await availabilityEngine.calculateAvailability(
        'business-123',
        'service-456',
        '2024-01-15',
        30
      );

      // Verify 10:00 slot is excluded
      const conflictingSlot = slots.find(
        slot => slot.startTime.getHours() === 10 && slot.startTime.getMinutes() === 0
      );

      expect(conflictingSlot).toBeUndefined();
    });
  });

  describe('checkSlotAvailability', () => {
    it('should return available if slot is free', async () => {
      // Mock all necessary Firestore calls for availability calculation
      mockFirestore.get
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({
            workingHours: [
              { dayOfWeek: 1, openTime: '09:00', closeTime: '18:00', isOpen: true },
            ],
          }),
        })
        .mockResolvedValueOnce({ empty: true }) // No holidays
        .mockResolvedValueOnce({ empty: true, docs: [] }) // No bookings
        .mockResolvedValueOnce({ exists: true, data: () => ({ staffIds: [] }) })
        .mockResolvedValueOnce({
          docs: [{ id: 'staff-1', data: () => ({ name: 'Staff', isActive: true }) }],
        });

      const result = await availabilityEngine.checkSlotAvailability(
        'business-123',
        'service-456',
        new Date('2024-01-15T10:00:00Z'),
        30
      );

      expect(result.available).toBe(true);
      expect(result.availableSpots).toBeGreaterThan(0);
    });

    it('should return unavailable if slot is booked', async () => {
      const slotTime = new Date('2024-01-15T10:00:00Z');

      // Mock working hours
      mockFirestore.get
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({
            workingHours: [
              { dayOfWeek: 1, openTime: '09:00', closeTime: '18:00', isOpen: true },
            ],
          }),
        })
        .mockResolvedValueOnce({ empty: true }) // No holidays
        .mockResolvedValueOnce({
          empty: false,
          docs: [
            {
              data: () => ({
                appointmentTime: { toDate: () => slotTime },
                duration: 30,
                status: 'confirmed',
              }),
            },
          ],
        })
        .mockResolvedValueOnce({ exists: true, data: () => ({ staffIds: [] }) })
        .mockResolvedValueOnce({
          docs: [{ id: 'staff-1', data: () => ({ name: 'Staff', isActive: true }) }],
        });

      const result = await availabilityEngine.checkSlotAvailability(
        'business-123',
        'service-456',
        slotTime,
        30
      );

      expect(result.available).toBe(false);
      expect(result.availableSpots).toBe(0);
    });
  });

  describe('getAlternativeSlots', () => {
    it('should return slots closest to requested time', async () => {
      const requestedTime = new Date('2024-01-15T10:00:00Z');

      // Mock availability calculation
      mockFirestore.get
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({
            workingHours: [
              { dayOfWeek: 1, openTime: '09:00', closeTime: '18:00', isOpen: true },
            ],
          }),
        })
        .mockResolvedValueOnce({ empty: true })
        .mockResolvedValueOnce({ empty: true, docs: [] })
        .mockResolvedValueOnce({ exists: true, data: () => ({ staffIds: [] }) })
        .mockResolvedValueOnce({
          docs: [{ id: 'staff-1', data: () => ({ name: 'Staff', isActive: true }) }],
        });

      const alternatives = await availabilityEngine.getAlternativeSlots(
        'business-123',
        'service-456',
        requestedTime,
        30,
        3
      );

      expect(alternatives.length).toBeLessThanOrEqual(3);
      
      // Alternatives should be sorted by proximity to requested time
      if (alternatives.length > 1) {
        const timeDiff1 = Math.abs(
          alternatives[0].startTime.getTime() - requestedTime.getTime()
        );
        const timeDiff2 = Math.abs(
          alternatives[1].startTime.getTime() - requestedTime.getTime()
        );
        expect(timeDiff1).toBeLessThanOrEqual(timeDiff2);
      }
    });
  });

  describe('Slot Generation Logic', () => {
    it('should generate slots with 15-minute intervals', async () => {
      mockFirestore.get
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({
            workingHours: [
              { dayOfWeek: 1, openTime: '10:00', closeTime: '11:00', isOpen: true },
            ],
          }),
        })
        .mockResolvedValueOnce({ empty: true })
        .mockResolvedValueOnce({ empty: true, docs: [] })
        .mockResolvedValueOnce({ exists: true, data: () => ({ staffIds: [] }) })
        .mockResolvedValueOnce({
          docs: [{ id: 'staff-1', data: () => ({ name: 'Staff', isActive: true }) }],
        });

      const slots = await availabilityEngine.calculateAvailability(
        'business-123',
        'service-456',
        '2024-01-15',
        30
      );

      // With 1 hour window and 30 min service, should have slots at :00, :15, :30
      expect(slots.length).toBeGreaterThanOrEqual(2);
      
      // Check 15-minute intervals
      if (slots.length > 1) {
        const diff = slots[1].startTime.getTime() - slots[0].startTime.getTime();
        expect(diff).toBe(15 * 60 * 1000); // 15 minutes in milliseconds
      }
    });

    it('should not generate slots that exceed closing time', async () => {
      mockFirestore.get
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({
            workingHours: [
              { dayOfWeek: 1, openTime: '17:30', closeTime: '18:00', isOpen: true },
            ],
          }),
        })
        .mockResolvedValueOnce({ empty: true })
        .mockResolvedValueOnce({ empty: true, docs: [] })
        .mockResolvedValueOnce({ exists: true, data: () => ({ staffIds: [] }) })
        .mockResolvedValueOnce({
          docs: [{ id: 'staff-1', data: () => ({ name: 'Staff', isActive: true }) }],
        });

      const slots = await availabilityEngine.calculateAvailability(
        'business-123',
        'service-456',
        '2024-01-15',
        60 // 60 minute service
      );

      // No slots should be generated because 60-min service doesn't fit in 30-min window
      expect(slots.length).toBe(0);
    });
  });
});
