/**
 * BOOKING TYPE SELECTOR
 * 
 * Bir işletme birden fazla rezervasyon modeli destekliyorsa,
 * kullanıcı hangi türde rezervasyon yapmak istediğini seçer.
 * 
 * Örnek: Bir restoran hem masa rezervasyonu hem sipariş alıyorsa
 */

import { motion } from 'framer-motion';
import { Calendar, ShoppingBag, Home, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BookingType } from '@/utils/bookingTypeResolver';

interface BookingTypeSelectorProps {
  availableTypes: BookingType[];
  onSelect: (type: BookingType) => void;
  businessName: string;
}

const TYPE_CONFIG: Record<BookingType, { 
  label: string; 
  description: string; 
  icon: any; 
  color: string;
  gradient: string;
}> = {
  slot: {
    label: 'Randevu Al',
    description: 'Belirli bir tarih ve saatte randevu oluştur',
    icon: Calendar,
    color: '#8B5CF6',
    gradient: 'from-purple-500 to-pink-500',
  },
  nightly: {
    label: 'Konaklama Rezervasyonu',
    description: 'Giriş ve çıkış tarihi seçerek rezervasyon yap',
    icon: Home,
    color: '#3B82F6',
    gradient: 'from-blue-500 to-cyan-500',
  },
  daily: {
    label: 'Günlük Kiralama',
    description: 'Araç, ekipman veya mekan kiralama',
    icon: Calendar,
    color: '#10B981',
    gradient: 'from-emerald-500 to-teal-500',
  },
  project: {
    label: 'Etkinlik/Proje',
    description: 'Organizasyon veya proje bazlı hizmet',
    icon: Sparkles,
    color: '#F59E0B',
    gradient: 'from-amber-500 to-orange-500',
  },
  order: {
    label: 'Sipariş Ver',
    description: 'Ürün veya yemek siparişi oluştur',
    icon: ShoppingBag,
    color: '#EC4899',
    gradient: 'from-pink-500 to-rose-500',
  },
};

export function BookingTypeSelector({ availableTypes, onSelect, businessName }: BookingTypeSelectorProps) {
  return (
    <div className="min-h-screen bg-[var(--void)] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-[var(--chrome-white)] mb-3">
            {businessName}
          </h1>
          <p className="font-body text-lg text-[var(--muted-lead)]">
            Ne yapmak istersiniz?
          </p>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {availableTypes.map((type, index) => {
            const config = TYPE_CONFIG[type];
            const Icon = config.icon;

            return (
              <motion.button
                key={type}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => onSelect(type)}
                className={cn(
                  'relative p-6 rounded-3xl border-2 border-white/10 bg-white/[0.02]',
                  'hover:border-white/20 hover:bg-white/[0.05]',
                  'transition-all duration-300 text-left group overflow-hidden',
                  'active:scale-95'
                )}
              >
                {/* Background Gradient */}
                <div className={cn(
                  'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity',
                  config.gradient
                )} />

                {/* Content */}
                <div className="relative">
                  {/* Icon */}
                  <div
                    className={cn(
                      'w-14 h-14 rounded-2xl flex items-center justify-center mb-4',
                      'bg-gradient-to-br transition-transform group-hover:scale-110',
                      config.gradient
                    )}
                  >
                    <Icon size={28} className="text-white" strokeWidth={2.5} />
                  </div>

                  {/* Label */}
                  <h3 className="font-heading font-bold text-xl text-[var(--chrome-white)] mb-2">
                    {config.label}
                  </h3>

                  {/* Description */}
                  <p className="font-body text-sm text-[var(--muted-lead)]">
                    {config.description}
                  </p>
                </div>

                {/* Arrow */}
                <motion.div
                  className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  initial={{ x: -10 }}
                  whileHover={{ x: 0 }}
                >
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </motion.div>
              </motion.button>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-[var(--muted-lead)]">
            Size en uygun seçeneği belirleyin
          </p>
        </div>
      </motion.div>
    </div>
  );
}
