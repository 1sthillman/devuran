import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  appointmentsService, 
  salonsService, 
  servicesService, 
  staffService 
} from '@/services/firebaseService';
import { reservationService } from '@/services/reservationService';
import { subscriptionService } from '@/services/subscriptionService';
import type { Salon, Service, Staff, BusinessSubscription } from '@/types';

interface UseBusinessDataResult {
  salon: Salon | null;
  reservations: any[];
  services: Service[];
  staff: Staff[];
  queueCount: number;
  subscription: BusinessSubscription | null;
  loading: boolean;
  loadData: () => Promise<void>;
  loadSubscription: () => Promise<void>;
}

export function useBusinessData(userId: string | undefined): UseBusinessDataResult {
  const [salon, setSalon] = useState<Salon | null>(null);
  const [reservations, setReservations] = useState<any[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [queueCount, setQueueCount] = useState(0);
  const [subscription, setSubscription] = useState<BusinessSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSubscription = useCallback(async () => {
    if (!userId) return;
    try {
      const sub = await subscriptionService.getBusinessSubscription(userId);
      setSubscription(sub);
      if (sub) {
        await subscriptionService.checkAndUpdateSubscriptionStatus(userId);
      }
    } catch (error) {
      console.error('Subscription load error:', error);
    }
  }, [userId]);

  const loadData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    try {
      const [salonData, reservationsData, servicesData, staffData] = await Promise.all([
        salonsService.getById(userId),
        reservationService.getBusinessReservations(userId),
        servicesService.getBySalon(userId),
        staffService.getBySalon(userId),
      ]);

      setSalon(salonData);
      setReservations(reservationsData);

      // Merge services
      let allServices = [...servicesData];
      if (salonData?.services?.length > 0) {
        const salonServices = salonData.services.filter((s: any) => s.isActive !== false);
        allServices = [...allServices, ...salonServices].reduce((acc: any[], curr: any) => {
          if (!acc.find(s => s.id === curr.id)) acc.push(curr);
          return acc;
        }, []);
      }
      setServices(allServices);
      setStaff(staffData);

      // Restaurant table migration
      if (salonData?.category === 'restoran' && servicesData.length === 0) {
        const { migrateTableToServices } = await import('@/scripts/migrateTableToServices');
        const result = await migrateTableToServices(userId);
        if (result.success && result.servicesCreated > 0) {
          const freshSalon = await salonsService.getById(userId);
          if (freshSalon?.services) {
            setServices(freshSalon.services.filter((s: any) => s.isActive !== false));
            setSalon(freshSalon);
          }
          toast.success(`${result.servicesCreated} masa rezervasyona hazır!`);
        }
      }

      // Update subscription stats
      if (userId) {
        const monthlyBookings = reservationsData.filter((r: any) => {
          const d = new Date(r.date || r.eventDate || r.checkIn);
          const now = new Date();
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length;

        await subscriptionService.updateUsageStats(userId, {
          staffCount: staffData.length,
          serviceCount: allServices.length,
          monthlyBookings,
        });
      }
    } catch (error) {
      console.error('Data load error:', error);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadData();
      loadSubscription();
      appointmentsService.getQueue(userId).then(q => setQueueCount(q.length));
    }
  }, [userId, loadData, loadSubscription]);

  return {
    salon,
    reservations,
    services,
    staff,
    queueCount,
    subscription,
    loading,
    loadData,
    loadSubscription,
  };
}
