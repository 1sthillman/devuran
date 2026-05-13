import { useState } from 'react';
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

  const handleComplete = () => {
    if (phone && role && acceptedTerms) {
      onComplete({ phone, role, acceptedTerms });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[var(--slate-surface)] border border-[var(--obsidian-rim)] rounded-3xl p-6 shadow-2xl"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="font-display font-bold text-xl text-[var(--chrome-white)] mb-2">
            Hosgeldin, {userName}!
          </h2>
          <p className="font-body text-sm text-[var(--muted-lead)]">
            Hesabini tamamlamak icin birka bilgiye ihtiyacimiz var
          </p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-[var(--liquid-chrome)]' : 'bg-[var(--obsidian-rim)]'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Role Selection */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h3 className="font-heading font-semibold text-[var(--silver-frost)] mb-4">
              Nasil kullanacaksin?
            </h3>
            
            <button
              onClick={() => setRole('customer')}
              className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                role === 'customer'
                  ? 'border-[var(--liquid-chrome)] bg-white/5'
                  : 'border-[var(--obsidian-rim)] hover:border-[var(--silver-frost)]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                  role === 'customer' ? 'border-[var(--liquid-chrome)] bg-[var(--liquid-chrome)]' : 'border-[var(--obsidian-rim)]'
                }`}>
                  {role === 'customer' && <Check size={14} className="text-[var(--void)]" />}
                </div>
                <div>
                  <p className="font-heading font-semibold text-[var(--chrome-white)]">Musteri</p>
                  <p className="font-body text-sm text-[var(--muted-lead)] mt-1">
                    Randevu almak ve salonlari kesfetmek istiyorum
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setRole('owner')}
              className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                role === 'owner'
                  ? 'border-[var(--liquid-chrome)] bg-white/5'
                  : 'border-[var(--obsidian-rim)] hover:border-[var(--silver-frost)]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                  role === 'owner' ? 'border-[var(--liquid-chrome)] bg-[var(--liquid-chrome)]' : 'border-[var(--obsidian-rim)]'
                }`}>
                  {role === 'owner' && <Check size={14} className="text-[var(--void)]" />}
                </div>
                <div>
                  <p className="font-heading font-semibold text-[var(--chrome-white)]">Isletme Sahibi</p>
                  <p className="font-body text-sm text-[var(--muted-lead)] mt-1">
                    Salonum var ve randevulari yonetmek istiyorum
                  </p>
                </div>
              </div>
            </button>

            <ChromaticButton
              fullWidth
              onClick={() => setStep(2)}
              disabled={!role}
              className="mt-6"
            >
              Devam Et
            </ChromaticButton>
          </motion.div>
        )}

        {/* Step 2: Phone Number */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h3 className="font-heading font-semibold text-[var(--silver-frost)] mb-4">
              Telefon numarani gir
            </h3>
            
            <div>
              <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-2">
                Telefon Numarasi
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="5XX XXX XX XX"
                className="w-full h-[52px] px-4 rounded-2xl bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] placeholder:text-[var(--ash)] font-body text-[15px] outline-none transition-all focus:border-[var(--liquid-chrome)] focus:shadow-[0_0_0_3px_rgba(255,255,255,0.06)]"
              />
              <p className="font-body text-xs text-[var(--muted-lead)] mt-2">
                Randevu hatirlatmalari icin kullanilacak
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 h-[52px] rounded-2xl border border-[var(--obsidian-rim)] font-heading font-medium text-[var(--silver-frost)] hover:border-[var(--liquid-chrome)] transition-all"
              >
                Geri
              </button>
              <ChromaticButton
                onClick={() => setStep(3)}
                disabled={!phone || phone.length < 10}
                className="flex-1"
              >
                Devam Et
              </ChromaticButton>
            </div>
          </motion.div>
        )}

        {/* Step 3: Terms & Conditions */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h3 className="font-heading font-semibold text-[var(--silver-frost)] mb-4">
              Son adim!
            </h3>
            
            <div className="p-4 rounded-2xl bg-[var(--void)] border border-[var(--obsidian-rim)]">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-2 border-[var(--obsidian-rim)] bg-transparent checked:bg-[var(--liquid-chrome)] checked:border-[var(--liquid-chrome)] cursor-pointer"
                />
                <div className="flex-1">
                  <p className="font-body text-sm text-[var(--chrome-white)]">
                    <button
                      onClick={() => setShowTerms(true)}
                      className="text-[var(--liquid-chrome)] hover:underline"
                    >
                      Kullanim Kosullari
                    </button>
                    {' '}ve{' '}
                    <button
                      onClick={() => setShowTerms(true)}
                      className="text-[var(--liquid-chrome)] hover:underline"
                    >
                      Gizlilik Politikasi
                    </button>
                    'ni okudum ve kabul ediyorum
                  </p>
                </div>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 h-[52px] rounded-2xl border border-[var(--obsidian-rim)] font-heading font-medium text-[var(--silver-frost)] hover:border-[var(--liquid-chrome)] transition-all"
              >
                Geri
              </button>
              <ChromaticButton
                onClick={handleComplete}
                disabled={!acceptedTerms}
                className="flex-1"
              >
                Tamamla
              </ChromaticButton>
            </div>
          </motion.div>
        )}

        {/* Terms Modal */}
        <AnimatePresence>
          {showTerms && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-2xl bg-[var(--slate-surface)] border border-[var(--obsidian-rim)] rounded-3xl p-6 max-h-[80vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-bold text-xl text-[var(--chrome-white)]">
                    Kullanim Kosullari ve Gizlilik Politikasi
                  </h3>
                  <button
                    onClick={() => setShowTerms(false)}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors"
                  >
                    <X size={20} className="text-[var(--muted-lead)]" />
                  </button>
                </div>
                
                <div className="space-y-4 font-body text-sm text-[var(--silver-frost)]">
                  <section>
                    <h4 className="font-heading font-semibold text-[var(--chrome-white)] mb-2">
                      1. Hizmet Kullanimi
                    </h4>
                    <p className="text-[var(--muted-lead)]">
                      Bu platformu kullanarak, randevu alma ve yonetme hizmetlerimizden faydalanabilirsiniz.
                      Hesabinizin guvenliginden siz sorumlusunuz.
                    </p>
                  </section>

                  <section>
                    <h4 className="font-heading font-semibold text-[var(--chrome-white)] mb-2">
                      2. Veri Guvenligi
                    </h4>
                    <p className="text-[var(--muted-lead)]">
                      Kisisel bilgileriniz guvenli bir sekilde saklanir ve ucuncu sahislarla paylasilmaz.
                      Telefon numaraniz sadece randevu hatirlatmalari icin kullanilir.
                    </p>
                  </section>

                  <section>
                    <h4 className="font-heading font-semibold text-[var(--chrome-white)] mb-2">
                      3. Iptal Politikasi
                    </h4>
                    <p className="text-[var(--muted-lead)]">
                      Randevularinizi en az 24 saat onceden iptal edebilirsiniz. Gecikme veya gelmeme
                      durumunda salon politikalari gecerlidir.
                    </p>
                  </section>

                  <section>
                    <h4 className="font-heading font-semibold text-[var(--chrome-white)] mb-2">
                      4. Sorumluluk
                    </h4>
                    <p className="text-[var(--muted-lead)]">
                      Platform, salonlar ve musteriler arasinda aracilik hizmeti saglar. Hizmet kalitesinden
                      salonlar sorumludur.
                    </p>
                  </section>
                </div>

                <ChromaticButton
                  fullWidth
                  onClick={() => setShowTerms(false)}
                  className="mt-6"
                >
                  Anladim
                </ChromaticButton>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
