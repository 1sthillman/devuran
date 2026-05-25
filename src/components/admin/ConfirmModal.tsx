import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'success' | 'warning' | 'info';
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Onayla',
  cancelText = 'İptal',
  type = 'warning',
  loading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      icon: AlertTriangle,
      iconBg: 'from-red-500 to-rose-500',
      iconColor: 'text-white',
      confirmBg: 'from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600',
      borderColor: 'border-red-500/30',
      bgGradient: 'from-red-500/10 via-transparent to-rose-500/10',
    },
    success: {
      icon: CheckCircle,
      iconBg: 'from-green-500 to-emerald-500',
      iconColor: 'text-white',
      confirmBg: 'from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600',
      borderColor: 'border-green-500/30',
      bgGradient: 'from-green-500/10 via-transparent to-emerald-500/10',
    },
    warning: {
      icon: AlertCircle,
      iconBg: 'from-amber-500 to-orange-500',
      iconColor: 'text-white',
      confirmBg: 'from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600',
      borderColor: 'border-amber-500/30',
      bgGradient: 'from-amber-500/10 via-transparent to-orange-500/10',
    },
    info: {
      icon: Info,
      iconBg: 'from-blue-500 to-cyan-500',
      iconColor: 'text-white',
      confirmBg: 'from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600',
      borderColor: 'border-blue-500/30',
      bgGradient: 'from-blue-500/10 via-transparent to-cyan-500/10',
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'relative bg-slate-800/95 backdrop-blur-xl rounded-3xl border-2 max-w-md w-full overflow-hidden',
              config.borderColor
            )}
          >
            {/* Gradient Background */}
            <div className={cn('absolute inset-0 bg-gradient-to-br opacity-50', config.bgGradient)} />

            {/* Content */}
            <div className="relative p-6">
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className={cn(
                  'w-16 h-16 rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg',
                  config.iconBg
                )}>
                  <Icon size={32} className={config.iconColor} strokeWidth={2.5} />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-white text-center mb-3">
                {title}
              </h3>

              {/* Message */}
              <p className="text-white/70 text-center mb-6 leading-relaxed">
                {message}
              </p>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white rounded-full font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className={cn(
                    'flex-1 px-6 py-3 bg-gradient-to-r text-white rounded-full font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed',
                    config.confirmBg
                  )}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>İşleniyor...</span>
                    </div>
                  ) : (
                    confirmText
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
