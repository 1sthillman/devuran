import { useState } from 'react';
import { Check, X, Zap } from 'lucide-react';
import { RESTAURANT_SUBSCRIPTION_PLANS, RESTAURANT_FEATURE_DESCRIPTIONS } from '@/config/restaurantSubscriptionPlans';
import type { SubscriptionInterval } from '@/types/subscription';

interface RestaurantSubscriptionPlansProps {
  onSelectPlan: (planId: string, interval: SubscriptionInterval) => void;
}

export function RestaurantSubscriptionPlans({ onSelectPlan }: RestaurantSubscriptionPlansProps) {
  const [selectedInterval, setSelectedInterval] = useState<SubscriptionInterval>('monthly');

  const intervals: { value: SubscriptionInterval; label: string; discount: string }[] = [
    { value: 'monthly', label: 'Aylık', discount: '' },
    { value: 'quarterly', label: '3 Aylık', discount: '%10 İndirim' },
    { value: 'semi-annual', label: '6 Aylık', discount: '%15 İndirim' },
    { value: 'annual', label: 'Yıllık', discount: '%20 İndirim' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Restoran Abonelik Paketleri</h2>
        <p className="text-white/60">İşletmeniz için en uygun paketi seçin</p>
      </div>

      {/* Interval Selector */}
      <div className="flex justify-center">
        <div className="inline-flex bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5">
          {intervals.map((interval) => (
            <button
              key={interval.value}
              onClick={() => setSelectedInterval(interval.value)}
              className={`
                relative px-6 py-3 rounded-xl font-medium transition-all text-sm
                ${selectedInterval === interval.value
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'text-white/60 hover:text-white'
                }
              `}
            >
              <span className="relative z-10">{interval.label}</span>
              {interval.discount && (
                <span className={`
                  absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold
                  ${selectedInterval === interval.value ? 'bg-green-500 text-white' : 'bg-green-500/20 text-green-400'}
                `}>
                  {interval.discount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {RESTAURANT_SUBSCRIPTION_PLANS.filter(plan => plan.id !== 'custom').map((plan) => {
          const price = plan.pricing[selectedInterval];
          const discount = plan.discounts[selectedInterval];

          return (
            <div
              key={plan.id}
              className={`
                relative bg-slate-800/50 backdrop-blur-xl border rounded-3xl p-6
                transition-all hover:scale-105
                ${plan.popular
                  ? 'border-purple-500 shadow-lg shadow-purple-500/20'
                  : 'border-white/10'
                }
              `}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                    <Zap className="w-4 h-4" />
                    Popüler
                  </div>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-white/60 text-sm">{plan.description}</p>
              </div>

              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-4xl font-bold text-white">{price.toLocaleString('tr-TR')}</span>
                  <span className="text-white/60">₺</span>
                </div>
                <p className="text-white/40 text-sm mt-1">
                  / {selectedInterval === 'monthly' ? 'ay' : selectedInterval === 'quarterly' ? '3 ay' : selectedInterval === 'semi-annual' ? '6 ay' : 'yıl'}
                </p>
                {discount > 0 && (
                  <div className="mt-2">
                    <span className="inline-block bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold">
                      %{discount} İndirimli
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-3 mb-6">
                <FeatureItem
                  icon={<Check className="w-4 h-4" />}
                  text={`${plan.features.maxTables === 'unlimited' ? 'Sınırsız' : plan.features.maxTables} Masa`}
                  available={true}
                />
                <FeatureItem
                  icon={<Check className="w-4 h-4" />}
                  text={`${plan.features.maxMenuItems === 'unlimited' ? 'Sınırsız' : plan.features.maxMenuItems} Menü Ürünü`}
                  available={true}
                />
                <FeatureItem
                  icon={<Check className="w-4 h-4" />}
                  text={`${plan.features.maxMonthlyOrders === 'unlimited' ? 'Sınırsız' : plan.features.maxMonthlyOrders} Aylık Sipariş`}
                  available={true}
                />
                <FeatureItem
                  icon={plan.features.advancedAnalytics ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  text="Gelişmiş Analitik"
                  available={plan.features.advancedAnalytics}
                />
                <FeatureItem
                  icon={plan.features.customerNotifications ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  text="Müşteri Bildirimleri"
                  available={plan.features.customerNotifications}
                />
                <FeatureItem
                  icon={plan.features.multiLocation ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  text="Çoklu Şube"
                  available={plan.features.multiLocation}
                />
                <FeatureItem
                  icon={plan.features.prioritySupport ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  text="Öncelikli Destek"
                  available={plan.features.prioritySupport}
                />
              </div>

              <button
                onClick={() => onSelectPlan(plan.id, selectedInterval)}
                className={`
                  w-full py-3 rounded-xl font-bold transition-all
                  ${plan.popular
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/20'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                  }
                `}
              >
                Paketi Seç
              </button>
            </div>
          );
        })}
      </div>

      {/* Custom Plan */}
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-3xl p-8 text-center">
        <h3 className="text-2xl font-bold text-white mb-2">Özel Çözüm</h3>
        <p className="text-white/60 mb-6">
          İhtiyaçlarınıza özel tasarlanmış restoran paketi için bizimle iletişime geçin
        </p>
        <button
          onClick={() => onSelectPlan('custom', 'monthly')}
          className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-purple-500/20"
        >
          İletişime Geç
        </button>
      </div>
    </div>
  );
}

interface FeatureItemProps {
  icon: React.ReactNode;
  text: string;
  available: boolean;
}

function FeatureItem({ icon, text, available }: FeatureItemProps) {
  return (
    <div className={`flex items-center gap-2 ${available ? 'text-white' : 'text-white/30'}`}>
      <div className={`
        flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center
        ${available ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}
      `}>
        {icon}
      </div>
      <span className="text-sm">{text}</span>
    </div>
  );
}
