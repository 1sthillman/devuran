import { memo } from 'react';
import { motion } from 'framer-motion';
import { Check, Search } from 'lucide-react';
import { getAllCategories, type CategoryId } from '@/config/categories';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface CategorySelectionProps {
  value: CategoryId;
  onChange: (category: CategoryId) => void;
}

const CategoryButton = memo(({ 
  category, 
  isSelected, 
  onClick 
}: { 
  category: any; 
  isSelected: boolean; 
  onClick: () => void;
}) => {
  const IconComponent = category.icon;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative overflow-hidden p-4 rounded-3xl border-2 transition-all w-full aspect-square",
        isSelected
          ? "border-purple-500/60 bg-gradient-to-br from-purple-500/15 via-fuchsia-500/10 to-pink-500/15 shadow-lg shadow-purple-500/20"
          : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]"
      )}
    >
      {isSelected && (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 pointer-events-none" />
      )}
      
      <div className="relative flex flex-col items-center justify-center gap-2 h-full">
        <div className={cn(
          "w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all",
          isSelected 
            ? "bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30" 
            : "bg-white/5"
        )}>
          <IconComponent 
            size={24} 
            className={cn("sm:size-7", isSelected ? "text-white" : "text-[var(--muted-lead)]")}
            strokeWidth={isSelected ? 2.5 : 2} 
          />
        </div>
        
        <span className={cn(
          "font-heading font-semibold text-xs sm:text-sm text-center leading-tight line-clamp-2",
          isSelected ? "text-[var(--chrome-white)]" : "text-[var(--muted-lead)]"
        )}>
          {category.name}
        </span>
      </div>
      
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-lg"
        >
          <Check size={14} strokeWidth={3} className="text-white" />
        </motion.div>
      )}
    </motion.button>
  );
});

export function CategorySelection({ value, onChange }: CategorySelectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const allCategories = getAllCategories();
  
  const filteredCategories = allCategories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Info Badge - Minimal */}
      <div className="flex-shrink-0 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 mb-3 mx-auto">
        <p className="text-sm text-[var(--silver-frost)] text-center font-medium">
          İşletmenizin kategorisini seçin
        </p>
      </div>

      {/* Search - Compact */}
      <div className="flex-shrink-0 relative mb-3">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-lead)]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Kategori ara..."
          className="w-full h-10 pl-11 pr-4 rounded-full bg-white/5 border border-white/10 text-[var(--chrome-white)] text-sm placeholder:text-[var(--ash)] outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all"
        />
      </div>

      {/* Categories Grid - MAXIMUM WIDTH */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2.5 sm:gap-3 auto-rows-min pb-2">
          {filteredCategories.map((cat) => (
            <CategoryButton
              key={cat.id}
              category={cat}
              isSelected={value === cat.id}
              onClick={() => onChange(cat.id)}
            />
          ))}
        </div>
        
        {filteredCategories.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-[var(--muted-lead)]">Kategori bulunamadı</p>
          </div>
        )}
      </div>
    </div>
  );
}
