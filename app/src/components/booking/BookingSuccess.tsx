import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ChromaticButton } from '@/components/ui/ChromaticButton';

interface BookingSuccessProps {
  onNavigate: () => void;
}

export function BookingSuccess({ onNavigate }: BookingSuccessProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.2 }}
        className="w-20 h-20 rounded-full bg-[var(--success)] flex items-center justify-center mb-6"
      >
        <motion.div
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <Check size={40} className="text-white" />
        </motion.div>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="font-display font-bold text-3xl text-[var(--chrome-white)] mb-3"
      >
        Randevunuz Alindi!
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="font-body text-[var(--muted-lead)] mb-8 max-w-xs"
      >
        Randevunuz onaylandi. Salon tarafindan teyit edilecektir.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="flex flex-col gap-3 w-full max-w-xs"
      >
        <Link to="/appointments" onClick={onNavigate}>
          <ChromaticButton fullWidth>Randevularima Git</ChromaticButton>
        </Link>
        <Link to="/" onClick={onNavigate}>
          <ChromaticButton variant="ghost" fullWidth>Ana Sayfaya Don</ChromaticButton>
        </Link>
      </motion.div>
    </div>
  );
}
