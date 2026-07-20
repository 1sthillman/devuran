import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Users, 
  Calendar as CalendarIcon, 
  DollarSign,
  ChevronDown,
  Link2,
  ExternalLink,
  Sparkles,
  ChefHat,
  Plus,
  Scissors,
  Settings
} from 'lucide-react';
import { BusinessInfoCard } from '@/components/dashboard/BusinessInfoCard';
import { QRCodeCard } from '@/components/qr/ModernQRGenerator';
import { CopyButton } from '@/components/ui/CopyButton';
import { useUIStore } from '@/store/uiStore';
import { getDashboardModules } from '@/utils/bookingTypeResolver';
import { getSalonTerminology } from '@/utils/businessHelpers';
import type { Salon, BusinessSubscription } from '@/types';

interface OverviewModuleProps {
  salon: Salon;
  todayApps: any[];
  weekApps: any[];
  queueCount: number;
  monthlyRevenue: number;
  subscription: BusinessSubscription | null;
  onTabChange: (tab: string) => void;
}

const qrStyles = [
  {
    id: 'classic',
    name: 'Klasik',
    config: {
      width: 400,
      height: 400,
      margin: 10,
      dotsOptions: { type: 'rounded' as const, color: '#1a1a1a' },
      cornersSquareOptions: { type: 'extra-rounded' as const, color: '#1a1a1a' },
      cornersDotOptions: { type: 'dot' as const, color: '#1a1a1a' },
      backgroundOptions: { color: '#ffffff' }
    }
  },
  {
    id: 'modern',
    name: 'Modern',
    config: {
      width: 400,
      height: 400,
      margin: 10,
      dotsOptions: { type: 'dots' as const, color: '#2563eb' },
      cornersSquareOptions: { type: 'extra-rounded' as const, color: '#1d4ed8' },
      cornersDotOptions: { type: 'dot' as const, color: '#2563eb' },
      backgroundOptions: { color: '#ffffff' }
    }
  },
  {
    id: 'minimal',
    name: 'Minimal',
    config: {
      width: 400,
      height: 400,
      margin: 10,
      dotsOptions: { type: 'square' as const, color: '#0f172a' },
      cornersSquareOptions: { type: 'square' as const, color: '#0f172a' },
      cornersDotOptions: { type: 'square' as const, color: '#0f172a' },
      backgroundOptions: { color: '#ffffff' }
    }
  },
  {
    id: 'elegant',
    name: 'Zarif',
    config: {
      width: 400,
      height: 400,
      margin: 10,
      dotsOptions: { type: 'classy-rounded' as const, color: '#059669' },
      cornersSquareOptions: { type: 'extra-rounded' as const, color: '#047857' },
      cornersDotOptions: { type: 'dot' as const, color: '#059669' },
      backgroundOptions: { color: '#ffffff' }
    }
  },
  {
    id: 'professional',
    name: 'Profesyonel',
    config: {
      width: 400,
      height: 400,
      margin: 10,
      dotsOptions: { type: 'extra-rounded' as const, color: '#7c3aed' },
      cornersSquareOptions: { type: 'extra-rounded' as const, color: '#6d28d9' },
      cornersDotOptions: { type: 'dot' as const, color: '#7c3aed' },
      backgroundOptions: { color: '#ffffff' }
    }
  }
];

