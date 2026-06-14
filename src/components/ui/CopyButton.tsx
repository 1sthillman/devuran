import { useState } from 'react';
import { Copy, Check, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CopyButtonProps {
  text: string;
  onCopy?: () => void;
  variant?: 'icon' | 'button';
  label?: string;
  size?: 'sm' | 'md';
}

export function CopyButton({ text, onCopy, variant = 'icon', label, size = 'md' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopy?.();
      
      // Yıldızlar oluştur
      const newSparkles = Array.from({ length: 8 }, (_, i) => ({
        id: Date.now() + i,
        x: Math.cos((i * Math.PI * 2) / 8) * 30,
        y: Math.sin((i * Math.PI * 2) / 8) * 30,
      }));
      setSparkles(newSparkles);
      
      // Temizle
      setTimeout(() => {
        setCopied(false);
        setSparkles([]);
      }, 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const iconSize = size === 'sm' ? 14 : 16;
  const buttonSize = size === 'sm' ? 'w-9 h-9' : 'w-10 h-10';

  if (variant === 'button') {
    return (
      <button
        onClick={handleCopy}
        disabled={copied}
        className="relative flex-1 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center gap-2 transition-all group disabled:opacity-100 overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {copied ? (
            <motion.div
              key="copied"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              className="flex items-center gap-2"
            >
              <Check size={14} className="text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400">Kopyalandı!</span>
            </motion.div>
          ) : (
            <motion.div
              key="copy"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="flex items-center gap-2"
            >
              <Copy size={14} className="text-[var(--muted-lead)] group-hover:text-[var(--chrome-white)]" />
              <span className="text-xs font-semibold text-[var(--muted-lead)] group-hover:text-[var(--chrome-white)]">{label || 'Kopyala'}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Yıldızlar */}
        <AnimatePresence>
          {sparkles.map((sparkle) => (
            <motion.div
              key={sparkle.id}
              initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
              animate={{ 
                x: sparkle.x, 
                y: sparkle.y, 
                opacity: 0,
                scale: 1
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="absolute"
            >
              <Sparkles size={12} className="text-emerald-400" />
            </motion.div>
          ))}
        </AnimatePresence>
      </button>
    );
  }

  return (
    <button
      onClick={handleCopy}
      disabled={copied}
      className={`relative ${buttonSize} rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all disabled:opacity-100 overflow-hidden`}
      title={copied ? 'Kopyalandı!' : 'Kopyala'}
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.div
            key="check"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            <Check size={iconSize} className="text-emerald-400" />
          </motion.div>
        ) : (
          <motion.div
            key="copy"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Copy size={iconSize} className="text-[var(--muted-lead)]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Yıldız Animasyonu */}
      <AnimatePresence>
        {sparkles.map((sparkle) => (
          <motion.div
            key={sparkle.id}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
            animate={{ 
              x: sparkle.x, 
              y: sparkle.y, 
              opacity: 0,
              scale: 1
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute pointer-events-none"
          >
            <Sparkles size={10} className="text-emerald-400" />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Success pulse effect */}
      {copied && (
        <motion.div
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 rounded-full bg-emerald-400"
        />
      )}
    </button>
  );
}
