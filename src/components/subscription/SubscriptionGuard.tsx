import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, AlertTriangle, Zap } from 'lucide-react';
import { subscriptionService } from '@/services/subscriptionService';
import type { FeatureAccess } from '@/types/subscription';
import type { PlanFeatures } from '@/types/subscription';

interface SubscriptionGuardProps {
  businessId: string;
  feature: keyof PlanFeatures;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onUpgrade?: () => void;
}

export function SubscriptionGuard({
  businessId,
  feature,
  children,
  fallback,
  onUpgrade,
}: SubscriptionGuardProps) {
  const [access, setAccess] = useState<FeatureAccess | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAccess();
  }, [businessId, feature]);

  const checkAccess = async () => {
    try {
      setLoading(true);
      const result = await subscriptionService.checkFeatureAccess(businessId, feature);
      setAccess(result);
    } catch (error) {
      console.error('Error checking feature access:', error);
      setAccess({ hasAccess: false, reason: 'Erişim kontrolü başarısız' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!access?.hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="relative overflow-hidden rounded-3xl border-2 border-orange-500/20 bg-gradient-to-br from-orange-500/5 via-transparent to-red-500/5 backdrop-blur-xl p-8"
        >
          {/* Decorative gradient orb */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-full blur-3xl -z-10" />
          
          <div className="relative z-10 text-center max-w-md mx-auto">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full mb-6 shadow-lg shadow-orange-500/20">
              <Lock className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>
            
            {/* Title */}
            <h3 className="font-heading text-2xl font-bold text-white mb-3">
              Bu Özellik Kilitli
            </h3>
            
            {/* Description */}
            <p className="font-body text-sm text-gray-300 mb-6 leading-relaxed">
              {access.reason || 'Bu özelliğe erişmek için planınızı yükseltmeniz gerekmektedir.'}
            </p>

            {/* Required Plan Badge */}
            {access.upgradeRequired && access.requiredPlan && (
              <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-300 px-5 py-3 rounded-full mb-6">
                <AlertTriangle className="w-4 h-4" strokeWidth={2.5} />
                <span className="text-sm font-heading font-semibold">
                  Minimum gerekli plan: <span className="capitalize text-orange-200">{access.requiredPlan}</span>
                </span>
              </div>
            )}

            {/* Upgrade Button */}
            {onUpgrade && (
              <button
                onClick={onUpgrade}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-4 rounded-full font-heading font-bold text-sm shadow-lg shadow-orange-500/20 transition-all hover:scale-105 active:scale-95"
              >
                <Zap className="w-5 h-5" strokeWidth={2.5} />
                <span>Planı Yükselt</span>
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return <>{children}</>;
}

// Hook version for programmatic checks
export function useFeatureAccess(businessId: string, feature: keyof PlanFeatures) {
  const [access, setAccess] = useState<FeatureAccess | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAccess();
  }, [businessId, feature]);

  const checkAccess = async () => {
    try {
      setLoading(true);
      const result = await subscriptionService.checkFeatureAccess(businessId, feature);
      setAccess(result);
    } catch (error) {
      console.error('Error checking feature access:', error);
      setAccess({ hasAccess: false, reason: 'Erişim kontrolü başarısız' });
    } finally {
      setLoading(false);
    }
  };

  return { access, loading, refetch: checkAccess };
}
