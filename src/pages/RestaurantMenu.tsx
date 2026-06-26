import { useParams } from 'react-router-dom';
import { CustomerMenu } from '@/components/restaurant/CustomerMenu';

export function RestaurantMenu() {
  const { restaurantId, tableQR } = useParams<{ restaurantId: string; tableQR: string }>();

  if (!restaurantId || !tableQR) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Geçersiz QR Kod</h1>
          <p className="text-gray-600">Lütfen masanızdaki QR kodu okutun.</p>
        </div>
      </div>
    );
  }

  return <CustomerMenu restaurantId={restaurantId} tableQR={tableQR} />;
}

export default RestaurantMenu;
