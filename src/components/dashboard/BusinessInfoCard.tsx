/**
 * ============================================================================
 * İŞLETME BİLGİ KARTI
 * ============================================================================
 * 
 * Capabilities bazlı işletme özelliklerini gösterir
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  MapPin,
  Users,
  Calendar,
  Table2,
  Clock,
  Package,
  Truck,
  CheckCircle2,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import type { Salon } from '@/types';
import { determineBookingType, getBookingTerminology } from '@/utils/bookingTypeResolver';

interface Props {
  salon: Salon;
}

export function BusinessInfoCard({ salon }: Props) {
  const anySalon = salon as any;
  const capabilities = anySalon.capabilities;

  const bookingInfo = useMemo(() => {
    return capabilities ? determineBookingType(capabilities) : null;
  }, [capabilities]);

  const terminology = useMemo(() => {
    return getBookingTerminology(capabilities);
  }, [capabilities]);

  if (!capabilities) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-yellow-900">Eski Sistem</p>
            <p className="text-sm text-yellow-700 mt-1">
              Bu işletme eski kategori sistemini kullanıyor. Yeni özelliklere erişmek için işletmeyi güncelleyin.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: Calendar,
      label: 'Rezervasyon Modeli',
      value: bookingInfo?.supports.map(t => {
        if (t === 'slot') return 'Randevu';
        if (t === 'daily') return 'Günlük Kiralama';
        if (t === 'nightly') return 'Gecelik Konaklama';
        if (t === 'project') return 'Proje Bazlı';
        if (t === 'order') return 'Sipariş';
        return t;
      }).join(', ') || 'Tanımsız',
      active: true
    },
    {
      icon: Users,
      label: 'Personel Sistemi',
      value: capabilities.hasStaff ? 'Aktif' : 'Pasif',
      active: capabilities.hasStaff
    },
    {
      icon: Table2,
      label: capabilities.tableTerminology || 'Masa',
      value: capabilities.hasTables ? 'Aktif' : 'Pasif',
      active: capabilities.hasTables
    },
    {
      icon: Clock,
      label: 'Süre Bazlı',
      value: capabilities.isDurationBased ? 'Evet' : 'Hayır',
      active: capabilities.isDurationBased
    },
    {
      icon: MapPin,
      label: 'Fiziksel Mekan',
      value: capabilities.hasPhysicalLocation ? 'Var' : 'Mobil Hizmet',
      active: capabilities.hasPhysicalLocation
    },
    {
      icon: Truck,
      label: 'Teslimat',
      value: capabilities.hasDelivery ? 'Aktif' : 'Pasif',
      active: capabilities.hasDelivery
    },
    {
      icon: Package,
      label: 'Ürün Kataloğu',
      value: capabilities.hasProductCatalog ? 'Var' : 'Yok',
      active: capabilities.hasProductCatalog
    },
    {
      icon: CheckCircle2,
      label: 'Otomatik Onay',
      value: capabilities.autoConfirmDefault ? 'Aktif' : 'Manuel',
      active: capabilities.autoConfirmDefault
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-lg text-purple-900">İşletme Özellikleri</h3>
          </div>
          <p className="text-sm text-purple-700">
            Akıllı sistem ayarlarınız
          </p>
        </div>
        <div className="px-3 py-1 bg-purple-600 text-white text-xs font-semibold rounded-full">
          Yeni Sistem
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.label}
              className={`p-3 rounded-xl border-2 transition-all ${
                feature.active
                  ? 'bg-white border-purple-200'
                  : 'bg-gray-50 border-gray-200 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon
                  className={`w-4 h-4 ${
                    feature.active ? 'text-purple-600' : 'text-gray-400'
                  }`}
                />
                <span className="text-xs font-semibold text-gray-700">
                  {feature.label}
                </span>
              </div>
              <p
                className={`text-sm font-medium ${
                  feature.active ? 'text-purple-900' : 'text-gray-500'
                }`}
              >
                {feature.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-purple-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-purple-700">Müşteri Görünümü:</span>
          <span className="font-semibold text-purple-900">
            "{terminology.action}" butonu
          </span>
        </div>
      </div>
    </motion.div>
  );
}
