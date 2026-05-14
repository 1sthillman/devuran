import { type CategoryId } from '@/config/categories';
import type { ReactElement } from 'react';

interface CategoryIconProps {
  category: CategoryId;
  size?: number;
  className?: string;
}

export function CategoryIcon({ category, size = 48, className = '' }: CategoryIconProps) {
  const iconMap: Record<CategoryId, ReactElement> = {
    // Beauty & Personal Care
    kuafor: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="kuafor-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        <path d="M32 8L28 20L24 32L28 44L32 56L36 44L40 32L36 20L32 8Z" fill="url(#kuafor-gradient)" opacity="0.2"/>
        <path d="M20 16L24 24L28 32L24 40L20 48" stroke="url(#kuafor-gradient)" strokeWidth="3" strokeLinecap="round"/>
        <path d="M44 16L40 24L36 32L40 40L44 48" stroke="url(#kuafor-gradient)" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="32" cy="32" r="4" fill="url(#kuafor-gradient)"/>
      </svg>
    ),
    berber: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="berber-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        <rect x="16" y="12" width="32" height="8" rx="4" fill="url(#berber-gradient)" opacity="0.2"/>
        <rect x="16" y="28" width="32" height="8" rx="4" fill="url(#berber-gradient)" opacity="0.2"/>
        <rect x="16" y="44" width="32" height="8" rx="4" fill="url(#berber-gradient)" opacity="0.2"/>
        <path d="M20 16L44 16M20 32L44 32M20 48L44 48" stroke="url(#berber-gradient)" strokeWidth="3" strokeLinecap="round"/>
      </svg>
    ),
    guzellik: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="guzellik-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="20" fill="url(#guzellik-gradient)" opacity="0.1"/>
        <path d="M32 16L36 24L44 28L36 32L32 40L28 32L20 28L28 24L32 16Z" fill="url(#guzellik-gradient)" opacity="0.3"/>
        <circle cx="32" cy="32" r="8" stroke="url(#guzellik-gradient)" strokeWidth="3"/>
        <circle cx="32" cy="32" r="3" fill="url(#guzellik-gradient)"/>
      </svg>
    ),
    tirnak: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="tirnak-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        <ellipse cx="32" cy="36" rx="12" ry="20" fill="url(#tirnak-gradient)" opacity="0.2"/>
        <path d="M32 16C24 16 20 24 20 36C20 48 24 56 32 56C40 56 44 48 44 36C44 24 40 16 32 16Z" stroke="url(#tirnak-gradient)" strokeWidth="3"/>
        <path d="M26 28L38 28M26 36L38 36M26 44L38 44" stroke="url(#tirnak-gradient)" strokeWidth="2" opacity="0.5"/>
      </svg>
    ),

    // Events & Organization
    'dugun-organizasyon': (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="dugun-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        <path d="M32 20C32 20 24 12 16 20C8 28 16 40 32 52C48 40 56 28 48 20C40 12 32 20 32 20Z" fill="url(#dugun-gradient)" opacity="0.2"/>
        <path d="M32 20C32 20 24 12 16 20C8 28 16 40 32 52C48 40 56 28 48 20C40 12 32 20 32 20Z" stroke="url(#dugun-gradient)" strokeWidth="3" strokeLinejoin="round"/>
      </svg>
    ),
    'nisan-organizasyon': (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="nisan-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        <rect x="20" y="16" width="24" height="32" rx="4" fill="url(#nisan-gradient)" opacity="0.2"/>
        <path d="M20 24L32 16L44 24M32 16V48" stroke="url(#nisan-gradient)" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="32" cy="48" r="4" fill="url(#nisan-gradient)"/>
      </svg>
    ),
    'evlilik-teklifi': (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="evlilik-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
        <circle cx="32" cy="36" r="12" fill="url(#evlilik-gradient)" opacity="0.2"/>
        <circle cx="32" cy="36" r="8" stroke="url(#evlilik-gradient)" strokeWidth="3"/>
        <path d="M32 28V20M28 24L32 20L36 24" stroke="url(#evlilik-gradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="24" y="44" width="16" height="8" rx="2" fill="url(#evlilik-gradient)" opacity="0.3"/>
      </svg>
    ),
    'dogum-gunu': (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="dogum-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>
        <rect x="16" y="32" width="32" height="20" rx="2" fill="url(#dogum-gradient)" opacity="0.2"/>
        <path d="M32 24L28 28L32 32L36 28L32 24Z" fill="url(#dogum-gradient)"/>
        <path d="M32 16V24M32 24L28 28M32 24L36 28" stroke="url(#dogum-gradient)" strokeWidth="3" strokeLinecap="round"/>
        <rect x="16" y="32" width="32" height="20" rx="2" stroke="url(#dogum-gradient)" strokeWidth="3"/>
      </svg>
    ),
    'kurumsal-etkinlik': (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="kurumsal-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
        </defs>
        <rect x="16" y="16" width="32" height="36" rx="2" fill="url(#kurumsal-gradient)" opacity="0.2"/>
        <rect x="16" y="16" width="32" height="36" rx="2" stroke="url(#kurumsal-gradient)" strokeWidth="3"/>
        <path d="M24 24H40M24 32H40M24 40H40" stroke="url(#kurumsal-gradient)" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),

    // Venues
    'dugun-salonu': (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="salon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>
        <path d="M12 52L12 28L32 12L52 28L52 52L12 52Z" fill="url(#salon-gradient)" opacity="0.2"/>
        <path d="M12 28L32 12L52 28M12 28V52H52V28" stroke="url(#salon-gradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="28" y="36" width="8" height="16" fill="url(#salon-gradient)" opacity="0.5"/>
      </svg>
    ),
    'etkinlik-alani': (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="etkinlik-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
        <rect x="12" y="20" width="40" height="32" rx="4" fill="url(#etkinlik-gradient)" opacity="0.2"/>
        <rect x="12" y="20" width="40" height="32" rx="4" stroke="url(#etkinlik-gradient)" strokeWidth="3"/>
        <circle cx="32" cy="36" r="8" stroke="url(#etkinlik-gradient)" strokeWidth="2"/>
      </svg>
    ),

    // Accommodation
    bungalov: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bungalov-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
        <path d="M16 32L32 16L48 32V52H16V32Z" fill="url(#bungalov-gradient)" opacity="0.2"/>
        <path d="M16 32L32 16L48 32M16 32V52H48V32" stroke="url(#bungalov-gradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="24" y="40" width="8" height="12" stroke="url(#bungalov-gradient)" strokeWidth="2"/>
        <rect x="36" y="32" width="8" height="8" stroke="url(#bungalov-gradient)" strokeWidth="2"/>
      </svg>
    ),
    otel: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="otel-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        <rect x="16" y="12" width="32" height="40" rx="2" fill="url(#otel-gradient)" opacity="0.2"/>
        <rect x="16" y="12" width="32" height="40" rx="2" stroke="url(#otel-gradient)" strokeWidth="3"/>
        <path d="M24 20H28M36 20H40M24 28H28M36 28H40M24 36H28M36 36H40" stroke="url(#otel-gradient)" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    villa: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="villa-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <path d="M12 36L32 16L52 36V52H12V36Z" fill="url(#villa-gradient)" opacity="0.2"/>
        <path d="M12 36L32 16L52 36M12 36V52H52V36" stroke="url(#villa-gradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="32" cy="28" r="4" fill="url(#villa-gradient)"/>
        <rect x="24" y="40" width="16" height="12" stroke="url(#villa-gradient)" strokeWidth="2"/>
      </svg>
    ),
    'kamp-alani': (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="kamp-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#84cc16" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
        <path d="M16 48L32 16L48 48H16Z" fill="url(#kamp-gradient)" opacity="0.2"/>
        <path d="M16 48L32 16L48 48H16Z" stroke="url(#kamp-gradient)" strokeWidth="3" strokeLinejoin="round"/>
        <path d="M24 48V40L32 32L40 40V48" stroke="url(#kamp-gradient)" strokeWidth="2"/>
      </svg>
    ),

    // Photography & Video
    fotograf: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="fotograf-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <rect x="12" y="20" width="40" height="28" rx="4" fill="url(#fotograf-gradient)" opacity="0.2"/>
        <rect x="12" y="20" width="40" height="28" rx="4" stroke="url(#fotograf-gradient)" strokeWidth="3"/>
        <circle cx="32" cy="34" r="8" stroke="url(#fotograf-gradient)" strokeWidth="3"/>
        <circle cx="44" cy="26" r="2" fill="url(#fotograf-gradient)"/>
      </svg>
    ),
    'video-produksiyon': (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="video-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        <rect x="12" y="20" width="32" height="24" rx="2" fill="url(#video-gradient)" opacity="0.2"/>
        <rect x="12" y="20" width="32" height="24" rx="2" stroke="url(#video-gradient)" strokeWidth="3"/>
        <path d="M44 26L52 22V42L44 38V26Z" fill="url(#video-gradient)" opacity="0.5"/>
        <path d="M26 28L34 32L26 36V28Z" fill="url(#video-gradient)"/>
      </svg>
    ),
    'drone-cekim': (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="drone-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <circle cx="20" cy="20" r="6" stroke="url(#drone-gradient)" strokeWidth="2"/>
        <circle cx="44" cy="20" r="6" stroke="url(#drone-gradient)" strokeWidth="2"/>
        <circle cx="20" cy="44" r="6" stroke="url(#drone-gradient)" strokeWidth="2"/>
        <circle cx="44" cy="44" r="6" stroke="url(#drone-gradient)" strokeWidth="2"/>
        <rect x="26" y="26" width="12" height="12" rx="2" fill="url(#drone-gradient)" opacity="0.3"/>
        <path d="M20 20L26 26M44 20L38 26M20 44L26 38M44 44L38 38" stroke="url(#drone-gradient)" strokeWidth="2"/>
      </svg>
    ),

    // Catering & Food
    catering: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="catering-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>
        <circle cx="32" cy="28" r="12" fill="url(#catering-gradient)" opacity="0.2"/>
        <path d="M20 28C20 21.4 25.4 16 32 16C38.6 16 44 21.4 44 28" stroke="url(#catering-gradient)" strokeWidth="3" strokeLinecap="round"/>
        <path d="M16 28H48" stroke="url(#catering-gradient)" strokeWidth="3" strokeLinecap="round"/>
        <path d="M20 28L24 48H40L44 28" stroke="url(#catering-gradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    'pasta-tatli': (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="pasta-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>
        </defs>
        <rect x="16" y="36" width="32" height="16" rx="2" fill="url(#pasta-gradient)" opacity="0.2"/>
        <rect x="20" y="28" width="24" height="8" rx="2" fill="url(#pasta-gradient)" opacity="0.3"/>
        <rect x="24" y="20" width="16" height="8" rx="2" fill="url(#pasta-gradient)" opacity="0.4"/>
        <path d="M32 12V20M28 16L32 12L36 16" stroke="url(#pasta-gradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="16" y="36" width="32" height="16" rx="2" stroke="url(#pasta-gradient)" strokeWidth="3"/>
      </svg>
    ),
    'kahve-ikram': (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="kahve-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#eab308" />
          </linearGradient>
        </defs>
        <path d="M16 24H40V44C40 48.4 36.4 52 32 52H24C19.6 52 16 48.4 16 44V24Z" fill="url(#kahve-gradient)" opacity="0.2"/>
        <path d="M16 24H40V44C40 48.4 36.4 52 32 52H24C19.6 52 16 48.4 16 44V24Z" stroke="url(#kahve-gradient)" strokeWidth="3"/>
        <path d="M40 28H44C46.2 28 48 29.8 48 32V36C48 38.2 46.2 40 44 40H40" stroke="url(#kahve-gradient)" strokeWidth="3"/>
        <path d="M20 16C20 16 24 12 28 16C28 16 32 12 36 16" stroke="url(#kahve-gradient)" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  };

  return (
    <div 
      className={className}
      style={{ width: size, height: size }}
    >
      {iconMap[category]}
    </div>
  );
}
