import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { BannedUser, SalonCustomerRating } from '@/types';

const COLLECTIONS = {
  BANNED_USERS: 'bannedUsers',
  SALON_CUSTOMER_RATINGS: 'salonCustomerRatings',
} as const;

// ==================== BAN SYSTEM ====================

export const banService = {
  // Ban a customer from salon
  async banCustomer(banData: {
    userId: string;
    salonId: string;
    bannedBy: string;
    reason: string;
    customerName: string;
    customerPhone: string;
  }) {
    try {
      // Check if already banned
      const existing = await this.isCustomerBanned(banData.userId, banData.salonId);
      if (existing) {
        throw new Error('Bu müşteri zaten engellenmiş');
      }

      const docRef = await addDoc(collection(db, COLLECTIONS.BANNED_USERS), {
        ...banData,
        bannedAt: new Date().toISOString(),
        createdAt: Timestamp.now(),
      });

      return { id: docRef.id, ...banData };
    } catch (error) {
      console.error('Error banning customer:', error);
      throw error;
    }
  },

  // Unban a customer
  async unbanCustomer(banId: string) {
    try {
      await deleteDoc(doc(db, COLLECTIONS.BANNED_USERS, banId));
    } catch (error) {
      console.error('Error unbanning customer:', error);
      throw error;
    }
  },

  // Check if customer is banned from salon
  async isCustomerBanned(userId: string, salonId: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, COLLECTIONS.BANNED_USERS),
        where('userId', '==', userId),
        where('salonId', '==', salonId)
      );
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking ban status:', error);
      return false;
    }
  },

  // Get banned customers for salon
  async getBannedCustomers(salonId: string) {
    try {
      const q = query(
        collection(db, COLLECTIONS.BANNED_USERS),
        where('salonId', '==', salonId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as BannedUser));
    } catch (error) {
      console.error('Error fetching banned customers:', error);
      throw error;
    }
  },

  // Report a customer (for admin review)
  async reportCustomer(reportData: {
    userId: string;
    salonId: string;
    reportedBy: string;
    reason: string;
    customerName: string;
    customerPhone: string;
  }) {
    try {
      // Şikayet sistemini implement et - admin review için
      // Bu, ayrı bir collection'da report document oluşturabilir
      // admin review öncesi banlama için
      
      // Şimdilik sadece error log - production'da admin panel'e gönderilmeli
      console.error('Customer report received:', {
        reportedBy: reportData.reportedBy,
        reason: reportData.reason,
        timestamp: new Date().toISOString()
      });
      // This could create a report document in a separate collection
      // for admin review before banning
    } catch (error) {
      console.error('Error reporting customer:', error);
      throw error;
    }
  },
};

// ==================== SALON CUSTOMER RATING ====================

export const salonCustomerRatingService = {
  // Rate a customer
  async rateCustomer(ratingData: {
    salonId: string;
    customerId: string;
    customerName: string;
    rating: number;
    comment?: string;
    ratedBy: string;
  }) {
    try {
      // Validate rating
      if (ratingData.rating < 1 || ratingData.rating > 5) {
        throw new Error('Puan 1-5 arasında olmalıdır');
      }

      // Check if already rated
      const q = query(
        collection(db, COLLECTIONS.SALON_CUSTOMER_RATINGS),
        where('salonId', '==', ratingData.salonId),
        where('customerId', '==', ratingData.customerId)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        throw new Error('Bu müşteriyi zaten değerlendirdiniz');
      }

      const docRef = await addDoc(collection(db, COLLECTIONS.SALON_CUSTOMER_RATINGS), {
        ...ratingData,
        ratedAt: new Date().toISOString(),
        createdAt: Timestamp.now(),
      });

      return { id: docRef.id, ...ratingData };
    } catch (error) {
      console.error('Error rating customer:', error);
      throw error;
    }
  },

  // Get customer rating by salon
  async getCustomerRating(salonId: string, customerId: string) {
    try {
      const q = query(
        collection(db, COLLECTIONS.SALON_CUSTOMER_RATINGS),
        where('salonId', '==', salonId),
        where('customerId', '==', customerId)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as SalonCustomerRating;
    } catch (error) {
      console.error('Error fetching customer rating:', error);
      return null;
    }
  },

  // Get all customer ratings for salon
  async getSalonCustomerRatings(salonId: string) {
    try {
      const q = query(
        collection(db, COLLECTIONS.SALON_CUSTOMER_RATINGS),
        where('salonId', '==', salonId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as SalonCustomerRating));
    } catch (error) {
      console.error('Error fetching salon customer ratings:', error);
      throw error;
    }
  },
};
