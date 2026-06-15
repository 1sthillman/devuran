import { Phone, Mail, MessageSquare, FileText } from 'lucide-react';

interface BasicInfoProps {
  data: {
    name: string;
    phone: string;
    whatsappNumber: string;
    email: string;
    description: string;
  };
  onChange: (data: any) => void;
}

export function BasicInfo({ data, onChange }: BasicInfoProps) {
  return (
    <div className="space-y-2.5">
      {/* Info Badge - Compact */}
      <div className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
        <p className="text-sm text-[var(--silver-frost)] text-center font-medium">
          İşletmenizin temel iletişim bilgilerini girin
        </p>
      </div>

      <div className="space-y-2.5">
        {/* Business Name */}
        <div>
          <label className="block font-heading font-semibold text-sm text-[var(--chrome-white)] mb-1.5">
            İşletme Adı *
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => onChange({ ...data, name: e.target.value })}
            placeholder="Örn: Güzellik Salonu, Cafe, Otel..."
            className="w-full h-11 px-4 rounded-full bg-white/5 border border-white/10 text-[var(--chrome-white)] text-sm placeholder:text-[var(--ash)] outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all"
          />
        </div>

        {/* Phone Numbers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block font-heading font-semibold text-sm text-[var(--chrome-white)] mb-1.5 flex items-center gap-1.5">
              <Phone size={14} className="text-purple-400" />
              Telefon *
            </label>
            <input
              type="tel"
              value={data.phone}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/\D/g, '');
                onChange({ ...data, phone: cleaned.slice(0, 10) });
              }}
              placeholder="5XX XXX XX XX"
              maxLength={10}
              className="w-full h-11 px-4 rounded-full bg-white/5 border border-white/10 text-[var(--chrome-white)] text-sm placeholder:text-[var(--ash)] outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all"
            />
            <p className="text-xs text-[var(--muted-lead)] mt-1 ml-1">
              10 haneli numara
            </p>
          </div>

          <div>
            <label className="block font-heading font-semibold text-sm text-[var(--chrome-white)] mb-1.5 flex items-center gap-1.5">
              <MessageSquare size={14} className="text-green-400" />
              WhatsApp
            </label>
            <input
              type="tel"
              value={data.whatsappNumber}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/\D/g, '');
                onChange({ ...data, whatsappNumber: cleaned.slice(0, 10) });
              }}
              placeholder="5XX XXX XX XX"
              maxLength={10}
              className="w-full h-11 px-4 rounded-full bg-white/5 border border-white/10 text-[var(--chrome-white)] text-sm placeholder:text-[var(--ash)] outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all"
            />
            <p className="text-xs text-[var(--muted-lead)] mt-1 ml-1">
              Opsiyonel
            </p>
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block font-heading font-semibold text-sm text-[var(--chrome-white)] mb-1.5 flex items-center gap-1.5">
            <Mail size={14} className="text-blue-400" />
            E-posta
          </label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => onChange({ ...data, email: e.target.value })}
            placeholder="info@isletme.com"
            className="w-full h-11 px-4 rounded-full bg-white/5 border border-white/10 text-[var(--chrome-white)] text-sm placeholder:text-[var(--ash)] outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all"
          />
          <p className="text-xs text-[var(--muted-lead)] mt-1 ml-1">
            Opsiyonel
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block font-heading font-semibold text-sm text-[var(--chrome-white)] mb-1.5 flex items-center gap-1.5">
            <FileText size={14} className="text-purple-400" />
            İşletme Açıklaması
          </label>
          <textarea
            value={data.description}
            onChange={(e) => onChange({ ...data, description: e.target.value })}
            placeholder="İşletmeniz hakkında kısa bir açıklama yazın..."
            rows={4}
            className="w-full px-4 py-3 rounded-3xl bg-white/5 border border-white/10 text-[var(--chrome-white)] text-sm placeholder:text-[var(--ash)] outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all resize-none"
          />
          <p className="text-xs text-[var(--muted-lead)] mt-1 ml-1">
            Müşterileriniz bu açıklamayı görecek
          </p>
        </div>
      </div>
    </div>
  );
}
