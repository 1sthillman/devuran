import { useUIStore } from '@/store/uiStore';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertCircle,
  info: Info,
};

const colors = {
  success: 'text-[#2DC24E]',
  error: 'text-[#E5483E]',
  warning: 'text-[#E5A522]',
  info: 'text-[var(--silver-frost)]',
};

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 items-center">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="liquid-glass flex items-center gap-3 px-5 py-3 min-w-[280px]"
            >
              <Icon size={18} className={colors[toast.type]} />
              <span className="font-heading font-medium text-sm text-[var(--chrome-white)] flex-1">
                {toast.message}
              </span>
              <button onClick={() => removeToast(toast.id)} className="text-[var(--muted-lead)] hover:text-[var(--silver-frost)]">
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
