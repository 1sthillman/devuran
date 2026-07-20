import { SubscriptionGuard } from '@/components/subscription/SubscriptionGuard';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';

interface AnalyticsModuleProps {
  businessId: string;
  onUpgrade: () => void;
}

export function AnalyticsModule({ businessId, onUpgrade }: AnalyticsModuleProps) {
  return (
    <SubscriptionGuard
      businessId={businessId}
      feature="advancedAnalytics"
      onUpgrade={onUpgrade}
    >
      <AnalyticsDashboard salonId={businessId} />
    </SubscriptionGuard>
  );
}
