import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Zap, TrendingUp, Building2, Crown, Sparkles, ArrowRight, ArrowDown, CheckCircle, Users, Scissors, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SUBSCRIPTION_PLANS } from '@/config/subscriptionPlans';
import { subscriptionService } from '@/services/subscriptionService';
import { useUIStore } from '@/store/uiStore';
import { useThemeStore } from '@/store/themeStore';
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
            className="fixed inset-4 bg-white dark:bg-[var(--slate-surface)] rounded-3xl border border-gray-200 dark:border-white/[0.08] shadow-2xl flex flex-col overflow-hidden will-change-transform"
          >
          {/* Sticky Header */}
          <div className="sticky top-0 bg-gradient-to-b from-white to-white/95 dark:from-[var(--slate-surface)] dark:to-[var(--slate-surface)]/95 backdrop-blur-xl border-b border-gray-200 dark:border-white/[0.08] p-5 z-10 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <Sparkles size={24} className="text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-gray-900 dark:text-[var(--chrome-white)]">
                    Abonelik Planları
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-[var(--muted-lead)]">
                    İşletmeniz için en uygun planı seçin
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
                  const plan = SUBSCRIPTION_PLANS[1];
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
                      'group relative rounded-3xl transition-all duration-300 overflow-hidden will-change-transform hover:-translate-y-2 flex flex-col',
                      isCurrentPlan && 'ring-2 ring-emerald-400/50 shadow-2xl shadow-emerald-500/20',
                      plan.popular && 'ring-2 ring-purple-400/50 shadow-2xl shadow-purple-500/20'
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
                          ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.03) 0%, rgba(236, 72, 153, 0.05) 100%)'
                          : 'linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(236, 72, 153, 0.08) 100%)'
                      }}
                    />

                    {/* Badge Container */}
                    <div className="relative z-10">
                      {plan.popular && (
                        <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-2xl rounded-tr-3xl shadow-lg">
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
                        <div className="absolute top-0 left-0 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white text-xs font-bold px-4 py-1.5 rounded-br-2xl rounded-tl-3xl flex items-center gap-1.5 shadow-lg">
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

                    <div className="relative z-10 p-4 sm:p-5 lg:p-6 flex flex-col flex-1">
                      {/* Icon & Name - Mobile Compact */}
                      <div className="flex flex-col items-center text-center mb-4 lg:mb-5">
                        <div className={cn('relative w-16 sm:w-18 lg:w-20 h-16 sm:h-18 lg:h-20 rounded-2xl bg-gradient-to-br shadow-2xl mb-3 lg:mb-4 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500', PLAN_COLORS[plan.id])}>
                          {/* Glow effect */}
                          <div className={cn('absolute inset-0 rounded-2xl blur-xl opacity-40 group-hover:opacity-90 transition-all duration-500', PLAN_COLORS[plan.id])} />
                          {/* Animated ring */}
                          <div className={cn('absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500', PLAN_COLORS[plan.id])} style={{
                            background: `conic-gradient(from 0deg, transparent 0deg, ${actualTheme === 'light' ? 'rgba(168, 85, 247, 0.4)' : 'rgba(168, 85, 247, 0.6)'} 90deg, transparent 180deg)`,
                            animation: 'spin 3s linear infinite'
                          }} />
                          <div className="relative w-full h-full flex items-center justify-center">
                            <Icon className="w-8 sm:w-9 lg:w-10 h-8 sm:h-9 lg:h-10 text-white drop-shadow-2xl transform group-hover:scale-110 transition-transform duration-300" strokeWidth={2.5} />
                          </div>
                        </div>
                        <h3 className="text-xl sm:text-xl lg:text-2xl font-black font-heading tracking-tight" style={{ 
                          color: actualTheme === 'light' ? '#0f172a' : 'white',
                          textShadow: actualTheme === 'dark' ? '0 2px 10px rgba(0,0,0,0.3)' : 'none'
                        }}>
                          {plan.name}
                        </h3>
                      </div>

                      {/* Description - Mobile Compact */}
                      <p className="text-xs sm:text-sm text-center mb-4 lg:mb-6 min-h-[36px] lg:min-h-[42px] leading-relaxed" style={{ color: actualTheme === 'light' ? '#64748b' : '#94a3b8' }}>
                        {plan.description}
                      </p>

                      {/* Pricing - Mobile Optimized */}
                      <div className="mb-4 lg:mb-6 text-center">
                        {plan.customPricing ? (
                          <div className="py-3 lg:py-4">
                            <p className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
                              Özel Fiyat
                            </p>
                            <p className="text-xs sm:text-sm mt-2 font-medium" style={{ color: actualTheme === 'light' ? '#64748b' : '#94a3b8' }}>
                              İletişime geçin
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-baseline justify-center gap-1 mb-1.5 lg:mb-2">
                              <span className="text-4xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tighter" style={{ 
                                color: actualTheme === 'light' ? '#0f172a' : 'white',
                                textShadow: actualTheme === 'dark' ? '0 2px 10px rgba(0,0,0,0.3)' : 'none'
                              }}>
                                {planPrice.toLocaleString('tr-TR')}₺
                              </span>
                            </div>
                            <span className="text-xs sm:text-sm font-semibold" style={{ color: actualTheme === 'light' ? '#64748b' : '#94a3b8' }}>
                              / {selectedInterval === 'monthly' ? 'aylık' : 'dönem'}
                            </span>
                            {discount > 0 && (
                              <div className="mt-2.5 lg:mt-3 inline-flex items-center gap-1.5 text-xs font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg animate-pulse" style={{
                                background: actualTheme === 'light' 
                                  ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(16, 185, 129, 0.2) 100%)'
                                  : 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(16, 185, 129, 0.25) 100%)',
                                color: actualTheme === 'light' ? '#15803d' : '#4ade80',
                                border: `1px solid ${actualTheme === 'light' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(34, 197, 94, 0.3)'}`
                              }}>
                                <TrendingUp className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                                <span>%{discount} tasarruf</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Divider - Enhanced */}
                      <div className="h-px mb-4 lg:mb-6 relative overflow-hidden">
                        <div className="absolute inset-0" style={{ 
                          background: actualTheme === 'light' 
                            ? 'linear-gradient(90deg, transparent, rgba(203, 213, 225, 0.8), transparent)'
                            : 'linear-gradient(90deg, transparent, rgba(71, 85, 105, 0.8), transparent)'
                        }} />
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{
                          background: actualTheme === 'light'
                            ? 'linear-gradient(90deg, transparent, rgba(168, 85, 247, 0.3), transparent)'
                            : 'linear-gradient(90deg, transparent, rgba(168, 85, 247, 0.5), transparent)'
                        }} />
                      </div>

                      {/* Key Features - Mobile Compact */}
                      <div className="space-y-2 sm:space-y-2.5 lg:space-y-3 mb-4 lg:mb-6 flex-1">
                        <div 
                          className="flex items-center gap-2 sm:gap-2.5 lg:gap-3 text-xs sm:text-sm py-2 sm:py-2.5 lg:py-3 px-3 sm:px-3.5 lg:px-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
                          style={{
                            background: actualTheme === 'light' 
                              ? 'linear-gradient(135deg, rgba(249, 250, 251, 0.9) 0%, rgba(243, 244, 246, 0.8) 100%)'
                              : 'linear-gradient(135deg, rgba(51, 65, 85, 0.4) 0%, rgba(71, 85, 105, 0.3) 100%)',
                            border: `1px solid ${actualTheme === 'light' ? 'rgba(226, 232, 240, 1)' : 'rgba(71, 85, 105, 0.5)'}`,
                            boxShadow: actualTheme === 'light' ? '0 2px 4px rgba(0,0,0,0.05)' : '0 2px 8px rgba(0,0,0,0.2)'
                          }}
                        >
                          <div className="w-7 sm:w-8 h-7 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:rotate-12" style={{
                            background: actualTheme === 'light' 
                              ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(168, 85, 247, 0.08) 100%)'
                              : 'linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(168, 85, 247, 0.15) 100%)'
                          }}>
                            <Users className="w-4 sm:w-5 h-4 sm:h-5" style={{ color: actualTheme === 'light' ? '#9333ea' : '#c084fc' }} strokeWidth={2.5} />
                          </div>
                          <span className="font-bold text-sm sm:text-base" style={{ color: actualTheme === 'light' ? '#0f172a' : '#e2e8f0' }}>
                            {plan.features.maxStaff === 'unlimited' ? 'Sınırsız' : plan.features.maxStaff}
                          </span>
                          <span className="font-medium text-xs sm:text-sm" style={{ color: actualTheme === 'light' ? '#64748b' : '#94a3b8' }}>Personel</span>
                        </div>
                        
                        <div 
                          className="flex items-center gap-2 sm:gap-2.5 lg:gap-3 text-xs sm:text-sm py-2 sm:py-2.5 lg:py-3 px-3 sm:px-3.5 lg:px-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
                          style={{
                            background: actualTheme === 'light' 
                              ? 'linear-gradient(135deg, rgba(249, 250, 251, 0.9) 0%, rgba(243, 244, 246, 0.8) 100%)'
                              : 'linear-gradient(135deg, rgba(51, 65, 85, 0.4) 0%, rgba(71, 85, 105, 0.3) 100%)',
                            border: `1px solid ${actualTheme === 'light' ? 'rgba(226, 232, 240, 1)' : 'rgba(71, 85, 105, 0.5)'}`,
                            boxShadow: actualTheme === 'light' ? '0 2px 4px rgba(0,0,0,0.05)' : '0 2px 8px rgba(0,0,0,0.2)'
                          }}
                        >
                          <div className="w-7 sm:w-8 h-7 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:rotate-12" style={{
                            background: actualTheme === 'light' 
                              ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.08) 100%)'
                              : 'linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(59, 130, 246, 0.15) 100%)'
                          }}>
                            <Scissors className="w-4 sm:w-5 h-4 sm:h-5" style={{ color: actualTheme === 'light' ? '#3b82f6' : '#60a5fa' }} strokeWidth={2.5} />
                          </div>
                          <span className="font-bold text-sm sm:text-base" style={{ color: actualTheme === 'light' ? '#0f172a' : '#e2e8f0' }}>
                            {plan.features.maxServices === 'unlimited' ? 'Sınırsız' : plan.features.maxServices}
                          </span>
                          <span className="font-medium text-xs sm:text-sm" style={{ color: actualTheme === 'light' ? '#64748b' : '#94a3b8' }}>Hizmet</span>
                        </div>
                        
                        <div 
                          className="flex items-center gap-2 sm:gap-2.5 lg:gap-3 text-xs sm:text-sm py-2 sm:py-2.5 lg:py-3 px-3 sm:px-3.5 lg:px-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
                          style={{
                            background: actualTheme === 'light' 
                              ? 'linear-gradient(135deg, rgba(249, 250, 251, 0.9) 0%, rgba(243, 244, 246, 0.8) 100%)'
                              : 'linear-gradient(135deg, rgba(51, 65, 85, 0.4) 0%, rgba(71, 85, 105, 0.3) 100%)',
                            border: `1px solid ${actualTheme === 'light' ? 'rgba(226, 232, 240, 1)' : 'rgba(71, 85, 105, 0.5)'}`,
                            boxShadow: actualTheme === 'light' ? '0 2px 4px rgba(0,0,0,0.05)' : '0 2px 8px rgba(0,0,0,0.2)'
                          }}
                        >
                          <div className="w-7 sm:w-8 h-7 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:rotate-12" style={{
                            background: actualTheme === 'light' 
                              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)'
                              : 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0.15) 100%)'
                          }}>
                            <Calendar className="w-4 sm:w-5 h-4 sm:h-5" style={{ color: actualTheme === 'light' ? '#10b981' : '#4ade80' }} strokeWidth={2.5} />
                          </div>
                          <span className="font-bold text-sm sm:text-base" style={{ color: actualTheme === 'light' ? '#0f172a' : '#e2e8f0' }}>
                            {plan.features.maxMonthlyBookings === 'unlimited' ? 'Sınırsız' : plan.features.maxMonthlyBookings}
                          </span>
                          <span className="font-medium text-xs sm:text-sm" style={{ color: actualTheme === 'light' ? '#64748b' : '#94a3b8' }}>Randevu</span>
                        </div>
                      </div>

                      {/* CTA Button - Mobile Optimized */}
                      <button
                        onClick={() => handleSelectPlan(plan.id, selectedInterval)}
                        className={cn(
                          'relative w-full py-3 sm:py-3.5 lg:py-4 px-4 sm:px-5 lg:px-6 rounded-2xl font-heading font-bold text-sm sm:text-base transition-all duration-500 hover:shadow-2xl hover:scale-105 active:scale-95 mt-auto overflow-hidden group/btn',
                          isCurrentPlan && 'shadow-xl shadow-emerald-500/40',
                          isUpgrade && 'shadow-xl shadow-purple-500/40',
                          plan.popular && 'shadow-xl shadow-pink-500/40'
                        )}
                        style={{
                          background: isCurrentPlan
                            ? 'linear-gradient(135deg, #10b981 0%, #059669 50%, #14b8a6 100%)'
                            : isUpgrade
                            ? 'linear-gradient(135deg, #a855f7 0%, #d946ef 50%, #ec4899 100%)'
                            : isDowngrade
                            ? 'linear-gradient(135deg, #64748b 0%, #475569 50%, #334155 100%)'
                            : plan.id === 'starter'
                            ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #06b6d4 100%)'
                            : plan.id === 'professional'
                            ? 'linear-gradient(135deg, #a855f7 0%, #9333ea 50%, #ec4899 100%)'
                            : plan.id === 'business'
                            ? 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #dc2626 100%)'
                            : plan.id === 'enterprise'
                            ? 'linear-gradient(135deg, #eab308 0%, #f59e0b 50%, #f97316 100%)'
                            : 'linear-gradient(135deg, #4b5563 0%, #374151 50%, #1f2937 100%)',
                          color: 'white',
                          boxShadow: actualTheme === 'light' 
                            ? '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)'
                            : '0 10px 30px -5px rgba(0,0,0,0.5), 0 8px 15px -6px rgba(0,0,0,0.4)'
                        }}
                      >
                        {/* Animated background gradient */}
                        <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500" style={{
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
                          animation: 'shimmer 2s infinite'
                        }} />
                        {/* Glow effect on hover */}
                        <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-30 blur-xl transition-all duration-500" style={{
                          background: isCurrentPlan
                            ? 'radial-gradient(circle, #10b981 0%, transparent 70%)'
                            : isUpgrade
                            ? 'radial-gradient(circle, #a855f7 0%, transparent 70%)'
                            : 'radial-gradient(circle, #3b82f6 0%, transparent 70%)'
                        }} />
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          {isCurrentPlan 
                            ? '✨ Yenile' 
                            : plan.customPricing 
                            ? '📞 İletişime Geç' 
                            : isUpgrade
                            ? '⬆️ Yükselt'
                            : isDowngrade
                            ? '⬇️ Düşür'
                            : '🚀 Planı Seç'}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          </div>

          {/* Sticky Footer - Confirmation */}
          {selectedPlan && (
            <div
              className="sticky bottom-0 bg-gradient-to-t from-white to-white/95 dark:from-[var(--slate-surface)] dark:to-[var(--slate-surface)]/95 backdrop-blur-xl border-t border-gray-200 dark:border-white/[0.08] p-4 flex-shrink-0 animate-fadeIn"
            >
              <div className="flex items-center justify-between gap-3">
                {/* Selected Plan Info - Compact */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate capitalize">
                      {SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan)?.name}
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

                {/* Action Buttons - Compact */}
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
