import { cn } from '@/lib/utils';

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'Beklemede', color: 'bg-yellow-500/20 text-yellow-500' },
  confirmed: { label: 'Onaylandı', color: 'bg-green-500/20 text-green-500' },
  completed: { label: 'Tamamlandı', color: 'bg-blue-500/20 text-blue-500' },
  cancelled: { label: 'İptal', color: 'bg-red-500/20 text-red-500' },
  cancelled_by_user: { label: 'Müşteri İptal Etti', color: 'bg-red-500/20 text-red-500' },
  cancelled_by_business: { label: 'İşletme İptal Etti', color: 'bg-orange-500/20 text-orange-500' },
  no_show: { label: 'Gelmedi', color: 'bg-gray-500/20 text-gray-500' },
  upcoming: { label: 'Yaklaşan', color: 'bg-purple-500/20 text-purple-500' },
  deposit_paid: { label: 'Depozito Ödendi', color: 'bg-cyan-500/20 text-cyan-500' },
  fully_paid: { label: 'Ödendi', color: 'bg-emerald-500/20 text-emerald-500' },
  in_progress: { label: 'Devam Ediyor', color: 'bg-indigo-500/20 text-indigo-500' },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  pending: 'bg-[#E5A522]/15 text-[#E5A522]',
  confirmed: 'bg-[#2DC24E]/15 text-[#2DC24E]',
  completed: 'bg-[var(--slate-elevated)] text-[var(--muted-lead)]',
  cancelled: 'bg-[#E5483E]/15 text-[#E5483E]',
  cancelled_by_user: 'bg-[#E5483E]/15 text-[#E5483E]',
  cancelled_by_business: 'bg-[#FF8C42]/15 text-[#FF8C42]',
  no_show: 'bg-[#E5483E]/15 text-[#E5483E]',
  upcoming: 'liquid-glass-pill text-[var(--chrome-white)]',
  deposit_paid: 'bg-[#06B6D4]/15 text-[#06B6D4]',
  fully_paid: 'bg-[#10B981]/15 text-[#10B981]',
  in_progress: 'bg-[#6366F1]/15 text-[#6366F1]',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const label = statusLabels[status]?.label || status;

  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full text-xs font-heading font-medium',
        statusStyles[status] || statusStyles.upcoming,
        className
      )}
    >
      {label}
    </span>
  );
}
