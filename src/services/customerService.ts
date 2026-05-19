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
}

class CustomerService {
  /**
   * Get all customers for a salon
   */
  async getSalonCustomers(salonId: string): Promise<Customer[]> {
    const appointmentsQuery = query(
      collection(db, 'appointments'),
      where('salonId', '==', salonId)
    );
    
    const snapshot = await getDocs(appointmentsQuery);
    const appointments = snapshot.docs.map(doc => doc.data() as Appointment);

    // Group by customer
    const customerMap = new Map<string, Customer>();

    appointments.forEach(appointment => {
      const existing = customerMap.get(appointment.userId);

      if (!existing) {
        customerMap.set(appointment.userId, {
          id: appointment.userId,
          name: appointment.customerName,
          phone: appointment.customerPhone,
          email: '',
          totalAppointments: 1,
          totalSpent: appointment.totalPrice,
          lastVisit: appointment.date,
          firstVisit: appointment.date,
          favoriteServices: appointment.services.map(s => s.name),
          favoriteStaff: [appointment.staffName],
          notes: '',
          tags: [],
          loyaltyPoints: Math.floor(appointment.totalPrice / 10),
          status: 'active',
        });
      } else {
        existing.totalAppointments++;
        existing.totalSpent += appointment.totalPrice;
        existing.loyaltyPoints += Math.floor(appointment.totalPrice / 10);

        if (new Date(appointment.date) > new Date(existing.lastVisit)) {
          existing.lastVisit = appointment.date;
        }

        if (new Date(appointment.date) < new Date(existing.firstVisit)) {
          existing.firstVisit = appointment.date;
        }

        // Update favorite services
        appointment.services.forEach(service => {
          if (!existing.favoriteServices.includes(service.name)) {
            existing.favoriteServices.push(service.name);
          }
        });

        // Update favorite staff
        if (!existing.favoriteStaff.includes(appointment.staffName)) {
          existing.favoriteStaff.push(appointment.staffName);
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
      const customerDoc = await getDoc(doc(db, 'customers', customer.id));
      if (customerDoc.exists()) {
        const data = customerDoc.data();
        customer.notes = data.notes || '';
        customer.tags = data.tags || [];
        customer.rating = data.rating;
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
  async updateCustomerNotes(customerId: string, notes: string): Promise<void> {
    const customerRef = doc(db, 'customers', customerId);
    await setDoc(customerRef, { notes }, { merge: true });
  }

  /**
   * Update customer tags
   */
  async updateCustomerTags(customerId: string, tags: string[]): Promise<void> {
    const customerRef = doc(db, 'customers', customerId);
    await setDoc(customerRef, { tags }, { merge: true });
  }

  /**
   * Rate customer
   */
  async rateCustomer(customerId: string, rating: number): Promise<void> {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const customerRef = doc(db, 'customers', customerId);
    await setDoc(customerRef, { rating }, { merge: true });
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
