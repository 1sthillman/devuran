import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { ChromaticButton } from '@/components/ui/ChromaticButton';
import { categoryGroups, type CategoryId } from '@/config/categories';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (data: {
    phone: string;
    role: 'customer' | 'owner';
    businessCategory?: CategoryId;
    acceptedTerms: boolean;
  }) => void;
  userName: string;
}

export function OnboardingModal({ isOpen, onComplete, userName }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'customer' | 'owner' | null>(null);
  const [businessCategory, setBusinessCategory] = useState<CategoryId | null>(null);
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

  const totalSteps = role === 'owner' ? 4 : 3;

  const handleComplete = () => {
    if (phone && role && acceptedTerms) {
      onComplete({ 
        phone, 
        role, 
        businessCategory: businessCategory || undefined,
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
                        className="font-display font-bold text-3xl sm:text-4xl md:text-5xl text-[var(--chrome-white)] mb-3"
                      >
                        Hoşgeldin, {userName}! 👋
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
                      className={`w-full p-6 sm:p-8 rounded-3xl border-2 transition-all text-left group hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-purple-500/50 ${
                        role === 'customer'
                          ? 'border-purple-500 bg-purple-500/10 shadow-2xl shadow-purple-500/30'
                          : 'border-[var(--obsidian-rim)] hover:border-purple-500/50 hover:bg-white/5'
                      }`}
                      aria-pressed={role === 'customer'}
                    >
                      <div className="flex items-start gap-5">
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center mt-1 transition-all ${
                          role === 'customer' 
                            ? 'border-purple-500 bg-purple-500 scale-110' 
                            : 'border-[var(--obsidian-rim)] group-hover:border-purple-500/50'
                        }`}>
                          {role === 'customer' && <Check size={20} className="text-white" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-heading font-bold text-xl sm:text-2xl text-[var(--chrome-white)] mb-2">👤 Müşteri</p>
                          <p className="font-body text-base sm:text-lg text-[var(--muted-lead)]">
                            Randevu almak ve işletmeleri keşfetmek istiyorum
                          </p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setRole('owner')}
                      className={`w-full p-6 sm:p-8 rounded-3xl border-2 transition-all text-left group hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-pink-500/50 ${
                        role === 'owner'
                          ? 'border-pink-500 bg-pink-500/10 shadow-2xl shadow-pink-500/30'
                          : 'border-[var(--obsidian-rim)] hover:border-pink-500/50 hover:bg-white/5'
                      }`}
                      aria-pressed={role === 'owner'}
                    >
                      <div className="flex items-start gap-5">
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center mt-1 transition-all ${
                          role === 'owner' 
                            ? 'border-pink-500 bg-pink-500 scale-110' 
                            : 'border-[var(--obsidian-rim)] group-hover:border-pink-500/50'
                        }`}>
                          {role === 'owner' && <Check size={20} className="text-white" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-heading font-bold text-xl sm:text-2xl text-[var(--chrome-white)] mb-2">🏢 İşletme Sahibi</p>
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

                {step === 2 && role === 'owner' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-6 max-w-4xl mx-auto"
                  >
                    <div className="text-center mb-8">
                      <h3 className="font-heading font-bold text-2xl sm:text-3xl text-[var(--chrome-white)] mb-3">
                        İşletme Kategorin Nedir?
                      </h3>
                      <p className="font-body text-base sm:text-lg text-[var(--muted-lead)]">
                        Kategorine göre özel yönetim paneli ve rezervasyon sistemi hazırlayacağız
                      </p>
                    </div>
                    
                    <input
                      type="text"
                      placeholder="Kategori ara..."
                      className="w-full h-14 px-5 rounded-2xl bg-[var(--slate-surface)] border-2 border-[var(--obsidian-rim)] text-[var(--chrome-white)] placeholder:text-[var(--ash)] font-body text-base outline-none transition-all focus:border-purple-500 focus:shadow-[0_0_0_3px_rgba(168,85,247,0.1)] mb-6"
                    />
                    
                    <div 
                      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
                      role="radiogroup"
                      aria-label="İşletme kategorisi seçimi"
                    >
                      {categoryGroups.map((group, index) => {
                        const Icon = group.icon;
                        const isSelected = businessCategory && group.categories.includes(businessCategory);
                        
                        return (
                          <motion.button
                            key={group.id}
                            ref={index === 0 ? firstFocusableRef : undefined}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => setBusinessCategory(group.categories[0])}
                            className={`p-5 sm:p-6 rounded-2xl border-2 transition-all text-center group hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-purple-500/50 ${
                              isSelected
                                ? 'border-purple-500 bg-purple-500/10 shadow-2xl shadow-purple-500/30'
                                : 'border-[var(--obsidian-rim)] hover:border-purple-500/50 hover:bg-white/5'
                            }`}
                            role="radio"
                            aria-checked={isSelected}
                          >
                            <div className="flex flex-col items-center gap-3">
                              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all ${
                                isSelected 
                                  ? `bg-gradient-to-br ${group.color} scale-110` 
                                  : 'bg-white/5 group-hover:bg-white/10'
                              }`}>
                                <Icon size={28} className={isSelected ? "text-white" : "text-[var(--muted-lead)]"} />
                              </div>
                              <div>
                                <p className="font-heading font-semibold text-base text-[var(--chrome-white)]">
                                  {group.name}
                                </p>
                                <p className="font-body text-xs text-[var(--muted-lead)] mt-1 line-clamp-2">
                                  {group.description}
                                </p>
                              </div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 mt-12 max-w-2xl mx-auto">
                      <button
                        onClick={() => setStep(1)}
                        className="flex-1 h-14 rounded-2xl border-2 border-[var(--obsidian-rim)] font-heading font-medium text-lg text-[var(--silver-frost)] hover:border-[var(--liquid-chrome)] transition-all focus:outline-none focus:ring-4 focus:ring-purple-500/50"
                      >
                        ← Geri
                      </button>
                      <ChromaticButton
                        onClick={() => setStep(3)}
                        disabled={!businessCategory}
                        className="flex-1 h-14 text-lg"
                      >
                        Devam Et →
                      </ChromaticButton>
                    </div>
                  </motion.div>
                )}

                {((step === 2 && role === 'customer') || (step === 3 && role === 'owner')) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-6 max-w-xl mx-auto"
                  >
                    <div className="text-center mb-8">
                      <h3 className="font-heading font-bold text-2xl sm:text-3xl text-[var(--chrome-white)] mb-3">
                        📱 İletişim Bilgilerin
                      </h3>
                      <p className="font-body text-base sm:text-lg text-[var(--muted-lead)]">
                        Randevu hatırlatmaları ve bildirimler için telefon numarana ihtiyacımız var
                      </p>
                    </div>
                    
                    <div>
                      <label 
                        htmlFor="phone-input"
                        className="block font-heading font-semibold text-lg text-[var(--silver-frost)] mb-3"
                      >
                        Telefon Numarası *
                      </label>
                      <input
                        id="phone-input"
                        ref={inputRef}
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="5XX XXX XX XX"
                        maxLength={10}
                        className="w-full h-16 px-6 rounded-2xl bg-[var(--slate-surface)] border-2 border-[var(--obsidian-rim)] text-[var(--chrome-white)] placeholder:text-[var(--ash)] font-body text-lg outline-none transition-all focus:border-purple-500 focus:shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                        aria-required="true"
                        aria-invalid={phone.length > 0 && phone.length < 10}
                      />
                      <div className="mt-4 p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
                        <p className="font-body text-sm text-[var(--silver-frost)]">
                          💡 <strong>Neden telefon numarası?</strong><br/>
                          Randevu hatırlatmaları ve önemli bildirimler için kullanılacak
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 mt-12">
                      <button
                        onClick={() => setStep(role === 'owner' ? 2 : 1)}
                        className="flex-1 h-14 rounded-2xl border-2 border-[var(--obsidian-rim)] font-heading font-medium text-lg text-[var(--silver-frost)] hover:border-[var(--liquid-chrome)] transition-all focus:outline-none focus:ring-4 focus:ring-purple-500/50"
                      >
                        ← Geri
                      </button>
                      <ChromaticButton
                        onClick={() => setStep(role === 'owner' ? 4 : 3)}
                        disabled={!phone || phone.length < 10}
                        className="flex-1 h-14 text-lg"
                      >
                        Devam Et →
                      </ChromaticButton>
                    </div>
                  </motion.div>
                )}

                {((step === 3 && role === 'customer') || (step === 4 && role === 'owner')) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-6 max-w-xl mx-auto"
                  >
                    <div className="text-center mb-8">
                      <h3 className="font-heading font-bold text-2xl sm:text-3xl text-[var(--chrome-white)] mb-3">
                        Son Adım! 🎉
                      </h3>
                      <p className="font-body text-base sm:text-lg text-[var(--muted-lead)]">
                        Kullanım koşullarını kabul et ve hesabını oluştur
                      </p>
                    </div>
                    
                    <div className="p-6 rounded-2xl bg-[var(--slate-surface)] border-2 border-[var(--obsidian-rim)]">
                      <label className="flex items-start gap-4 cursor-pointer group">
                        <input
                          ref={inputRef}
                          type="checkbox"
                          checked={acceptedTerms}
                          onChange={(e) => setAcceptedTerms(e.target.checked)}
                          className="mt-1.5 w-6 h-6 rounded-lg border-2 border-[var(--obsidian-rim)] bg-transparent checked:bg-purple-500 checked:border-purple-500 cursor-pointer transition-all focus:ring-4 focus:ring-purple-500/50"
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

                    {role === 'owner' && businessCategory && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30"
                      >
                        <p className="font-body text-base sm:text-lg text-[var(--chrome-white)] text-center">
                          ✨ <span className="font-bold">
                            {categoryGroups.find(g => g.categories.includes(businessCategory))?.name}
                          </span> kategorisi için özel yönetim paneli hazırlanacak
                        </p>
                      </motion.div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4 mt-12">
                      <button
                        onClick={() => setStep(role === 'owner' ? 3 : 2)}
                        className="flex-1 h-14 rounded-2xl border-2 border-[var(--obsidian-rim)] font-heading font-medium text-lg text-[var(--silver-frost)] hover:border-[var(--liquid-chrome)] transition-all focus:outline-none focus:ring-4 focus:ring-purple-500/50"
                      >
                        ← Geri
                      </button>
                      <ChromaticButton
                        onClick={handleComplete}
                        disabled={!acceptedTerms}
                        className="flex-1 h-14 text-lg"
                      >
                        🎊 Hesabı Tamamla
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
