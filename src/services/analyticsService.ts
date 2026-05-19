import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import type { Appointment, Reservation } from '@/types';

export interface AnalyticsData {
  revenue: {
    today: number;
    week: number;
    month: number;
    year: number;
    trend: number; // percentage change from previous period
  };
  appointments: {
    today: number;
    week: number;
    month: number;
    total: number;
    byStatus: Record<string, number>;
    trend: number;
  };
  customers: {
    total: number;
    new: number;
    returning: number;
    trend: number;
  };
  services: {
    topServices: Array<{ name: string; count: number; revenue: number }>;
    totalServices: number;
  };
  staff: {
    topStaff: Array<{ name: string; appointments: number; revenue: number; rating: number }>;
    totalStaff: number;
  };
  reviews: {
    averageRating: number;
    totalReviews: number;
    recentReviews: number;
  };
  hourlyDistribution: Record<string, number>;
  dailyDistribution: Record<string, number>;
  monthlyRevenue: Array<{ month: string; revenue: number; appointments: number }>;
}

class AnalyticsService {
  /**
   * Get comprehensive analytics for a salon
   */
  async getSalonAnalytics(salonId: string): Promise<AnalyticsData> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    // Get all appointments
    const appointmentsQuery = query(
      collection(db, 'appointments'),
      where('salonId', '==', salonId)
    );
    const appointmentsSnapshot = await getDocs(appointmentsQuery);
    const appointments = appointmentsSnapshot.docs.map(doc => doc.data() as Appointment);

    // Calculate revenue
    const revenue = this.calculateRevenue(appointments, todayStart, weekStart, monthStart, yearStart);

    // Calculate appointment stats
    const appointmentStats = this.calculateAppointmentStats(appointments, todayStart, weekStart, monthStart);

    // Calculate customer stats
    const customerStats = this.calculateCustomerStats(appointments, monthStart);

    // Calculate service stats
    const serviceStats = this.calculateServiceStats(appointments);

    // Calculate staff stats
    const staffStats = await this.calculateStaffStats(salonId, appointments);

    // Calculate review stats
    const reviewStats = await this.calculateReviewStats(salonId);

    // Calculate distributions
    const hourlyDistribution = this.calculateHourlyDistribution(appointments);
    const dailyDistribution = this.calculateDailyDistribution(appointments);
    const monthlyRevenue = this.calculateMonthlyRevenue(appointments);

