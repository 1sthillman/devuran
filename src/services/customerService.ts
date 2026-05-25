import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import type { Appointment } from '@/types';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar?: string;
  totalAppointments: number;
  totalSpent: number;
  lastVisit: string;
  firstVisit: string;
  favoriteServices: string[];
  favoriteStaff: string[];
  notes: string;
  tags: string[];
  loyaltyPoints: number;
  status: 'active' | 'inactive' | 'vip';
  rating?: number; // Salon's rating of the customer
  isBanned?: boolean; // Banned from this salon
  bannedAt?: string;
  bannedReason?: string;
  bannedBy?: string; // Owner/staff who banned
}

class CustomerService {
  /**
   * Get all customers for a salon
   */
  async getSalonCustomers(salonId: string): Promise<Customer[]> {
    // DÜZELTME: reservations collection'ından sadece bu işletmenin verilerini çek
    const reservationsQuery = query(
      collection(db, 'reservations'),
      where('businessId', '==', salonId)
    );
    
    const snapshot = await getDocs(reservationsQuery);
    const reservations = snapshot.docs.map(doc => doc.data());

    // Group by customer
    const customerMap = new Map<string, Customer>();

    reservations.forEach((reservation: any) => {
      const userId = reservation.userId;
      if (!userId) return;

      // İptal edilmiş rezervasyonları sayma
      const status = reservation.status;
      if (status === 'cancelled' || status === 'cancelled_by_business' || status === 'cancelled_by_customer') {
        return; // Skip cancelled reservations
      }

      const existing = customerMap.get(userId);
      const resDate = reservation.date || reservation.eventDate || reservation.checkIn || reservation.deliveryDate || '';
      const price = reservation.pricing?.totalAmount || reservation.totalPrice || 0;
      const services = reservation.services || [];

      if (!existing) {
        customerMap.set(userId, {
          id: userId,
          name: reservation.userName || 'İsimsiz',
          phone: reservation.userPhone || '',
          email: reservation.userEmail || '',
          totalAppointments: 1,
          totalSpent: price,
          lastVisit: resDate,
          firstVisit: resDate,
          favoriteServices: services.map((s: any) => s.name),
          favoriteStaff: reservation.staffName ? [reservation.staffName] : [],
          notes: '',
          tags: [],
          loyaltyPoints: Math.floor(price / 10), // Her 10 TL'ye 1 puan
          status: 'active',
        });
      } else {
        existing.totalAppointments++;
        existing.totalSpent += price;
        existing.loyaltyPoints += Math.floor(price / 10); // Her 10 TL'ye 1 puan ekle

        if (resDate && new Date(resDate) > new Date(existing.lastVisit)) {
          existing.lastVisit = resDate;
        }

        if (resDate && new Date(resDate) < new Date(existing.firstVisit)) {
          existing.firstVisit = resDate;
        }

        // Update favorite services
        services.forEach((service: any) => {
          if (service.name && !existing.favoriteServices.includes(service.name)) {
            existing.favoriteServices.push(service.name);
          }
        });

        // Update favorite staff
        if (reservation.staffName && !existing.favoriteStaff.includes(reservation.staffName)) {
          existing.favoriteStaff.push(reservation.staffName);
        }

        // Determine VIP status
        if (existing.totalAppointments >= 10 || existing.totalSpent >= 5000) {
          existing.status = 'vip';
        }
      }
    });

    // Load additional customer data from Firestore
    const customers = Array.from(customerMap.values());
    
    for (const customer of customers) {
      const customerDocRef = doc(db, 'customers', `${salonId}_${customer.id}`);
      const customerDoc = await getDoc(customerDocRef);
      if (customerDoc.exists()) {
        const data = customerDoc.data();
        customer.notes = data.notes || '';
        customer.tags = data.tags || [];
        customer.rating = data.rating;
        customer.isBanned = data.isBanned || false;
        customer.bannedAt = data.bannedAt;
        customer.bannedReason = data.bannedReason;
        customer.bannedBy = data.bannedBy;
      }
    }
    
    return customers.sort((a, b) => 
      new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime()
    );
  }

