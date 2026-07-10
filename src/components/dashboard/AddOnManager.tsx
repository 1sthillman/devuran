import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Check, X, Sparkles } from 'lucide-react';
import type { ServiceAddOn } from '@/types';
import { cn } from '@/lib/utils';

interface AddOnManagerProps {
  addOns: ServiceAddOn[];
  onChange: (addOns: ServiceAddOn[]) => void;
}

export const AddOnManager = ({ addOns, onChange }: AddOnManagerProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ServiceAddOn>>({
    name: '',
    description: '',
    price: 0,
    priceType: 'fixed',
    isActive: true,
    maxQuantity: 10,
    minQuantity: 1,
    allowPartialDays: true,
  });

  const handleAdd = () => {
    if (!formData.name || !formData.price) return;
    
    const newAddOn: ServiceAddOn = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description,
      price: formData.price,
      priceType: formData.priceType || 'fixed',
      isActive: formData.isActive ?? true,
      maxQuantity: formData.maxQuantity,
      minQuantity: formData.minQuantity,
      allowPartialDays: formData.allowPartialDays,
      calculatePerGuest: formData.priceType === 'per-person' || formData.priceType === 'per-person-per-night',
      multiplyByNights: formData.priceType === 'per-night' || formData.priceType === 'per-person-per-night',
    };
    
    onChange([...addOns, newAddOn]);
    setFormData({
      name: '',
      description: '',
      price: 0,
      priceType: 'fixed',
      isActive: true,
      maxQuantity: 10,
      minQuantity: 1,
      allowPartialDays: true,
    });
    setIsAdding(false);
  };

  const handleEdit = (id: string) => {
    const addOn = addOns.find(a => a.id === id);
    if (addOn) {
      setFormData(addOn);
      setEditingId(id);
      setIsAdding(true);
    }
  };

  const handleUpdate = () => {
    if (!editingId || !formData.name || !formData.price) return;
    
    onChange(addOns.map(a => a.id === editingId ? {
      ...a,
      ...formData,
      calculatePerGuest: formData.priceType === 'per-person' || formData.priceType === 'per-person-per-night',
      multiplyByNights: formData.priceType === 'per-night' || formData.priceType === 'per-person-per-night',
    } as ServiceAddOn : a));
    
    setFormData({
      name: '',
      description: '',
      price: 0,
      priceType: 'fixed',
      isActive: true,
      maxQuantity: 10,
      minQuantity: 1,
      allowPartialDays: true,
    });
    setEditingId(null);
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    onChange(addOns.filter(a => a.id !== id));
  };

  const priceTypeOptions = [
    { 
      value: 'fixed', 
      label: 'Sabit', 
      desc: 'Tek seferlik ücret',
      example: 'Havaalanı transfer: 200₺',
      formula: 'Fiyat × Adet'
    },
    { 
      value: 'per-night', 
      label: 'Gece Başı', 
      desc: 'Her gece için ücret',
      example: 'Ekstra yatak: 100₺/gece',
      formula: 'Fiyat × Gece Sayısı'
    },
    { 
      value: 'per-person', 
      label: 'Kişi Başı', 
      desc: 'Her kişi için sabit',
      example: 'Spa ücreti: 150₺/kişi',
      formula: 'Fiyat × Kişi Sayısı'
    },
    { 
      value: 'per-person-per-night', 
      label: 'Kişi × Gece', 
      desc: 'Her kişi her gün için',
      example: 'Kahvaltı: 50₺/kişi/gün',
      formula: 'Fiyat × Kişi × Gece'
    },
  ];

  return (
    <div className="space-y-3">
      {/* Mevcut Ek Hizmetler */}
      {addOns.length > 0 && (
        <div className="space-y-2">
          {addOns.map(addOn => (
            <div
              key={addOn.id}
              className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-blue-500/30 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="font-heading font-bold text-sm text-[var(--chrome-white)]">
                      {addOn.name}
                    </h5>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-semibold",
                      addOn.priceType === 'fixed' && "bg-gray-500/20 text-gray-300",
                      addOn.priceType === 'per-night' && "bg-blue-500/20 text-blue-300",
                      addOn.priceType === 'per-person' && "bg-purple-500/20 text-purple-300",
                      addOn.priceType === 'per-person-per-night' && "bg-pink-500/20 text-pink-300"
                    )}>
                      {priceTypeOptions.find(o => o.value === addOn.priceType)?.label}
                    </span>
                  </div>
                  {addOn.description && (
                    <p className="text-xs text-[var(--muted-lead)] mb-1">{addOn.description}</p>
                  )}
                  <p className="text-sm font-bold text-blue-400">{addOn.price}₺</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleEdit(addOn.id)}
                    className="p-2 rounded-lg hover:bg-blue-500/10 text-blue-400 transition-all"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(addOn.id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Yeni Ek Hizmet Ekle Butonu */}
      {!isAdding && (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="w-full p-3 rounded-xl border-2 border-dashed border-blue-500/30 hover:border-blue-500/50 text-blue-400 hover:bg-blue-500/5 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          <span className="font-semibold text-sm">Yeni Ek Hizmet Ekle</span>
        </button>
      )}

      {/* Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-blue-400" />
                <h4 className="font-heading font-bold text-sm text-blue-300">
                  {editingId ? 'Ek Hizmeti Düzenle' : 'Yeni Ek Hizmet'}
                </h4>
              </div>

              {/* İsim */}
              <div>
                <label className="block text-xs font-semibold text-[var(--chrome-white)] mb-1">
                  Hizmet Adı *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Örn: Kahvaltı, Ekstra Yatak"
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-[var(--chrome-white)] text-sm focus:outline-none focus:border-blue-500/50"
                />
              </div>

              {/* Açıklama */}
              <div>
                <label className="block text-xs font-semibold text-[var(--chrome-white)] mb-1">
                  Açıklama
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Hizmet hakkında kısa açıklama"
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-[var(--chrome-white)] text-sm focus:outline-none focus:border-blue-500/50 resize-none"
                />
              </div>

              {/* Fiyat */}
              <div>
                <label className="block text-xs font-semibold text-[var(--chrome-white)] mb-1">
                  Fiyat (₺) *
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  placeholder="0"
                  min="0"
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-[var(--chrome-white)] text-sm focus:outline-none focus:border-blue-500/50"
                />
              </div>

              {/* Fiyatlandırma Tipi */}
              <div>
                <label className="block text-xs font-semibold text-[var(--chrome-white)] mb-2">
                  Fiyatlandırma Mantığı *
                </label>
                <div className="space-y-2">
                  {priceTypeOptions.map(option => {
                    const isSelected = formData.priceType === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, priceType: option.value as any })}
                        className={cn(
                          "w-full p-2.5 rounded-lg border text-left transition-all",
                          isSelected
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-white/[0.08] hover:border-blue-500/30"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <div className={cn(
                            "w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center flex-shrink-0",
                            isSelected ? "border-blue-500 bg-blue-500" : "border-white/20"
                          )}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-xs text-[var(--chrome-white)] mb-0.5">
                              {option.label} <span className="text-[var(--muted-lead)] font-normal">- {option.desc}</span>
                            </p>
                            <p className="text-xs text-blue-300/70 font-mono">
                              {option.formula}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Min/Max Miktar */}
              {(formData.priceType === 'per-night' || formData.priceType === 'per-person-per-night') && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--chrome-white)] mb-1">
                      Min. Gün
                    </label>
                    <input
                      type="number"
                      value={formData.minQuantity}
                      onChange={(e) => setFormData({ ...formData, minQuantity: Number(e.target.value) })}
                      min="1"
                      className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-[var(--chrome-white)] text-sm focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--chrome-white)] mb-1">
                      Max. Gün
                    </label>
                    <input
                      type="number"
                      value={formData.maxQuantity}
                      onChange={(e) => setFormData({ ...formData, maxQuantity: Number(e.target.value) })}
                      min="1"
                      className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-[var(--chrome-white)] text-sm focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                </div>
              )}

              {/* Butonlar */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={editingId ? handleUpdate : handleAdd}
                  disabled={!formData.name || !formData.price}
                  className="flex-1 py-2 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Check size={16} />
                  {editingId ? 'Güncelle' : 'Ekle'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingId(null);
                    setFormData({
                      name: '',
                      description: '',
                      price: 0,
                      priceType: 'fixed',
                      isActive: true,
                      maxQuantity: 10,
                      minQuantity: 1,
                      allowPartialDays: true,
                    });
                  }}
                  className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-[var(--muted-lead)] hover:text-white font-semibold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <X size={16} />
                  İptal
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
