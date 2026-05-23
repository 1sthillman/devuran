import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { ChromaticButton } from '@/components/ui/ChromaticButton';
import { OnboardingModal } from '@/components/auth/OnboardingModal';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export function Login() {
  const { isAuthenticated } = useAuthStore();
  const { addToast } = useUIStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'customer' | 'owner'>('customer');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [pendingGoogleUser, setPendingGoogleUser] = useState<any>(null);
  const { login, register, googleSignIn, completeOnboarding } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || '/';

  // Giriş yapmış kullanıcıyı anasayfaya yönlendir
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegister && !acceptedTerms) {
      return;
    }
    setLoading(true);

    let success;
    if (isRegister) {
      success = await register(name, email, password, phone, role);
    } else {
      success = await login(email, password);
    }

    if (success) {
      navigate(from, { replace: true });
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true);
    const result = await googleSignIn();
    
    if (result.success) {
      // If pending (mobile redirect), keep loading state
      if (result.pending) {
        // Don't set loading to false, redirect is happening
        return;
      }
      
      if (result.needsOnboarding) {
        setPendingGoogleUser(result.user);
        setShowOnboarding(true);
        setLoading(false);
      } else {
        // Success, will navigate via auth state change
        navigate(from, { replace: true });
      }
    } else {
      setLoading(false);
    }
  };

  const handleOnboardingComplete = async (data: {
    phone: string;
    role: 'customer' | 'owner';
    acceptedTerms: boolean;
  }) => {
    setLoading(true);
    const success = await completeOnboarding(data.phone, data.role);
    if (success) {
      setShowOnboarding(false);
      navigate(from, { replace: true });
    }
    setLoading(false);
  };

  return (
    <>
      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
        userName={pendingGoogleUser?.displayName || 'Kullanici'}
      />

      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="font-display font-bold text-2xl text-[var(--chrome-white)]">
              RANDEVU
            </h1>
            <h2 className="font-display font-bold text-2xl text-[var(--chrome-white)] mt-4">
              {isRegister ? 'Hesap Oluştur' : 'Hoş Geldiniz'}
            </h2>
            <p className="font-body text-[var(--muted-lead)] mt-2">
              {isRegister
                ? 'Randevu almak için kayıt olun'
                : 'Randevu almak için giriş yapın'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-2">
                    Ad Soyad
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Adınız"
                    required
                    className="w-full h-[52px] px-4 rounded-2xl bg-[var(--slate-surface)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] placeholder:text-[var(--ash)] font-body text-[15px] outline-none transition-all focus:border-[var(--liquid-chrome)] focus:shadow-[0_0_0_3px_rgba(255,255,255,0.06)]"
                  />
                </div>

                <div>
                  <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-2">
                    Telefon Numarası
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="5XX XXX XX XX"
                    required
                    className="w-full h-[52px] px-4 rounded-2xl bg-[var(--slate-surface)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] placeholder:text-[var(--ash)] font-body text-[15px] outline-none transition-all focus:border-[var(--liquid-chrome)] focus:shadow-[0_0_0_3px_rgba(255,255,255,0.06)]"
                  />
                </div>

                <div>
                  <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-2">
                    Hesap Tipi
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('customer')}
                      className={`h-[52px] px-4 rounded-2xl border-2 transition-all font-heading font-medium text-[15px] ${
                        role === 'customer'
                          ? 'border-[var(--liquid-chrome)] bg-white/5 text-[var(--chrome-white)]'
                          : 'border-[var(--obsidian-rim)] text-[var(--muted-lead)] hover:border-[var(--silver-frost)]'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        {role === 'customer' && <Check size={16} />}
                        <span>Müşteri</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('owner')}
                      className={`h-[52px] px-4 rounded-2xl border-2 transition-all font-heading font-medium text-[15px] ${
                        role === 'owner'
                          ? 'border-[var(--liquid-chrome)] bg-white/5 text-[var(--chrome-white)]'
                          : 'border-[var(--obsidian-rim)] text-[var(--muted-lead)] hover:border-[var(--silver-frost)]'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        {role === 'owner' && <Check size={16} />}
                        <span>İşletme</span>
                      </div>
                    </button>
                  </div>
                  <p className="font-body text-xs text-[var(--muted-lead)] mt-2">
                    {role === 'customer' 
                      ? 'Randevu almak ve salonları keşfetmek için' 
                      : 'Salonunuzu yönetmek ve randevuları takip etmek için'}
                  </p>
                </div>
              </>
            )}

            <div>
              <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-2">
                E-posta
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@email.com"
                required
                className="w-full h-[52px] px-4 rounded-2xl bg-[var(--slate-surface)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] placeholder:text-[var(--ash)] font-body text-[15px] outline-none transition-all focus:border-[var(--liquid-chrome)] focus:shadow-[0_0_0_3px_rgba(255,255,255,0.06)]"
              />
            </div>

            <div>
              <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-2">
                Şifre
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full h-[52px] px-4 rounded-2xl bg-[var(--slate-surface)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] placeholder:text-[var(--ash)] font-body text-[15px] outline-none transition-all focus:border-[var(--liquid-chrome)] focus:shadow-[0_0_0_3px_rgba(255,255,255,0.06)]"
              />
            </div>

            {isRegister && (
              <div className="p-4 rounded-2xl bg-[var(--void)] border border-[var(--obsidian-rim)]">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-2 border-[var(--obsidian-rim)] bg-transparent checked:bg-[var(--liquid-chrome)] checked:border-[var(--liquid-chrome)] cursor-pointer accent-[var(--liquid-chrome)]"
                  />
                  <div className="flex-1">
                    <p className="font-body text-sm text-[var(--chrome-white)]">
                      <button
                        type="button"
                        onClick={() => {
                          addToast('Kullanım koşulları sayfası yakında eklenecektir', 'info');
                        }}
                        className="text-[var(--liquid-chrome)] hover:underline"
                      >
                        Kullanım Koşulları
                      </button>
                      {' '}ve{' '}
                      <button
                        type="button"
                        onClick={() => {
                          addToast('Gizlilik politikası sayfası yakında eklenecektir', 'info');
                        }}
                        className="text-[var(--liquid-chrome)] hover:underline"
                      >
                        Gizlilik Politikası
                      </button>
                      'ni okudum ve kabul ediyorum
                    </p>
                  </div>
                </label>
              </div>
            )}

            <ChromaticButton 
              fullWidth 
              loading={loading} 
              className="h-[52px]"
              disabled={isRegister && !acceptedTerms}
            >
              {isRegister ? 'Kayıt Ol' : 'Giriş Yap'}
            </ChromaticButton>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[var(--obsidian-rim)]" />
            <span className="font-body text-xs text-[var(--muted-lead)]">veya</span>
            <div className="flex-1 h-px bg-[var(--obsidian-rim)]" />
          </div>

          {/* Google Sign In */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full h-[52px] flex items-center justify-center gap-3 rounded-2xl bg-[var(--slate-surface)] border border-[var(--obsidian-rim)] font-heading font-medium text-[15px] text-[var(--chrome-white)] transition-all hover:border-[var(--liquid-chrome)] active:scale-[0.98]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google ile {isRegister ? 'kayıt ol' : 'giriş yap'}
          </button>

          {/* Toggle */}
          <p className="text-center mt-6 font-body text-sm text-[var(--muted-lead)]">
            {isRegister ? 'Zaten hesabınız var mı?' : 'Hesabınız yok mu?'}{' '}
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-[var(--silver-frost)] font-heading font-medium hover:underline"
            >
              {isRegister ? 'Giriş Yapın' : 'Kayıt Olun'}
            </button>
          </p>
        </motion.div>
      </div>
    </>
  );
}