  /**
   * Get customer details
   */
  async getCustomer(customerId: string, salonId: string): Promise<Customer | null> {
    const customers = await this.getSalonCustomers(salonId);
    return customers.find(c => c.id === customerId) || null;
  }

  /**
   * Update customer notes
   */
  async updateCustomerNotes(customerId: string, salonId: string, notes: string): Promise<void> {
    const customerRef = doc(db, 'customers', `${salonId}_${customerId}`);
    await setDoc(customerRef, { notes, salonId, customerId }, { merge: true });
  }

  /**
   * Update customer tags
   */
  async updateCustomerTags(customerId: string, salonId: string, tags: string[]): Promise<void> {
    const customerRef = doc(db, 'customers', `${salonId}_${customerId}`);
    await setDoc(customerRef, { tags, salonId, customerId }, { merge: true });
  }

  /**
   * Rate customer
   */
  async rateCustomer(customerId: string, salonId: string, rating: number): Promise<void> {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const customerRef = doc(db, 'customers', `${salonId}_${customerId}`);
    await setDoc(customerRef, { rating, salonId, customerId }, { merge: true });
  }

  /**
   * Ban customer from salon
   */
  async banCustomer(
    customerId: string, 
    salonId: string, 
    reason: string, 
    bannedBy: string
  ): Promise<void> {
    const customerRef = doc(db, 'customers', `${salonId}_${customerId}`);
    await setDoc(customerRef, {
      isBanned: true,
      bannedAt: new Date().toISOString(),
      bannedReason: reason,
      bannedBy,
      salonId,
      customerId
    }, { merge: true });
  }

  /**
   * Unban customer
   */
  async unbanCustomer(customerId: string, salonId: string): Promise<void> {
    const customerRef = doc(db, 'customers', `${salonId}_${customerId}`);
    await setDoc(customerRef, {
      isBanned: false,
      bannedAt: null,
      bannedReason: null,
      bannedBy: null,
      salonId,
      customerId
    }, { merge: true });
  }

  /**
   * Check if customer is banned
   */
  async isCustomerBanned(customerId: string, salonId: string): Promise<boolean> {
    const customerRef = doc(db, 'customers', `${salonId}_${customerId}`);
    const customerDoc = await getDoc(customerRef);
    
    if (customerDoc.exists()) {
      return customerDoc.data().isBanned || false;
    }
    
    return false;
  }

  /**
   * Search customers
   */
  async searchCustomers(salonId: string, searchTerm: string): Promise<Customer[]> {
    const customers = await this.getSalonCustomers(salonId);
    const term = searchTerm.toLowerCase();

    return customers.filter(customer =>
      customer.name.toLowerCase().includes(term) ||
      customer.phone.includes(term) ||
      customer.email.toLowerCase().includes(term)
    );
  }

  /**
   * Get customer statistics
   */
  async getCustomerStats(salonId: string): Promise<{
    total: number;
    active: number;
    vip: number;
    inactive: number;
    averageSpent: number;
    averageVisits: number;
  }> {
    const customers = await this.getSalonCustomers(salonId);

    const total = customers.length;
    const active = customers.filter(c => c.status === 'active').length;
    const vip = customers.filter(c => c.status === 'vip').length;
    const inactive = customers.filter(c => c.status === 'inactive').length;

    const totalSpent = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    const totalVisits = customers.reduce((sum, c) => sum + c.totalAppointments, 0);

    return {
      total,
      active,
      vip,
      inactive,
      averageSpent: total > 0 ? totalSpent / total : 0,
      averageVisits: total > 0 ? totalVisits / total : 0,
    };
  }
}

export const customerService = new CustomerService();
