import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { StaffForm } from '@/components/dashboard/StaffForm';
import type { Salon, Staff } from '@/types';

interface StaffModuleProps {
  salon: Salon;
  staff: Staff[];
  onSaveStaff: (data: Omit<Staff, 'id'>) => Promise<void>;
  onDeleteStaff: (id: string) => Promise<void>;
}

export function StaffModule({
  salon,
  staff,
  onSaveStaff,
  onDeleteStaff
}: StaffModuleProps) {
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  return (
    <div className="space-y-4">
      {/* Add Staff Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          setSelectedStaff(null);
          setShowStaffForm(true);
        }}
        className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-heading font-bold text-sm shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2.5"
      >
        <Users size={20} strokeWidth={2.5} />
        <span>Yeni Personel Ekle</span>
      </motion.button>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staff.map((member) => (
          <div
            key={member.id}
            className="obsidian-card p-5 text-center hover:border-[var(--liquid-chrome)] transition-colors cursor-pointer"
            onClick={() => {
              setSelectedStaff(member);
              setShowStaffForm(true);
            }}
          >
            <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-3 bg-[var(--slate-elevated)]">
              {member.photo && (
                <img
                  src={member.photo}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <h3 className="font-heading font-semibold text-[var(--chrome-white)]">
              {member.name}
            </h3>
            <p className="font-body text-sm text-[var(--muted-lead)]">{member.title}</p>
            <p className="font-mono text-sm text-[var(--silver-frost)] mt-1">
              ⭐ {member.rating} ({member.reviewCount})
            </p>
            <div className="flex flex-wrap gap-1 justify-center mt-2">
              {member.specialties.slice(0, 2).map((spec) => (
                <span
                  key={spec}
                  className="px-2 py-0.5 rounded-xl bg-white/5 text-[var(--muted-lead)] font-body text-xs"
                >
                  {spec}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Staff Form Modal */}
      {showStaffForm && (
        <StaffForm
          salonId={salon.id}
          staff={selectedStaff || undefined}
          onSave={async (data) => {
            await onSaveStaff(data);
            setShowStaffForm(false);
            setSelectedStaff(null);
          }}
          onDelete={selectedStaff ? async () => {
            await onDeleteStaff(selectedStaff.id);
            setShowStaffForm(false);
            setSelectedStaff(null);
          } : undefined}
          onClose={() => {
            setShowStaffForm(false);
            setSelectedStaff(null);
          }}
        />
      )}
    </div>
  );
}
