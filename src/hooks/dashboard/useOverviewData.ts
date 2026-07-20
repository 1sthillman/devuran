import { useMemo } from 'react';

interface UseOverviewDataProps {
  reservations: any[];
}

export function useOverviewData({ reservations }: UseOverviewDataProps) {
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    const todayApps = reservations.filter((r: any) => {
      const d = r.date || r.eventDate || r.checkIn || r.deliveryDate || '';
      const isActive = ['confirmed', 'pending', 'deposit_paid'].includes(r.status);
      return d === todayStr && isActive;
    });

    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);
    weekEnd.setHours(23, 59, 59, 999);

    const weekApps = reservations.filter((r: any) => {
      const d = r.date || r.eventDate || r.checkIn || r.deliveryDate;
      if (!d) return false;
      const date = new Date(d);
      const isActive = ['confirmed', 'pending', 'deposit_paid'].includes(r.status);
      return date >= weekStart && date <= weekEnd && isActive;
    });

    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyRevenue = reservations
      .filter((r: any) => {
        const d = r.date || r.eventDate || r.checkIn || r.deliveryDate || '';
        const isCompleted = ['completed', 'confirmed', 'fully_paid'].includes(r.status);
        return d.startsWith(currentMonth) && isCompleted;
      })
      .reduce((sum, r) => sum + (r.pricing?.totalAmount || r.totalPrice || 0), 0);

    return {
      todayApps,
      weekApps,
      monthlyRevenue,
    };
  }, [reservations]);

  return stats;
}
