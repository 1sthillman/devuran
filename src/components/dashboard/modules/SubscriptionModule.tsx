import { CreditCard, TrendingUp } from 'lucide-react';
import { SubscriptionOverviewCard } from '@/components/subscription/SubscriptionOverviewCard';
import { SubscriptionStatus } from '@/components/subscription/SubscriptionStatus';

interface SubscriptionModuleProps {
  businessId: string;
  onViewPlans: () => void;
}

export function SubscriptionModule({ businessId, onViewPlans }: SubscriptionModuleProps) {
  return (
    <div className="space-y-6">
      {/* Main Subscription Card */}
      <SubscriptionOverviewCard
        businessId={businessId}
        onViewPlans={onViewPlans}
      />

      {/* Detailed Status */}
      <div className="obsidian-card p-6">
        <h3 className="text-xl font-bold text-[var(--chrome-white)] mb-4 flex items-center gap-2">
          <CreditCard size={24} className="text-primary" />
          Abonelik Detayları
        </h3>
        <SubscriptionStatus
          businessId={businessId}
          onUpgrade={onViewPlans}
        />
      </div>

      {/* Plan Comparison */}
      <div className="obsidian-card p-6">
        <h3 className="text-xl font-bold text-[var(--chrome-white)] mb-2">
          Paket Değiştir veya Yükselt
        </h3>
        <p className="text-sm text-[var(--muted-lead)] mb-6">
          İhtiyaçlarınıza uygun paketi seçerek işletmenizi büyütün. Yıllık ödemelerde %20'ye varan indirimler.
        </p>
        <button
          onClick={onViewPlans}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-600 text-white rounded-xl font-heading font-semibold shadow-lg shadow-primary/30 transition-all hover:scale-105"
        >
          <TrendingUp size={20} strokeWidth={2.5} />
          Tüm Paketleri Görüntüle
        </button>
      </div>
    </div>
  );
}
