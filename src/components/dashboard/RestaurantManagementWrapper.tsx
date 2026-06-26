import { useAuthStore } from '@/store/authStore';
import { RestaurantDashboard } from '@/components/restaurant/RestaurantDashboard';
import type { Salon } from '@/types';

interface Props {
  salon: Salon;
}

export function RestaurantManagementWrapper({ salon }: Props) {
  // Restoran kategorisi kontrolü
  const category = salon.category as string;
  const isRestaurant = category === 'restoran' || category === 'kafe';

  if (!isRestaurant) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <RestaurantDashboard />
    </div>
  );
}
