import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { restaurantService } from '@/services/restaurantService';
import { soundService } from '@/services/soundService';
import type { RestaurantSettings } from '@/types/restaurant';

interface Props {
  restaurantId: string;
}

export function RestaurantSettings({ restaurantId }: Props) {
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, [restaurantId]);

  const loadSettings = async () => {
    try {
      const data = await restaurantService.getSettings(restaurantId);
      setSettings(data);
    } catch (error) {
      console.error('Ayarlar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      await restaurantService.updateSettings(restaurantId, settings);
      soundService.play('success');
      alert('Ayarlar kaydedildi!');
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      alert('Ayarlar kaydedilemedi!');
    }
  };

  if (loading || !settings) {
    return <div className="p-4">Yükleniyor...</div>;
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Restoran Ayarları</h2>

        <div className="space-y-6">
          {/* Eve Servis */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <div className="font-bold text-gray-900">Eve Servis</div>
              <div className="text-sm text-gray-600">Müşteriler eve sipariş verebilsin mi?</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.deliveryEnabled}
                onChange={(e) => setSettings({ ...settings, deliveryEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-500"></div>
            </label>
          </div>

          {settings.deliveryEnabled && (
            <>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Minimum Sipariş Tutarı (₺)</label>
                <input
                  type="number"
                  value={settings.deliveryMinAmount || 0}
                  onChange={(e) => setSettings({ ...settings, deliveryMinAmount: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-0"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Teslimat Ücreti (₺)</label>
                <input
                  type="number"
                  value={settings.deliveryFee || 0}
                  onChange={(e) => setSettings({ ...settings, deliveryFee: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-0"
                />
              </div>
            </>
          )}

          {/* KDV */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">KDV Oranı (%)</label>
            <input
              type="number"
              step="0.01"
              value={(settings.taxRate * 100).toFixed(0)}
              onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) / 100 })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-0"
            />
          </div>

          {/* Hazırlık Süresi */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Ortalama Hazırlık Süresi (dakika)</label>
            <input
              type="number"
              value={settings.preparationTime}
              onChange={(e) => setSettings({ ...settings, preparationTime: parseInt(e.target.value) })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-0"
            />
          </div>

          {/* Otomatik Onay */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <div className="font-bold text-gray-900">Otomatik Sipariş Onayı</div>
              <div className="text-sm text-gray-600">Siparişler otomatik onaylansın mı?</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoConfirmOrders}
                onChange={(e) => setSettings({ ...settings, autoConfirmOrders: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-500"></div>
            </label>
          </div>

          {/* Bildirim Sesi */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <div className="font-bold text-gray-900">Bildirim Sesi</div>
              <div className="text-sm text-gray-600">Yeni sipariş bildirimi sesi çalsın mı?</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => setSettings({ ...settings, soundEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-500"></div>
            </label>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full mt-6 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-6 h-6" />
          Ayarları Kaydet
        </button>
      </div>
    </div>
  );
}
