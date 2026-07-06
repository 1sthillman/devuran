import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Zap, TrendingUp, Building2, Crown, Sparkles, ArrowRight, ArrowDown, CheckCircle, UtensilsCrossed, QrCode, ChefHat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RESTAURANT_SUBSCRIPTION_PLANS } from '@/config/restaurantSubscriptionPlans';
import { subscriptionService } from '@/services/subscriptionService';
import { useUIStore } from '@/store/uiStore';
import { useThemeStore } from '@/store/themeStore';
import type { SubscriptionPlanType, SubscriptionInterval } from '@/types/subscription';

interface RestaurantSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  businessName: string;
  currentPlan?: SubscriptionPlanType;
  onSuccess?: () => void;
}

const PLAN_ICONS = {
  starter: Zap,
  professional: TrendingUp,
  business: Building2,
  enterprise: Crown,
  custom: Sparkles,
};

const PLAN_COLORS = {
  starter: 'from-blue-500 to-cyan-500',
  professional: 'from-purple-500 to-pink-500',
  business: 'from-orange-500 to-red-500',
  enterprise: 'from-yellow-500 to-amber-500',
  custom: 'from-gray-700 to-gray-900',
};

export function RestaurantSubscriptionModal({
  isOpen,
  onClose,
  businessId,
  businessName,
  currentPlan,
  onSuccess,
}: RestaurantSubscriptionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanType | null>(null);
  const [selectedInterval, setSelectedInterval] = useState<SubscriptionInterval>('monthly');
  const [loading, setLoading] = useState(false);
  const { addToast } = useUIStore();
  const { actualTheme } = useThemeStore();

  const handleSelectPlan = (planId: SubscriptionPlanType, interval: SubscriptionInterval) => {
    if (planId === 'custom') {
      addToast('Özel plan için lütfen bizimle iletişime geçin', 'info');
      return;
    }

    setSelectedPlan(planId);
    setSelectedInterval(interval);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedPlan) return;

    try {
      setLoading(true);
      
      if (currentPlan) {
        await subscriptionService.changePlan(businessId, selectedPlan, 'restaurant');
        addToast('⏳ Plan değişikliği talebi oluşturuldu! Admin onayı bekleniyor.', 'info');
      } else {
        await subscriptionService.purchaseSubscription(
          businessId,
          businessName,
          selectedPlan,
          selectedInterval,
          'restaurant'
        );
        addToast('⏳ Abonelik talebi oluşturuldu! Admin onayı bekleniyor.', 'info');
      }

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error purchasing subscription:', error);
      addToast(error.message || 'İşlem sırasında bir hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const intervals: { value: SubscriptionInterval; label: string }[] = [
    { value: 'monthly', label: 'Aylık' },
    { value: 'quarterly', label: '3 Aylık' },
    { value: 'semi-annual', label: '6 Aylık' },
    { value: 'annual', label: 'Yıllık' },
  ];

  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-xl"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-4 bg-white dark:bg-[var(--slate-surface)] rounded-3xl border border-gray-200 dark:border-white/[0.08] shadow-2xl flex flex-col overflow-hidden will-change-transform"
          >
          {/* Sticky Header */}
          <div className="sticky top-0 bg-gradient-to-b from-white to-white/95 dark:from-[var(--slate-surface)] dark:to-[var(--slate-surface)]/95 backdrop-blur-xl border-b border-gray-200 dark:border-white/[0.08] p-5 z-10 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <UtensilsCrossed size={24} className="text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-gray-900 dark:text-[var(--chrome-white)]">
                    Restoran Abonelik Planları
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-[var(--muted-lead)]">
                    Restoranınız için en uygun planı seçin
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/[0.05] hover:bg-gray-200 dark:hover:bg-white/[0.08] flex items-center justify-center transition-colors"
              >
                <X size={20} className="text-gray-600 dark:text-[var(--muted-lead)]" />
              </button>
            </div>

            {/* Interval Selector */}
            <div className="flex justify-center mt-4">
              <div className="inline-flex bg-gray-100 dark:bg-white/[0.05] rounded-full p-1">
                {intervals.map((interval) => {
                  const plan = RESTAURANT_SUBSCRIPTION_PLANS[1];
                  const discount = plan.discounts[interval.value];
                  
                  return (
                    <button
                      key={interval.value}
                      onClick={() => setSelectedInterval(interval.value)}
                      className={cn(
                        'relative px-4 py-2 rounded-full text-sm font-heading font-semibold transition-all',
                        selectedInterval === interval.value
                          ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-lg'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      )}
                    >
                      {interval.label}
                      {discount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                          %{discount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="max-w-[1600px] mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-5 lg:gap-6">
                {RESTAURANT_SUBSCRIPTION_PLANS.map((plan) => {
                const Icon = PLAN_ICONS[plan.id];
                const isCurrentPlan = currentPlan === plan.id;
                const planPrice = plan.pricing[selectedInterval] || 0;
                const discount = plan.discounts[selectedInterval] || 0;
                
                const planOrder = ['starter', 'professional', 'business', 'enterprise', 'custom'];
                const currentPlanIndex = currentPlan ? planOrder.indexOf(currentPlan) : -1;
                const thisPlanIndex = planOrder.indexOf(plan.id);
                const isUpgrade = currentPlanIndex >= 0 && thisPlanIndex > currentPlanIndex;
                const isDowngrade = currentPlanIndex >= 0 && thisPlanIndex < currentPlanIndex;

                return (
                  <div
                    key={plan.id}
                    className={cn(
                      'group relative rounded-3xl transition-all duration-300 overflow-hidden will-change-transform hover:-translate-y-2 flex flex-col',
                      isCurrentPlan && 'ring-2 ring-emerald-400/50 shadow-2xl shadow-emerald-500/20',
                      plan.popular && 'ring-2 ring-orange-400/50 shadow-2xl shadow-orange-500/20'
                    )}
                    style={{
                      backgroundColor: actualTheme === 'light' ? 'white' : 'rgba(15, 23, 42, 0.6)',
                      backdropFilter: actualTheme === 'dark' ? 'blur(20px)' : 'none',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: actualTheme === 'light' 
                        ? (isCurrentPlan ? 'rgba(16, 185, 129, 0.3)' : 'rgba(226, 232, 240, 1)')
                        : (isCurrentPlan ? 'rgba(16, 185, 129, 0.3)' : 'rgba(51, 65, 85, 0.5)'),
                      boxShadow: actualTheme === 'light' 
                        ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' 
                        : '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    {/* Gradient Overlay on Hover */}
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                      style={{
                        background: actualTheme === 'light'
                          ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.03) 0%, rgba(251, 146, 60, 0.05) 100%)'
                          : 'linear-gradient(135deg, rgba(249, 115, 22, 0.05) 0%, rgba(251, 146, 60, 0.08) 100%)'
                      }}
                    />

                    {/* Badge Container */}
                    <div className="relative z-10">
                      {plan.popular && (
                        <div className="absolute top-0 right-0 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-2xl rounded-tr-3xl shadow-lg">
                          ⭐ Popüler
                        </div>
                      )}

                      {isCurrentPlan && (
                        <div className="absolute top-0 left-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white text-xs font-bold px-4 py-1.5 rounded-br-2xl rounded-tl-3xl flex items-center gap-1.5 shadow-lg">
                          <CheckCircle size={14} strokeWidth={2.5} />
                          <span>Mevcut Plan</span>
                        </div>
                      )}
                      
                      {!isCurrentPlan && isUpgrade && (
                        <div className="absolute top-0 left-0 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white text-xs font-bold px-4 py-1.5 rounded-br-2xl rounded-tl-3xl flex items-center gap-1.5 shadow-lg">
                          <TrendingUp size={14} strokeWidth={2.5} />
                          <span>Yükseltme</span>
                        </div>
                      )}
                      
                      {!isCurrentPlan && isDowngrade && (
                        <div className="absolute top-0 left-0 bg-gradient-to-r from-slate-600 to-slate-700 text-white text-xs font-bold px-4 py-1.5 rounded-br-2xl rounded-tl-3xl flex items-center gap-1.5 shadow-lg">
                          <ArrowDown size={14} strokeWidth={2.5} />
                          <span>Düşürme</span>
                        </div>
                      )}
                    </div>

                    <div className="relative z-10 p-6 flex flex-col flex-1">
                      {/* Icon & Name */}
                      <div className="flex flex-col items-center text-center mb-5">
                        <div className={cn('relative w-20 h-20 rounded-2xl bg-gradient-to-br shadow-2xl mb-4 transform group-hover:scale-110 transition-transform duration-300', PLAN_COLORS[plan.id])}>
                          {/* Glow effect */}
                          <div className={cn('absolute inset-0 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity', PLAN_COLORS[plan.id])} />
                          <div className="relative w-full h-full flex items-center justify-center">
                            <Icon className="w-10 h-10 text-white drop-shadow-lg" strokeWidth={2} />
                          </div>
                        </div>
                        <h3 className="text-2xl font-black font-heading tracking-tight" style={{ 
                          color: actualTheme === 'light' ? '#0f172a' : 'white',
                          textShadow: actualTheme === 'dark' ? '0 2px 10px rgba(0,0,0,0.3)' : 'none'
                        }}>
                          {plan.name}
                        </h3>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-center mb-6 min-h-[42px] leading-relaxed" style={{ color: actualTheme === 'light' ? '#64748b' : '#94a3b8' }}>
                        {plan.description}
                      </p>

                      {/* Pricing */}
                      <div className="mb-6 text-center">
                        {plan.customPricing ? (
                          <div className="py-4">
                            <p className="text-4xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                              Özel Fiyat
                            </p>
                            <p className="text-sm mt-2 font-medium" style={{ color: actualTheme === 'light' ? '#64748b' : '#94a3b8' }}>
                              İletişime geçin
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-baseline justify-center gap-1 mb-2">
                              <span className="text-5xl font-black font-mono tracking-tighter" style={{ 
                                color: actualTheme === 'light' ? '#0f172a' : 'white',
                                textShadow: actualTheme === 'dark' ? '0 2px 10px rgba(0,0,0,0.3)' : 'none'
                              }}>
                                {planPrice.toLocaleString('tr-TR')}₺
                              </span>
                            </div>
                            <span className="text-sm font-semibold" style={{ color: actualTheme === 'light' ? '#64748b' : '#94a3b8' }}>
                              / {selectedInterval === 'monthly' ? 'aylık' : 'dönem'}
                            </span>
                            {discount > 0 && (
                              <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full shadow-lg" style={{
                                backgroundColor: actualTheme === 'light' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.15)',
                                color: actualTheme === 'light' ? '#15803d' : '#4ade80',
                                border: `1px solid ${actualTheme === 'light' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)'}`
                              }}>
                                <TrendingUp className="w-3.5 h-3.5" />
                                <span>%{discount} tasarruf</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Divider */}
                      <div className="h-px mb-6" style={{ 
                        background: actualTheme === 'light' 
                          ? 'linear-gradient(90deg, transparent, rgba(203, 213, 225, 0.5), transparent)'
                          : 'linear-gradient(90deg, transparent, rgba(51, 65, 85, 0.5), transparent)'
                      }} />

                      {/* Key Features */}
                      <div className="space-y-3 mb-6 flex-1">
                        <div 
                          className="flex items-center gap-3 text-sm py-3 px-4 rounded-xl transition-all duration-200 hover:scale-105"
                          style={{
                            backgroundColor: actualTheme === 'light' ? 'rgba(249, 250, 251, 0.8)' : 'rgba(51, 65, 85, 0.3)',
                            border: `1px solid ${actualTheme === 'light' ? 'rgba(226, 232, 240, 0.8)' : 'rgba(71, 85, 105, 0.3)'}`
                          }}
                        >
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{
                            backgroundColor: actualTheme === 'light' ? 'rgba(249, 115, 22, 0.1)' : 'rgba(249, 115, 22, 0.15)'
                          }}>
                            <UtensilsCrossed className="w-5 h-5" style={{ color: actualTheme === 'light' ? '#ea580c' : '#fb923c' }} strokeWidth={2.5} />
                          </div>
                          <span className="font-bold text-base" style={{ color: actualTheme === 'light' ? '#0f172a' : '#e2e8f0' }}>
                            {plan.features.maxTables === 'unlimited' ? 'Sınırsız' : plan.features.maxTables}
                          </span>
                          <span className="font-medium" style={{ color: actualTheme === 'light' ? '#64748b' : '#94a3b8' }}>Masa</span>
                        </div>
                        
                        <div 
                          className="flex items-center gap-3 text-sm py-3 px-4 rounded-xl transition-all duration-200 hover:scale-105"
                          style={{
                            backgroundColor: actualTheme === 'light' ? 'rgba(249, 250, 251, 0.8)' : 'rgba(51, 65, 85, 0.3)',
                            border: `1px solid ${actualTheme === 'light' ? 'rgba(226, 232, 240, 0.8)' : 'rgba(71, 85, 105, 0.3)'}`
                          }}
                        >
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{
                            backgroundColor: actualTheme === 'light' ? 'rgba(168, 85, 247, 0.1)' : 'rgba(168, 85, 247, 0.15)'
                          }}>
                            <ChefHat className="w-5 h-5" style={{ color: actualTheme === 'light' ? '#9333ea' : '#c084fc' }} strokeWidth={2.5} />
                          </div>
                          <span className="font-bold text-base" style={{ color: actualTheme === 'light' ? '#0f172a' : '#e2e8f0' }}>
                            {plan.features.maxMenuItems === 'unlimited' ? 'Sınırsız' : plan.features.maxMenuItems}
                          </span>
                          <span className="font-medium" style={{ color: actualTheme === 'light' ? '#64748b' : '#94a3b8' }}>Menü</span>
                        </div>
                        
                        {plan.features.qrCodeGeneration && (
                          <div 
                            className="flex items-center gap-3 text-sm py-3 px-4 rounded-xl transition-all duration-200 hover:scale-105"
                            style={{
                              backgroundColor: actualTheme === 'light' ? 'rgba(249, 250, 251, 0.8)' : 'rgba(51, 65, 85, 0.3)',
                              border: `1px solid ${actualTheme === 'light' ? 'rgba(226, 232, 240, 0.8)' : 'rgba(71, 85, 105, 0.3)'}`
                            }}
                          >
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{
                              backgroundColor: actualTheme === 'light' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.15)'
                            }}>
                              <QrCode className="w-5 h-5" style={{ color: actualTheme === 'light' ? '#16a34a' : '#4ade80' }} strokeWidth={2.5} />
                            </div>
                            <span className="font-semibold" style={{ color: actualTheme === 'light' ? '#0f172a' : '#e2e8f0' }}>QR Kod Menü</span>
                          </div>
                        )}
                      </div>

                      {/* CTA Button */}
                      <button
                        onClick={() => handleSelectPlan(plan.id, selectedInterval)}
                        className={cn(
                          'relative w-full py-4 px-6 rounded-2xl font-heading font-bold text-base transition-all duration-300 hover:shadow-2xl hover:scale-105 active:scale-95 mt-auto overflow-hidden group/btn',
                          isCurrentPlan && 'shadow-lg shadow-emerald-500/30',
                          isUpgrade && 'shadow-lg shadow-orange-500/30'
                        )}
                        style={{
                          background: isCurrentPlan
                            ? 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)'
                            : isUpgrade
                            ? 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)'
                            : isDowngrade
                            ? 'linear-gradient(135deg, #64748b 0%, #475569 100%)'
                            : `linear-gradient(135deg, ${PLAN_COLORS[plan.id].split(' ')[0].replace('from-', '#')} 0%, ${PLAN_COLORS[plan.id].split(' ')[2].replace('to-', '#')} 100%)`,
                          color: 'white'
                        }}
                      >
                        {/* Button shine effect */}
                        <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" style={{
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                          transform: 'translateX(-100%)',
                          animation: 'shimmer 2s infinite'
                        }} />
                        <span className="relative z-10">
                          {isCurrentPlan 
                            ? 'Yenile' 
                            : plan.customPricing 
                            ? 'İletişime Geç' 
                            : isUpgrade
                            ? 'Yükselt'
                            : isDowngrade
                            ? 'Düşür'
                            : 'Planı Seç'}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          {selectedPlan && (
            <div className="sticky bottom-0 bg-gradient-to-t from-white to-white/95 dark:from-[var(--slate-surface)] dark:to-[var(--slate-surface)]/95 backdrop-blur-xl border-t border-gray-200 dark:border-white/[0.08] p-4 flex-shrink-0 animate-fadeIn">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate capitalize">
                      {RESTAURANT_SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan)?.name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {currentPlan ? (
                        <>
                          {(() => {
                            const planOrder = ['starter', 'professional', 'business', 'enterprise', 'custom'];
                            const currentIndex = planOrder.indexOf(currentPlan);
                            const selectedIndex = planOrder.indexOf(selectedPlan);
                            return selectedIndex > currentIndex ? '⬆️ Yükseltme' : '⬇️ Düşürme';
                          })()}
                        </>
                      ) : (
                        <>
                          {selectedInterval === 'monthly' && 'Aylık'}
                          {selectedInterval === 'quarterly' && '3 Aylık'}
                          {selectedInterval === 'semi-annual' && '6 Aylık'}
                          {selectedInterval === 'annual' && 'Yıllık'}
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setSelectedPlan(null)}
                    className="w-9 h-9 rounded-full bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center transition-colors"
                    title="İptal"
                  >
                    <X size={16} className="text-gray-600 dark:text-gray-400" />
                  </button>
                  <button
                    onClick={handleConfirmPurchase}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-full font-heading font-semibold text-sm shadow-lg shadow-orange-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                        <span>İşleniyor</span>
                      </>
                    ) : (
                      <>
                        <span>{currentPlan ? 'Değiştir' : 'Onayla'}</span>
                        <ArrowRight size={14} strokeWidth={2.5} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