export function OverviewModule({
  salon,
  todayApps,
  weekApps,
  queueCount,
  monthlyRevenue,
  subscription,
  onTabChange
}: OverviewModuleProps) {
  const { addToast } = useUIStore();
  const [showBusinessLink, setShowBusinessLink] = useState(false);
  const [showQRCodes, setShowQRCodes] = useState(false);

  const dashboardModules = useMemo(() => {
    const anySalon = salon as any;
    return getDashboardModules(anySalon.capabilities);
  }, [salon]);

  const terminology = useMemo(() => getSalonTerminology(salon), [salon]);

  const stats = [
    { label: "Bugunku Randevu", value: todayApps.length, icon: Clock, color: '#2DC24E', tab: 'appointments' },
    { label: "Bekleyen Sıra", value: queueCount, icon: Users, color: '#E5A522', tab: 'appointments' },
    { label: "Bu Hafta", value: weekApps.length, icon: CalendarIcon, color: '#60a5fa', tab: 'appointments' },
    { label: "Bu Ay Gelir", value: `${monthlyRevenue.toLocaleString()}₺`, icon: DollarSign, color: '#c8c8d4', tab: 'analytics' },
  ];

  return (
    <div className="space-y-6">
      {/* Business Info Card */}
      <BusinessInfoCard salon={salon} />

      {/* Pending Subscription Warning */}
      {subscription?.status === 'pending' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Clock size={24} className="text-amber-400" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <h3 className="font-heading font-bold text-lg text-amber-300 mb-2">
                ⏳ Abonelik Onayı Bekleniyor
              </h3>
              <p className="font-body text-sm text-amber-200/80 mb-3">
                Abonelik talebiniz oluşturuldu ve admin onayı bekleniyor.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.button
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => onTabChange(stat.tab)}
              className="relative overflow-hidden obsidian-card p-5 text-left hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer group"
            >
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: `${stat.color}20` }}
                  >
                    <Icon size={20} style={{ color: stat.color }} strokeWidth={2.5} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-[var(--chrome-white)] mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-[var(--muted-lead)]">{stat.label}</div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Business Link Card */}
      {salon && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.02] to-transparent backdrop-blur-xl"
        >
          <button
            onClick={() => setShowBusinessLink(!showBusinessLink)}
            className="w-full p-6 text-left transition-all hover:bg-white/[0.03]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-white/[0.08] flex items-center justify-center">
                  <Link2 size={22} className="text-cyan-400" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-[var(--chrome-white)]">
                    İşletme Linki
                  </h3>
                  <p className="text-xs text-[var(--muted-lead)]">
                    QR kod ve paylaşım linkleri
                  </p>
                </div>
              </div>
              <motion.div
                animate={{ rotate: showBusinessLink ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown size={20} className="text-[var(--muted-lead)]" />
              </motion.div>
            </div>
          </button>

          <AnimatePresence>
            {showBusinessLink && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6 border-t border-white/[0.08] space-y-3 pt-4">
                  <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/[0.08]">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-12 px-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center">
                        <code className="text-sm font-mono font-semibold text-cyan-400 truncate">
                          randevu.app/{salon.slug}
                        </code>
                      </div>
                      <CopyButton
                        text={`https://app-ruby-ten-20.vercel.app/salon/${salon.slug}`}
                        onCopy={() => addToast('📋 Link kopyalandı!', 'success')}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => setShowQRCodes(!showQRCodes)}
                    className="w-full p-5 rounded-3xl bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.03] transition-all text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-heading font-semibold text-sm text-[var(--chrome-white)]">
                        QR Kodlar
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 text-[var(--muted-lead)] transition-transform ${showQRCodes ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </button>

                  <AnimatePresence>
                    {showQRCodes && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 pt-3">
                          {qrStyles.map((style) => (
                            <QRCodeCard
                              key={style.id}
                              url={`https://app-ruby-ten-20.vercel.app/salon/${salon.slug}`}
                              businessName={salon.name}
                              style={style}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Restaurant Panel Link */}
      {dashboardModules?.showRestaurant && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onClick={() => onTabChange('restaurant')}
          className="relative w-full overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.02] to-transparent backdrop-blur-xl p-6 hover:bg-white/[0.05] transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-white/[0.08] flex items-center justify-center group-hover:scale-110 transition-transform">
              <ChefHat size={24} className="text-orange-400" strokeWidth={2} />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-heading font-bold text-lg text-[var(--chrome-white)] mb-1">
                {terminology.capacityUnitLabel} Paneli
              </h3>
              <p className="text-xs text-[var(--muted-lead)]">
                Mutfak, Garson, Kasiyer, Menü ve {terminology.capacityUnitLabel} Yönetimi
              </p>
            </div>
            <ChevronDown className="w-5 h-5 text-[var(--muted-lead)] -rotate-90 group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.button>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => onTabChange('appointments')}
          className="obsidian-card p-4 rounded-3xl flex items-center gap-3 hover:bg-white/5 transition-all active:scale-95 group"
        >
          <div className="w-12 h-12 rounded-full bg-[#2DC24E]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus size={20} className="text-[#2DC24E]" strokeWidth={2.5} />
          </div>
          <span className="font-heading font-semibold text-sm text-[var(--chrome-white)]">
            {terminology.bookingUnitPlural} Yönet
          </span>
        </button>

        <button
          onClick={() => onTabChange('services')}
          className="obsidian-card p-4 rounded-3xl flex items-center gap-3 hover:bg-white/5 transition-all active:scale-95 group"
        >
          <div className="w-12 h-12 rounded-full bg-[#60a5fa]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Scissors size={20} className="text-[#60a5fa]" strokeWidth={2.5} />
          </div>
          <span className="font-heading font-semibold text-sm text-[var(--chrome-white)]">
            Hizmetler
          </span>
        </button>

        {dashboardModules?.showStaff && (
          <button
            onClick={() => onTabChange('staff')}
            className="obsidian-card p-4 rounded-3xl flex items-center gap-3 hover:bg-white/5 transition-all active:scale-95 group"
          >
            <div className="w-12 h-12 rounded-full bg-[#E5A522]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users size={20} className="text-[#E5A522]" strokeWidth={2.5} />
            </div>
            <span className="font-heading font-semibold text-sm text-[var(--chrome-white)]">
              Personel
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
