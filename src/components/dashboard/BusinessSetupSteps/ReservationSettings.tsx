import { useState } from 'react';
import { Calendar, Clock, X, CreditCard, Percent, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ReservationSettingsProps {
  data: {
    settings: {
      advanceBookingDays: number;
      minOrderDays: number;
      autoConfirm: boolean;
      allowCancellation: boolean;
      cancellationHours: number;
      allowQueue: boolean;
      autoConfirmQueue: boolean;
    };
    bankAccount?: {
      bankName: string;
      iban: string;
      accountHolder: string;
    };
    depositSettings?: {
      enabled: boolean;
      percentage: number;
      minAmount: number;
    };
  };
  onChange: (data: any) => void;
}

export function ReservationSettings({ data, onChange }: ReservationSettingsProps) {
  const [showBankAccount, setShowBankAccount] = useState(!!data.bankAccount?.iban);
  const [showDeposit, setShowDeposit] = useState(!!data.depositSettings?.enabled);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Info Badge */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
        <p className="text-sm text-[var(--silver-frost)] text-center">
          Rezervasyon kurallarını belirleyin. Bu ayarlar opsiyoneldir, daha sonra değiştirebilirsiniz.
        </p>
      </div>

      <div className="space-y-4">
        {/* Basic Settings */}
        <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/[0.08] space-y-4">
          {/* Min Order Days */}
          <div>
            <label className="block mb-3">
              <span className="font-heading font-semibold text-sm text-[var(--chrome-white)] flex items-center gap-2">
                <Calendar size={16} className="text-purple-400" />
                Minimum Sipariş/Rezervasyon Süresi
              </span>
              <span className="text-xs text-[var(--muted-lead)] block mt-1">
                Müşteriler en az kaç gün önceden rezervasyon yapabilir?
              </span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                max="30"
                value={data.settings.minOrderDays}
                onChange={(e) => onChange({
                  ...data,
                  settings: {
                    ...data.settings,
                    minOrderDays: parseInt(e.target.value) || 0
                  }
                })}
                className="w-24 h-12 px-4 rounded-full bg-white/[0.05] border border-white/[0.08] text-[var(--chrome-white)] font-heading font-semibold text-center outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition-all"
              />
              <span className="text-sm text-[var(--muted-lead)] font-heading">gün</span>
            </div>
            <p className="text-xs text-[var(--muted-lead)] mt-2 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
              {data.settings.minOrderDays === 0 
                ? 'Müşteriler bugün için bile rezervasyon yapabilir (anında rezervasyon)'
                : `Müşteriler en az ${data.settings.minOrderDays} gün önceden rezervasyon yapabilir`}
            </p>
          </div>

          {/* Advance Booking Days */}
          <div>
            <label className="block mb-3">
              <span className="font-heading font-semibold text-sm text-[var(--chrome-white)] flex items-center gap-2">
                <Calendar size={16} className="text-blue-400" />
                Maksimum İleri Rezervasyon
              </span>
              <span className="text-xs text-[var(--muted-lead)] block mt-1">
                Müşteriler en fazla kaç gün sonrasına rezervasyon yapabilir?
              </span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="7"
                max="365"
                value={data.settings.advanceBookingDays}
                onChange={(e) => onChange({
                  ...data,
                  settings: {
                    ...data.settings,
                    advanceBookingDays: parseInt(e.target.value) || 30
                  }
                })}
                className="w-24 h-12 px-4 rounded-full bg-white/[0.05] border border-white/[0.08] text-[var(--chrome-white)] font-heading font-semibold text-center outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition-all"
              />
              <span className="text-sm text-[var(--muted-lead)] font-heading">gün</span>
            </div>
          </div>

          {/* Cancellation Hours */}
          <div>
            <label className="block mb-3">
              <span className="font-heading font-semibold text-sm text-[var(--chrome-white)] flex items-center gap-2">
                <X size={16} className="text-red-400" />
                İptal Süresi
              </span>
              <span className="text-xs text-[var(--muted-lead)] block mt-1">
                Müşteriler rezervasyondan en az kaç saat önce iptal edebilir?
              </span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="72"
                value={data.settings.cancellationHours}
                onChange={(e) => onChange({
                  ...data,
                  settings: {
                    ...data.settings,
                    cancellationHours: parseInt(e.target.value) || 24
                  }
                })}
                className="w-24 h-12 px-4 rounded-full bg-white/[0.05] border border-white/[0.08] text-[var(--chrome-white)] font-heading font-semibold text-center outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition-all"
              />
              <span className="text-sm text-[var(--muted-lead)] font-heading">saat</span>
            </div>
          </div>
        </div>

        {/* Bank Account (Optional) */}
        <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/[0.08]">
          <button
            type="button"
            onClick={() => setShowBankAccount(!showBankAccount)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <CreditCard size={18} className="text-emerald-400" />
              <span className="font-heading font-bold text-sm text-[var(--chrome-white)]">
                Banka Hesabı Bilgileri
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Opsiyonel
              </span>
            </div>
            {showBankAccount ? (
              <ChevronUp size={18} className="text-[var(--muted-lead)]" />
            ) : (
              <ChevronDown size={18} className="text-[var(--muted-lead)]" />
            )}
          </button>

          <AnimatePresence>
            {showBankAccount && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-4 space-y-3">
                  <input
                    type="text"
                    value={data.bankAccount?.bankName || ''}
                    onChange={(e) => onChange({
                      ...data,
                      bankAccount: {
                        ...data.bankAccount,
                        bankName: e.target.value,
                        iban: data.bankAccount?.iban || '',
                        accountHolder: data.bankAccount?.accountHolder || ''
                      }
                    })}
                    placeholder="Banka Adı (örn: Garanti BBVA)"
                    className="w-full h-12 px-4 rounded-full bg-white/[0.05] border border-white/[0.08] text-[var(--chrome-white)] text-sm placeholder:text-[var(--ash)] outline-none focus:border-emerald-500/50 focus:bg-white/[0.08] transition-all"
                  />
                  <input
                    type="text"
                    value={data.bankAccount?.iban || ''}
                    onChange={(e) => onChange({
                      ...data,
                      bankAccount: {
                        ...data.bankAccount,
                        bankName: data.bankAccount?.bankName || '',
                        iban: e.target.value,
                        accountHolder: data.bankAccount?.accountHolder || ''
                      }
                    })}
                    placeholder="IBAN (TR...)"
                    maxLength={26}
                    className="w-full h-12 px-4 rounded-full bg-white/[0.05] border border-white/[0.08] text-[var(--chrome-white)] text-sm placeholder:text-[var(--ash)] outline-none focus:border-emerald-500/50 focus:bg-white/[0.08] transition-all"
                  />
                  <input
                    type="text"
                    value={data.bankAccount?.accountHolder || ''}
                    onChange={(e) => onChange({
                      ...data,
                      bankAccount: {
                        ...data.bankAccount,
                        bankName: data.bankAccount?.bankName || '',
                        iban: data.bankAccount?.iban || '',
                        accountHolder: e.target.value
                      }
                    })}
                    placeholder="Hesap Sahibi Ad Soyad"
                    className="w-full h-12 px-4 rounded-full bg-white/[0.05] border border-white/[0.08] text-[var(--chrome-white)] text-sm placeholder:text-[var(--ash)] outline-none focus:border-emerald-500/50 focus:bg-white/[0.08] transition-all"
                  />
                  <p className="text-xs text-[var(--muted-lead)] mt-2">
                    Müşterileriniz ödeme yapmak için bu bilgileri görebilir
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Deposit Settings (Optional) */}
        <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/[0.08]">
          <button
            type="button"
            onClick={() => setShowDeposit(!showDeposit)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Percent size={18} className="text-amber-400" />
              <span className="font-heading font-bold text-sm text-[var(--chrome-white)]">
                Kapora Ayarları
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Opsiyonel
              </span>
            </div>
            {showDeposit ? (
              <ChevronUp size={18} className="text-[var(--muted-lead)]" />
            ) : (
              <ChevronDown size={18} className="text-[var(--muted-lead)]" />
            )}
          </button>

          <AnimatePresence>
            {showDeposit && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-4 space-y-3">
                  <label className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.08] cursor-pointer hover:bg-white/[0.05] transition-colors">
                    <input
                      type="checkbox"
                      checked={data.depositSettings?.enabled || false}
                      onChange={(e) => onChange({
                        ...data,
                        depositSettings: {
                          enabled: e.target.checked,
                          percentage: data.depositSettings?.percentage || 20,
                          minAmount: data.depositSettings?.minAmount || 100
                        }
                      })}
                      className="w-5 h-5 rounded bg-white/5 border border-white/10 checked:bg-purple-500 checked:border-purple-500"
                    />
                    <span className="text-sm text-[var(--chrome-white)]">
                      Kapora sistemi aktif
                    </span>
                  </label>

                  {data.depositSettings?.enabled && (
                    <>
                      <div>
                        <label className="block text-xs font-heading font-semibold text-[var(--silver-frost)] mb-2">
                          Kapora Oranı (%)
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min="10"
                            max="100"
                            value={data.depositSettings.percentage}
                            onChange={(e) => onChange({
                              ...data,
                              depositSettings: {
                                ...data.depositSettings!,
                                percentage: parseInt(e.target.value) || 20
                              }
                            })}
                            className="w-24 h-12 px-4 rounded-full bg-white/[0.05] border border-white/[0.08] text-[var(--chrome-white)] font-heading font-semibold text-center outline-none focus:border-amber-500/50 focus:bg-white/[0.08] transition-all"
                          />
                          <span className="text-sm text-[var(--muted-lead)] font-heading">%</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-heading font-semibold text-[var(--silver-frost)] mb-2">
                          Minimum Kapora Tutarı (₺)
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min="0"
                            step="50"
                            value={data.depositSettings.minAmount}
                            onChange={(e) => onChange({
                              ...data,
                              depositSettings: {
                                ...data.depositSettings!,
                                minAmount: parseInt(e.target.value) || 100
                              }
                            })}
                            className="w-32 h-12 px-4 rounded-full bg-white/[0.05] border border-white/[0.08] text-[var(--chrome-white)] font-heading font-semibold text-center outline-none focus:border-amber-500/50 focus:bg-white/[0.08] transition-all"
                          />
                          <span className="text-sm text-[var(--muted-lead)] font-heading">₺</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
