import { useState } from 'react';
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

  const totalSteps = role === 'owner' ? 4 : 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-[var(--slate-surface)] border border-[var(--obsidian-rim)] rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="font-display font-bold text-2xl text-[var(--chrome-white)] mb-2">
            Hoşgeldin, {userName}!
          </h2>
          <p className="font-body text-sm text-[var(--muted-lead)]">
            Hesabını tamamlamak için birkaç bilgiye ihtiyacımız var
          </p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i + 1 <= step ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-[var(--obsidian-rim)]'
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
            <h3 className="font-heading font-bold text-lg text-[var(--chrome-white)] mb-6">
              Nasıl kullanacaksın?
            </h3>
            
            <button
              onClick={() => setRole('customer')}
              className={`w-full p-5 rounded-2xl border-2 transition-all text-left group hover:scale-[1.02] ${
                role === 'customer'
                  ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20'
                  : 'border-[var(--obsidian-rim)] hover:border-white/20'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all ${
                  role === 'customer' 
                    ? 'border-purple-500 bg-purple-500' 
                    : 'border-[var(--obsidian-rim)] group-hover:border-white/30'
                }`}>
                  {role === 'customer' && <Check size={16} className="text-white" />}
                </div>
                <div className="flex-1">
                  <p className="font-heading font-bold text-[var(--chrome-white)] mb-1">👤 Müşteri</p>
                  <p className="font-body text-sm text-[var(--muted-lead)]">
                    Randevu almak ve işletmeleri keşfetmek istiyorum
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setRole('owner')}
              className={`w-full p-5 rounded-2xl border-2 transition-all text-left group hover:scale-[1.02] ${
                role === 'owner'
                  ? 'border-pink-500 bg-pink-500/10 shadow-lg shadow-pink-500/20'
                  : 'border-[var(--obsidian-rim)] hover:border-white/20'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all ${
                  role === 'owner' 
                    ? 'border-pink-500 bg-pink-500' 
                    : 'border-[var(--obsidian-rim)] group-hover:border-white/30'
                }`}>
                  {role === 'owner' && <Check size={16} className="text-white" />}
                </div>
                <div className="flex-1">
                  <p className="font-heading font-bold text-[var(--chrome-white)] mb-1">🏢 İşletme Sahibi</p>
                  <p className="font-body text-sm text-[var(--muted-lead)]">
                    İşletmem var ve rezervasyonları yönetmek istiyorum
                  </p>
                </div>
              </div>
            </button>

            <ChromaticButton
              fullWidth
              onClick={() => setStep(2)}
              disabled={!role}
              className="mt-8"
            >
              Devam Et
            </ChromaticButton>
          </motion.div>
        )}

        {/* Step 2: Business Category (Only for owners) */}
        {step === 2 && role === 'owner' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h3 className="font-heading font-bold text-lg text-[var(--chrome-white)] mb-2">
              İşletme Kategorin Nedir?
            </h3>
            <p className="font-body text-sm text-[var(--muted-lead)] mb-6">
              Kategorine göre özel yönetim paneli ve rezervasyon sistemi hazırlayacağız
            </p>
            
            <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
              {categoryGroups.map((group) => {
                const Icon = group.icon;
                const isSelected = businessCategory && group.categories.includes(businessCategory);
                
                return (
                  <button
                    key={group.id}
                    onClick={() => setBusinessCategory(group.categories[0])}
                    className={`p-4 rounded-xl border-2 transition-all text-left group hover:scale-[1.02] ${
                      isSelected
                        ? 'border-purple-500 bg-purple-500/10 shadow-lg'
                        : 'border-[var(--obsidian-rim)] hover:border-white/20'
                    }`}
                  >
                    <div className="flex flex-col gap-2">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                        isSelected 
                          ? `bg-gradient-to-br ${group.color}` 
                          : 'bg-white/5 group-hover:bg-white/10'
                      }`}>
                        <Icon size={20} className={isSelected ? "text-white" : "text-[var(--muted-lead)]"} />
                      </div>
                      <div>
                        <p className="font-heading font-semibold text-sm text-[var(--chrome-white)]">
                          {group.name}
                        </p>
                        <p className="font-body text-xs text-[var(--muted-lead)] mt-0.5 line-clamp-2">
                          {group.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(1)}
                className="flex-1 h-12 rounded-xl border border-[var(--obsidian-rim)] font-heading font-medium text-[var(--silver-frost)] hover:border-[var(--liquid-chrome)] transition-all"
              >
                Geri
              </button>
              <ChromaticButton
                onClick={() => setStep(3)}
                disabled={!businessCategory}
                className="flex-1"
              >
                Devam Et
              </ChromaticButton>
            </div>
          </motion.div>
        )}

        {/* Step 2/3: Phone Number */}
        {((step === 2 && role === 'customer') || (step === 3 && role === 'owner')) && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h3 className="font-heading font-bold text-lg text-[var(--chrome-white)] mb-6">
              Telefon Numaranı Gir
            </h3>
            
            <div>
              <label className="block font-heading font-medium text-sm text-[var(--silver-frost)] mb-2">
                Telefon Numarası
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="5XX XXX XX XX"
                maxLength={10}
                className="w-full h-14 px-4 rounded-xl bg-[var(--void)] border-2 border-[var(--obsidian-rim)] text-[var(--chrome-white)] placeholder:text-[var(--ash)] font-body text-base outline-none transition-all focus:border-purple-500 focus:shadow-[0_0_0_3px_rgba(168,85,247,0.1)]"
              />
              <p className="font-body text-xs text-[var(--muted-lead)] mt-2">
                📱 Randevu hatırlatmaları ve bildirimler için kullanılacak
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(role === 'owner' ? 2 : 1)}
                className="flex-1 h-12 rounded-xl border border-[var(--obsidian-rim)] font-heading font-medium text-[var(--silver-frost)] hover:border-[var(--liquid-chrome)] transition-all"
              >
                Geri
              </button>
              <ChromaticButton
                onClick={() => setStep(role === 'owner' ? 4 : 3)}
                disabled={!phone || phone.length < 10}
                className="flex-1"
              >
                Devam Et
              </ChromaticButton>
            </div>
          </motion.div>
        )}

        {/* Step 3/4: Terms & Conditions */}
        {((step === 3 && role === 'customer') || (step === 4 && role === 'owner')) && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h3 className="font-heading font-bold text-lg text-[var(--chrome-white)] mb-6">
              Son Adım! 🎉
            </h3>
            
            <div className="p-5 rounded-xl bg-[var(--void)] border-2 border-[var(--obsidian-rim)]">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-2 border-[var(--obsidian-rim)] bg-transparent checked:bg-purple-500 checked:border-purple-500 cursor-pointer transition-all"
                />
                <div className="flex-1">
                  <p className="font-body text-sm text-[var(--chrome-white)] leading-relaxed">
                    <button
                      onClick={() => setShowTerms(true)}
                      className="text-purple-400 hover:text-purple-300 underline transition-colors"
                    >
                      Kullanım Koşulları
                    </button>
                    {' '}ve{' '}
                    <button
                      onClick={() => setShowTerms(true)}
                      className="text-purple-400 hover:text-purple-300 underline transition-colors"
                    >
                      Gizlilik Politikası
                    </button>
                    'nı okudum ve kabul ediyorum
                  </p>
                </div>
              </label>
            </div>

            {role === 'owner' && businessCategory && (
              <div className="p-5 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30">
                <p className="font-body text-sm text-[var(--chrome-white)]">
                  ✨ <span className="font-semibold">
                    {categoryGroups.find(g => g.categories.includes(businessCategory))?.name}
                  </span> kategorisi için özel yönetim paneli hazırlanacak
                </p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(role === 'owner' ? 3 : 2)}
                className="flex-1 h-12 rounded-xl border border-[var(--obsidian-rim)] font-heading font-medium text-[var(--silver-frost)] hover:border-[var(--liquid-chrome)] transition-all"
              >
                Geri
              </button>
              <ChromaticButton
                onClick={handleComplete}
                disabled={!acceptedTerms}
                className="flex-1"
              >
                Hesabı Tamamla
              </ChromaticButton>
            </div>
          </motion.div>
        )}

        {/* Terms Modal */}
        <AnimatePresence>
          {showTerms && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-2xl bg-[var(--slate-surface)] border border-[var(--obsidian-rim)] rounded-2xl p-6 max-h-[80vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-display font-bold text-xl text-[var(--chrome-white)]">
                    Kullanım Koşulları ve Gizlilik Politikası
                  </h3>
                  <button
                    onClick={() => setShowTerms(false)}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors"
                  >
                    <X size={20} className="text-[var(--muted-lead)]" />
                  </button>
                </div>
                
                <div className="space-y-6 font-body text-sm text-[var(--silver-frost)]">
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

                <ChromaticButton
                  fullWidth
                  onClick={() => setShowTerms(false)}
                  className="mt-6"
                >
                  Anladım
                </ChromaticButton>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
