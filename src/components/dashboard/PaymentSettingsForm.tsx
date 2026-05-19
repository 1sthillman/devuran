import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Save, CreditCard, Building2 } from 'lucide-react';
import { ChromaticButton } from '@/components/ui/ChromaticButton';

interface BankAccount {
  bankName: string;
  accountHolder: string;
  iban: string;
  accountNumber?: string;
  branch?: string;
}

interface PaymentSettings {
  bankTransferEnabled: boolean;
  bankAccounts?: BankAccount[];
  paymentInstructions?: string;
}

interface PaymentSettingsFormProps {
  settings: PaymentSettings;
  onSave: (settings: PaymentSettings) => Promise<void>;
}

export function PaymentSettingsForm({ settings, onSave }: PaymentSettingsFormProps) {
  const [enabled, setEnabled] = useState(settings.bankTransferEnabled || false);
  const [accounts, setAccounts] = useState<BankAccount[]>(settings.bankAccounts || []);
  const [instructions, setInstructions] = useState(settings.paymentInstructions || '');
  const [isSaving, setIsSaving] = useState(false);

  const addAccount = () => {
    setAccounts([
      ...accounts,
      {
        bankName: '',
        accountHolder: '',
        iban: '',
        accountNumber: '',
        branch: '',
      },
    ]);
  };

  const removeAccount = (index: number) => {
    setAccounts(accounts.filter((_, i) => i !== index));
  };

  const updateAccount = (index: number, field: keyof BankAccount, value: string) => {
    const updated = [...accounts];
    updated[index] = { ...updated[index], [field]: value };
    setAccounts(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        bankTransferEnabled: enabled,
        bankAccounts: accounts.filter(acc => acc.bankName && acc.iban),
        paymentInstructions: instructions,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Enable/Disable Toggle */}
      <div className="obsidian-card p-6 rounded-3xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
              <CreditCard size={24} className="text-green-400" strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-[var(--chrome-white)]">
                Havale/EFT ile Ödeme
              </h3>
              <p className="font-body text-sm text-[var(--muted-lead)] mt-1">
                Müşterileriniz banka havalesi ile ödeme yapabilsin
              </p>
            </div>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            className={`w-14 h-7 rounded-full relative transition-colors ${
              enabled ? 'bg-[var(--success)]' : 'bg-[var(--slate-elevated)]'
            }`}
          >
            <div
              className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                enabled ? 'translate-x-7' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      {enabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-6"
        >
          {/* Bank Accounts */}
          <div className="obsidian-card p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Building2 size={20} className="text-[var(--liquid-chrome)]" />
                <h4 className="font-heading font-semibold text-[var(--chrome-white)]">
                  Banka Hesapları
                </h4>
              </div>
              <button
                onClick={addAccount}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <Plus size={16} className="text-[var(--liquid-chrome)]" />
                <span className="font-heading text-sm text-[var(--chrome-white)]">
                  Hesap Ekle
                </span>
              </button>
            </div>

            {accounts.length === 0 ? (
              <div className="text-center py-8">
                <p className="font-body text-[var(--muted-lead)] mb-4">
                  Henüz banka hesabı eklenmedi
                </p>
                <button
                  onClick={addAccount}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--liquid-chrome)]/10 hover:bg-[var(--liquid-chrome)]/20 transition-colors"
                >
                  <Plus size={18} className="text-[var(--liquid-chrome)]" />
                  <span className="font-heading font-semibold text-[var(--liquid-chrome)]">
                    İlk Hesabı Ekle
                  </span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {accounts.map((account, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-white/[0.02] border border-[var(--obsidian-rim)] space-y-3"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-heading font-semibold text-sm text-[var(--silver-frost)]">
                        Hesap #{index + 1}
                      </span>
                      <button
                        onClick={() => removeAccount(index)}
                        className="p-2 rounded-full hover:bg-red-500/10 transition-colors group"
                      >
                        <Trash2 size={16} className="text-[var(--muted-lead)] group-hover:text-red-400" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-body text-xs text-[var(--muted-lead)] mb-1">
                          Banka Adı *
                        </label>
                        <input
                          type="text"
                          value={account.bankName}
                          onChange={(e) => updateAccount(index, 'bankName', e.target.value)}
                          placeholder="Örn: Ziraat Bankası"
                          className="w-full px-4 py-2 rounded-xl bg-[var(--slate-elevated)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-body text-sm focus:outline-none focus:border-[var(--liquid-chrome)]"
                        />
                      </div>

                      <div>
                        <label className="block font-body text-xs text-[var(--muted-lead)] mb-1">
                          Hesap Sahibi *
                        </label>
                        <input
                          type="text"
                          value={account.accountHolder}
                          onChange={(e) => updateAccount(index, 'accountHolder', e.target.value)}
                          placeholder="Örn: AHMET YILMAZ"
                          className="w-full px-4 py-2 rounded-xl bg-[var(--slate-elevated)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-body text-sm focus:outline-none focus:border-[var(--liquid-chrome)]"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block font-body text-xs text-[var(--muted-lead)] mb-1">
                          IBAN *
                        </label>
                        <input
                          type="text"
                          value={account.iban}
                          onChange={(e) => updateAccount(index, 'iban', e.target.value.toUpperCase())}
                          placeholder="TR00 0000 0000 0000 0000 0000 00"
                          maxLength={32}
                          className="w-full px-4 py-2 rounded-xl bg-[var(--slate-elevated)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-mono text-sm focus:outline-none focus:border-[var(--liquid-chrome)]"
                        />
                      </div>

                      <div>
                        <label className="block font-body text-xs text-[var(--muted-lead)] mb-1">
                          Hesap No (Opsiyonel)
                        </label>
                        <input
                          type="text"
                          value={account.accountNumber || ''}
                          onChange={(e) => updateAccount(index, 'accountNumber', e.target.value)}
                          placeholder="Örn: 12345678"
                          className="w-full px-4 py-2 rounded-xl bg-[var(--slate-elevated)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-body text-sm focus:outline-none focus:border-[var(--liquid-chrome)]"
                        />
                      </div>

                      <div>
                        <label className="block font-body text-xs text-[var(--muted-lead)] mb-1">
                          Şube (Opsiyonel)
                        </label>
                        <input
                          type="text"
                          value={account.branch || ''}
                          onChange={(e) => updateAccount(index, 'branch', e.target.value)}
                          placeholder="Örn: Kadıköy Şubesi"
                          className="w-full px-4 py-2 rounded-xl bg-[var(--slate-elevated)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-body text-sm focus:outline-none focus:border-[var(--liquid-chrome)]"
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Instructions */}
          <div className="obsidian-card p-6 rounded-3xl">
            <h4 className="font-heading font-semibold text-[var(--chrome-white)] mb-3">
              Ödeme Talimatları
            </h4>
            <p className="font-body text-sm text-[var(--muted-lead)] mb-4">
              Müşterilerinize gösterilecek ödeme talimatları (opsiyonel)
            </p>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Örn: Havale yaparken açıklama kısmına randevu numaranızı yazınız..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-[var(--slate-elevated)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-body text-sm focus:outline-none focus:border-[var(--liquid-chrome)] resize-none"
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <ChromaticButton
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Kaydediliyor...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>Kaydet</span>
                </>
              )}
            </ChromaticButton>
          </div>
        </motion.div>
      )}

      {!enabled && (
        <div className="obsidian-card p-6 rounded-3xl text-center">
          <p className="font-body text-[var(--muted-lead)]">
            Havale/EFT ödemesini aktifleştirmek için yukarıdaki düğmeyi açın
          </p>
        </div>
      )}
    </div>
  );
}
