import { useEffect, useState } from 'react';
import { TrendingUp, ShoppingBag, DollarSign, Users, Clock } from 'lucide-react';
import { restaurantService } from '@/services/restaurantService';
import type { RestaurantStats as Stats } from '@/types/restaurant';

interface Props {
  restaurantId: string;
}

export function RestaurantStats({ restaurantId }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [restaurantId]);

  async function loadStats() {
    try {
      setLoading(true);
      const data = await restaurantService.getStats(restaurantId);
      setStats(data);
    } catch (error) {
      console.error('İstatistik yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-4 text-center">
        <div className="text-gray-500">İstatistikler yüklenemedi</div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-green-100 rounded-xl">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {stats.todayRevenue.toFixed(0)}₺
          </div>
          <div className="text-sm text-gray-600">Günlük Ciro</div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-blue-100 rounded-xl">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {stats.todayOrders}
          </div>
          <div className="text-sm text-gray-600">Günlük Sipariş</div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-orange-100 rounded-xl">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {stats.activeOrders}
          </div>
          <div className="text-sm text-gray-600">Aktif Sipariş</div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {stats.activeTables}
          </div>
          <div className="text-sm text-gray-600">Dolu Masa</div>
        </div>
      </div>

      {/* Popüler Ürünler */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Popüler Ürünler</h3>
        <div className="space-y-3">
          {stats.popularItems.map((item, index) => (
            <div key={item.itemId} className="flex items-center gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <span className="text-lg font-bold text-orange-600">#{index + 1}</span>
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{item.name}</div>
                <div className="text-sm text-gray-600">{item.orderCount} sipariş</div>
              </div>
            </div>
          ))}
          {stats.popularItems.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              Henüz veri yok
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
