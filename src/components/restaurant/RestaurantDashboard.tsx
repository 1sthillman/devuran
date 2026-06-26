import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useDashboardStore } from '@/store/dashboardStore';
import { KitchenPanel } from './KitchenPanel';
import { WaiterPanel } from './WaiterPanel';
import { CashierPanel } from './CashierPanel';
import { MenuManagement } from './MenuManagement';
import { TableManagement } from './TableManagement';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, Users, Wallet, ChevronDown, UtensilsCrossed, QrCode } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'menu', label: 'Menü', icon: UtensilsCrossed, color: 'from-purple-500 to-pink-500' },
  { id: 'tables', label: 'Masalar', icon: QrCode, color: 'from-indigo-500 to-purple-500' },
  { id: 'kitchen', label: 'Mutfak', icon: ChefHat, color: 'from-orange-500 to-red-500' },
  { id: 'waiter', label: 'Garson', icon: Users, color: 'from-blue-500 to-cyan-500' },
  { id: 'cashier', label: 'Kasiyer', icon: Wallet, color: 'from-green-500 to-emerald-500' },
];

export function RestaurantDashboard() {
  const { user } = useAuthStore();
  const { setActiveTab: setMainTab } = useDashboardStore();
  const [activeTab, setActiveTab] = useState('menu');

  if (!user?.salonId) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <ChefHat className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
          <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">İşletme Bulunamadı</h2>
          <p className="text-gray-600 dark:text-gray-400">Lütfen önce bir restoran oluşturun.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 sm:pb-32 bg-gray-50 dark:bg-[#0a0a0a]">
      {/* Content Area - Modern Spacing */}
      <div className="max-w-7xl mx-auto px-4 sm:px-5 md:px-6 lg:px-8 py-4 sm:py-5 md:py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'menu' && <MenuManagement restaurantId={user.salonId} />}
            {activeTab === 'tables' && <TableManagement restaurantId={user.salonId} />}
            {activeTab === 'kitchen' && <KitchenPanel restaurantId={user.salonId} />}
            {activeTab === 'waiter' && <WaiterPanel restaurantId={user.salonId} />}
            {activeTab === 'cashier' && <CashierPanel restaurantId={user.salonId} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Navigation - Modern Oval Design with Theme Support */}
      <div className="fixed bottom-0 left-0 right-0 z-[9999] px-3 sm:px-4 pb-3 sm:pb-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}>
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", damping: 25 }}
            className="relative"
          >
            {/* Glow Effect - Adaptive to theme */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20 dark:from-purple-500/30 dark:via-pink-500/30 dark:to-cyan-500/30 rounded-full blur-2xl" />
            
            {/* Main Navigation Container - Theme Adaptive */}
            <div className="relative rounded-full bg-white/90 dark:bg-black/60 backdrop-blur-2xl border border-gray-200/50 dark:border-white/10 shadow-2xl shadow-black/10 dark:shadow-black/40 p-2 sm:p-2.5 md:p-3">
              <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3">
                {/* Back Button */}
                <motion.button
                  onClick={() => setMainTab('overview')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-shrink-0 w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 dark:from-white/10 dark:to-white/5 hover:from-gray-200 hover:to-gray-100 dark:hover:from-white/20 dark:hover:to-white/10 border border-gray-200 dark:border-white/20 flex items-center justify-center transition-all shadow-lg"
                  title="İşletme Paneline Dön"
                >
                  <ChevronDown className="w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6 text-gray-700 dark:text-white rotate-90" strokeWidth={2.5} />
                </motion.button>

                {/* Tab Navigation */}
                <div className="flex-1 grid grid-cols-5 gap-1.5 sm:gap-2 md:gap-2.5">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                      <motion.button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        whileHover={{ scale: isActive ? 1 : 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative"
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeTab"
                            className={cn(
                              "absolute inset-0 rounded-full bg-gradient-to-br shadow-xl",
                              tab.color
                            )}
                            transition={{
                              type: "spring",
                              bounce: 0.2,
                              duration: 0.6
                            }}
                          />
                        )}
                        
                        <div className={cn(
                          'relative px-3 py-2.5 sm:px-4 sm:py-3 md:px-5 md:py-3.5 rounded-full transition-all',
                          !isActive && 'bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200/50 dark:border-white/10'
                        )}>
                          <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                            <Icon 
                              className={cn(
                                'w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6 transition-colors',
                                isActive ? 'text-white drop-shadow-lg' : 'text-gray-600 dark:text-gray-400'
                              )} 
                              strokeWidth={2.5}
                            />
                            <span className={cn(
                              'text-[9px] sm:text-[10px] md:text-[11px] font-heading font-bold transition-colors leading-none',
                              isActive ? 'text-white drop-shadow-lg' : 'text-gray-600 dark:text-gray-400'
                            )}>
                              {tab.label}
                            </span>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
