import { motion } from 'framer-motion';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { type Category } from '@/config/categories';
import { cn } from '@/lib/utils';

interface CategoryCardProps {
  category: Category;
  isActive: boolean;
  onClick: () => void;
  index: number;
}

export function CategoryCard({ category, isActive, onClick, index }: CategoryCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      onClick={onClick}
      className={cn(
        "group relative p-6 rounded-3xl border-2 transition-all duration-300 overflow-hidden",
        "hover:scale-105 hover:shadow-2xl",
        isActive
          ? "border-white/30 shadow-xl"
          : "border-white/5 hover:border-white/20"
      )}
    >
      {/* Gradient Background */}
      <div 
        className={cn(
          "absolute inset-0 opacity-0 transition-opacity duration-300",
          isActive ? "opacity-100" : "group-hover:opacity-50"
        )}
        style={{
          background: `linear-gradient(135deg, ${category.gradient.replace('from-', '').replace('to-', '').split(' ').map(c => `var(--${c})`).join(', ')})`,
          opacity: isActive ? 0.15 : 0.05,
        }}
      />

      {/* Glow Effect */}
      {isActive && (
        <div 
          className="absolute inset-0 blur-2xl opacity-30"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${category.gradient.replace('from-', '').split(' ')[0]}, transparent 70%)`,
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-4">
        {/* Icon */}
        <div className={cn(
          "relative transition-transform duration-300",
          isActive ? "scale-110" : "group-hover:scale-110"
        )}>
          <CategoryIcon 
            category={category.id} 
            size={64}
            className="drop-shadow-lg"
          />
        </div>

        {/* Text */}
        <div className="text-center space-y-1">
          <h3 className={cn(
            "font-heading font-bold text-base transition-colors",
            isActive 
              ? "text-white" 
              : "text-[var(--chrome-white)] group-hover:text-white"
          )}>
            {category.name}
          </h3>
          <p className={cn(
            "font-body text-xs leading-relaxed transition-colors line-clamp-2",
            isActive
              ? "text-white/80"
              : "text-[var(--muted-lead)] group-hover:text-[var(--silver-frost)]"
          )}>
            {category.description}
          </p>
        </div>

        {/* Active Indicator */}
        {isActive && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-white to-white/80 shadow-lg flex items-center justify-center"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--void)]"/>
            </svg>
          </motion.div>
        )}
      </div>
    </motion.button>
  );
}
