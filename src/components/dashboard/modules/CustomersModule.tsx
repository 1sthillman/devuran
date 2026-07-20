import { SubscriptionGuard } from '@/components/subscription/SubscriptionGuard';
import { CustomerList } from '@/components/crm/CustomerList';

interface CustomersModuleProps {
  businessId: string;
  onUpgrade: () => void;
}

export function CustomersModule({ businessId, onUpgrade }: CustomersModuleProps) {
  return (
    <SubscriptionGuard
      businessId={businessId}
      feature="customerManagement"
      onUpgrade={onUpgrade}
    >
      <CustomerList salonId={businessId} />
    </SubscriptionGuard>
  );
}
