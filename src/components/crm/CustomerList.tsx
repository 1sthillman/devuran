import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Star,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  Tag,
  MessageSquare,
  Crown,
  TrendingUp,
  Ban,
} from 'lucide-react';
import { customerService, type Customer } from '@/services/customerService';
import { CustomerDetailModal } from './CustomerDetailModal';

interface CustomerListProps {
  salonId: string;
}

export function CustomerList({ salonId }: CustomerListProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'vip' | 'inactive'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadCustomers();
    loadStats();
  }, [salonId]);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchTerm, filterStatus]);

  const loadCustomers = async () => {
    try {
      const data = await customerService.getSalonCustomers(salonId);
      setCustomers(data);
    } catch (error) {
      console.error('Müşteriler yüklenemedi:', error);
    }
    setLoading(false);
  };

  const loadStats = async () => {
    try {
      const data = await customerService.getCustomerStats(salonId);
      setStats(data);
    } catch (error) {
      console.error('İstatistikler yüklenemedi:', error);
    }
  };

  const filterCustomers = () => {
    let filtered = customers;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(c => c.status === filterStatus);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        c =>
          c.name.toLowerCase().includes(term) ||
          c.phone.includes(term) ||
          c.email.toLowerCase().includes(term)
      );
    }

    setFilteredCustomers(filtered);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-white/10 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="obsidian-card p-4 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-blue-400" />
              <span className="font-body text-xs text-[var(--muted-lead)]">Toplam</span>
            </div>
            <p className="font-mono font-bold text-2xl text-[var(--chrome-white)]">
              {stats.total}
            </p>
          </div>

          <div className="obsidian-card p-4 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Crown size={16} className="text-yellow-400" />
              <span className="font-body text-xs text-[var(--muted-lead)]">VIP</span>
            </div>
            <p className="font-mono font-bold text-2xl text-[var(--chrome-white)]">
              {stats.vip}
            </p>
          </div>

          <div className="obsidian-card p-4 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={16} className="text-green-400" />
              <span className="font-body text-xs text-[var(--muted-lead)]">Ort. Harcama</span>
            </div>
            <p className="font-mono font-bold text-xl text-[var(--chrome-white)]">
              {stats.averageSpent.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL
            </p>
          </div>

          <div className="obsidian-card p-4 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={16} className="text-purple-400" />
              <span className="font-body text-xs text-[var(--muted-lead)]">Ort. Ziyaret</span>
            </div>
            <p className="font-mono font-bold text-2xl text-[var(--chrome-white)]">
              {stats.averageVisits.toFixed(1)}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-lead)]"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Müşteri ara..."
            className="w-full h-12 pl-12 pr-4 rounded-full bg-[var(--slate-elevated)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-body text-sm focus:outline-none focus:border-[var(--liquid-chrome)]"
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'Tümü' },
            { key: 'active', label: 'Aktif' },
            { key: 'vip', label: 'VIP' },
            { key: 'inactive', label: 'Pasif' },
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setFilterStatus(filter.key as any)}
              className={`px-4 py-2 rounded-full font-heading font-semibold text-sm transition-all whitespace-nowrap ${
                filterStatus === filter.key
                  ? 'bg-[var(--liquid-chrome)] text-[var(--void)]'
                  : 'bg-white/5 text-[var(--muted-lead)] hover:bg-white/10'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customer List */}
      {filteredCustomers.length === 0 ? (
        <div className="obsidian-card p-12 rounded-3xl text-center">
          <p className="font-heading text-lg text-[var(--chrome-white)] mb-2">
            Müşteri bulunamadı
          </p>
          <p className="font-body text-sm text-[var(--muted-lead)]">
            Arama kriterlerinizi değiştirin
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer, index) => (
            <motion.div
              key={customer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative p-6 rounded-3xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10 hover:border-[var(--liquid-chrome)]/40 hover:shadow-lg hover:shadow-purple-500/10 transition-all cursor-pointer active:scale-[0.98]"
              onClick={() => setSelectedCustomer(customer)}
            >
              {/* Ban Badge */}
              {customer.isBanned && (
                <div className="absolute top-4 right-4">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30">
                    <Ban size={12} className="text-red-400" />
                    <span className="font-heading font-semibold text-xs text-red-400">Engelli</span>
                  </div>
                </div>
              )}

              {/* Header */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <span className="font-heading font-bold text-xl text-white">
                      {customer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-heading font-bold text-base text-[var(--chrome-white)] mb-1">
                      {customer.name}
                    </p>
                    {customer.status === 'vip' && (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
                        <Crown size={10} className="text-yellow-400" />
                        <span className="font-heading font-semibold text-xs text-yellow-400">VIP</span>
                      </div>
                    )}
                  </div>
                </div>

                {customer.rating && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/10">
                    <Star size={12} className="fill-yellow-400 text-yellow-400" />
                    <span className="font-mono text-xs font-bold text-yellow-400">
                      {customer.rating}
                    </span>
                  </div>
                )}
              </div>

              {/* Contact */}
              <div className="space-y-2 mb-5">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02]">
                  <Phone size={14} className="text-blue-400" />
                  <span className="font-mono text-sm text-[var(--chrome-white)]">
                    {customer.phone}
                  </span>
                </div>
                {customer.email && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02]">
                    <Mail size={14} className="text-purple-400" />
                    <span className="font-body text-sm text-[var(--chrome-white)] truncate">
                      {customer.email}
                    </span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-3 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                  <p className="font-mono font-bold text-lg text-[var(--chrome-white)]">
                    {customer.totalAppointments}
                  </p>
                  <p className="font-body text-xs text-[var(--muted-lead)]">Randevu</p>
                </div>
                <div className="text-center p-3 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                  <p className="font-mono font-bold text-lg text-[var(--chrome-white)]">
                    {(customer.totalSpent / 1000).toFixed(1)}K
                  </p>
                  <p className="font-body text-xs text-[var(--muted-lead)]">Harcama</p>
                </div>
                <div className="text-center p-3 rounded-2xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
                  <p className="font-mono font-bold text-lg text-[var(--chrome-white)]">
                    {customer.loyaltyPoints}
                  </p>
                  <p className="font-body text-xs text-[var(--muted-lead)]">Puan</p>
                </div>
              </div>

              {/* Last Visit */}
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.02] mb-3">
                <span className="font-body text-xs text-[var(--muted-lead)]">Son Ziyaret</span>
                <span className="font-mono text-xs font-semibold text-[var(--chrome-white)]">
                  {formatDate(customer.lastVisit)}
                </span>
              </div>

              {/* Tags */}
              {customer.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {customer.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-heading font-semibold text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Customer Detail Modal */}
      <AnimatePresence>
        {selectedCustomer && (
          <CustomerDetailModal
            customer={selectedCustomer}
            salonId={salonId}
            onClose={() => setSelectedCustomer(null)}
            onUpdate={() => {
              loadCustomers();
              loadStats();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
