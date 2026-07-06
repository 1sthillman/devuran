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
      {/* Animated Background - Aydınlık modda daha belirgin */}
      <div className={`absolute inset-0 pointer-events-none ${actualTheme === 'light' ? 'opacity-[0.60]' : 'opacity-[0.35]'}`}>
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

      {/* Gradient Overlay - Aydınlık modda daha koyu overlay */}
      <div className={`absolute inset-0 pointer-events-none ${
        actualTheme === 'light' 
          ? 'bg-gradient-to-br from-gray-900/85 via-gray-900/80 to-gray-900/85' 
          : 'bg-gradient-to-br from-[var(--slate-surface)]/95 via-[var(--slate-surface)]/90 to-[var(--slate-surface)]/95'
      }`} />

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
              style={{
                maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <span className="text-gray-300 text-sm">Görsel Yok</span>
            </div>
          )}
          {salon.isPremium && (
            <div className="absolute top-3 right-3 liquid-glass-pill px-3 py-1 text-[10px] font-heading font-semibold uppercase tracking-wider text-white">
              Premium
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-heading font-bold text-lg text-white mb-1 line-clamp-1">
            {salon.name}
          </h3>
          <div className="flex items-center gap-1.5 mb-3">
            <MapPin size={14} className="text-gray-300 flex-shrink-0" />
            <span className="font-body text-sm text-gray-300 line-clamp-1">
              {salon.address.district}, {salon.address.city}
            </span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1">
              <Star size={14} className="fill-yellow-400 text-yellow-400" />
              <span className="font-heading font-semibold text-sm text-white">
                {salon.stats.averageRating}
              </span>
            </div>
            <span className="font-body text-xs text-gray-300">
              ({salon.stats.reviewCount} yorum)
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleClick}
              className="flex-1 h-10 rounded-full bg-white/[0.08] border border-white/20 font-heading font-medium text-sm text-white hover:bg-white/[0.15] hover:border-white/30 transition-all"
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
