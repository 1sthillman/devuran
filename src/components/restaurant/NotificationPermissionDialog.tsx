import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, AlertCircle } from 'lucide-react';
import { fcmService } from '@/services/fcmService';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';

interface NotificationPermissionDialogProps {
  role: 'owner' | 'waiter' | 'kitchen' | 'cashier';
  restaurantId: string;
}

export function NotificationPermissionDialog({ role, restaurantId }: NotificationPermissionDialogProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    // Sayfa yüklendiğinde bildirim durumunu kontrol et
    checkNotificationPermission();
  }, []);

  async function checkNotificationPermission() {
    if (!fcmService.isNotificationSupported()) {
      console.log('⚠️ Tarayıcı bildirim desteklemiyor');
      return;
    }

    const permission = fcmService.getPermissionStatus();
    
    // localStorage'da dismiss edilmiş mi kontrol et
    const dismissed = localStorage.getItem('notificationPermissionDismissed');
    if (dismissed === 'true') {
      console.log('ℹ️ Kullanıcı bildirim iznini daha önce kapatmış');
      return;
    }
    
    if (permission === 'default') {
      // Henüz izin istenmemiş, dialog göster
      setTimeout(() => setShowDialog(true), 2000); // 2 saniye sonra göster
    } else if (permission === 'granted') {
      // İzin verilmiş, token'ı kontrol et ve gerekirse yenile
      console.log('✅ Bildirim izni zaten verilmiş');
      await refreshToken();
    }
  }

  async function handleRequestPermission() {
    if (!user?.uid) {
      toast.error('Kullanıcı bilgisi bulunamadı');
      return;
    }

    try {
      setRequesting(true);

      const token = await fcmService.requestPermissionAndGetToken();
      
      if (!token) {
        toast.error('Bildirim izni alınamadı', {
          description: 'Tarayıcı ayarlarından izin verebilirsiniz'
        });
        setShowDialog(false);
        return;
      }

      // Token'ı Firestore'a kaydet
      await fcmService.saveTokenToFirestore(user.uid, token, role);

      toast.success('Bildirimler aktif! 🔔', {
        description: 'Artık anlık bildirimler alacaksınız'
      });

      setShowDialog(false);

      // Test bildirimi göster
      setTimeout(() => {
        fcmService.showTestNotification();
      }, 1000);

    } catch (error) {
      console.error('❌ İzin isteme hatası:', error);
      toast.error('Bir hata oluştu');
    } finally {
      setRequesting(false);
    }
  }

  async function refreshToken() {
    if (!user?.uid) return;

    try {
      const token = await fcmService.requestPermissionAndGetToken();
      if (token) {
        await fcmService.saveTokenToFirestore(user.uid, token, role);
      }
    } catch (error) {
      console.error('❌ Token yenileme hatası:', error);
    }
  }

  function handleDismiss() {
    setShowDialog(false);
    // Local storage'a kaydet - bir daha gösterme
    localStorage.setItem('notificationPermissionDismissed', 'true');
  }

  return (
    <AnimatePresence>
      {showDialog && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          >
            <div className="relative max-w-md w-full bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-gray-800">
              {/* Close Button */}
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>

              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <Bell className="w-8 h-8 text-white" />
                </div>
              </div>

              {/* Content */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Anlık Bildirimler
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {role === 'waiter' && 'Müşteri çağrıları, köz talepleri ve hesap isteklerini anında alın'}
                  {role === 'kitchen' && 'Yeni siparişleri anında görün ve hazırlamaya başlayın'}
                  {role === 'cashier' && 'Hesap isteklerini ve ödemeleri anında takip edin'}
                  {role === 'owner' && 'Restoran aktivitelerini anlık takip edin'}
                </p>

                {/* Features */}
                <div className="mt-4 space-y-2 text-left">
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Telefon kilitli bile olsa bildirim alın</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Uygulama arka plandayken bildirim + ses</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Hızlı yanıt butonları</span>
                  </div>
                </div>

                {/* Warning */}
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 dark:text-amber-300 text-left">
                      Tarayıcınız izin isteyecek. "İzin Ver" seçeneğini seçin.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRequestPermission}
                  disabled={requesting}
                  className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {requesting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      İzin İsteniyor...
                    </>
                  ) : (
                    <>
                      <Bell className="w-5 h-5" />
                      Bildirimleri Aktif Et
                    </>
                  )}
                </motion.button>

                <button
                  onClick={handleDismiss}
                  className="w-full h-10 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Şimdi değil
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
