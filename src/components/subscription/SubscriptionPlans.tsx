import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, TrendingUp, Building2, Crown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SUBSCRIPTION_PLANS, FEATURE_DESCRIPTIONS } from '@/config/subscriptionPlans';
import type { SubscriptionInterval, SubscriptionPlanType } from '@/types/subscription';

interface SubscriptionPlansProps {
  currentPlan?: SubscriptionPlanType;
  onSelectPlan: (planId: SubscriptionPlanType, interval: SubscriptionInterval) => void;
  className?: string;
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

export function SubscriptionPlans({ currentPlan, onSelectPlan, className }: SubscriptionPlansProps) {
  const [selectedInterval, setSelectedInterval] = useState<SubscriptionInterval>('monthly');

  const intervals: { value: SubscriptionInterval; label: string }[] = [
    { value: 'monthly', label: 'Aylık' },
    { value: 'quarterly', label: '3 Aylık' },
    { value: 'semi-annual', label: '6 Aylık' },
    { value: 'annual', label: 'Yıllık' },
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getMonthlyEquivalent = (price: number, interval: SubscriptionInterval) => {
    const months = { monthly: 1, quarterly: 3, 'semi-annual': 6, annual: 12 };
    return price / months[interval];
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Interval Selector */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {intervals.map((interval) => {
            const plan = SUBSCRIPTION_PLANS[1]; // Professional plan for discount display
            const discount = plan.discounts[interval.value];
            
            return (
              <button
                key={interval.value}
                onClick={() => setSelectedInterval(interval.value)}
                className={cn(
                  'relative px-4 py-2 rounded-md text-sm font-medium transition-all',
                  selectedInterval === interval.value
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                )}
              >
                {interval.label}
                {discount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    %{discount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const Icon = PLAN_ICONS[plan.id];
          const isCurrentPlan = currentPlan === plan.id;
          const price = plan.pricing[selectedInterval];
          const monthlyEquivalent = getMonthlyEquivalent(price, selectedInterval);
          const discount = plan.discounts[selectedInterval];

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden',
                'border-2 transition-all duration-300',
                isCurrentPlan
                  ? 'border-primary ring-4 ring-primary/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary/50',
                plan.popular && 'ring-2 ring-purple-500/50'
              )}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  Popüler
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrentPlan && (
                <div className="absolute top-0 left-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-br-lg">
                  Mevcut Plan
                </div>
              )}

              <div className="p-6">
                {/* Icon & Name */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn('p-3 rounded-xl bg-gradient-to-br', PLAN_COLORS[plan.id])}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {plan.name}
                    </h3>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  {plan.description}
                </p>

                {/* Pricing */}
                <div className="mb-6">
                  {plan.customPricing ? (
                    <div className="text-center py-4">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        Özel Fiyat
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        İletişime geçin
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">
                          {formatPrice(price)}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          / {selectedInterval === 'monthly' ? 'ay' : 'dönem'}
                        </span>
                      </div>
                      {selectedInterval !== 'monthly' && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {formatPrice(monthlyEquivalent)} / ay
                        </p>
                      )}
                      {discount > 0 && (
                        <div className="mt-2 inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium px-2 py-1 rounded-full">
                          <TrendingUp className="w-3 h-3" />
                          %{discount} tasarruf
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Key Features */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {plan.features.maxStaff === 'unlimited' ? 'Sınırsız' : plan.features.maxStaff} Personel
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {plan.features.maxServices === 'unlimited' ? 'Sınırsız' : plan.features.maxServices} Hizmet
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {plan.features.maxMonthlyBookings === 'unlimited' ? 'Sınırsız' : plan.features.maxMonthlyBookings} Randevu/Ay
                    </span>
                  </div>
                  {plan.features.advancedAnalytics && (
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">Gelişmiş Analitik</span>
                    </div>
                  )}
                  {plan.features.customerManagement && (
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">Müşteri Yönetimi</span>
                    </div>
                  )}
                  {plan.features.whatsappIntegration && (
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">WhatsApp Entegrasyonu</span>
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => onSelectPlan(plan.id, selectedInterval)}
                  disabled={isCurrentPlan}
                  className={cn(
                    'w-full py-3 px-4 rounded-lg font-medium transition-all',
                    isCurrentPlan
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r ' + PLAN_COLORS[plan.id] + ' text-white hover:shadow-lg hover:scale-105'
                  )}
                >
                  {isCurrentPlan ? 'Mevcut Planınız' : plan.customPricing ? 'İletişime Geç' : 'Planı Seç'}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Feature Comparison Link */}
      <div className="text-center mt-8">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Tüm özellikleri karşılaştırmak için{' '}
          <button className="text-primary hover:underline font-medium">
            detaylı karşılaştırma tablosuna
          </button>{' '}
          göz atın
        </p>
      </div>
    </div>
  );
}