    return {
      revenue,
      appointments: appointmentStats,
      customers: customerStats,
      services: serviceStats,
      staff: staffStats,
      reviews: reviewStats,
      hourlyDistribution,
      dailyDistribution,
      monthlyRevenue,
    };
  }

  private calculateRevenue(
    appointments: Appointment[],
    todayStart: Date,
    weekStart: Date,
    monthStart: Date,
    yearStart: Date
  ) {
    const completed = appointments.filter(a => a.status === 'completed');

    const today = completed
      .filter(a => new Date(a.date) >= todayStart)
      .reduce((sum, a) => sum + a.totalPrice, 0);

    const week = completed
      .filter(a => new Date(a.date) >= weekStart)
      .reduce((sum, a) => sum + a.totalPrice, 0);

    const month = completed
      .filter(a => new Date(a.date) >= monthStart)
      .reduce((sum, a) => sum + a.totalPrice, 0);

    const year = completed
      .filter(a => new Date(a.date) >= yearStart)
      .reduce((sum, a) => sum + a.totalPrice, 0);

    // Calculate trend (compare with previous month)
    const prevMonthStart = new Date(monthStart.getTime() - 30 * 24 * 60 * 60 * 1000);
    const prevMonth = completed
      .filter(a => {
        const date = new Date(a.date);
        return date >= prevMonthStart && date < monthStart;
      })
      .reduce((sum, a) => sum + a.totalPrice, 0);

    const trend = prevMonth > 0 ? ((month - prevMonth) / prevMonth) * 100 : 0;

    return { today, week, month, year, trend };
  }

  private calculateAppointmentStats(
    appointments: Appointment[],
    todayStart: Date,
    weekStart: Date,
    monthStart: Date
  ) {
    const today = appointments.filter(a => new Date(a.date) >= todayStart).length;
    const week = appointments.filter(a => new Date(a.date) >= weekStart).length;
    const month = appointments.filter(a => new Date(a.date) >= monthStart).length;
    const total = appointments.length;

    const byStatus: Record<string, number> = {};
    appointments.forEach(a => {
      byStatus[a.status] = (byStatus[a.status] || 0) + 1;
    });

    // Calculate trend
    const prevMonthStart = new Date(monthStart.getTime() - 30 * 24 * 60 * 60 * 1000);
    const prevMonth = appointments.filter(a => {
      const date = new Date(a.date);
      return date >= prevMonthStart && date < monthStart;
    }).length;

    const trend = prevMonth > 0 ? ((month - prevMonth) / prevMonth) * 100 : 0;

    return { today, week, month, total, byStatus, trend };
  }

  private calculateCustomerStats(appointments: Appointment[], monthStart: Date) {
    const uniqueCustomers = new Set(appointments.map(a => a.userId));
    const total = uniqueCustomers.size;

    const monthlyAppointments = appointments.filter(a => new Date(a.date) >= monthStart);
    const monthlyCustomers = new Set(monthlyAppointments.map(a => a.userId));

    // New customers (first appointment this month)
    const newCustomers = Array.from(monthlyCustomers).filter(customerId => {
      const customerAppointments = appointments.filter(a => a.userId === customerId);
      const firstAppointment = customerAppointments.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      )[0];
      return new Date(firstAppointment.date) >= monthStart;
    });

    const returning = monthlyCustomers.size - newCustomers.length;

    // Calculate trend
    const prevMonthStart = new Date(monthStart.getTime() - 30 * 24 * 60 * 60 * 1000);
    const prevMonthCustomers = new Set(
      appointments
        .filter(a => {
          const date = new Date(a.date);
          return date >= prevMonthStart && date < monthStart;
        })
        .map(a => a.userId)
    );

    const trend = prevMonthCustomers.size > 0 
      ? ((monthlyCustomers.size - prevMonthCustomers.size) / prevMonthCustomers.size) * 100 
      : 0;

    return { total, new: newCustomers.length, returning, trend };
  }

  private calculateServiceStats(appointments: Appointment[]) {
    const serviceMap = new Map<string, { count: number; revenue: number }>();

    appointments.forEach(appointment => {
      appointment.services.forEach(service => {
        const existing = serviceMap.get(service.name) || { count: 0, revenue: 0 };
        serviceMap.set(service.name, {
          count: existing.count + 1,
          revenue: existing.revenue + service.price,
        });
      });
    });

    const topServices = Array.from(serviceMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      topServices,
      totalServices: serviceMap.size,
    };
  }

  private async calculateStaffStats(salonId: string, appointments: Appointment[]) {
    const staffMap = new Map<string, { 
      name: string; 
      appointments: number; 
      revenue: number; 
      rating: number;
    }>();

    appointments.forEach(appointment => {
      const existing = staffMap.get(appointment.staffId) || {
        name: appointment.staffName,
        appointments: 0,
        revenue: 0,
        rating: 0,
      };

      staffMap.set(appointment.staffId, {
        ...existing,
        appointments: existing.appointments + 1,
        revenue: existing.revenue + appointment.totalPrice,
      });
    });

    // Get staff ratings
    const staffQuery = query(collection(db, 'staff'), where('salonId', '==', salonId));
    const staffSnapshot = await getDocs(staffQuery);
    
    staffSnapshot.docs.forEach(doc => {
      const staff = doc.data();
      const existing = staffMap.get(doc.id);
      if (existing) {
        existing.rating = staff.rating || 0;
      }
    });

    const topStaff = Array.from(staffMap.values())
      .sort((a, b) => b.appointments - a.appointments)
      .slice(0, 10);

    return {
      topStaff,
      totalStaff: staffMap.size,
    };
  }

  private async calculateReviewStats(salonId: string) {
    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('salonId', '==', salonId)
    );
    const reviewsSnapshot = await getDocs(reviewsQuery);
    const reviews = reviewsSnapshot.docs.map(doc => doc.data());

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentReviews = reviews.filter(r => new Date(r.createdAt) >= thirtyDaysAgo).length;

    return {
      averageRating: Number(averageRating.toFixed(2)),
      totalReviews,
      recentReviews,
    };
  }

  private calculateHourlyDistribution(appointments: Appointment[]) {
    const distribution: Record<string, number> = {};

    appointments.forEach(appointment => {
      const hour = appointment.time.split(':')[0];
      distribution[hour] = (distribution[hour] || 0) + 1;
    });

    return distribution;
  }

  private calculateDailyDistribution(appointments: Appointment[]) {
    const distribution: Record<string, number> = {
      '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0,
    };

    appointments.forEach(appointment => {
      const day = new Date(appointment.date).getDay();
      distribution[day.toString()] = (distribution[day.toString()] || 0) + 1;
    });

    return distribution;
  }

  private calculateMonthlyRevenue(appointments: Appointment[]) {
    const monthlyData = new Map<string, { revenue: number; appointments: number }>();

    appointments
      .filter(a => a.status === 'completed')
      .forEach(appointment => {
        const date = new Date(appointment.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        const existing = monthlyData.get(monthKey) || { revenue: 0, appointments: 0 };
        monthlyData.set(monthKey, {
          revenue: existing.revenue + appointment.totalPrice,
          appointments: existing.appointments + 1,
        });
      });

    return Array.from(monthlyData.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Last 12 months
  }
}

export const analyticsService = new AnalyticsService();
