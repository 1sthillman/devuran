import { useState, useEffect, type ReactNode } from 'react';

const STORAGE_KEY = 'randevu_animated_bg_enabled';

export function useAnimatedBackground() {
  const [enabled, setEnabled] = useState(() => {
    // Check localStorage on mount
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      return stored === 'true';
    }
    // Default: enabled on desktop, disabled on mobile for performance
    return window.innerWidth >= 768;
  });

  useEffect(() => {
    // Save to localStorage whenever it changes
    localStorage.setItem(STORAGE_KEY, String(enabled));
  }, [enabled]);

  const toggle = () => setEnabled(prev => !prev);

  return { enabled, toggle };
}

interface AnimatedBackgroundProps {
  opacity?: number;
}

export function AnimatedBackground({ opacity = 0.08 }: AnimatedBackgroundProps): ReactNode {
  const { enabled } = useAnimatedBackground();

  if (!enabled) return null;

  return (
    <>
      {/* Animated Background */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ opacity }}
      >
        <img
          src="/asset/Kaliteyi_bozmadan_loop_olmasn_istiyorum_kar.gif"
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
  );
}
