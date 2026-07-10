/**
 * Availability Engine
 * 
 * Calculates available time slots based on:
 * - Business working hours
 * - Existing bookings
 * - Staff availability
 * - Holidays/breaks
 */

import { getAdminFirestore } from '@/config/firebase-admin';
import { TimeSlot } from '@/types/booking.types';

interface WorkingHours {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  openTime: string; // HH:MM format (24h)
  closeTime: string; // HH:MM format (24h)
  isOpen: boolean;
}

interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
  isRecurring?: boolean; // Annual recurring holiday
}

interface StaffMember {
  staffId: string;
  name: string;
  workingHours?: WorkingHours[];
  breaks?: Array<{ start: string; end: string }>; // Daily breaks
}

interface ExistingBooking {
  bookingId: string;
  startTime: Date;
  endTime: Date;
  staffId?: string;
}

/**
 * Availability Engine Class
 */
export class AvailabilityEngine {
  private db = getAdminFirestore();

  /**
   * Calculate available time slots for a specific date
   * 
   * @param businessId - Business ID
   * @param serviceId - Service ID
   * @param date - Date in YYYY-MM-DD format
   * @param duration - Service duration in minutes
   * @returns Array of available time slots
   */
  async calculateAvailability(
    businessId: string,
    serviceId: string,
    date: string,
    duration: number
  ): Promise<TimeSlot[]> {
    console.log(`[Availability Engine] Calculating for ${businessId} on ${date}`);

    // 1. Get business working hours
    const workingHours = await this.getWorkingHours(businessId, date);
    
    if (!workingHours || !workingHours.isOpen) {
      console.log(`[Availability Engine] Business closed on ${date}`);
      return [];
    }

    // 2. Check if date is a holiday
    const isHoliday = await this.isHoliday(businessId, date);
    
    if (isHoliday) {
      console.log(`[Availability Engine] Holiday on ${date}`);
      return [];
    }

    // 3. Get existing bookings for this date
    const existingBookings = await this.getExistingBookings(businessId, date);

    // 4. Get staff availability
    const staffMembers = await this.getStaffForService(businessId, serviceId);

    // 5. Generate all possible time slots based on working hours
    const allSlots = this.generateTimeSlots(
      date,
      workingHours.openTime,
      workingHours.closeTime,
      duration
    );

    // 6. Filter available slots (not conflicting with existing bookings)
    const availableSlots = this.filterAvailableSlots(
      allSlots,
      existingBookings,
      staffMembers,
      duration
    );

    console.log(`[Availability Engine] Found ${availableSlots.length} available slots`);

    return availableSlots;
  }

  /**
   * Get working hours for a specific date
   */
  private async getWorkingHours(
    businessId: string,
    date: string
  ): Promise<WorkingHours | null> {
    try {
      // Get day of week (0 = Sunday, 6 = Saturday)
      const dayOfWeek = new Date(date).getDay();

      // Fetch working hours from Firestore
      const businessDoc = await this.db.collection('businesses').doc(businessId).get();

      if (!businessDoc.exists) {
        return null;
      }

      const business = businessDoc.data();
      const workingHours = business?.workingHours || [];

      // Find working hours for this day of week
      const dayHours = workingHours.find((wh: WorkingHours) => wh.dayOfWeek === dayOfWeek);

      return dayHours || null;
    } catch (error) {
      console.error('[Availability Engine] Error getting working hours:', error);
      return null;
    }
  }

  /**
   * Check if date is a holiday
   */
  private async isHoliday(businessId: string, date: string): Promise<boolean> {
    try {
      const holidaysSnapshot = await this.db
        .collection('holidays')
        .where('businessId', '==', businessId)
        .where('date', '==', date)
        .limit(1)
        .get();

      return !holidaysSnapshot.empty;
    } catch (error) {
      console.error('[Availability Engine] Error checking holiday:', error);
      return false;
    }
  }

  /**
   * Get existing bookings for a specific date
   */
  private async getExistingBookings(
    businessId: string,
    date: string
  ): Promise<ExistingBooking[]> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const bookingsSnapshot = await this.db
        .collection('bookings')
        .where('businessId', '==', businessId)
        .where('appointmentTime', '>=', startOfDay)
        .where('appointmentTime', '<=', endOfDay)
        .where('status', 'in', ['confirmed', 'pending'])
        .get();

