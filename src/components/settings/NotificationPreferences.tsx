import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Mail, MessageSquare, Save } from 'lucide-react';
import { ChromaticButton } from '@/components/ui/ChromaticButton';

interface NotificationSettings {
  email: {
    reservationCreated: boolean;
    reservationConfirmed: boolean;
    reservationReminder: boolean;
    reservationCancelled: boolean;
    paymentReceived: boolean;
    reviewRequest: boolean;
  };
  sms: {
    reservationCreated: boolean;
    reservationConfirmed: boolean;
    reservationReminder: boolean;
    reservationCancelled: boolean;
  };
}

interface NotificationPreferencesProps {
  settings: NotificationSettings;
  onSave: (settings: NotificationSettings) => Promise<void>;
}

export function NotificationPreferences({ settings, onSave }: NotificationPreferencesProps) {
  const [emailSettings, setEmailSettings] = useState(settings.email);
  const [smsSettings, setSmsSettings] = useState(settings.sms);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        email: emailSettings,
        sms: smsSettings,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEmail = (key: keyof typeof emailSettings) => {
    setEmailSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSms = (key: keyof typeof smsSettings) => {
    setSmsSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <div className="obsidian-card p-6 rounded-3xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
            <Mail size={24} className="text-blue-400" strokeWidth={2} />
          </div>
          <div>
            <h3 className="font-heading font-bold text-xl text-[var(--chrome-white)]">
              E-posta Bildirimleri
            </h3>
            <p className="font-body text-sm text-[var(--muted-lead)] mt-1">
              Hangi durumlarda e-posta almak istersiniz?
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { key: 'reservationCreated', label: 'Rezervasyon Oluşturulduğunda', desc: 'Yeni rezervasyon oluşturduğunuzda' },
            { key: 'reservationConfirmed', label: 'Rezervasyon Onaylandığında', desc: 'İşletme rezervasyonunuzu onayladığında' },
            { key: 'reservationReminder', label: 'Randevu Hatırlatıcı', desc: 'Randevunuzdan 1 gün önce' },
            { key: 'reservationCancelled', label: 'Rezervasyon İptal Edildiğinde', desc: 'Rezervasyon iptal edildiğinde' },
            { key: 'paymentReceived', label: 'Ödeme Alındığında', desc: 'Ödemeniz onaylandığında' },
            { key: 'reviewRequest', label: 'Değerlendirme İsteği', desc: 'Randevu sonrası değerlendirme daveti' },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-[var(--obsidian-rim)] hover:border-[var(--liquid-chrome)]/30 transition-colors"
            >
              <div className="flex-1">
                <p className="font-heading font-semibold text-[var(--chrome-white)]">
                  {item.label}
                </p>
                <p className="font-body text-sm text-[var(--muted-lead)] mt-0.5">
                  {item.desc}
                </p>
              </div>
              <button
                onClick={() => toggleEmail(item.key as keyof typeof emailSettings)}
                className={`w-12 h-6 rounded-full relative transition-colors ${
                  emailSettings[item.key as keyof typeof emailSettings]
                    ? 'bg-[var(--success)]'
                    : 'bg-[var(--slate-elevated)]'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    emailSettings[item.key as keyof typeof emailSettings]
                      ? 'translate-x-6'
                      : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* SMS Notifications */}
      <div className="obsidian-card p-6 rounded-3xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
            <MessageSquare size={24} className="text-green-400" strokeWidth={2} />
          </div>
          <div>
            <h3 className="font-heading font-bold text-xl text-[var(--chrome-white)]">
              SMS Bildirimleri
            </h3>
            <p className="font-body text-sm text-[var(--muted-lead)] mt-1">
              Hangi durumlarda SMS almak istersiniz?
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { key: 'reservationCreated', label: 'Rezervasyon Oluşturulduğunda', desc: 'Yeni rezervasyon oluşturduğunuzda' },
            { key: 'reservationConfirmed', label: 'Rezervasyon Onaylandığında', desc: 'İşletme rezervasyonunuzu onayladığında' },
            { key: 'reservationReminder', label: 'Randevu Hatırlatıcı', desc: 'Randevunuzdan 1 gün önce' },
            { key: 'reservationCancelled', label: 'Rezervasyon İptal Edildiğinde', desc: 'Rezervasyon iptal edildiğinde' },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-[var(--obsidian-rim)] hover:border-[var(--liquid-chrome)]/30 transition-colors"
            >
              <div className="flex-1">
                <p className="font-heading font-semibold text-[var(--chrome-white)]">
                  {item.label}
                </p>
                <p className="font-body text-sm text-[var(--muted-lead)] mt-0.5">
                  {item.desc}
                </p>
              </div>
              <button
                onClick={() => toggleSms(item.key as keyof typeof smsSettings)}
                className={`w-12 h-6 rounded-full relative transition-colors ${
                  smsSettings[item.key as keyof typeof smsSettings]
                    ? 'bg-[var(--success)]'
                    : 'bg-[var(--slate-elevated)]'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    smsSettings[item.key as keyof typeof smsSettings]
                      ? 'translate-x-6'
                      : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
          <p className="font-body text-sm text-yellow-300/90">
            SMS bildirimleri için operatör ücretleri geçerlidir.
          </p>
        </div>
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
              <span>Tercihleri Kaydet</span>
            </>
          )}
        </ChromaticButton>
      </div>
    </div>
  );
}
