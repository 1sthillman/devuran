import { cn } from '@/lib/utils';
import { useThemeStore } from '@/store/themeStore';
import type { ReactNode } from 'react';

interface ObsidianCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  animated?: boolean;
}

export function ObsidianCard({ children, className, hover = true, onClick, animated = true }: ObsidianCardProps) {
  const { actualTheme } = useThemeStore();

  // Choose GIF based on theme - HER ZAMAN KARANLIK (SİYAH) GIF KULLAN
  const backgroundGif = '/asset/Kaliteyi_bozmadan_loop_olmasn_istiyorum_kar.gif';

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        'obsidian-card',
        hover && 'obsidian-card-hover cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {animated && (
        <>
          {/* Animated Background */}
          <div className="absolute inset-0 opacity-[0.25] pointer-events-none">
            <img
              src={backgroundGif}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
              style={{
                imageRendering: 'auto',
                willChange: 'auto',
              }}
            />
          </div>

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--slate-surface)]/95 via-[var(--slate-surface)]/90 to-[var(--slate-surface)]/95 pointer-events-none" />
        </>
      )}

      {/* Content */}
      <div className="relative">
        {children}
      </div>
    </div>
  );
}
