/**
 * İŞLETME OLUŞTURMA SAYFASI - 1 İŞLETME LİMİTİ
 */

import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { BusinessSetupWizard } from '@/components/business/BusinessSetupWizard';
import { useEffect, useState } from 'react';
import { salonsService } from '@/services/firebaseService';
import { Loader2, AlertCircle, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

export function BusinessSetup() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [checking, setChecking] = useState(true);
  const [hasSalon, setHasSalon] = useState(false);

  useEffect(() => {
    const checkExistingSalon = async () => {
      if (!user?.uid) {
        setChecking(false);
        return;
      }

      try {
        // Check if user has salonId
        setHasSalon(!!user.salonId);
      } catch (error) {
        console.error('Salon check error:', error);
        setHasSalon(false);
      } finally {
        setChecking(false);
      }
    };

    if (user) {
      checkExistingSalon();
    } else if (!authLoading) {
      setChecking(false);
    }
  }, [user, authLoading]);

  // Auth loading
  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--primary)] via-[var(--accent)] to-[var(--primary)]">
        <div className="text-center">
          <Loader2 size={48} className="mx-auto text-purple-400 animate-spin mb-4" />
          <p className="text-white/80">Kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Already has a salon - redirect with message
  if (hasSalon) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[var(--primary)] via-[var(--accent)] to-[var(--primary)]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <AlertCircle size={32} className="text-white" />
              </div>
              <h2 className="font-heading font-bold text-2xl text-gray-900 mb-3">
                Zaten bir işletmeniz var
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Bir kullanıcı sadece bir işletme oluşturabilir. Mevcut işletmenizi yönetmek için dashboard'a gidin veya ayarlar bölümünden düzenleyin.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="/dashboard"
                  className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:from-purple-700 hover:to-pink-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Settings size={18} />
                  Dashboard'a Git
                </a>
                <a
                  href="/"
                  className="flex-1 px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all active:scale-95"
                >
                  Ana Sayfa
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Create new business
  return <BusinessSetupWizard />;
}
