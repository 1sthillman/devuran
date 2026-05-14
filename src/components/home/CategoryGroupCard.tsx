import { motion } from 'framer-motion';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { type CategoryGroup } from '@/config/categories';
import { cn } from '@/lib/utils';

interface CategoryGroupCardProps {
  group: CategoryGroup;
  isActive: boolean;
  onClick: () => void;
  index: number;
  sampleCategory: string;
}

export function CategoryGroupCard({ group, isActive, onClick, index, sampleCategory }: CategoryGroupCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={onClick}
      className={cn(
        "group relative p-5 rounded-2xl border-2 transition-all duration-300",
        "hover:scale-105",
        isActive
          ? "border-white/30 shadow-2xl"
          : "border-white/5 hover:border-white/15"
      )}
    >
      {/* Gradient Background */}
      <div 
        className={cn(
          "absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300",
          isActive ? "opacity-100" : "group-hover:opacity-30"
        )}
        style={{
          background: `linear-gradient(135deg, ${group.color.replace('from-', '').replace('to-', '').split(' ').map(c => `var(--${c})`).join(', ')})`,
          opacity: isActive ? 0.12 : 0.05,
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-3">
        {/* Icon Container */}
        <div className={cn(
          "w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300",
          isActive 
            ? "bg-white/15 shadow-lg" 
            : "bg-white/5 group-hover:bg-white/10"
        )}>
          <CategoryIcon 
            category={sampleCategory as any} 
            size={32}
          />
        </div>

        {/* Text */}
        <div className="text-center space-y-0.5">
          <h3 className={cn(
            "font-heading font-bold text-sm transition-colors leading-tight",
            isActive 
              ? "text-white" 
              : "text-[var(--chrome-white)] group-hover:text-white"
          )}>
            {group.name}
          </h3>
          <p className={cn(
            "font-body text-[10px] transition-colors line-clamp-1",
            isActive
              ? "text-white/70"
              : "text-[var(--muted-lead)] group-hover:text-[var(--silver-frost)]"
          )}>
            {group.categories.length} kategori
          </p>
        </div>

        {/* Active Indicator */}
        {isActive && (
          <motion.div
            layoutId="activeGroupIndicator"
            className="absolute inset-0 rounded-2xl border-2 border-white/40"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
      </div>
    </motion.button>
  );
}
