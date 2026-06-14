import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Zap, TrendingUp, Building2, Crown, Sparkles, ArrowRight, ArrowDown, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SUBSCRIPTION_PLANS } from '@/config/subscriptionPlans';
import { subscriptionService } from '@/services/subscriptionService';
import { useUIStore } from '@/store/uiStore';
import type { SubscriptionPlanType, SubscriptionInterval } from '@/types/subscription';

interface SubscriptionModalProps {
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

export function SubscriptionModal({
  isOpen,
  onClose,
  businessId,
  businessName,
  currentPlan,
  onSuccess,
}: SubscriptionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanType | null>(null);
  const [selectedInterval, setSelectedInterval] = useState<SubscriptionInterval>('monthly');
  const [loading, setLoading] = useState(false);
  const { addToast } = useUIStore();

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
      
      // Eğer mevcut plan varsa, plan değiştir (upgrade/downgrade)
      // Yoksa yeni abonelik oluştur
      if (currentPlan) {
        await subscriptionService.changePlan(
          businessId,
          selectedPlan
        );
        addToast('⏳ Plan değişikliği talebi oluşturuldu! Admin onayı bekleniyor.', 'info');
      } else {
        await subscriptionService.purchaseSubscription(
          businessId,
          businessName,
          selectedPlan,
          selectedInterval
        );
        addToast('⏳ Abonelik talebi oluşturuldu! Admin onayı bekleniyor. Onaylandıktan sonra işletmeniz anasayfada görünecektir.', 'info');
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
            className="fixed inset-x-0 bottom-0 sm:absolute sm:inset-4 sm:top-auto sm:bottom-auto sm:left-1/2 sm:-translate-x-1/2 sm:max-w-6xl sm:my-auto h-[85vh] sm:h-auto sm:max-h-[90vh] bg-[var(--slate-surface)] rounded-t-3xl sm:rounded-3xl border-t border-white/[0.08] sm:border shadow-2xl flex flex-col overflow-hidden will-change-transform"
          >
          {/* Sticky Header */}
          <div className="sticky top-0 bg-gradient-to-b from-[var(--slate-surface)] to-[var(--slate-surface)]/95 backdrop-blur-xl border-b border-white/[0.08] p-5 z-10 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <Sparkles size={24} className="text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-[var(--chrome-white)]">
                    Abonelik Planları
                  </h3>
                  <p className="text-xs text-[var(--muted-lead)]">
                    İşletmeniz için en uygun planı seçin
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/[0.05] hover:bg-white/[0.08] flex items-center justify-center transition-colors"
              >
                <X size={20} className="text-[var(--muted-lead)]" />
              </button>
            </div>

            {/* Interval Selector */}
            <div className="flex justify-center mt-4">
              <div className="inline-flex bg-white/[0.05] rounded-full p-1">
                {intervals.map((interval) => {
                  const plan = SUBSCRIPTION_PLANS[1];
                  const discount = plan.discounts[interval.value];
                  
                  return (
                    <button
                      key={interval.value}
                      onClick={() => setSelectedInterval(interval.value)}
                      className={cn(
                        'relative px-4 py-2 rounded-full text-sm font-heading font-semibold transition-all',
                        selectedInterval === interval.value
                          ? 'bg-white/10 text-white shadow-lg'
                          : 'text-gray-400 hover:text-white'
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
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 lg:p-8" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-5 max-w-[1600px] mx-auto">
              {SUBSCRIPTION_PLANS.map((plan) => {
                const Icon = PLAN_ICONS[plan.id];
                const isCurrentPlan = currentPlan === plan.id;
                const planPrice = plan.pricing[selectedInterval] || 0;
                const discount = plan.discounts[selectedInterval] || 0;
                
                // Plan karşılaştırması için sıralama
                const planOrder = ['starter', 'professional', 'business', 'enterprise', 'custom'];
                const currentPlanIndex = currentPlan ? planOrder.indexOf(currentPlan) : -1;
                const thisPlanIndex = planOrder.indexOf(plan.id);
                const isUpgrade = currentPlanIndex >= 0 && thisPlanIndex > currentPlanIndex;
                const isDowngrade = currentPlanIndex >= 0 && thisPlanIndex < currentPlanIndex;

                return (
                  <div
                    key={plan.id}
                    className={cn(
                      'relative bg-white/[0.02] backdrop-blur-xl rounded-3xl border-2 transition-all overflow-hidden will-change-transform hover:-translate-y-1',
                      isCurrentPlan
                        ? 'border-emerald-500/50 ring-2 ring-emerald-500/20 shadow-lg shadow-emerald-500/10'
                        : isUpgrade
                        ? 'border-purple-500/30 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/20'
                        : 'border-white/[0.08] hover:border-white/20 hover:shadow-xl hover:shadow-white/5',
                      plan.popular && 'ring-2 ring-purple-500/30 shadow-lg shadow-purple-500/10'
                    )}
                  >
                    {/* Popular Badge */}
                    {plan.popular && (
                      <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-bl-2xl">
                        Popüler
                      </div>
                    )}

                    {/* Current Plan Badge */}
                    {isCurrentPlan && (
                      <div className="absolute top-0 left-0 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold px-3 py-1 rounded-br-2xl flex items-center gap-1">
                        <CheckCircle size={12} strokeWidth={2.5} />
                        <span>Mevcut</span>
                      </div>
                    )}
                    
                    {/* Upgrade Badge */}
                    {!isCurrentPlan && isUpgrade && (
                      <div className="absolute top-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-br-2xl flex items-center gap-1">
                        <TrendingUp size={12} strokeWidth={2.5} />
                        <span>Yükselt</span>
                      </div>
                    )}
                    
                    {/* Downgrade Badge */}
                    {!isCurrentPlan && isDowngrade && (
                      <div className="absolute top-0 left-0 bg-gradient-to-r from-gray-600 to-gray-700 text-white text-xs font-bold px-3 py-1 rounded-br-2xl flex items-center gap-1">
                        <ArrowDown size={12} strokeWidth={2.5} />
                        <span>Düşür</span>
                      </div>
                    )}

                    <div className="p-5 lg:p-6">
                      {/* Icon & Name */}
                      <div className="flex flex-col items-center text-center mb-5">
                        <div className={cn('w-14 h-14 rounded-2xl bg-gradient-to-br shadow-lg mb-3', PLAN_COLORS[plan.id])}>
                          <div className="w-full h-full flex items-center justify-center">
                            <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                          </div>
                        </div>
                        <h3 className="text-xl font-bold text-white font-heading">
                          {plan.name}
                        </h3>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-400 mb-5 text-center min-h-[40px]">
                        {plan.description}
                      </p>

                      {/* Pricing */}
                      <div className="mb-5 text-center">
                        {plan.customPricing ? (
                          <div className="py-3">
                            <p className="text-3xl font-bold text-white">
                              Özel Fiyat
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              İletişime geçin
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-baseline justify-center gap-1">
                              <span className="text-3xl lg:text-4xl font-bold text-white font-mono">
                                {planPrice.toLocaleString('tr-TR')}₺
                              </span>
                            </div>
                            <span className="text-gray-400 text-sm block mt-1">
                              / {selectedInterval === 'monthly' ? 'ay' : 'dönem'}
                            </span>
                            {discount > 0 && (
                              <div className="mt-3 inline-flex items-center gap-1 bg-green-500/10 text-green-400 text-xs font-bold px-3 py-1.5 rounded-full">
                                <TrendingUp className="w-3 h-3" />
                                %{discount} tasarruf
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Key Features */}
                      <div className="space-y-3 mb-6">
                        <div className="flex items-start gap-3 text-sm">
                          <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-green-400" strokeWidth={3} />
                          </div>
                          <span className="text-gray-300 font-medium">
                            {plan.features.maxStaff === 'unlimited' ? 'Sınırsız' : plan.features.maxStaff} Personel
                          </span>
                        </div>
                        <div className="flex items-start gap-3 text-sm">
                          <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-green-400" strokeWidth={3} />
                          </div>
                          <span className="text-gray-300 font-medium">
                            {plan.features.maxServices === 'unlimited' ? 'Sınırsız' : plan.features.maxServices} Hizmet
                          </span>
                        </div>
                        <div className="flex items-start gap-3 text-sm">
                          <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-green-400" strokeWidth={3} />
                          </div>
                          <span className="text-gray-300 font-medium">
                            {plan.features.maxMonthlyBookings === 'unlimited' ? 'Sınırsız' : plan.features.maxMonthlyBookings} Randevu
                          </span>
                        </div>
                        {plan.features.advancedAnalytics && (
                          <div className="flex items-start gap-3 text-sm">
                            <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Check className="w-3 h-3 text-green-400" strokeWidth={3} />
                            </div>
                            <span className="text-gray-300 font-medium">Gelişmiş Analitik</span>
                          </div>
                        )}
                      </div>

                      {/* CTA Button */}
                      <button
                        onClick={() => handleSelectPlan(plan.id, selectedInterval)}
                        className={cn(
                          'w-full py-3.5 px-4 rounded-full font-heading font-bold text-sm transition-all hover:shadow-xl hover:scale-105 active:scale-95',
                          isCurrentPlan
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30'
                            : isUpgrade
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                            : isDowngrade
                            ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg shadow-gray-600/30'
                            : 'bg-gradient-to-r ' + PLAN_COLORS[plan.id] + ' text-white shadow-lg'
                        )}
                      >
                        {isCurrentPlan 
                          ? 'Yenile' 
                          : plan.customPricing 
                          ? 'İletişime Geç' 
                          : isUpgrade
                          ? 'Yükselt'
                          : isDowngrade
                          ? 'Düşür'
                          : 'Planı Seç'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sticky Footer - Confirmation */}
          {selectedPlan && (
            <div
              className="sticky bottom-0 bg-gradient-to-t from-[var(--slate-surface)] to-[var(--slate-surface)]/95 backdrop-blur-xl border-t border-white/[0.08] p-4 flex-shrink-0 animate-fadeIn"
            >
              <div className="flex items-center justify-between gap-3">
                {/* Selected Plan Info - Compact */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate capitalize">
                      {SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan)?.name}
                    </p>
                    <p className="text-xs text-gray-400">
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

                {/* Action Buttons - Compact */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setSelectedPlan(null)}
                    className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                    title="İptal"
                  >
                    <X size={16} className="text-gray-400" />
                  </button>
                  <button
                    onClick={handleConfirmPurchase}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full font-heading font-semibold text-sm shadow-lg shadow-purple-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
