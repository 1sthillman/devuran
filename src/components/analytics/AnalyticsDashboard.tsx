import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Users,
  Star,
  Clock,
  Scissors,
  UserCheck,
} from 'lucide-react';
import { analyticsService, type AnalyticsData } from '@/services/analyticsService';

interface AnalyticsDashboardProps {
  salonId: string;
}

export function AnalyticsDashboard({ salonId }: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year'>('month');

  useEffect(() => {
    loadAnalytics();
  }, [salonId]);

  const loadAnalytics = async () => {
    try {
      const analytics = await analyticsService.getSalonAnalytics(salonId);
      setData(analytics);
    } catch (error) {
      console.error('Analytics yüklenemedi:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-white/10 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--muted-lead)]">Veri yüklenemedi</p>
      </div>
    );
  }

  const StatCard = ({
    icon: Icon,
    label,
    value,
    trend,
    color,
  }: {
    icon: any;
    label: string;
    value: string | number;
    trend?: number;
    color: string;
  }) => (
    <div className="obsidian-card p-6 rounded-3xl">
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon size={24} style={{ color }} strokeWidth={2} />
        </div>
        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full ${
              trend >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'
            }`}
          >
            {trend >= 0 ? (
              <TrendingUp size={14} className="text-green-400" />
            ) : (
              <TrendingDown size={14} className="text-red-400" />
            )}
            <span
              className={`font-mono text-xs ${
                trend >= 0 ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {Math.abs(trend).toFixed(1)}%
            </span>
          </div>
        )}
      </div>
      <p className="font-mono font-bold text-3xl text-[var(--chrome-white)] mb-1">
        {value}
      </p>
      <p className="font-body text-sm text-[var(--muted-lead)]">{label}</p>
    </div>
  );

  const getRevenueByPeriod = () => {
    switch (period) {
      case 'today':
        return data.revenue.today;
      case 'week':
        return data.revenue.week;
      case 'month':
        return data.revenue.month;
      case 'year':
        return data.revenue.year;
    }
  };

  const getAppointmentsByPeriod = () => {
    switch (period) {
      case 'today':
        return data.appointments.today;
      case 'week':
        return data.appointments.week;
      case 'month':
        return data.appointments.month;
      default:
        return data.appointments.total;
    }
  };

  const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { key: 'today', label: 'Bugün' },
          { key: 'week', label: 'Bu Hafta' },
          { key: 'month', label: 'Bu Ay' },
          { key: 'year', label: 'Bu Yıl' },
        ].map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key as any)}
            className={`px-6 py-2 rounded-full font-heading font-semibold text-sm transition-all whitespace-nowrap ${
              period === p.key
                ? 'bg-[var(--liquid-chrome)] text-[var(--void)]'
                : 'bg-white/5 text-[var(--muted-lead)] hover:bg-white/10'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Gelir"
          value={`${getRevenueByPeriod().toLocaleString('tr-TR')} TL`}
          trend={data.revenue.trend}
          color="#10b981"
        />
        <StatCard
          icon={Calendar}
          label="Randevular"
          value={getAppointmentsByPeriod()}
          trend={data.appointments.trend}
          color="#3b82f6"
        />
        <StatCard
          icon={Users}
          label="Müşteriler"
          value={data.customers.total}
          trend={data.customers.trend}
          color="#8b5cf6"
        />
        <StatCard
          icon={Star}
          label="Ortalama Puan"
          value={data.reviews.averageRating.toFixed(1)}
          color="#f59e0b"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="obsidian-card p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-4">
            <UserCheck size={20} className="text-green-400" />
            <h3 className="font-heading font-semibold text-[var(--chrome-white)]">
              Müşteri Analizi
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-body text-sm text-[var(--muted-lead)]">Yeni Müşteri</span>
              <span className="font-mono font-semibold text-[var(--chrome-white)]">
                {data.customers.new}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-body text-sm text-[var(--muted-lead)]">Geri Dönen</span>
              <span className="font-mono font-semibold text-[var(--chrome-white)]">
                {data.customers.returning}
              </span>
            </div>
          </div>
        </div>

        <div className="obsidian-card p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-4">
            <Star size={20} className="text-yellow-400" />
            <h3 className="font-heading font-semibold text-[var(--chrome-white)]">
              Değerlendirmeler
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-body text-sm text-[var(--muted-lead)]">Toplam</span>
              <span className="font-mono font-semibold text-[var(--chrome-white)]">
                {data.reviews.totalReviews}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-body text-sm text-[var(--muted-lead)]">Son 30 Gün</span>
              <span className="font-mono font-semibold text-[var(--chrome-white)]">
                {data.reviews.recentReviews}
              </span>
            </div>
          </div>
        </div>

        <div className="obsidian-card p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-4">
            <Calendar size={20} className="text-blue-400" />
            <h3 className="font-heading font-semibold text-[var(--chrome-white)]">
              Randevu Durumu
            </h3>
          </div>
          <div className="space-y-3">
            {Object.entries(data.appointments.byStatus).slice(0, 3).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="font-body text-sm text-[var(--muted-lead)] capitalize">
                  {status === 'confirmed' ? 'Onaylı' : 
                   status === 'pending' ? 'Bekliyor' :
                   status === 'completed' ? 'Tamamlandı' : status}
                </span>
                <span className="font-mono font-semibold text-[var(--chrome-white)]">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Services */}
      <div className="obsidian-card p-6 rounded-3xl">
        <div className="flex items-center gap-3 mb-6">
          <Scissors size={24} className="text-purple-400" />
          <h3 className="font-heading font-bold text-xl text-[var(--chrome-white)]">
            En Popüler Hizmetler
          </h3>
        </div>
        <div className="space-y-3">
          {data.services.topServices.slice(0, 5).map((service, index) => (
            <div
              key={service.name}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-[var(--obsidian-rim)]"
            >
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <span className="font-mono font-bold text-purple-400">
                  {index + 1}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-semibold text-[var(--chrome-white)] truncate">
                  {service.name}
                </p>
                <p className="font-body text-sm text-[var(--muted-lead)]">
                  {service.count} randevu
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono font-bold text-[var(--liquid-chrome)]">
                  {service.revenue.toLocaleString('tr-TR')} TL
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Staff */}
      <div className="obsidian-card p-6 rounded-3xl">
        <div className="flex items-center gap-3 mb-6">
          <Users size={24} className="text-blue-400" />
          <h3 className="font-heading font-bold text-xl text-[var(--chrome-white)]">
            En İyi Performans
          </h3>
        </div>
        <div className="space-y-3">
          {data.staff.topStaff.slice(0, 5).map((staff, index) => (
            <div
              key={staff.name}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-[var(--obsidian-rim)]"
            >
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <span className="font-mono font-bold text-blue-400">
                  {index + 1}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-semibold text-[var(--chrome-white)] truncate">
                  {staff.name}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="font-body text-sm text-[var(--muted-lead)]">
                    {staff.appointments} randevu
                  </span>
                  <span className="flex items-center gap-1">
                    <Star size={12} className="fill-yellow-400 text-yellow-400" />
                    <span className="font-mono text-sm text-yellow-400">
                      {staff.rating.toFixed(1)}
                    </span>
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono font-bold text-[var(--liquid-chrome)]">
                  {staff.revenue.toLocaleString('tr-TR')} TL
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Distribution */}
      <div className="obsidian-card p-6 rounded-3xl">
        <div className="flex items-center gap-3 mb-6">
          <Clock size={24} className="text-green-400" />
          <h3 className="font-heading font-bold text-xl text-[var(--chrome-white)]">
            Haftalık Dağılım
          </h3>
        </div>
        <div className="space-y-3">
          {Object.entries(data.dailyDistribution).map(([day, count]) => {
            const maxCount = Math.max(...Object.values(data.dailyDistribution));
            const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;

            return (
              <div key={day} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-body text-sm text-[var(--chrome-white)]">
                    {dayNames[parseInt(day)]}
                  </span>
                  <span className="font-mono text-sm text-[var(--muted-lead)]">
                    {count} randevu
                  </span>
                </div>
                <div className="h-2 bg-[var(--slate-elevated)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-400 transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
