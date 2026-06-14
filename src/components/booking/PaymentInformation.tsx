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
  depositRequired?: boolean;
  depositAmount?: number;
  remainingAmount?: number;
}

export function PaymentInformation({
  bankAccounts,
  paymentInstructions,
  totalAmount,
  reservationId,
  depositRequired = false,
  depositAmount = 0,
  remainingAmount = 0,
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
    <div className="space-y-3">
      {/* Payment Type - Compact Alert */}
      <div className="p-4 rounded-3xl border bg-slate-500/5 border-slate-500/20">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-500/10 flex items-center justify-center flex-shrink-0">
            <AlertCircle size={18} className="text-slate-400" />
          </div>
          <div className="flex-1">
            <p className="font-heading font-semibold text-sm text-[var(--chrome-white)] mb-1">
              {depositRequired ? 'Kapora Ödemesi Gerekli' : 'Ödeme Bilgileri'}
            </p>
            <p className="font-body text-xs text-[var(--muted-lead)]">
              {depositRequired 
                ? 'Rezervasyonunuzu garantilemek için önce kapora ödemesi yapmanız gerekmektedir.'
                : 'Aşağıdaki hesaplardan birine ödeme yaparak rezervasyonunuzu tamamlayın.'}
            </p>
          </div>
        </div>
      </div>

      {/* Amount Display - Compact */}
      {depositRequired ? (
        <div className="grid grid-cols-2 gap-3">
          {/* Kapora */}
          <div className="p-4 rounded-3xl bg-[var(--liquid-chrome)]/5 border border-[var(--liquid-chrome)]/20">
            <p className="font-body text-[10px] text-[var(--muted-lead)] uppercase tracking-wider mb-1">
              Şimdi Ödenecek
            </p>
            <p className="font-mono font-bold text-xl text-[var(--liquid-chrome)]">
              {depositAmount.toLocaleString('tr-TR')}₺
            </p>
            <p className="font-body text-[10px] text-[var(--muted-lead)] mt-1">
              Kapora tutarı
            </p>
          </div>

          {/* Kalan */}
          <div className="p-4 rounded-3xl bg-white/[0.02] border border-white/[0.08]">
            <p className="font-body text-[10px] text-[var(--muted-lead)] uppercase tracking-wider mb-1">
              Randevu Günü
            </p>
            <p className="font-mono font-bold text-xl text-[var(--chrome-white)]">
              {remainingAmount.toLocaleString('tr-TR')}₺
            </p>
            <p className="font-body text-[10px] text-[var(--muted-lead)] mt-1">
              Kalan ödeme
            </p>
          </div>
        </div>
      ) : (
        <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/[0.08] text-center">
          <p className="font-body text-[10px] text-[var(--muted-lead)] uppercase tracking-wider mb-1.5">
            Ödenecek Tutar
          </p>
          <p className="font-mono font-bold text-3xl text-[var(--liquid-chrome)]">
            {totalAmount.toLocaleString('tr-TR')}₺
          </p>
        </div>
      )}

      {/* Bank Accounts - Compact */}
      <div className="space-y-2">
        {bankAccounts.map((account, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-4 rounded-3xl bg-white/[0.02] border border-white/[0.08]"
          >
            <div className="flex items-center gap-2 mb-3">
              <Building2 size={16} className="text-slate-400" />
              <h4 className="font-heading font-semibold text-sm text-[var(--chrome-white)]">
                {account.bankName}
              </h4>
              {account.branch && (
                <span className="text-[10px] text-[var(--muted-lead)]">• {account.branch}</span>
              )}
            </div>

            <div className="space-y-2">
              {/* Account Holder */}
              <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/[0.02]">
                <div className="flex-1 min-w-0">
                  <p className="font-body text-[10px] text-[var(--muted-lead)] uppercase tracking-wider">
                    Hesap Sahibi
                  </p>
                  <p className="font-heading text-xs text-[var(--chrome-white)] truncate">
                    {account.accountHolder}
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(account.accountHolder, `holder-${index}`)}
                  className="p-1.5 rounded-lg hover:bg-white/5 transition-colors flex-shrink-0"
                >
                  {copiedField === `holder-${index}` ? (
                    <Check size={14} className="text-green-400" />
                  ) : (
                    <Copy size={14} className="text-[var(--muted-lead)]" />
                  )}
                </button>
              </div>

              {/* IBAN */}
              <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/[0.02]">
                <div className="flex-1 min-w-0">
                  <p className="font-body text-[10px] text-[var(--muted-lead)] uppercase tracking-wider">
                    IBAN
                  </p>
                  <p className="font-mono text-xs text-[var(--chrome-white)] truncate">
                    {formatIBAN(account.iban)}
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(account.iban, `iban-${index}`)}
                  className="p-1.5 rounded-lg hover:bg-white/5 transition-colors flex-shrink-0"
                >
                  {copiedField === `iban-${index}` ? (
                    <Check size={14} className="text-green-400" />
                  ) : (
                    <Copy size={14} className="text-[var(--muted-lead)]" />
                  )}
                </button>
              </div>

              {/* Account Number (if exists) */}
              {account.accountNumber && (
                <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/[0.02]">
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-[10px] text-[var(--muted-lead)] uppercase tracking-wider">
                      Hesap No
                    </p>
                    <p className="font-mono text-xs text-[var(--chrome-white)]">
                      {account.accountNumber}
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(account.accountNumber!, `account-${index}`)}
                    className="p-1.5 rounded-lg hover:bg-white/5 transition-colors flex-shrink-0"
                  >
                    {copiedField === `account-${index}` ? (
                      <Check size={14} className="text-green-400" />
                    ) : (
                      <Copy size={14} className="text-[var(--muted-lead)]" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Payment Instructions - Compact */}
      {paymentInstructions && (
        <div className="p-4 rounded-3xl bg-white/[0.02] border border-white/[0.08]">
          <p className="font-heading font-semibold text-xs text-[var(--chrome-white)] mb-2">
            Önemli Notlar
          </p>
          <p className="font-body text-xs text-[var(--muted-lead)] whitespace-pre-wrap">
            {paymentInstructions}
          </p>
        </div>
      )}

      {/* Reservation ID - Compact */}
      <div className="p-4 rounded-3xl bg-white/[0.02] border border-white/[0.08]">
        <p className="font-body text-[10px] text-[var(--muted-lead)] mb-2 uppercase tracking-wider">
          Havale Açıklamasına Yazınız
        </p>
        <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-[var(--liquid-chrome)]/5 border border-[var(--liquid-chrome)]/20">
          <p className="font-mono font-bold text-sm text-[var(--liquid-chrome)]">
            #{reservationId.slice(0, 10).toUpperCase()}
          </p>
          <button
            onClick={() => copyToClipboard(reservationId, 'reservation-id')}
            className="p-1.5 rounded-lg hover:bg-[var(--liquid-chrome)]/10 transition-colors"
          >
            {copiedField === 'reservation-id' ? (
              <Check size={14} className="text-green-400" />
            ) : (
              <Copy size={14} className="text-[var(--liquid-chrome)]" />
            )}
          </button>
        </div>
      </div>

      {/* Process Info - Compact */}
      {depositRequired && (
        <div className="p-4 rounded-3xl bg-white/[0.02] border border-white/[0.08]">
          <p className="font-heading font-semibold text-xs text-[var(--chrome-white)] mb-2">
            Ödeme Süreci
          </p>
          <div className="space-y-1.5 text-xs text-[var(--muted-lead)]">
            <p>1. Yukarıdaki hesaplara {depositAmount.toLocaleString('tr-TR')}₺ kapora yatırın</p>
            <p>2. İşletme ödemeyi onaylar (1-2 saat)</p>
            <p>3. Rezervasyonunuz kesinleşir</p>
            <p>4. Randevu günü kalan {remainingAmount.toLocaleString('tr-TR')}₺'yi ödersiniz</p>
          </div>
        </div>
      )}
    </div>
  );
}
