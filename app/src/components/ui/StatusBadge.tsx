import { cn } from '@/lib/utils';

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'Beklemede', color: 'bg-yellow-500/20 text-yellow-500' },
  confirmed: { label: 'Onaylandi', color: 'bg-green-500/20 text-green-500' },
  completed: { label: 'Tamamlandi', color: 'bg-blue-500/20 text-blue-500' },
  cancelled: { label: 'Iptal', color: 'bg-red-500/20 text-red-500' },
  no_show: { label: 'Gelmedi', color: 'bg-gray-500/20 text-gray-500' },
  upcoming: { label: 'Yaklasan', color: 'bg-purple-500/20 text-purple-500' },
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
  no_show: 'bg-[#E5483E]/15 text-[#E5483E]',
  upcoming: 'liquid-glass-pill text-[var(--chrome-white)]',
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
