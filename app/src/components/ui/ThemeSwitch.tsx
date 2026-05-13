import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';
import { motion } from 'framer-motion';

export function ThemeSwitch({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useThemeStore();

  const themes = [
    { value: 'light' as const, icon: Sun, label: 'Aydınlık' },
    { value: 'system' as const, icon: Monitor, label: 'Sistem' },
    { value: 'dark' as const, icon: Moon, label: 'Karanlık' },
  ];

  if (compact) {
    // Compact version for mobile
    return (
      <div className="flex items-center gap-0.5 p-0.5 rounded-full bg-[var(--slate-elevated)] border border-[var(--obsidian-rim)]">
        {themes.map((t) => {
          const Icon = t.icon;
          const isActive = theme === t.value;
          
          return (
            <button
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={`relative p-1.5 rounded-full transition-colors ${
                isActive
                  ? 'text-[var(--chrome-white)]'
                  : 'text-[var(--muted-lead)]'
              }`}
              title={t.label}
            >
              {isActive && (
                <motion.div
                  layoutId="theme-indicator-compact"
                  className="absolute inset-0 bg-[var(--liquid-chrome)] rounded-full"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon size={14} className="relative z-10" />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 p-1 rounded-full bg-[var(--slate-elevated)] border border-[var(--obsidian-rim)]">
      {themes.map((t) => {
        const Icon = t.icon;
        const isActive = theme === t.value;
        
        return (
          <button
            key={t.value}
            onClick={() => setTheme(t.value)}
            className={`relative px-3 py-2 rounded-full transition-colors ${
              isActive
                ? 'text-[var(--chrome-white)]'
                : 'text-[var(--muted-lead)] hover:text-[var(--silver-frost)]'
            }`}
            title={t.label}
          >
            {isActive && (
              <motion.div
                layoutId="theme-indicator"
                className="absolute inset-0 bg-[var(--liquid-chrome)] rounded-full"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <Icon size={18} className="relative z-10" />
          </button>
        );
      })}
    </div>
  );
}

