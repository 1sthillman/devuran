import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Save, CreditCard, Building2, TrendingUp, Percent, DollarSign } from 'lucide-react';
import { ChromaticButton } from '@/components/ui/ChromaticButton';

interface BankAccount {
  bankName: string;
  accountHolder: string;
  iban: string;
  accountNumber?: string;
  branch?: string;
}

interface DepositSettings {
  enabled: boolean;
  type: 'percentage' | 'fixed';
  amount: number;
  minimumReservationAmount?: number;
  paymentDeadlineHours: number;
  autoConfirmOnPayment: boolean;
  requireProof: boolean;
}

interface PaymentSettings {
  bankTransferEnabled: boolean;
  bankAccounts?: BankAccount[];
  paymentInstructions?: string;
  depositSettings?: DepositSettings;
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

  // Deposit settings state
  const [depositEnabled, setDepositEnabled] = useState(settings.depositSettings?.enabled || false);
  const [depositType, setDepositType] = useState<'percentage' | 'fixed'>(settings.depositSettings?.type || 'percentage');
  const [depositAmount, setDepositAmount] = useState(settings.depositSettings?.amount || 30);
  const [minReservationAmount, setMinReservationAmount] = useState(settings.depositSettings?.minimumReservationAmount || 0);
  const [paymentDeadlineHours, setPaymentDeadlineHours] = useState(settings.depositSettings?.paymentDeadlineHours || 48);
  const [autoConfirm, setAutoConfirm] = useState(settings.depositSettings?.autoConfirmOnPayment || false);
  const [requireProof, setRequireProof] = useState(settings.depositSettings?.requireProof || false);

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
        depositSettings: {
          enabled: depositEnabled,
          type: depositType,
          amount: depositAmount,
          minimumReservationAmount: minReservationAmount,
          paymentDeadlineHours: paymentDeadlineHours,
          autoConfirmOnPayment: autoConfirm,
          requireProof: requireProof,
        },
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Enable/Disable Toggle */}
      <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/[0.08]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-500/10 border border-white/[0.08] flex items-center justify-center">
              <CreditCard size={18} className="text-slate-400" strokeWidth={2} />
            </div>
            <div>
              <h4 className="font-heading font-semibold text-sm text-[var(--chrome-white)]">
                Havale/EFT ile Ödeme
              </h4>
              <p className="font-body text-xs text-[var(--muted-lead)] mt-0.5">
                Banka havalesi aktif/pasif
              </p>
            </div>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            className={`w-12 h-6 rounded-full relative transition-colors ${
              enabled ? 'bg-[var(--success)]' : 'bg-[var(--slate-elevated)]'
            }`}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 overflow-hidden"
          >
            {/* Bank Accounts */}
            <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/[0.08]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-slate-400" />
                  <h4 className="font-heading font-semibold text-sm text-[var(--chrome-white)]">
                    Banka Hesapları
                  </h4>
                </div>
                <button
                  onClick={addAccount}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <Plus size={14} className="text-[var(--liquid-chrome)]" />
                  <span className="font-heading text-xs text-[var(--chrome-white)]">
                    Ekle
                  </span>
                </button>
              </div>

              {accounts.length === 0 ? (
                <div className="text-center py-6">
                  <p className="font-body text-xs text-[var(--muted-lead)] mb-3">
                    Henüz banka hesabı eklenmedi
                  </p>
                  <button
                    onClick={addAccount}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[var(--liquid-chrome)]/10 hover:bg-[var(--liquid-chrome)]/20 transition-colors"
                  >
                    <Plus size={16} className="text-[var(--liquid-chrome)]" />
                    <span className="font-heading text-xs font-semibold text-[var(--liquid-chrome)]">
                      İlk Hesabı Ekle
                    </span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {accounts.map((account, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-3xl bg-white/[0.02] border border-white/[0.05] space-y-2"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-heading font-semibold text-xs text-[var(--silver-frost)]">
                          Hesap #{index + 1}
                        </span>
                        <button
                          onClick={() => removeAccount(index)}
                          className="p-1.5 rounded-full hover:bg-red-500/10 transition-colors group"
                        >
                          <Trash2 size={14} className="text-[var(--muted-lead)] group-hover:text-red-400" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-body text-[10px] uppercase tracking-wider text-[var(--muted-lead)] mb-1">
                            Banka Adı
                          </label>
                          <input
                            type="text"
                            value={account.bankName}
                            onChange={(e) => updateAccount(index, 'bankName', e.target.value)}
                            placeholder="Ziraat Bankası"
                            className="w-full h-9 px-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-[var(--chrome-white)] font-body text-xs focus:outline-none focus:border-[var(--liquid-chrome)]"
                          />
                        </div>

                        <div>
                          <label className="block font-body text-[10px] uppercase tracking-wider text-[var(--muted-lead)] mb-1">
                            Hesap Sahibi
                          </label>
                          <input
                            type="text"
                            value={account.accountHolder}
                            onChange={(e) => updateAccount(index, 'accountHolder', e.target.value)}
                            placeholder="AHMET YILMAZ"
                            className="w-full h-9 px-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-[var(--chrome-white)] font-body text-xs focus:outline-none focus:border-[var(--liquid-chrome)]"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block font-body text-[10px] uppercase tracking-wider text-[var(--muted-lead)] mb-1">
                            IBAN
                          </label>
                          <input
                            type="text"
                            value={account.iban}
                            onChange={(e) => updateAccount(index, 'iban', e.target.value.toUpperCase())}
                            placeholder="TR00 0000 0000 0000 0000 0000 00"
                            maxLength={32}
                            className="w-full h-9 px-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-[var(--chrome-white)] font-mono text-xs focus:outline-none focus:border-[var(--liquid-chrome)]"
                          />
                        </div>

                        <div>
                          <label className="block font-body text-[10px] uppercase tracking-wider text-[var(--muted-lead)] mb-1">
                            Hesap No
                          </label>
                          <input
                            type="text"
                            value={account.accountNumber || ''}
                            onChange={(e) => updateAccount(index, 'accountNumber', e.target.value)}
                            placeholder="12345678"
                            className="w-full h-9 px-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-[var(--chrome-white)] font-body text-xs focus:outline-none focus:border-[var(--liquid-chrome)]"
                          />
                        </div>

                        <div>
                          <label className="block font-body text-[10px] uppercase tracking-wider text-[var(--muted-lead)] mb-1">
                            Şube
                          </label>
                          <input
                            type="text"
                            value={account.branch || ''}
                            onChange={(e) => updateAccount(index, 'branch', e.target.value)}
                            placeholder="Kadıköy"
                            className="w-full h-9 px-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-[var(--chrome-white)] font-body text-xs focus:outline-none focus:border-[var(--liquid-chrome)]"
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Deposit Settings */}
            <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/[0.08]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <DollarSign size={16} className="text-slate-400" />
                  <div>
                    <h4 className="font-heading font-semibold text-sm text-[var(--chrome-white)]">
                      Kapora Sistemi
                    </h4>
                    <p className="font-body text-[10px] text-[var(--muted-lead)] mt-0.5">
                      Rezervasyon kaparo ayarları
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDepositEnabled(!depositEnabled)}
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                    depositEnabled ? 'bg-[var(--success)]' : 'bg-[var(--slate-elevated)]'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      depositEnabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <AnimatePresence>
                {depositEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3 pt-3 border-t border-white/[0.05] overflow-hidden"
                  >
                    {/* Deposit Type */}
                    <div>
                      <label className="block font-body text-[10px] uppercase tracking-wider text-[var(--muted-lead)] mb-2">
                        Kapora Tipi
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setDepositType('percentage')}
                          className={`h-9 px-3 rounded-2xl border transition-all ${
                            depositType === 'percentage'
                              ? 'bg-slate-500/20 border-slate-400/50 text-[var(--chrome-white)]'
                              : 'bg-white/[0.02] border-white/[0.08] text-[var(--muted-lead)] hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <Percent size={14} />
                            <span className="font-heading text-xs font-semibold">Yüzde</span>
                          </div>
                        </button>
                        <button
                          onClick={() => setDepositType('fixed')}
                          className={`h-9 px-3 rounded-2xl border transition-all ${
                            depositType === 'fixed'
                              ? 'bg-slate-500/20 border-slate-400/50 text-[var(--chrome-white)]'
                              : 'bg-white/[0.02] border-white/[0.08] text-[var(--muted-lead)] hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <TrendingUp size={14} />
                            <span className="font-heading text-xs font-semibold">Sabit</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Deposit Amount */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-body text-[10px] uppercase tracking-wider text-[var(--muted-lead)] mb-1.5">
                          {depositType === 'percentage' ? 'Yüzde (%)' : 'Tutar (₺)'}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max={depositType === 'percentage' ? 100 : 999999}
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(parseInt(e.target.value) || 0)}
                            className="w-full h-9 px-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-[var(--chrome-white)] font-heading font-semibold text-center outline-none focus:border-[var(--liquid-chrome)]"
                          />
                          <span className="text-xs text-[var(--muted-lead)] font-heading">
                            {depositType === 'percentage' ? '%' : '₺'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block font-body text-[10px] uppercase tracking-wider text-[var(--muted-lead)] mb-1.5">
                          Min. Tutar (₺)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={minReservationAmount}
                          onChange={(e) => setMinReservationAmount(parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full h-9 px-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-[var(--chrome-white)] font-heading font-semibold text-center outline-none focus:border-[var(--liquid-chrome)]"
                        />
                      </div>
                    </div>

                    {/* Payment Deadline */}
                    <div>
                      <label className="block font-body text-[10px] uppercase tracking-wider text-[var(--muted-lead)] mb-1.5">
                        Ödeme Süresi (Saat)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="168"
                          value={paymentDeadlineHours}
                          onChange={(e) => setPaymentDeadlineHours(parseInt(e.target.value) || 48)}
                          className="w-24 h-9 px-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-[var(--chrome-white)] font-heading font-semibold text-center outline-none focus:border-[var(--liquid-chrome)]"
                        />
                        <span className="text-xs text-[var(--muted-lead)] font-heading">saat</span>
                      </div>
                      <p className="text-[10px] text-[var(--muted-lead)] mt-1.5">
                        Müşterinin kapora ödemesi için süresi
                      </p>
                    </div>

                    {/* Auto Confirm Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                      <div>
                        <p className="font-heading text-xs font-semibold text-[var(--chrome-white)]">
                          Otomatik Onay
                        </p>
                        <p className="text-[10px] text-[var(--muted-lead)] mt-0.5">
                          Kapora ödenince onaylansın
                        </p>
                      </div>
                      <button
                        onClick={() => setAutoConfirm(!autoConfirm)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${
                          autoConfirm ? 'bg-[var(--success)]' : 'bg-[var(--slate-elevated)]'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                            autoConfirm ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Require Proof Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                      <div>
                        <p className="font-heading text-xs font-semibold text-[var(--chrome-white)]">
                          Dekont Zorunlu
                        </p>
                        <p className="text-[10px] text-[var(--muted-lead)] mt-0.5">
                          Ödeme makbuzu istenir
                        </p>
                      </div>
                      <button
                        onClick={() => setRequireProof(!requireProof)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${
                          requireProof ? 'bg-[var(--success)]' : 'bg-[var(--slate-elevated)]'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                            requireProof ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Payment Instructions */}
            <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/[0.08]">
              <label className="block mb-3">
                <span className="font-heading font-semibold text-sm text-[var(--chrome-white)]">
                  Ödeme Talimatları
                </span>
                <span className="text-xs text-[var(--muted-lead)] block mt-1">
                  Müşterilere gösterilecek ödeme notları
                </span>
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Havale yaparken açıklama kısmına randevu numaranızı yazınız..."
                rows={3}
                className="w-full px-3 py-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-[var(--chrome-white)] font-body text-xs focus:outline-none focus:border-[var(--liquid-chrome)] resize-none"
              />
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
              <ChromaticButton
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 h-10 px-6"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Kaydediliyor...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span className="text-sm">Kaydet</span>
                  </>
                )}
              </ChromaticButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!enabled && (
        <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/[0.08] text-center">
          <p className="font-body text-xs text-[var(--muted-lead)]">
            Havale/EFT ödemesini aktifleştirmek için yukarıdaki düğmeyi açın
          </p>
        </div>
      )}
    </div>
  );
}
