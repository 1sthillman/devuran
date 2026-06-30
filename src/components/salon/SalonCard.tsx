import { useNavigate } from 'react-router-dom';
import { MapPin, Star } from 'lucide-react';
import { memo } from 'react';
import { useThemeStore } from '@/store/themeStore';
import type { Salon } from '@/types';

interface SalonCardProps {
  salon: Salon;
  index?: number;
}

export const SalonCard = memo(function SalonCard({ salon, index = 0 }: SalonCardProps) {
  const navigate = useNavigate();
  const { actualTheme } = useThemeStore();

  const handleClick = () => {
    navigate(`/salon/${salon.id}`);
  };

  const handleBooking = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/booking/${salon.id}`);
  };

  // Choose GIF based on theme - HER ZAMAN KARANLIK (SİYAH) GIF KULLAN
  const backgroundGif = '/asset/Kaliteyi_bozmadan_loop_olmasn_istiyorum_kar.gif';

  return (
    <div
      onClick={handleClick}
      className="relative overflow-hidden obsidian-card obsidian-card-hover cursor-pointer group"
    >
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-[0.20] pointer-events-none">
        <img
          src={backgroundGif}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          style={{
            imageRendering: 'auto',
            willChange: 'auto',
          }}
          />
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--slate-surface)]/95 via-[var(--slate-surface)]/90 to-[var(--slate-surface)]/95 pointer-events-none" />

        {/* Content */}
        <div className="relative">
          {/* Cover Image */}
          <div className="relative h-[160px] overflow-hidden">
            {salon.coverImage ? (
              <img
                src={salon.coverImage}
                loading="lazy"
                decoding="async"
                alt={salon.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                <span className="text-[var(--muted-lead)] text-sm">Görsel Yok</span>
              </div>
            )}
            {salon.isPremium && (
              <div className="absolute top-3 right-3 liquid-glass-pill px-3 py-1 text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--chrome-white)]">
                Premium
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-4">
            <h3 className="font-heading font-bold text-lg text-[var(--chrome-white)] mb-1 line-clamp-1">
              {salon.name}
            </h3>
            <div className="flex items-center gap-1.5 mb-3">
              <MapPin size={14} className="text-[var(--muted-lead)] flex-shrink-0" />
              <span className="font-body text-sm text-[var(--muted-lead)] line-clamp-1">
                {salon.address.district}, {salon.address.city}
              </span>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1">
                <Star size={14} className="fill-yellow-400 text-yellow-400" />
                <span className="font-heading font-semibold text-sm text-[var(--chrome-white)]">
                  {salon.stats.averageRating}
                </span>
              </div>
              <span className="font-body text-xs text-[var(--muted-lead)]">
                ({salon.stats.reviewCount} yorum)
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleClick}
                className="flex-1 h-10 rounded-full bg-white/[0.04] border border-[var(--obsidian-rim)] font-heading font-medium text-sm text-[var(--silver-frost)] hover:bg-white/[0.08] hover:border-[var(--liquid-chrome)] transition-all"
              >
                Detay
              </button>
              <button
                onClick={handleBooking}
                className="flex-1 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 font-heading font-semibold text-sm text-white hover:shadow-lg hover:shadow-purple-500/25 transition-all"
              >
                Randevu Al
              </button>
            </div>
          </div>
        </div>
      </div>
  );
});

