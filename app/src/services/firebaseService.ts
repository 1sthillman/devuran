import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
  onSnapshot,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Appointment, Salon, Service, Staff, Review } from '@/types';

// Collections
const COLLECTIONS = {
  SALONS: 'salons',
  SERVICES: 'services',
  STAFF: 'staff',
  APPOINTMENTS: 'appointments',
  REVIEWS: 'reviews',
  USERS: 'users',
  AVAILABILITY: 'availability',
  QUEUE: 'queue',
  BANNED_USERS: 'bannedUsers',
  SALON_CUSTOMER_RATINGS: 'salonCustomerRatings',
} as const;

// ==================== APPOINTMENTS ====================

export const appointmentsService = {
  // Create new appointment
  async create(appointmentData: Omit<Appointment, 'id'>) {
    try {
      // Validation: Check if slot is still available
      const isAvailable = await this.isSlotAvailable(
        appointmentData.salonId,
        appointmentData.staffId,
        appointmentData.date,
        appointmentData.time
      );
      
      if (!isAvailable) {
        throw new Error('Bu saat artık müsait değil. Lütfen başka bir saat seçin.');
      }
      
      // Calculate end time based on total duration
      const [hours, minutes] = appointmentData.time.split(':').map(Number);
      const totalMinutes = hours * 60 + minutes + appointmentData.totalDuration;
      const endHours = Math.floor(totalMinutes / 60);
      const endMinutes = totalMinutes % 60;
      const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
      
      const docRef = await addDoc(collection(db, COLLECTIONS.APPOINTMENTS), {
        ...appointmentData,
        endTime,
        status: 'confirmed', // Otomatik onay
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return { id: docRef.id, ...appointmentData, endTime, status: 'confirmed' as const };
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  },

  // Get user appointments
  async getUserAppointments(userId: string) {
    try {
      const q = query(
        collection(db, COLLECTIONS.APPOINTMENTS),
        where('userId', '==', userId),
        orderBy('date', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Appointment));
    } catch (error) {
      console.error('Error fetching user appointments:', error);
      throw error;
    }
  },

  // Get salon appointments
  async getSalonAppointments(salonId: string, startDate?: string, endDate?: string) {
    try {
      const constraints: QueryConstraint[] = [
        where('salonId', '==', salonId),
        orderBy('date', 'asc'),
      ];

      if (startDate) {
        constraints.push(where('date', '>=', startDate));
      }
      if (endDate) {
        constraints.push(where('date', '<=', endDate));
      }

      const q = query(collection(db, COLLECTIONS.APPOINTMENTS), ...constraints);
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Appointment));
    } catch (error) {
      console.error('Error fetching salon appointments:', error);
      throw error;
    }
  },

  // Update appointment status
  async updateStatus(appointmentId: string, status: Appointment['status'], reason?: string) {
    try {
      const docRef = doc(db, COLLECTIONS.APPOINTMENTS, appointmentId);
      const updateData: any = {
        status,
        updatedAt: Timestamp.now(),
      };
      
      if (status === 'cancelled' && reason) {
        updateData.cancellationReason = reason;
        updateData.cancelledAt = new Date().toISOString();
      }
      
      if (status === 'completed') {
        updateData.completedAt = new Date().toISOString();
      }
      
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating appointment status:', error);
      throw error;
    }
  },

  // Cancel appointment with reason
  async cancel(appointmentId: string, reason: string, cancelledBy: 'customer' | 'salon') {
    try {
      const docRef = doc(db, COLLECTIONS.APPOINTMENTS, appointmentId);
      const appointmentSnap = await getDoc(docRef);
      
      if (!appointmentSnap.exists()) {
        throw new Error('Randevu bulunamadı');
      }
      
      const appointment = appointmentSnap.data() as Appointment;
      
      await updateDoc(docRef, {
        status: 'cancelled',
        cancellationReason: reason,
        cancelledBy,
        cancelledAt: new Date().toISOString(),
        updatedAt: Timestamp.now(),
      });
      
      // Process queue - sıradaki kişiyi otomatik randevuya al
      await this.processQueue(
        appointment.salonId,
        appointment.staffId,
        appointment.date,
        appointment.time
      );
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      throw error;
    }
  },

  // Complete appointment early
  async completeEarly(appointmentId: string, actualEndTime: string) {
    try {
      const docRef = doc(db, COLLECTIONS.APPOINTMENTS, appointmentId);
      await updateDoc(docRef, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        actualEndTime,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error completing appointment early:', error);
      throw error;
    }
  },

  // Delete appointment (hard delete - use with caution)
  async delete(appointmentId: string) {
    try {
      await deleteDoc(doc(db, COLLECTIONS.APPOINTMENTS, appointmentId));
    } catch (error) {
      console.error('Error deleting appointment:', error);
      throw error;
    }
  },

  // Check if time slot is available
  async isSlotAvailable(salonId: string, staffId: string, date: string, time: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, COLLECTIONS.APPOINTMENTS),
        where('salonId', '==', salonId),
        where('staffId', '==', staffId),
        where('date', '==', date),
        where('time', '==', time),
        where('status', 'in', ['pending', 'confirmed'])
      );
      const snapshot = await getDocs(q);
      return snapshot.empty;
    } catch (error) {
      console.error('Error checking slot availability:', error);
      return false;
    }
  },

  // Get booked slots for a specific date and staff
  async getBookedSlots(salonId: string, staffId: string, date: string): Promise<string[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.APPOINTMENTS),
        where('salonId', '==', salonId),
        where('staffId', '==', staffId),
        where('date', '==', date),
        where('status', 'in', ['pending', 'confirmed'])
      );
      const snapshot = await getDocs(q);
      
      // Tüm bloke edilmesi gereken saatleri hesapla
      const allBlockedSlots: string[] = [];
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const startTime = data.time as string;
        const duration = data.totalDuration || 60; // Toplam hizmet süresi
        
        // Başlangıç saatini dakikaya çevir
        const [hours, minutes] = startTime.split(':').map(Number);
        const startMinutes = hours * 60 + minutes;
        
        // Hizmet süresi boyunca tüm 30dk'lık slotları blokla
        for (let i = 0; i < duration; i += 30) {
          const blockedMinutes = startMinutes + i;
          const blockedHours = Math.floor(blockedMinutes / 60);
          const blockedMins = blockedMinutes % 60;
          const blockedSlot = `${blockedHours}:${blockedMins.toString().padStart(2, '0')}`;
          allBlockedSlots.push(blockedSlot);
        }
      });
      
      return allBlockedSlots;
    } catch (error) {
      console.error('Error getting booked slots:', error);
      return [];
    }
  },

  // Add to queue - sıraya alma (saat seçimi opsiyonel)
  async addToQueue(queueData: {
    userId: string;
    salonId: string;
    staffId: string;
    customerName: string;
    customerPhone: string;
    customerAvatar?: string;
    services: { id: string; name: string; price: number; duration: number }[];
    preferredDate?: string;
    preferredTime?: string;
    totalPrice: number;
    totalDuration: number;
    notes: string;
  }) {
    try {
      // Get current queue position
      const q = query(
        collection(db, COLLECTIONS.QUEUE),
        where('salonId', '==', queueData.salonId),
        where('staffId', '==', queueData.staffId)
      );
      const snapshot = await getDocs(q);
      const queuePosition = snapshot.size + 1;

      const docRef = await addDoc(collection(db, COLLECTIONS.QUEUE), {
        ...queueData,
        queuePosition,
        notified: false,
        createdAt: new Date().toISOString(),
      });
      
      return { id: docRef.id, ...queueData, queuePosition, notified: false };
    } catch (error) {
      console.error('Error adding to queue:', error);
      throw error;
    }
  },

  // Process queue when appointment is cancelled - otomatik randevuya çevir
  async processQueue(salonId: string, staffId: string, date: string, time: string) {
    try {
      // Find first person in queue
      const q = query(
        collection(db, COLLECTIONS.QUEUE),
        where('salonId', '==', salonId),
        where('staffId', '==', staffId),
        orderBy('queuePosition', 'asc')
      );
      
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const firstInQueue = snapshot.docs[0];
        const queueData = firstInQueue.data();
        
        // Create appointment from queue
        const appointmentData = {
          userId: queueData.userId,
          salonId: queueData.salonId,
          staffId: queueData.staffId,
          customerName: queueData.customerName,
          customerPhone: queueData.customerPhone,
          services: queueData.services,
          date,
          time,
          totalPrice: queueData.totalPrice,
          totalDuration: queueData.totalDuration,
          notes: queueData.notes,
          status: 'confirmed' as const,
          salonName: '', // Will be filled by booking component
          salonCover: '',
          salonAddress: '',
          staffName: '',
          staffPhoto: '',
          whatsappNumber: '',
          endTime: '',
        };
        
        await this.create(appointmentData);
        
        // Remove from queue
        await deleteDoc(firstInQueue.ref);
        
        // Update queue positions for remaining
        const remaining = snapshot.docs.slice(1);
        const batch = writeBatch(db);
        remaining.forEach((doc, index) => {
          batch.update(doc.ref, { queuePosition: index + 1 });
        });
        await batch.commit();
        
        // TODO: Send notification to customer
        console.log('Queue processed, customer notified:', queueData.customerName);
      }
    } catch (error) {
      console.error('Error processing queue:', error);
      throw error;
    }
  },

  // Get queue for salon/staff
  async getQueue(salonId: string, staffId?: string) {
    try {
      const constraints: QueryConstraint[] = [
        where('salonId', '==', salonId),
        orderBy('queuePosition', 'asc'),
      ];
      
      if (staffId) {
        constraints.push(where('staffId', '==', staffId));
      }
      
      const q = query(collection(db, COLLECTIONS.QUEUE), ...constraints);
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as any));
    } catch (error) {
      console.error('Error fetching queue:', error);
      throw error;
    }
  },

  // Remove from queue
  async removeFromQueue(queueId: string) {
    try {
      await deleteDoc(doc(db, COLLECTIONS.QUEUE, queueId));
    } catch (error) {
      console.error('Error removing from queue:', error);
      throw error;
    }
  },

  // Assign queue entry to time slot
  async assignQueueToSlot(queueId: string, date: string, time: string) {
    try {
      const queueRef = doc(db, COLLECTIONS.QUEUE, queueId);
      const queueSnap = await getDoc(queueRef);
      
      if (!queueSnap.exists()) {
        throw new Error('Sıra kaydı bulunamadı');
      }
      
      const queueData = queueSnap.data();
      
      // Create appointment
      const appointmentData = {
        userId: queueData.userId,
        salonId: queueData.salonId,
        staffId: queueData.staffId,
        customerName: queueData.customerName,
        customerPhone: queueData.customerPhone,
        services: queueData.services,
        date,
        time,
        totalPrice: queueData.totalPrice,
        totalDuration: queueData.totalDuration,
        notes: queueData.notes,
        status: 'confirmed' as const,
        salonName: '',
        salonCover: '',
        salonAddress: '',
        staffName: '',
        staffPhoto: '',
        whatsappNumber: '',
        endTime: '',
      };
      
      const appointment = await this.create(appointmentData);
      
      // Remove from queue
      await deleteDoc(queueRef);
      
      return appointment;
    } catch (error) {
      console.error('Error assigning queue to slot:', error);
      throw error;
    }
  },

  // Reschedule appointment
  async reschedule(appointmentId: string, newDate: string, newTime: string) {
    try {
      const docRef = doc(db, COLLECTIONS.APPOINTMENTS, appointmentId);
      await updateDoc(docRef, {
        date: newDate,
        time: newTime,
        status: 'confirmed',
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      throw error;
    }
  },

  // Real-time listener for appointments
  subscribeToAppointments(
    userId: string,
    callback: (appointments: Appointment[]) => void
  ) {
    const q = query(
      collection(db, COLLECTIONS.APPOINTMENTS),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const appointments = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Appointment)
      );
      callback(appointments);
    });
  },

  // Auto-complete appointments after service duration
  async autoCompleteAppointments() {
    try {
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      const q = query(
        collection(db, COLLECTIONS.APPOINTMENTS),
        where('date', '==', currentDate),
        where('status', '==', 'confirmed')
      );
      
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      snapshot.docs.forEach((docSnap) => {
        const appointment = docSnap.data() as Appointment;
        if (appointment.endTime <= currentTime) {
          batch.update(docSnap.ref, {
            status: 'completed',
            completedAt: new Date().toISOString(),
            updatedAt: Timestamp.now(),
          });
        }
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error auto-completing appointments:', error);
    }
  },
};

// ==================== SALONS ====================

export const salonsService = {
  // Get all salons
  async getAll() {
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.SALONS));
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Salon));
    } catch (error) {
      console.error('Error fetching salons:', error);
      throw error;
    }
  },

  // Get salon by ID
  async getById(salonId: string) {
    try {
      const docRef = doc(db, COLLECTIONS.SALONS, salonId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Salon;
      }
      return null;
    } catch (error) {
      console.error('Error fetching salon:', error);
      throw error;
    }
  },

  // Create salon
  async create(salonData: Omit<Salon, 'id'>) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.SALONS), {
        ...salonData,
        createdAt: Timestamp.now(),
      });
      return { id: docRef.id, ...salonData };
    } catch (error) {
      console.error('Error creating salon:', error);
      throw error;
    }
  },

  // Update salon
  async update(salonId: string, updates: Partial<Salon>) {
    try {
      const docRef = doc(db, COLLECTIONS.SALONS, salonId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating salon:', error);
      throw error;
    }
  },
};

