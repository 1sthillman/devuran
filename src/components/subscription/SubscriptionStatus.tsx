import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, AlertCircle, CheckCircle, Clock, TrendingUp, Users, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { subscriptionService } from '@/services/subscriptionService';
import type { BusinessSubscription } from '@/types/subscription';
import { SUBSCRIPTION_PLANS } from '@/config/subscriptionPlans';

interface SubscriptionStatusProps {
  businessId: string;
  onUpgrade?: () => void;
  className?: string;
}

export function SubscriptionStatus({ businessId, onUpgrade, className }: SubscriptionStatusProps) {
  const [subscription, setSubscription] = useState<BusinessSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [daysRemaining, setDaysRemaining] = useState(0);

  useEffect(() => {
    loadSubscription();
  }, [businessId]);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      const sub = await subscriptionService.getBusinessSubscription(businessId);
      setSubscription(sub);

      if (sub) {
        const endDate = new Date(sub.endDate);
        const now = new Date();
        const diff = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        setDaysRemaining(diff);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={cn('bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm', className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className={cn('bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6', className)}>
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
              Abonelik Bulunamadı
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 mb-4">
              Sistemimizi kullanmaya devam etmek için bir abonelik planı seçmeniz gerekmektedir.
            </p>
            {onUpgrade && (
              <button
                onClick={onUpgrade}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Plan Seç
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const plan = SUBSCRIPTION_PLANS.find(p => p.id === subscription.planType);
  const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;
  const isExpired = subscription.status === 'expired' || daysRemaining <= 0;
  const isTrial = subscription.status === 'trial';

  const statusConfig = {
    trial: {
      icon: Clock,
      color: 'blue',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-900 dark:text-blue-100',
      label: 'Deneme Süresi',
    },
    active: {
      icon: CheckCircle,
      color: 'green',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      textColor: 'text-green-900 dark:text-green-100',
      label: 'Aktif',
    },
    expired: {
      icon: AlertCircle,
      color: 'red',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      textColor: 'text-red-900 dark:text-red-100',
      label: 'Süresi Dolmuş',
    },
    cancelled: {
      icon: AlertCircle,
      color: 'orange',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      borderColor: 'border-orange-200 dark:border-orange-800',
      textColor: 'text-orange-900 dark:text-orange-100',
      label: 'İptal Edilmiş',
    },
    suspended: {
      icon: AlertCircle,
      color: 'yellow',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      textColor: 'text-yellow-900 dark:text-yellow-100',
      label: 'Askıya Alınmış',
    },
  };

  const status = isExpired ? statusConfig.expired : statusConfig[subscription.status];
  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'border rounded-lg p-6',
        status.bgColor,
        status.borderColor,
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <StatusIcon className={cn('w-6 h-6 flex-shrink-0 mt-0.5', `text-${status.color}-600 dark:text-${status.color}-400`)} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={cn('text-lg font-semibold', status.textColor)}>
                {plan?.name || subscription.planType}
              </h3>
              <span className={cn(
                'text-xs font-medium px-2 py-0.5 rounded-full',
                `bg-${status.color}-100 dark:bg-${status.color}-900/30 text-${status.color}-700 dark:text-${status.color}-300`
              )}>
                {status.label}
              </span>
            </div>

            {/* Trial Warning */}
            {isTrial && (
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                <strong>{daysRemaining} gün</strong> ücretsiz deneme süreniz kaldı
              </p>
            )}

            {/* Expiring Soon Warning */}
            {isExpiringSoon && !isTrial && (
              <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                Aboneliğiniz <strong>{daysRemaining} gün</strong> içinde sona erecek
              </p>
            )}

            {/* Expired Warning */}
            {isExpired && (
              <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                Aboneliğinizin süresi dolmuştur. Hizmetlere erişim için lütfen yenileyin.
              </p>
            )}

            {/* Subscription Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Başlangıç</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {new Date(subscription.startDate).toLocaleDateString('tr-TR')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Bitiş</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {new Date(subscription.endDate).toLocaleDateString('tr-TR')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Ücret</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {subscription.price.toLocaleString('tr-TR')} ₺
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Dönem</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {subscription.interval === 'monthly' && 'Aylık'}
                  {subscription.interval === 'quarterly' && '3 Aylık'}
                  {subscription.interval === 'semi-annual' && '6 Aylık'}
                  {subscription.interval === 'annual' && 'Yıllık'}
                </p>
              </div>
            </div>

            {/* Usage Stats */}
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Personel</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {subscription.usage.staffCount} / {plan?.features.maxStaff === 'unlimited' ? '∞' : plan?.features.maxStaff}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Hizmet</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {subscription.usage.serviceCount} / {plan?.features.maxServices === 'unlimited' ? '∞' : plan?.features.maxServices}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Randevu/Ay</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {subscription.usage.monthlyBookings} / {plan?.features.maxMonthlyBookings === 'unlimited' ? '∞' : plan?.features.maxMonthlyBookings}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {onUpgrade && (isExpired || isExpiringSoon || isTrial) && (
          <button
            onClick={onUpgrade}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
              isExpired
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-primary hover:bg-primary/90 text-white'
            )}
          >
            {isExpired ? 'Yenile' : isTrial ? 'Planı Seç' : 'Yükselt'}
          </button>
        )}
      </div>
    </motion.div>
  );
}
