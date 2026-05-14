import { MapPin } from 'lucide-react';

interface SalonMapProps {
  coordinates: { lat: number; lng: number };
  address: string;
  salonName: string;
}

export function SalonMap({ coordinates, address, salonName }: SalonMapProps) {
  // Google Maps embed URL with proper parameters
  const mapUrl = `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}&hl=tr&z=15&output=embed`;

  return (
    <div>
      <div className="relative w-full h-[300px] rounded-2xl overflow-hidden obsidian-card">
        <iframe
          src={mapUrl}
          title={`${salonName} konum`}
          className="w-full h-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
      <div className="flex items-start gap-2 mt-3">
        <MapPin size={16} className="text-[var(--muted-lead)] mt-0.5 flex-shrink-0" />
        <p className="font-body text-sm text-[var(--muted-lead)]">{address}</p>
      </div>
      <a
        href={`https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 mt-3 liquid-glass-pill px-5 py-2.5 font-heading font-medium text-sm text-[var(--silver-frost)] hover:text-[var(--chrome-white)] transition-colors"
      >
        <MapPin size={16} />
        Yol Tarifi Al
      </a>
    </div>
  );
}
