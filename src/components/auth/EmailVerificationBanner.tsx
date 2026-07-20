/**
 * 📧 EMAIL VERIFICATION BANNER
 * 
 * Email doğrulaması yapılmamış kullanıcılara uyarı gösterir
 * 
 * @date 2026-07-20
 */

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { AlertTriangle, Mail, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function EmailVerificationBanner() {
  const { user } = useAuthStore();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Banner gösterme koşulları:
  // 1. Kullanıcı giriş yapmış
  // 2. Email doğrulanmamış
  // 3. Banner dismiss edilmemiş
  const shouldShow = user && 
                     auth.currentUser && 
                     !auth.currentUser.emailVerified && 
                     !dismissed;

  if (!shouldShow) return null;

  const handleResendEmail = async () => {
    if (!auth.currentUser || sending) return;
    
    setSending(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setSent(true);
      setTimeout(() => setSent(false), 5000); // 5 saniye sonra mesajı gizle
    } catch (error: any) {
      console.error('Email verification error:', error);
      alert(error.message || 'Email gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-yellow-50 border-b border-yellow-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <Alert className="border-yellow-300 bg-yellow-50">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <AlertTitle className="text-yellow-800 font-semibold">
                  Email Adresinizi Doğrulayın
                </AlertTitle>
                <AlertDescription className="text-yellow-700 text-sm mt-1">
                  Hesabınızı güvende tutmak ve tüm özelliklere erişebilmek için email adresinizi doğrulamanız gerekiyor.
                  {sent && (
                    <span className="block mt-2 text-green-700 font-medium">
                      ✅ Doğrulama emaili gönderildi! Lütfen gelen kutunuzu kontrol edin.
                    </span>
                  )}
                </AlertDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResendEmail}
                disabled={sending || sent}
                className="border-yellow-300 hover:bg-yellow-100"
              >
                <Mail className="h-4 w-4 mr-2" />
                {sending ? 'Gönderiliyor...' : sent ? 'Gönderildi' : 'Tekrar Gönder'}
              </Button>
              
              <button
                onClick={() => setDismissed(true)}
                className="text-yellow-600 hover:text-yellow-800 p-1"
                aria-label="Kapat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </Alert>
      </div>
    </div>
  );
}
