import { motion } from 'framer-motion';
import { Building2, Copy, Check, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface BankAccount {
  bankName: string;
  accountHolder: string;
  iban: string;
  accountNumber?: string;
  branch?: string;
}

interface PaymentInformationProps {
  bankAccounts: BankAccount[];
  paymentInstructions?: string;
  totalAmount: number;
  reservationId: string;
}

export function PaymentInformation({
  bankAccounts,
  paymentInstructions,
  totalAmount,
  reservationId,
}: PaymentInformationProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatIBAN = (iban: string) => {
    return iban.replace(/(.{4})/g, '$1 ').trim();
  };

  return (
    <div className="space-y-6">
      {/* Alert */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20"
      >
        <div className="flex gap-3">
          <AlertCircle size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-heading font-semibold text-blue-400 mb-1">
              Ödeme Bilgileri
            </p>
            <p className="font-body text-sm text-blue-300/80">
              Rezervasyonunuzu tamamlamak için aşağıdaki hesaplardan birine ödeme yapabilirsiniz.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Amount to Pay */}
      <div className="obsidian-card p-6 rounded-3xl text-center">
        <p className="font-body text-sm text-[var(--muted-lead)] mb-2">
          Ödenecek Tutar
        </p>
        <p className="font-display font-bold text-4xl text-[var(--liquid-chrome)]">
          {totalAmount.toLocaleString('tr-TR')} TL
        </p>
      </div>

      {/* Bank Accounts */}
      <div className="space-y-4">
        {bankAccounts.map((account, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="obsidian-card p-6 rounded-3xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                <Building2 size={24} className="text-green-400" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-lg text-[var(--chrome-white)]">
                  {account.bankName}
                </h4>
                {account.branch && (
                  <p className="font-body text-sm text-[var(--muted-lead)]">
                    {account.branch}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {/* Account Holder */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-[var(--obsidian-rim)]">
                <p className="font-body text-xs text-[var(--muted-lead)] mb-1">
                  Hesap Sahibi
                </p>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-heading font-semibold text-[var(--chrome-white)]">
                    {account.accountHolder}
                  </p>
                  <button
                    onClick={() => copyToClipboard(account.accountHolder, `holder-${index}`)}
                    className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    {copiedField === `holder-${index}` ? (
                      <Check size={16} className="text-green-400" />
                    ) : (
                      <Copy size={16} className="text-[var(--muted-lead)]" />
                    )}
                  </button>
                </div>
              </div>

              {/* IBAN */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-[var(--obsidian-rim)]">
                <p className="font-body text-xs text-[var(--muted-lead)] mb-1">
                  IBAN
                </p>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-sm text-[var(--chrome-white)] break-all">
                    {formatIBAN(account.iban)}
                  </p>
                  <button
                    onClick={() => copyToClipboard(account.iban, `iban-${index}`)}
                    className="p-2 rounded-lg hover:bg-white/5 transition-colors flex-shrink-0"
                  >
                    {copiedField === `iban-${index}` ? (
                      <Check size={16} className="text-green-400" />
                    ) : (
                      <Copy size={16} className="text-[var(--muted-lead)]" />
                    )}
                  </button>
                </div>
              </div>

              {/* Account Number (if exists) */}
              {account.accountNumber && (
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-[var(--obsidian-rim)]">
                  <p className="font-body text-xs text-[var(--muted-lead)] mb-1">
                    Hesap No
                  </p>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-sm text-[var(--chrome-white)]">
                      {account.accountNumber}
                    </p>
                    <button
                      onClick={() => copyToClipboard(account.accountNumber!, `account-${index}`)}
                      className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      {copiedField === `account-${index}` ? (
                        <Check size={16} className="text-green-400" />
                      ) : (
                        <Copy size={16} className="text-[var(--muted-lead)]" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Payment Instructions */}
      {paymentInstructions && (
        <div className="obsidian-card p-6 rounded-3xl">
          <h4 className="font-heading font-semibold text-[var(--chrome-white)] mb-3 flex items-center gap-2">
            <AlertCircle size={18} className="text-[var(--liquid-chrome)]" />
            Önemli Notlar
          </h4>
          <p className="font-body text-sm text-[var(--muted-lead)] whitespace-pre-wrap">
            {paymentInstructions}
          </p>
        </div>
      )}

      {/* Reservation ID */}
      <div className="obsidian-card p-6 rounded-3xl">
        <p className="font-body text-sm text-[var(--muted-lead)] mb-2">
          Havale açıklamasına yazınız:
        </p>
        <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-[var(--liquid-chrome)]/10 border border-[var(--liquid-chrome)]/20">
          <p className="font-mono font-bold text-lg text-[var(--liquid-chrome)]">
            {reservationId}
          </p>
          <button
            onClick={() => copyToClipboard(reservationId, 'reservation-id')}
            className="p-2 rounded-lg hover:bg-[var(--liquid-chrome)]/10 transition-colors"
          >
            {copiedField === 'reservation-id' ? (
              <Check size={18} className="text-green-400" />
            ) : (
              <Copy size={18} className="text-[var(--liquid-chrome)]" />
            )}
          </button>
        </div>
        <p className="font-body text-xs text-[var(--muted-lead)] mt-2">
          * Ödemenizin hızlı şekilde onaylanması için rezervasyon numaranızı mutlaka yazınız
        </p>
      </div>

      {/* Warning */}
      <div className="p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
        <div className="flex gap-3">
          <AlertCircle size={18} className="text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-body text-sm text-yellow-300/90">
              Ödemeniz işletme tarafından onaylandıktan sonra rezervasyonunuz kesinleşecektir.
              Ödeme dekontunu WhatsApp üzerinden de gönderebilirsiniz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
