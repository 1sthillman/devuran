import { motion } from 'framer-motion';
import { User, Store, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModernRoleSelectionProps {
  selectedRole: 'customer' | 'owner';
  onRoleChange: (role: 'customer' | 'owner') => void;
}

export function ModernRoleSelection({ selectedRole, onRoleChange }: ModernRoleSelectionProps) {
  const roles = [
    {
      id: 'customer' as const,
      title: 'Müşteri',
      description: 'Randevu Al & Keşfet',
      icon: User,
      gradient: 'from-blue-500 via-cyan-500 to-teal-500',
      features: ['Hızlı Randevu', 'Salon Keşfet', 'Yorumlar']
    },
    {
      id: 'owner' as const,
      title: 'İşletme',
      description: 'Yönet & Kazan',
      icon: Store,
      gradient: 'from-purple-500 via-pink-500 to-fuchsia-500',
      features: ['Randevu Yönetimi', 'Müşteri Takibi', 'Gelir Analizi']
    }
  ];

  return (
    <div className="space-y-3">
      <div className="text-center mb-4">
        <h3 className="font-heading font-bold text-lg text-[var(--chrome-white)] mb-1">
          Hesap Tipini Seçin
        </h3>
        <p className="text-xs text-[var(--muted-lead)]">
          Size en uygun seçeneği belirleyin
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {roles.map((role) => {
          const Icon = role.icon;
          const isSelected = selectedRole === role.id;

          return (
            <motion.button
              key={role.id}
              type="button"
              onClick={() => onRoleChange(role.id)}
              className={cn(
                "relative overflow-hidden p-5 rounded-3xl border-2 transition-all text-left",
                isSelected
                  ? "border-purple-500/60 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent shadow-xl shadow-purple-500/20"
                  : "border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Background Gradient */}
              {isSelected && (
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 pointer-events-none" />
              )}

              {/* Selection Indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-lg"
                >
                  <Check size={14} className="text-white" strokeWidth={3} />
                </motion.div>
              )}

              {/* Content */}
              <div className="relative space-y-3">
                {/* Icon */}
                <div className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center transition-all",
                  isSelected
                    ? `bg-gradient-to-br ${role.gradient} shadow-lg`
                    : "bg-white/5"
                )}>
                  <Icon 
                    size={24} 
                    className={isSelected ? "text-white" : "text-[var(--muted-lead)]"} 
                    strokeWidth={isSelected ? 2.5 : 2}
                  />
                </div>

                {/* Title & Description */}
                <div>
                  <h4 className={cn(
                    "font-heading font-bold text-base mb-1",
                    isSelected ? "text-[var(--chrome-white)]" : "text-[var(--muted-lead)]"
                  )}>
                    {role.title}
                  </h4>
                  <p className="text-xs text-[var(--muted-lead)]">
                    {role.description}
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
                  {role.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className={cn(
                        "w-1 h-1 rounded-full",
                        isSelected ? "bg-purple-400" : "bg-white/20"
                      )} />
                      <span className="text-xs text-[var(--silver-frost)]">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Info Badge */}
      {selectedRole && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-3xl bg-gradient-to-r from-purple-500/10 via-pink-500/5 to-transparent border border-purple-500/20"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <Sparkles size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[var(--silver-frost)] leading-relaxed">
                {selectedRole === 'customer' 
                  ? 'Binlerce salonu keşfet, anında randevu al, deneyimini paylaş'
                  : 'İşletmeni dijital dünyada yönet, randevularını takip et, gelirini artır'}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
