import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Users,
  Briefcase,
  Zap,
  Crown,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { subscriptionService } from '@/services/subscriptionService';
import { SUBSCRIPTION_PLANS } from '@/config/subscriptionPlans';
import { useThemeStore } from '@/store/themeStore';
import type { BusinessSubscription } from '@/types/subscription';

interface SubscriptionOverviewCardProps {
  businessId: string;
  onViewPlans?: () => void;
  className?: string;
}

export function SubscriptionOverviewCard({ 
  businessId, 
  onViewPlans,
  className 
}: SubscriptionOverviewCardProps) {
  const [subscription, setSubscription] = useState<BusinessSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const { actualTheme } = useThemeStore();

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
      <div 
        className={cn('rounded-3xl border p-6', className)}
        style={{
          backgroundColor: actualTheme === 'light' ? 'rgba(249, 250, 251, 0.8)' : 'rgba(255, 255, 255, 0.02)',
          borderColor: actualTheme === 'light' ? 'rgba(209, 213, 219, 0.5)' : 'rgba(255, 255, 255, 0.08)',
          boxShadow: actualTheme === 'light' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none'
        }}
      >
        <div className="animate-pulse space-y-4">
          <div className="h-6 rounded-2xl w-1/3" style={{ backgroundColor: actualTheme === 'light' ? 'rgba(209, 213, 219, 0.4)' : 'rgba(255, 255, 255, 0.05)' }}></div>
          <div className="h-20 rounded-2xl" style={{ backgroundColor: actualTheme === 'light' ? 'rgba(209, 213, 219, 0.4)' : 'rgba(255, 255, 255, 0.05)' }}></div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn('relative overflow-hidden rounded-3xl border-2 p-6', className)}
        style={{
          backgroundColor: actualTheme === 'light' ? 'rgba(254, 242, 242, 0.9)' : 'rgba(239, 68, 68, 0.05)',
          borderColor: actualTheme === 'light' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
          boxShadow: actualTheme === 'light' ? '0 4px 12px rgba(239, 68, 68, 0.1)' : 'none'
        }}
      >
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20 flex-shrink-0">
            <AlertCircle size={28} className="text-white" strokeWidth={2.5} />
          </div>
          
          <div className="flex-1">
            <h3 className="font-heading text-xl font-bold mb-2" style={{ color: actualTheme === 'light' ? '#991b1b' : 'white' }}>
              Abonelik Gerekli
            </h3>
            <p className="text-sm mb-4" style={{ color: actualTheme === 'light' ? '#7f1d1d' : '#fca5a5' }}>
              Sistemimizi kullanmaya devam etmek için bir abonelik planı seçmeniz gerekmektedir.
            </p>
            
            {onViewPlans && (
              <button
                onClick={onViewPlans}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-full font-heading font-semibold text-sm shadow-lg shadow-red-500/20 transition-all hover:scale-105 active:scale-95"
              >
                <CreditCard size={18} strokeWidth={2.5} />
                <span>Paket Seç</span>
                <ArrowRight size={16} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  const plan = SUBSCRIPTION_PLANS.find(p => p.id === subscription.planType);
  const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;
  const isExpired = subscription.status === 'expired' || daysRemaining <= 0;
  const isTrial = subscription.status === 'trial';

  // Status configuration
  const statusConfig = {
    trial: {
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-500/5 via-transparent to-cyan-500/5',
      borderColor: 'border-blue-500/20',
      icon: Clock,
      iconBg: 'from-blue-500 to-cyan-500',
      shadowColor: 'shadow-blue-500/20',
      label: 'Deneme',
      labelColor: 'text-blue-400',
      textColor: 'text-blue-300',
    },
    pending: {
      gradient: 'from-amber-500 to-orange-500',
      bgGradient: 'from-amber-500/5 via-transparent to-orange-500/5',
      borderColor: 'border-amber-500/20',
      icon: Clock,
      iconBg: 'from-amber-500 to-orange-500',
      shadowColor: 'shadow-amber-500/20',
      label: 'Onay Bekliyor',
      labelColor: 'text-amber-400',
      textColor: 'text-amber-300',
    },
    active: {
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-500/5 via-transparent to-emerald-500/5',
      borderColor: 'border-green-500/20',
      icon: CheckCircle,
      iconBg: 'from-green-500 to-emerald-500',
      shadowColor: 'shadow-green-500/20',
      label: 'Aktif',
      labelColor: 'text-green-400',
      textColor: 'text-green-300',
    },
    expired: {
      gradient: 'from-red-500 to-orange-500',
      bgGradient: 'from-red-500/5 via-transparent to-orange-500/5',
      borderColor: 'border-red-500/20',
      icon: AlertCircle,
      iconBg: 'from-red-500 to-orange-500',
      shadowColor: 'shadow-red-500/20',
      label: 'Dolmuş',
      labelColor: 'text-red-400',
      textColor: 'text-red-300',
    },
  };

  const currentStatus = isExpired ? statusConfig.expired : statusConfig[subscription.status] || statusConfig.active;
  const StatusIcon = currentStatus.icon;

  // Plan icon
  const planIcons = {
    starter: Zap,
    professional: TrendingUp,
    business: Briefcase,
    enterprise: Crown,
    custom: Sparkles,
  };
  const PlanIcon = planIcons[subscription.planType] || TrendingUp;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('relative overflow-hidden rounded-3xl border-2', className)}
      style={{
        backgroundColor: actualTheme === 'light' 
          ? (isExpired ? 'rgba(254, 242, 242, 0.9)' : 'rgba(249, 250, 251, 0.9)')
          : (isExpired ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255, 255, 255, 0.02)'),
        borderColor: actualTheme === 'light'
          ? (isExpired ? 'rgba(239, 68, 68, 0.3)' : 'rgba(209, 213, 219, 0.5)')
          : (isExpired ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.08)'),
        boxShadow: actualTheme === 'light' 
          ? (isExpired ? '0 4px 12px rgba(239, 68, 68, 0.1)' : '0 1px 3px rgba(0,0,0,0.05)')
          : 'none'
      }}
    >
      {/* Content */}
      <div className="relative p-5 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className={cn(
              'w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg flex-shrink-0',
              currentStatus.iconBg,
              currentStatus.shadowColor
            )}>
              <PlanIcon size={24} className="text-white" strokeWidth={2.5} />
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-heading text-lg sm:text-xl font-bold" style={{ color: actualTheme === 'light' ? '#1f2937' : 'white' }}>
                  {plan?.name || subscription.planType}
                </h3>
                <span 
                  className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: actualTheme === 'light' 
                      ? (isExpired ? 'rgba(239, 68, 68, 0.15)' : 'rgba(139, 92, 246, 0.15)')
                      : 'rgba(255, 255, 255, 0.1)',
                    color: actualTheme === 'light'
                      ? (isExpired ? '#dc2626' : '#7c3aed')
                      : (isExpired ? '#fca5a5' : currentStatus.labelColor.replace('text-', '#'))
                  }}
                >
                  {currentStatus.label}
                </span>
              </div>
              <p className="text-sm" style={{ color: actualTheme === 'light' ? '#6b7280' : '#d1d5db' }}>
                {subscription.interval === 'monthly' && 'Aylık'}
                {subscription.interval === 'quarterly' && '3 Aylık'}
                {subscription.interval === 'semi-annual' && '6 Aylık'}
                {subscription.interval === 'annual' && 'Yıllık'}
              </p>
            </div>
          </div>

          {/* Price */}
          <div className="text-left sm:text-right">
            <p className="text-2xl sm:text-3xl font-bold font-mono" style={{ color: actualTheme === 'light' ? '#1f2937' : 'white' }}>
              {subscription.price.toLocaleString('tr-TR')}₺
            </p>
            <p className="text-xs mt-1" style={{ color: actualTheme === 'light' ? '#6b7280' : '#d1d5db' }}>
              / {subscription.interval === 'monthly' ? 'ay' : 'dönem'}
            </p>
          </div>
        </div>

        {/* Days Remaining - Prominent */}
        <div 
          className="mb-5 p-4 sm:p-5 rounded-2xl border-2"
          style={{
            backgroundColor: actualTheme === 'light'
              ? (isExpired ? 'rgba(254, 226, 226, 0.5)' : isExpiringSoon ? 'rgba(254, 243, 199, 0.5)' : 'rgba(220, 252, 231, 0.5)')
              : 'rgba(255, 255, 255, 0.02)',
            borderColor: actualTheme === 'light'
              ? (isExpired ? 'rgba(239, 68, 68, 0.3)' : isExpiringSoon ? 'rgba(251, 146, 60, 0.3)' : 'rgba(34, 197, 94, 0.3)')
              : (isExpired ? 'rgba(239, 68, 68, 0.2)' : isExpiringSoon ? 'rgba(251, 146, 60, 0.2)' : 'rgba(34, 197, 94, 0.2)')
          }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Calendar 
                className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0"
                style={{
                  color: actualTheme === 'light'
                    ? (isExpired ? '#dc2626' : isExpiringSoon ? '#ea580c' : '#16a34a')
                    : (isExpired ? '#fca5a5' : isExpiringSoon ? '#fb923c' : '#4ade80')
                }}
                strokeWidth={2.5} 
              />
              <div>
                <p className="text-xs mb-0.5" style={{ color: actualTheme === 'light' ? '#6b7280' : '#d1d5db' }}>
                  {isExpired ? 'Süre Doldu' : isTrial ? 'Deneme Süresi' : 'Kalan Süre'}
                </p>
                <p 
                  className="text-2xl sm:text-3xl font-bold font-mono"
                  style={{
                    color: actualTheme === 'light'
                      ? (isExpired ? '#dc2626' : isExpiringSoon ? '#ea580c' : '#16a34a')
                      : (isExpired ? '#fca5a5' : isExpiringSoon ? '#fb923c' : '#4ade80')
                  }}
                >
                  {isExpired ? '0' : daysRemaining} Gün
                </p>
              </div>
            </div>
            
            <div className="text-left sm:text-right">
              <p className="text-xs mb-0.5" style={{ color: actualTheme === 'light' ? '#6b7280' : '#d1d5db' }}>Bitiş</p>
              <p className="text-sm font-semibold" style={{ color: actualTheme === 'light' ? '#1f2937' : 'white' }}>
                {new Date(subscription.endDate).toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'short'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Warning Messages */}
        {subscription.status === 'pending' && (
          <div 
            className="mb-4 p-4 rounded-2xl border"
            style={{
              backgroundColor: actualTheme === 'light' ? 'rgba(254, 243, 199, 0.5)' : 'rgba(245, 158, 11, 0.1)',
              borderColor: actualTheme === 'light' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.2)'
            }}
          >
            <p className="text-sm flex items-center gap-2" style={{ color: actualTheme === 'light' ? '#92400e' : '#fbbf24' }}>
              <Clock size={16} strokeWidth={2.5} />
              <span>
                Abonelik talebiniz <strong>admin onayı bekliyor</strong>. Onaylandıktan sonra işletmeniz anasayfada görünecektir.
              </span>
            </p>
          </div>
        )}

        {isTrial && (
          <div 
            className="mb-4 p-4 rounded-2xl border"
            style={{
              backgroundColor: actualTheme === 'light' ? 'rgba(219, 234, 254, 0.5)' : 'rgba(59, 130, 246, 0.1)',
              borderColor: actualTheme === 'light' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'
            }}
          >
            <p className="text-sm flex items-center gap-2" style={{ color: actualTheme === 'light' ? '#1e40af' : '#93c5fd' }}>
              <Clock size={16} strokeWidth={2.5} />
              <span>
                <strong>{daysRemaining} gün</strong> deneme süreniz kaldı
              </span>
            </p>
          </div>
        )}

        {isExpiringSoon && !isTrial && (
          <div 
            className="mb-4 p-4 rounded-2xl border"
            style={{
              backgroundColor: actualTheme === 'light' ? 'rgba(254, 243, 199, 0.5)' : 'rgba(249, 115, 22, 0.1)',
              borderColor: actualTheme === 'light' ? 'rgba(249, 115, 22, 0.3)' : 'rgba(249, 115, 22, 0.2)'
            }}
          >
            <p className="text-sm flex items-center gap-2" style={{ color: actualTheme === 'light' ? '#9a3412' : '#fb923c' }}>
              <AlertCircle size={16} strokeWidth={2.5} />
              <span>
                <strong>{daysRemaining} gün</strong> içinde sona erecek
              </span>
            </p>
          </div>
        )}

        {isExpired && (
          <div 
            className="mb-4 p-4 rounded-2xl border"
            style={{
              backgroundColor: actualTheme === 'light' ? 'rgba(254, 226, 226, 0.5)' : 'rgba(239, 68, 68, 0.1)',
              borderColor: actualTheme === 'light' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)'
            }}
          >
            <p className="text-sm flex items-center gap-2" style={{ color: actualTheme === 'light' ? '#991b1b' : '#fca5a5' }}>
              <AlertCircle size={16} strokeWidth={2.5} />
              <span>Aboneliğinizin süresi dolmuştur</span>
            </p>
          </div>
        )}

        {/* Usage Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div 
            className="rounded-2xl p-3 sm:p-4 border"
            style={{
              backgroundColor: actualTheme === 'light' ? 'rgba(249, 250, 251, 0.8)' : 'rgba(255, 255, 255, 0.02)',
              borderColor: actualTheme === 'light' ? 'rgba(209, 213, 219, 0.5)' : 'rgba(255, 255, 255, 0.08)'
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4" style={{ color: actualTheme === 'light' ? '#9333ea' : '#c084fc' }} strokeWidth={2.5} />
              <p className="text-xs" style={{ color: actualTheme === 'light' ? '#6b7280' : '#d1d5db' }}>Personel</p>
            </div>
            <p className="text-lg sm:text-xl font-bold font-mono" style={{ color: actualTheme === 'light' ? '#1f2937' : 'white' }}>
              {subscription.usage.staffCount}
              <span className="text-xs sm:text-sm font-normal" style={{ color: actualTheme === 'light' ? '#6b7280' : '#d1d5db' }}>
                {' '}/ {plan?.features.maxStaff === 'unlimited' ? '∞' : plan?.features.maxStaff}
              </span>
            </p>
          </div>

          <div 
            className="rounded-2xl p-3 sm:p-4 border"
            style={{
              backgroundColor: actualTheme === 'light' ? 'rgba(249, 250, 251, 0.8)' : 'rgba(255, 255, 255, 0.02)',
              borderColor: actualTheme === 'light' ? 'rgba(209, 213, 219, 0.5)' : 'rgba(255, 255, 255, 0.08)'
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-4 h-4" style={{ color: actualTheme === 'light' ? '#3b82f6' : '#60a5fa' }} strokeWidth={2.5} />
              <p className="text-xs" style={{ color: actualTheme === 'light' ? '#6b7280' : '#d1d5db' }}>Hizmet</p>
            </div>
            <p className="text-lg sm:text-xl font-bold font-mono" style={{ color: actualTheme === 'light' ? '#1f2937' : 'white' }}>
              {subscription.usage.serviceCount}
              <span className="text-xs sm:text-sm font-normal" style={{ color: actualTheme === 'light' ? '#6b7280' : '#d1d5db' }}>
                {' '}/ {plan?.features.maxServices === 'unlimited' ? '∞' : plan?.features.maxServices}
              </span>
            </p>
          </div>

          <div 
            className="rounded-2xl p-3 sm:p-4 border"
            style={{
              backgroundColor: actualTheme === 'light' ? 'rgba(249, 250, 251, 0.8)' : 'rgba(255, 255, 255, 0.02)',
              borderColor: actualTheme === 'light' ? 'rgba(209, 213, 219, 0.5)' : 'rgba(255, 255, 255, 0.08)'
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4" style={{ color: actualTheme === 'light' ? '#10b981' : '#4ade80' }} strokeWidth={2.5} />
              <p className="text-xs" style={{ color: actualTheme === 'light' ? '#6b7280' : '#d1d5db' }}>Randevu</p>
            </div>
            <p className="text-lg sm:text-xl font-bold font-mono" style={{ color: actualTheme === 'light' ? '#1f2937' : 'white' }}>
              {subscription.usage.monthlyBookings}
              <span className="text-xs sm:text-sm font-normal" style={{ color: actualTheme === 'light' ? '#6b7280' : '#d1d5db' }}>
                {' '}/ {plan?.features.maxMonthlyBookings === 'unlimited' ? '∞' : plan?.features.maxMonthlyBookings}
              </span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {onViewPlans && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Upgrade/Renew Button */}
            <button
              onClick={onViewPlans}
              className={cn(
                'inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full font-heading font-semibold text-sm shadow-lg transition-all hover:scale-105 active:scale-95',
                isExpired
                  ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-red-500/20'
                  : isExpiringSoon || isTrial
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-purple-500/20'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-emerald-500/20'
              )}
            >
              <TrendingUp size={18} strokeWidth={2.5} />
              <span>{isExpired ? 'Yenile' : isTrial ? 'Paket Seç' : 'Paket Yükselt'}</span>
            </button>

            {/* View All Plans Button */}
            <button
              onClick={onViewPlans}
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full font-heading font-semibold text-sm transition-all hover:scale-105 active:scale-95"
              style={{
                backgroundColor: actualTheme === 'light' ? 'rgba(249, 250, 251, 0.8)' : 'rgba(255, 255, 255, 0.05)',
                borderWidth: '2px',
                borderColor: actualTheme === 'light' ? 'rgba(209, 213, 219, 0.5)' : 'rgba(255, 255, 255, 0.1)',
                color: actualTheme === 'light' ? '#1f2937' : 'white'
              }}
            >
              <Sparkles size={18} strokeWidth={2.5} />
              <span>Tüm Paketler</span>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
