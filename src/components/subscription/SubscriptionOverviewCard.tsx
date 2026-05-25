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
      <div className={cn('bg-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/[0.08] p-6', className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/5 rounded-2xl w-1/3"></div>
          <div className="h-20 bg-white/5 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'relative overflow-hidden rounded-3xl border-2 border-red-500/20 bg-gradient-to-br from-red-500/5 via-transparent to-orange-500/5 backdrop-blur-xl p-6',
          className
        )}
      >
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20 flex-shrink-0">
            <AlertCircle size={28} className="text-white" strokeWidth={2.5} />
          </div>
          
          <div className="flex-1">
            <h3 className="font-heading text-xl font-bold text-white mb-2">
              Abonelik Gerekli
            </h3>
            <p className="text-sm text-gray-300 mb-4">
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
      className={cn(
        'relative overflow-hidden rounded-3xl border-2 backdrop-blur-xl bg-gradient-to-br',
        currentStatus.borderColor,
        currentStatus.bgGradient,
        className
      )}
    >
      {/* Content */}
      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={cn(
              'w-14 h-14 rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg flex-shrink-0',
              currentStatus.iconBg,
              currentStatus.shadowColor
            )}>
              <PlanIcon size={28} className="text-white" strokeWidth={2.5} />
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-heading text-xl font-bold text-white">
                  {plan?.name || subscription.planType}
                </h3>
                <span className={cn(
                  'text-xs font-bold px-3 py-1 rounded-full bg-white/10',
                  currentStatus.labelColor
                )}>
                  {currentStatus.label}
                </span>
              </div>
              <p className="text-sm text-gray-400">
                {subscription.interval === 'monthly' && 'Aylık'}
                {subscription.interval === 'quarterly' && '3 Aylık'}
                {subscription.interval === 'semi-annual' && '6 Aylık'}
                {subscription.interval === 'annual' && 'Yıllık'}
              </p>
            </div>
          </div>

          {/* Price */}
          <div className="text-right">
            <p className="text-3xl font-bold text-white font-mono">
              {subscription.price.toLocaleString('tr-TR')}₺
            </p>
            <p className="text-xs text-gray-400 mt-1">
              / {subscription.interval === 'monthly' ? 'ay' : 'dönem'}
            </p>
          </div>
        </div>

        {/* Days Remaining - Prominent */}
        <div className={cn(
          'mb-6 p-5 rounded-2xl border-2 bg-white/[0.02]',
          isExpired ? 'border-red-500/20' :
          isExpiringSoon ? 'border-orange-500/20' :
          isTrial ? 'border-blue-500/20' :
          'border-green-500/20'
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className={cn(
                'w-6 h-6',
                isExpired ? 'text-red-400' :
                isExpiringSoon ? 'text-orange-400' :
                isTrial ? 'text-blue-400' :
                'text-green-400'
              )} strokeWidth={2.5} />
              <div>
                <p className="text-xs text-gray-400 mb-0.5">
                  {isExpired ? 'Süre Doldu' : isTrial ? 'Deneme Süresi' : 'Kalan Süre'}
                </p>
                <p className={cn(
                  'text-3xl font-bold font-mono',
                  isExpired ? 'text-red-400' :
                  isExpiringSoon ? 'text-orange-400' :
                  isTrial ? 'text-blue-400' :
                  'text-green-400'
                )}>
                  {isExpired ? '0' : daysRemaining} Gün
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-xs text-gray-400 mb-0.5">Bitiş</p>
              <p className="text-sm font-semibold text-white">
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
          <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
            <p className="text-sm text-amber-300 flex items-center gap-2">
              <Clock size={16} strokeWidth={2.5} />
              <span>
                Abonelik talebiniz <strong>admin onayı bekliyor</strong>. Onaylandıktan sonra işletmeniz anasayfada görünecektir.
              </span>
            </p>
          </div>
        )}

        {isTrial && (
          <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
            <p className="text-sm text-blue-300 flex items-center gap-2">
              <Clock size={16} strokeWidth={2.5} />
              <span>
                <strong>{daysRemaining} gün</strong> deneme süreniz kaldı
              </span>
            </p>
          </div>
        )}

        {isExpiringSoon && !isTrial && (
          <div className="mb-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl">
            <p className="text-sm text-orange-300 flex items-center gap-2">
              <AlertCircle size={16} strokeWidth={2.5} />
              <span>
                <strong>{daysRemaining} gün</strong> içinde sona erecek
              </span>
            </p>
          </div>
        )}

        {isExpired && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
            <p className="text-sm text-red-300 flex items-center gap-2">
              <AlertCircle size={16} strokeWidth={2.5} />
              <span>Aboneliğinizin süresi dolmuştur</span>
            </p>
          </div>
        )}

        {/* Usage Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/[0.08]">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-purple-400" strokeWidth={2.5} />
              <p className="text-xs text-gray-400">Personel</p>
            </div>
            <p className="text-xl font-bold text-white font-mono">
              {subscription.usage.staffCount}
              <span className="text-sm text-gray-400 font-normal">
                {' '}/ {plan?.features.maxStaff === 'unlimited' ? '∞' : plan?.features.maxStaff}
              </span>
            </p>
          </div>

          <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/[0.08]">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-4 h-4 text-blue-400" strokeWidth={2.5} />
              <p className="text-xs text-gray-400">Hizmet</p>
            </div>
            <p className="text-xl font-bold text-white font-mono">
              {subscription.usage.serviceCount}
              <span className="text-sm text-gray-400 font-normal">
                {' '}/ {plan?.features.maxServices === 'unlimited' ? '∞' : plan?.features.maxServices}
              </span>
            </p>
          </div>

          <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/[0.08]">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-green-400" strokeWidth={2.5} />
              <p className="text-xs text-gray-400">Randevu</p>
            </div>
            <p className="text-xl font-bold text-white font-mono">
              {subscription.usage.monthlyBookings}
              <span className="text-sm text-gray-400 font-normal">
                {' '}/ {plan?.features.maxMonthlyBookings === 'unlimited' ? '∞' : plan?.features.maxMonthlyBookings}
              </span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {onViewPlans && (
          <div className="grid grid-cols-2 gap-3">
            {/* Upgrade/Renew Button */}
            <button
              onClick={onViewPlans}
              className={cn(
                'inline-flex items-center justify-center gap-2 px-5 py-4 rounded-full font-heading font-semibold text-sm shadow-lg transition-all hover:scale-105 active:scale-95',
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
              className="inline-flex items-center justify-center gap-2 px-5 py-4 rounded-full font-heading font-semibold text-sm bg-white/[0.05] hover:bg-white/[0.1] border-2 border-white/[0.1] hover:border-white/[0.2] text-white transition-all hover:scale-105 active:scale-95"
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
