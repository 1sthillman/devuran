import { useState } from 'react';
import { X, Search, Filter } from 'lucide-react';

interface AdvancedSearchModalProps {
  onClose: () => void;
  onSearch: (filters: any) => void;
}

export function AdvancedSearchModal({ onClose, onSearch }: AdvancedSearchModalProps) {
  const [filters, setFilters] = useState({
    isPremium: '',
    lastLoginDays: '',
    hasActiveBooking: '',
    hasPaymentIssue: '',
    minSpent: '',
    role: '',
    registeredAfter: '',
    registeredBefore: '',
  });

  const handleSearch = () => {
    const activeFilters: any = {};
    
    if (filters.isPremium) activeFilters.isPremium = filters.isPremium === 'true';
    if (filters.lastLoginDays) activeFilters.lastLoginDays = parseInt(filters.lastLoginDays);
    if (filters.hasActiveBooking) activeFilters.hasActiveBooking = filters.hasActiveBooking === 'true';
    if (filters.hasPaymentIssue) activeFilters.hasPaymentIssue = filters.hasPaymentIssue === 'true';
    if (filters.minSpent) activeFilters.minSpent = parseFloat(filters.minSpent);
    if (filters.role) activeFilters.role = filters.role;
    if (filters.registeredAfter) activeFilters.registeredAfter = filters.registeredAfter;
    if (filters.registeredBefore) activeFilters.registeredBefore = filters.registeredBefore;

    onSearch(activeFilters);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Filter className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-semibold text-white">Gelişmiş Arama</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Premium Status */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Premium Durumu</label>
            <select
              value={filters.isPremium}
              onChange={(e) => setFilters({ ...filters, isPremium: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
            >
              <option value="">Tümü</option>
              <option value="true">Premium</option>
              <option value="false">Ücretsiz</option>
            </select>
          </div>

          {/* Last Login */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Son Giriş (Gün)</label>
            <input
              type="number"
              value={filters.lastLoginDays}
              onChange={(e) => setFilters({ ...filters, lastLoginDays: e.target.value })}
              placeholder="Örn: 30 (son 30 günde giriş yapanlar)"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Active Booking */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Aktif Rezervasyon</label>
            <select
              value={filters.hasActiveBooking}
              onChange={(e) => setFilters({ ...filters, hasActiveBooking: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
            >
              <option value="">Tümü</option>
              <option value="true">Var</option>
              <option value="false">Yok</option>
            </select>
          </div>

          {/* Payment Issue */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Ödeme Problemi</label>
            <select
              value={filters.hasPaymentIssue}
              onChange={(e) => setFilters({ ...filters, hasPaymentIssue: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
            >
              <option value="">Tümü</option>
              <option value="true">Var</option>
              <option value="false">Yok</option>
            </select>
          </div>

          {/* Min Spent */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Minimum Harcama (₺)</label>
            <input
              type="number"
              value={filters.minSpent}
              onChange={(e) => setFilters({ ...filters, minSpent: e.target.value })}
              placeholder="Örn: 1000"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Rol</label>
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
            >
              <option value="">Tümü</option>
              <option value="customer">Müşteri</option>
              <option value="owner">İşletme Sahibi</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Registration Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Kayıt Başlangıç</label>
              <input
                type="date"
                value={filters.registeredAfter}
                onChange={(e) => setFilters({ ...filters, registeredAfter: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Kayıt Bitiş</label>
              <input
                type="date"
                value={filters.registeredBefore}
                onChange={(e) => setFilters({ ...filters, registeredBefore: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSearch}
              className="flex-1 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5" />
              Ara
            </button>
            <button
              onClick={() => {
                setFilters({
                  isPremium: '',
                  lastLoginDays: '',
                  hasActiveBooking: '',
                  hasPaymentIssue: '',
                  minSpent: '',
                  role: '',
                  registeredAfter: '',
                  registeredBefore: '',
                });
              }}
              className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"
            >
              Temizle
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"
            >
              İptal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