      return bookingsSnapshot.docs.map(doc => {
        const data = doc.data();
        const startTime = data.appointmentTime.toDate();
        const endTime = new Date(startTime.getTime() + (data.duration || 30) * 60000);

        return {
          bookingId: doc.id,
          startTime,
          endTime,
          staffId: data.staffId,
        };
      });
    } catch (error) {
      console.error('[Availability Engine] Error getting existing bookings:', error);
      return [];
    }
  }

  /**
   * Get staff members who can provide this service
   */
  private async getStaffForService(
    businessId: string,
    serviceId: string
  ): Promise<StaffMember[]> {
    try {
      // First, get service to see if it requires specific staff
      const serviceDoc = await this.db
        .collection('services')
        .doc(serviceId)
        .get();

      if (!serviceDoc.exists) {
        return [];
      }

      const service = serviceDoc.data();
      const requiredStaffIds = service?.staffIds || [];

      // If no specific staff required, get all active staff
      let staffQuery = this.db
        .collection('staff')
        .where('businessId', '==', businessId)
        .where('isActive', '==', true);

      if (requiredStaffIds.length > 0) {
        // Filter by specific staff IDs
        staffQuery = staffQuery.where('__name__', 'in', requiredStaffIds);
      }

      const staffSnapshot = await staffQuery.get();

      return staffSnapshot.docs.map(doc => ({
        staffId: doc.id,
        name: doc.data().name,
        workingHours: doc.data().workingHours,
        breaks: doc.data().breaks,
      }));
    } catch (error) {
      console.error('[Availability Engine] Error getting staff:', error);
      return [];
    }
  }

  /**
   * Generate all possible time slots within working hours
   */
  private generateTimeSlots(
    date: string,
    openTime: string,
    closeTime: string,
    duration: number,
    interval: number = 15 // Slot interval in minutes
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    
    const [openHour, openMinute] = openTime.split(':').map(Number);
    const [closeHour, closeMinute] = closeTime.split(':').map(Number);

    let currentTime = new Date(date);
    currentTime.setHours(openHour, openMinute, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(closeHour, closeMinute, 0, 0);

    // Generate slots with specified interval
    while (currentTime < endTime) {
      const slotEndTime = new Date(currentTime.getTime() + duration * 60000);

      // Only include slot if it fits within working hours
      if (slotEndTime <= endTime) {
        slots.push({
          slotId: `${date}-${currentTime.getHours()}-${currentTime.getMinutes()}`,
          startTime: new Date(currentTime),
          endTime: slotEndTime,
          duration,
          availableSpots: 1, // Will be calculated in filterAvailableSlots
        });
      }

      // Move to next interval
      currentTime.setMinutes(currentTime.getMinutes() + interval);
    }

    return slots;
  }

  /**
   * Filter slots to only include available ones (no conflicts)
   */
  private filterAvailableSlots(
    allSlots: TimeSlot[],
    existingBookings: ExistingBooking[],
    staffMembers: StaffMember[],
    duration: number
  ): TimeSlot[] {
    return allSlots.filter(slot => {
      // Check if any staff member is available for this slot
      const availableStaffCount = staffMembers.filter(staff => {
        // Check if staff has conflicting bookings
        const hasConflict = existingBookings.some(booking => {
          // Skip if booking is for different staff
          if (booking.staffId && booking.staffId !== staff.staffId) {
            return false;
          }

          // Check for time overlap
          return this.hasTimeOverlap(
            slot.startTime,
            slot.endTime,
            booking.startTime,
            booking.endTime
          );
        });

        return !hasConflict;
      }).length;

      // Slot is available if at least one staff member is free
      slot.availableSpots = availableStaffCount;
      return availableStaffCount > 0;
    });
  }

  /**
   * Check if two time ranges overlap
   */
  private hasTimeOverlap(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date
  ): boolean {
    return start1 < end2 && end1 > start2;
  }

  /**
   * Get capacity for a specific slot
   * (Used to check availability before booking)
   */
  async checkSlotAvailability(
    businessId: string,
    serviceId: string,
    slotTime: Date,
    duration: number
  ): Promise<{ available: boolean; availableSpots: number }> {
    const dateStr = slotTime.toISOString().split('T')[0];
    const slots = await this.calculateAvailability(businessId, serviceId, dateStr, duration);

    const requestedSlot = slots.find(slot => 
      slot.startTime.getTime() === slotTime.getTime()
    );

    if (!requestedSlot) {
      return { available: false, availableSpots: 0 };
    }

    return {
      available: requestedSlot.availableSpots > 0,
      availableSpots: requestedSlot.availableSpots,
    };
  }

  /**
   * Get alternative slots (used when requested slot is unavailable)
   */
  async getAlternativeSlots(
    businessId: string,
    serviceId: string,
    requestedTime: Date,
    duration: number,
    count: number = 3
  ): Promise<TimeSlot[]> {
    const dateStr = requestedTime.toISOString().split('T')[0];
    const allSlots = await this.calculateAvailability(businessId, serviceId, dateStr, duration);

    // Find slots closest to requested time
    const sortedSlots = allSlots
      .map(slot => ({
        ...slot,
        timeDiff: Math.abs(slot.startTime.getTime() - requestedTime.getTime()),
      }))
      .sort((a, b) => a.timeDiff - b.timeDiff)
      .slice(0, count);

    return sortedSlots;
  }
}

// Export singleton instance
export const availabilityEngine = new AvailabilityEngine();