// ==================== SERVICES ====================

export const servicesService = {
  // Get all services
  async getAll() {
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.SERVICES));
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Service));
    } catch (error) {
      console.error('Error fetching all services:', error);
      throw error;
    }
  },

  // Get services by salon
  async getBySalon(salonId: string) {
    try {
      const q = query(
        collection(db, COLLECTIONS.SERVICES),
        where('salonId', '==', salonId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Service));
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  },

  // Create service
  async create(serviceData: Omit<Service, 'id'>) {
    try {
      // Validation
      if (!serviceData.name || serviceData.name.trim().length === 0) {
        throw new Error('Hizmet adı boş olamaz');
      }
      if (serviceData.duration <= 0) {
        throw new Error('Hizmet süresi 0\'dan büyük olmalıdır');
      }
      if (serviceData.price < 0) {
        throw new Error('Hizmet fiyatı negatif olamaz');
      }
      
      const docRef = await addDoc(collection(db, COLLECTIONS.SERVICES), serviceData);
      return { id: docRef.id, ...serviceData };
    } catch (error) {
      console.error('Error creating service:', error);
      throw error;
    }
  },

  // Update service
  async update(serviceId: string, updates: Partial<Service>) {
    try {
      const docRef = doc(db, COLLECTIONS.SERVICES, serviceId);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error('Error updating service:', error);
      throw error;
    }
  },

  // Delete service
  async delete(serviceId: string) {
    try {
      await deleteDoc(doc(db, COLLECTIONS.SERVICES, serviceId));
    } catch (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
  },
};

// ==================== STAFF ====================

export const staffService = {
  // Get staff by salon
  async getBySalon(salonId: string) {
    try {
      const q = query(collection(db, COLLECTIONS.STAFF), where('salonId', '==', salonId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Staff));
    } catch (error) {
      console.error('Error fetching staff:', error);
      throw error;
    }
  },

  // Create staff member
  async create(staffData: Omit<Staff, 'id'>) {
    try {
      // Validation
      if (!staffData.name || staffData.name.trim().length === 0) {
        throw new Error('Personel adı boş olamaz');
      }
      if (!staffData.specialties || staffData.specialties.length === 0) {
        throw new Error('En az bir uzmanlık alanı seçilmelidir');
      }
      if (!staffData.workingDays || staffData.workingDays.length === 0) {
        throw new Error('En az bir çalışma günü seçilmelidir');
      }
      
      // Validate working days are valid (0-6)
      const invalidDays = staffData.workingDays.filter(day => day < 0 || day > 6);
      if (invalidDays.length > 0) {
        throw new Error('Geçersiz çalışma günü');
      }
      
      // Validate working hours
      if (staffData.workingHours) {
        Object.entries(staffData.workingHours).forEach(([day, hours]) => {
          if (hours.start >= hours.end) {
            throw new Error(`${day} için çalışma saatleri geçersiz`);
          }
        });
      }
      
      const docRef = await addDoc(collection(db, COLLECTIONS.STAFF), staffData);
      return { id: docRef.id, ...staffData };
    } catch (error) {
      console.error('Error creating staff:', error);
      throw error;
    }
  },

  // Update staff member
  async update(staffId: string, updates: Partial<Staff>) {
    try {
      const docRef = doc(db, COLLECTIONS.STAFF, staffId);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error('Error updating staff:', error);
      throw error;
    }
  },

  // Delete staff member
  async delete(staffId: string) {
    try {
      await deleteDoc(doc(db, COLLECTIONS.STAFF, staffId));
    } catch (error) {
      console.error('Error deleting staff:', error);
      throw error;
    }
  },
};

// ==================== AVAILABILITY ====================

export const availabilityService = {
  // Get available time slots for a staff member on a specific date
  async getAvailableSlots(staffId: string, date: string) {
    try {
      // Get staff working hours
      const staffDoc = await getDoc(doc(db, COLLECTIONS.STAFF, staffId));
      if (!staffDoc.exists()) return [];

      const staffData = staffDoc.data() as Staff;
      const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

      // Get existing appointments for this staff on this date
      const q = query(
        collection(db, COLLECTIONS.APPOINTMENTS),
        where('staffId', '==', staffId),
        where('date', '==', date),
        where('status', 'in', ['confirmed', 'upcoming'])
      );
      const snapshot = await getDocs(q);
      const bookedSlots = snapshot.docs.map((doc) => doc.data().time);

      // Generate available slots based on working hours
      const workingHours = staffData.workingHours?.[dayOfWeek];
      if (!workingHours) return [];

      const slots = generateTimeSlots(workingHours.start, workingHours.end, 30); // 30-minute intervals
      return slots.filter((slot) => !bookedSlots.includes(slot));
    } catch (error) {
      console.error('Error fetching available slots:', error);
      throw error;
    }
  },

  // Check if a specific time slot is available
  async isSlotAvailable(staffId: string, date: string, time: string) {
    try {
      const q = query(
        collection(db, COLLECTIONS.APPOINTMENTS),
        where('staffId', '==', staffId),
        where('date', '==', date),
        where('time', '==', time),
        where('status', 'in', ['confirmed', 'upcoming'])
      );
      const snapshot = await getDocs(q);
      return snapshot.empty;
    } catch (error) {
      console.error('Error checking slot availability:', error);
      throw error;
    }
  },
};

// ==================== REVIEWS ====================

export const reviewsService = {
  // Get reviews for a salon
  async getBySalon(salonId: string) {
    try {
      const q = query(
        collection(db, COLLECTIONS.REVIEWS),
        where('salonId', '==', salonId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Review));
    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw error;
    }
  },

  // Create review
  async create(reviewData: Omit<Review, 'id'>) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.REVIEWS), {
        ...reviewData,
        createdAt: Timestamp.now(),
      });
      return { id: docRef.id, ...reviewData };
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  },

  // Submit review for appointment (salon + staff ratings)
  async submitAppointmentReview(
    appointmentId: string,
    userId: string,
    salonId: string,
    staffId: string,
    salonRating: number,
    staffRating: number,
    comment: string,
    customerName: string,
    customerAvatar: string,
    serviceNames: string[],
    staffName: string
  ) {
    try {
      const batch = writeBatch(db);

      // 1. Create review document
      const reviewRef = doc(collection(db, COLLECTIONS.REVIEWS));
      batch.set(reviewRef, {
        salonId,
        staffId,
        userId,
        customerName,
        customerAvatar,
        rating: salonRating, // Salon rating for display
        staffRating, // Staff rating
        comment,
        serviceNames,
        staffName,
        date: new Date().toISOString().split('T')[0],
        createdAt: Timestamp.now(),
      });

      // 2. Update appointment with review flag
      const appointmentRef = doc(db, COLLECTIONS.APPOINTMENTS, appointmentId);
      batch.update(appointmentRef, {
        hasReview: true,
        reviewId: reviewRef.id,
        updatedAt: Timestamp.now(),
      });

      // 3. Update salon rating
      const salonRef = doc(db, COLLECTIONS.SALONS, salonId);
      const salonDoc = await getDoc(salonRef);
      if (salonDoc.exists()) {
        const salonData = salonDoc.data() as Salon;
        const currentAvg = salonData.stats?.averageRating || 0;
        const currentCount = salonData.stats?.reviewCount || 0;
        const newCount = currentCount + 1;
        const newAvg = ((currentAvg * currentCount) + salonRating) / newCount;
        
        batch.update(salonRef, {
          'stats.averageRating': Math.round(newAvg * 10) / 10,
          'stats.reviewCount': newCount,
          updatedAt: Timestamp.now(),
        });
      }

      // 4. Update staff rating
      const staffRef = doc(db, COLLECTIONS.STAFF, staffId);
      const staffDoc = await getDoc(staffRef);
      if (staffDoc.exists()) {
        const staffData = staffDoc.data() as Staff;
        const currentAvg = staffData.rating || 0;
        const currentCount = staffData.reviewCount || 0;
        const newCount = currentCount + 1;
        const newAvg = ((currentAvg * currentCount) + staffRating) / newCount;
        
        batch.update(staffRef, {
          rating: Math.round(newAvg * 10) / 10,
          reviewCount: newCount,
        });
      }

      await batch.commit();
      return reviewRef.id;
    } catch (error) {
      console.error('Error submitting review:', error);
      throw error;
    }
  },

  // Check if user has reviewed an appointment
  async hasUserReviewed(appointmentId: string): Promise<boolean> {
    try {
      const appointmentRef = doc(db, COLLECTIONS.APPOINTMENTS, appointmentId);
      const appointmentDoc = await getDoc(appointmentRef);
      if (appointmentDoc.exists()) {
        const data = appointmentDoc.data();
        return data.hasReview === true;
      }
      return false;
    } catch (error) {
      console.error('Error checking review status:', error);
      return false;
    }
  },
};

// ==================== HELPER FUNCTIONS ====================

function generateTimeSlots(startTime: string, endTime: string, intervalMinutes: number): string[] {
  const slots: string[] = [];
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  let currentHour = startHour;
  let currentMinute = startMinute;

  while (
    currentHour < endHour ||
    (currentHour === endHour && currentMinute < endMinute)
  ) {
    slots.push(
      `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`
    );

    currentMinute += intervalMinutes;
    if (currentMinute >= 60) {
      currentHour += Math.floor(currentMinute / 60);
      currentMinute = currentMinute % 60;
    }
  }

  return slots;
}
