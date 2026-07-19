import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { ChromaticButton } from '@/components/ui/ChromaticButton';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (data: {
    phone: string;
    role: 'customer' | 'owner';
    acceptedTerms: boolean;
  }) => void;
  userName: string;
}

export function OnboardingModal({ isOpen, onComplete, userName }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'customer' | 'owner' | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        } else {
          firstFocusableRef.current?.focus();
        }
      }, 100);

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && showTerms) {
          setShowTerms(false);
        }
      };

      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, showTerms]);

  const totalSteps = 3; // Same for both roles now

  const handleComplete = () => {
    if (phone && role && acceptedTerms) {
      onComplete({ 
        phone, 
        role,
        acceptedTerms 
      });
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[var(--void)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboarding-title"
          >
            <div 
              ref={modalRef}
              className="h-full w-full overflow-y-auto"
            >
              <div className="min-h-full flex flex-col p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
                {/* Header with Close Button */}
                <div className="flex items-start justify-between mb-6 sm:mb-8">
                  <div className="flex-1 text-center">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      <h2 
                        id="onboarding-title"
                        className="font-display font-bold text-3xl sm:text-4xl md:text-5xl bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent mb-3"
                      >
                        Hoşgeldin, {userName}
                      </h2>
                      <p className="font-body text-base sm:text-lg text-[var(--muted-lead)]">
                        Hesabını tamamlamak için birkaç bilgiye ihtiyacımız var
                      </p>
                    </motion.div>
                  </div>
                  <button
                    onClick={() => {/* Kapama işlemi eklenebilir */}}
                    className="p-3 hover:bg-white/5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                    aria-label="Kapat"
                  >
                    <X size={24} className="text-[var(--muted-lead)]" />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="flex gap-2 mb-8 sm:mb-12">
                  {Array.from({ length: totalSteps }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className={`h-2 sm:h-2.5 flex-1 rounded-full transition-all duration-500 ${
                        i + 1 <= step 
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/50' 
                          : 'bg-[var(--obsidian-rim)]'
                      }`}
                      role="progressbar"
                      aria-valuenow={i + 1 <= step ? 100 : 0}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  ))}
                </div>

                {/* Content Area - Centered and Spacious */}
                <div className="flex-1 py-4">

                {step === 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-6 max-w-2xl mx-auto"
                  >
                    <h3 className="font-heading font-bold text-2xl sm:text-3xl text-[var(--chrome-white)] mb-8 text-center">
                      Nasıl kullanacaksın?
                    </h3>
                    
                    <button
                      ref={firstFocusableRef}
                      onClick={() => setRole('customer')}
                      className={`relative w-full p-6 sm:p-8 rounded-3xl border-2 transition-all text-left group hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-purple-500/50 overflow-hidden ${
                        role === 'customer'
                          ? 'border-purple-500/40 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent shadow-2xl shadow-purple-500/20'
                          : 'border-white/[0.08] bg-white/[0.02] hover:border-purple-500/30'
                      }`}
                      aria-pressed={role === 'customer'}
                    >
                      {role === 'customer' && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                      )}
                      <div className="relative flex items-start gap-5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                          role === 'customer' 
                            ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30 scale-110' 
                            : 'bg-white/5 group-hover:bg-white/10'
                        }`}>
                          <Check size={24} className={role === 'customer' ? "text-white" : "text-[var(--muted-lead)]"} />
                        </div>
                        <div className="flex-1">
                          <p className="font-heading font-bold text-xl sm:text-2xl text-[var(--chrome-white)] mb-2">Müşteri</p>
                          <p className="font-body text-base sm:text-lg text-[var(--muted-lead)]">
                            Randevu almak ve işletmeleri keşfetmek istiyorum
                          </p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setRole('owner')}
                      className={`relative w-full p-6 sm:p-8 rounded-3xl border-2 transition-all text-left group hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-pink-500/50 overflow-hidden ${
                        role === 'owner'
                          ? 'border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent shadow-2xl shadow-amber-500/20'
                          : 'border-white/[0.08] bg-white/[0.02] hover:border-amber-500/30'
                      }`}
                      aria-pressed={role === 'owner'}
                    >
                      {role === 'owner' && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                      )}
                      <div className="relative flex items-start gap-5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                          role === 'owner' 
                            ? 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30 scale-110' 
                            : 'bg-white/5 group-hover:bg-white/10'
                        }`}>
                          <Check size={24} className={role === 'owner' ? "text-white" : "text-[var(--muted-lead)]"} />
                        </div>
                        <div className="flex-1">
                          <p className="font-heading font-bold text-xl sm:text-2xl text-[var(--chrome-white)] mb-2">İşletme Sahibi</p>
                          <p className="font-body text-base sm:text-lg text-[var(--muted-lead)]">
                            İşletmem var ve rezervasyonları yönetmek istiyorum
                          </p>
                        </div>
                      </div>
                    </button>

                    <ChromaticButton
                      fullWidth
                      onClick={() => setStep(2)}
                      disabled={!role}
                      className="mt-12 h-14 sm:h-16 text-lg"
                    >
                      Devam Et →
                    </ChromaticButton>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-6 max-w-xl mx-auto"
                  >
                    <div className="text-center mb-8">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 mb-4">
                        <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                        <span className="text-sm font-semibold text-purple-300">İletişim Bilgileri</span>
                      </div>
                      <h3 className="font-heading font-bold text-2xl sm:text-3xl text-[var(--chrome-white)] mb-3">
                        Telefon Numarası
                      </h3>
                      <p className="font-body text-base sm:text-lg text-[var(--muted-lead)]">
                        Randevu hatırlatmaları ve bildirimler için telefon numarana ihtiyacımız var
                      </p>
                    </div>
                    
                    <div>
                      <label 
                        htmlFor="phone-input"
                        className="block font-heading font-semibold text-base text-[var(--silver-frost)] mb-3"
                      >
                        Telefon Numarası <span className="text-purple-400">*</span>
                      </label>
                      <input
                        id="phone-input"
                        ref={inputRef}
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="5XX XXX XX XX"
                        maxLength={10}
                        className="w-full h-16 px-6 rounded-2xl bg-white/[0.05] border-2 border-white/[0.08] text-[var(--chrome-white)] placeholder:text-[var(--ash)] font-body text-lg outline-none transition-all focus:border-purple-500/50 focus:bg-white/[0.08] focus:shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                        aria-required="true"
                        aria-invalid={phone.length > 0 && phone.length < 10}
                      />
                      <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                        <p className="font-body text-sm text-[var(--silver-frost)] leading-relaxed">
                          <strong className="text-blue-300">Neden telefon numarası?</strong><br/>
                          Randevu hatırlatmaları ve önemli bildirimler için kullanılacak
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 mt-12">
                      <button
                        onClick={() => setStep(1)}
                        className="flex-1 h-14 rounded-2xl border-2 border-white/[0.08] font-heading font-semibold text-base text-[var(--silver-frost)] hover:border-white/20 hover:bg-white/[0.03] transition-all focus:outline-none focus:ring-4 focus:ring-purple-500/50 active:scale-[0.98]"
                      >
                        ← Geri
                      </button>
                      <ChromaticButton
                        onClick={() => setStep(3)}
                        disabled={!phone || phone.length < 10}
                        className="flex-1 h-14 text-base font-semibold"
                      >
                        Devam Et →
                      </ChromaticButton>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-6 max-w-xl mx-auto"
                  >
                    <div className="text-center mb-8">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 mb-4">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-sm font-semibold text-emerald-300">Son Adım</span>
                      </div>
                      <h3 className="font-heading font-bold text-2xl sm:text-3xl text-[var(--chrome-white)] mb-3">
                        Kullanım Koşulları
                      </h3>
                      <p className="font-body text-base sm:text-lg text-[var(--muted-lead)]">
                        Kullanım koşullarını kabul et ve hesabını oluştur
                      </p>
                    </div>
                    
                    <div className="p-6 rounded-2xl bg-white/[0.03] border-2 border-white/[0.08]">
                      <label className="flex items-start gap-4 cursor-pointer group">
                        <input
                          ref={inputRef}
                          type="checkbox"
                          checked={acceptedTerms}
                          onChange={(e) => setAcceptedTerms(e.target.checked)}
                          className="mt-1.5 w-6 h-6 rounded-lg border-2 border-white/[0.08] bg-transparent checked:bg-purple-500 checked:border-purple-500 cursor-pointer transition-all focus:ring-4 focus:ring-purple-500/50"
                          aria-required="true"
                        />
                        <div className="flex-1">
                          <p className="font-body text-base sm:text-lg text-[var(--chrome-white)] leading-relaxed">
                            <button
                              type="button"
                              onClick={() => setShowTerms(true)}
                              className="text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 rounded"
                            >
                              Kullanım Koşulları
                            </button>
                            {' '}ve{' '}
                            <button
                              type="button"
                              onClick={() => setShowTerms(true)}
                              className="text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 rounded"
                            >
                              Gizlilik Politikası
                            </button>
                            'nı okudum ve kabul ediyorum
                          </p>
                        </div>
                      </label>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 mt-12">
                      <button
                        onClick={() => setStep(2)}
                        className="flex-1 h-14 rounded-2xl border-2 border-white/[0.08] font-heading font-semibold text-base text-[var(--silver-frost)] hover:border-white/20 hover:bg-white/[0.03] transition-all focus:outline-none focus:ring-4 focus:ring-purple-500/50 active:scale-[0.98]"
                      >
                        ← Geri
                      </button>
                      <ChromaticButton
                        onClick={handleComplete}
                        disabled={!acceptedTerms}
                        className="flex-1 h-14 text-base font-semibold"
                      >
                        Hesabı Tamamla
                      </ChromaticButton>
                    </div>
                  </motion.div>
                )}
                
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTerms && (
          <div 
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="terms-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="w-full max-w-2xl bg-[var(--slate-surface)] border border-[var(--obsidian-rim)] rounded-2xl overflow-hidden shadow-2xl"
              style={{ maxHeight: 'calc(100vh - 4rem)' }}
            >
              <div className="sticky top-0 z-10 bg-[var(--slate-surface)] border-b border-[var(--obsidian-rim)] px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 
                    id="terms-title"
                    className="font-display font-bold text-xl text-[var(--chrome-white)]"
                  >
                    Kullanım Koşulları ve Gizlilik Politikası
                  </h3>
                  <button
                    onClick={() => setShowTerms(false)}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                    aria-label="Kapat"
                  >
                    <X size={20} className="text-[var(--muted-lead)]" />
                  </button>
                </div>
              </div>
              
              <div className="overflow-y-auto p-6 space-y-6 font-body text-sm text-[var(--silver-frost)]" style={{ maxHeight: 'calc(100vh - 12rem)' }}>
                <section>
                  <h4 className="font-heading font-semibold text-base text-[var(--chrome-white)] mb-3">
                    1. Hizmet Kullanımı
                  </h4>
                  <p className="text-[var(--muted-lead)] leading-relaxed">
                    Bu platformu kullanarak, randevu alma ve yönetme hizmetlerimizden faydalanabilirsiniz.
                    Hesabınızın güvenliğinden siz sorumlusunuz.
                  </p>
                </section>

                <section>
                  <h4 className="font-heading font-semibold text-base text-[var(--chrome-white)] mb-3">
                    2. Veri Güvenliği
                  </h4>
                  <p className="text-[var(--muted-lead)] leading-relaxed">
                    Kişisel bilgileriniz güvenli bir şekilde saklanır ve üçüncü şahıslarla paylaşılmaz.
                    Telefon numaranız sadece randevu hatırlatmaları için kullanılır.
                  </p>
                </section>

                <section>
                  <h4 className="font-heading font-semibold text-base text-[var(--chrome-white)] mb-3">
                    3. İptal Politikası
                  </h4>
                  <p className="text-[var(--muted-lead)] leading-relaxed">
                    Randevularınızı işletme politikalarına göre iptal edebilirsiniz. Gecikme veya gelmeme
                    durumunda işletme politikaları geçerlidir.
                  </p>
                </section>

                <section>
                  <h4 className="font-heading font-semibold text-base text-[var(--chrome-white)] mb-3">
                    4. Sorumluluk
                  </h4>
                  <p className="text-[var(--muted-lead)] leading-relaxed">
                    Platform, işletmeler ve müşteriler arasında aracılık hizmeti sağlar. Hizmet kalitesinden
                    işletmeler sorumludur.
                  </p>
                </section>
              </div>

              <div className="sticky bottom-0 bg-[var(--slate-surface)] border-t border-[var(--obsidian-rim)] p-6">
                <ChromaticButton
                  fullWidth
                  onClick={() => setShowTerms(false)}
                >
                  Anladım
                </ChromaticButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
