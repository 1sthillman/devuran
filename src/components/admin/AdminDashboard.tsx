// @ts-nocheck
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  Ban,
  Star,
  Activity,
} from 'lucide-react';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  todayRegistrations: number;
  premiumUsers: number;
  totalBusinesses: number;
  activeBusinesses: number;
  pendingApprovals: number;
  totalReservations: number;
  todayReservations: number;
  cancelledReservations: number;
  monthlyRevenue: number;
  dailyRevenue: number;
  activeSubscriptions: number;
  cancelledSubscriptions: number;
  supportTickets: number;
  averageRating: number;
}

interface AdminDashboardProps {
  onNavigate?: (tab: 'users' | 'businesses' | 'subscriptions' | 'notifications') => void;
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    todayRegistrations: 0,
    premiumUsers: 0,
    totalBusinesses: 0,
    activeBusinesses: 0,
    pendingApprovals: 0,
    totalReservations: 0,
    todayReservations: 0,
    cancelledReservations: 0,
    monthlyRevenue: 0,
    dailyRevenue: 0,
    activeSubscriptions: 0,
    cancelledSubscriptions: 0,
    supportTickets: 0,
    averageRating: 0,
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'today' | '7days' | '30days' | '90days'>('30days');

  useEffect(() => {
    loadDashboardStats();
  }, [timeRange]);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Kullanıcı istatistikleri
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      
      const totalUsers = allUsers.length;
      const activeUsers = allUsers.filter((u: any) => !u.isDeleted && !u.isBanned).length;
      const premiumUsers = allUsers.filter((u: any) => u.isPremium).length;
      const todayUsers = allUsers.filter((u: any) => {
        if (!u.createdAt) return false;
        const createdAt = typeof u.createdAt === 'string' 
          ? new Date(u.createdAt) 
          : u.createdAt.toDate?.() || new Date(u.createdAt);
        return createdAt >= todayStart;
      }).length;

      // İşletme istatistikleri
      const businessesSnapshot = await getDocs(collection(db, 'salons'));
      const allBusinesses = businessesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      
      const totalBusinesses = allBusinesses.length;
      const activeBusinesses = allBusinesses.filter(b => b.isActive && b.isApproved).length;
      const pendingApprovals = allBusinesses.filter(b => !b.isApproved && b.approvalStatus === 'pending').length;

      // Rezervasyon istatistikleri
      const reservationsSnapshot = await getDocs(collection(db, 'reservations'));
      const allReservations = reservationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const totalReservations = allReservations.length;
      const todayReservations = allReservations.filter(r => {
        if (!r.createdAt) return false;
        const createdAt = typeof r.createdAt === 'string' 
          ? new Date(r.createdAt) 
          : r.createdAt.toDate?.() || new Date(r.createdAt);
        return createdAt >= todayStart;
      }).length;
      const cancelledReservations = allReservations.filter(r => r.status === 'cancelled').length;

      // Abonelik istatistikleri
      const subscriptionsSnapshot = await getDocs(collection(db, 'subscriptions'));
      const allSubscriptions = subscriptionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const activeSubscriptions = allSubscriptions.filter(s => s.status === 'active').length;
      const cancelledSubscriptions = allSubscriptions.filter(s => s.status === 'cancelled').length;

      // Ödeme istatistikleri
      const paymentsSnapshot = await getDocs(collection(db, 'paymentTransactions'));
      const allPayments = paymentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const monthlyRevenue = allPayments
        .filter(p => {
          if (!p.createdAt || p.status !== 'completed') return false;
          const createdAt = typeof p.createdAt === 'string' 
            ? new Date(p.createdAt) 
            : p.createdAt.toDate?.() || new Date(p.createdAt);
          return createdAt >= monthStart;
        })
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      const dailyRevenue = allPayments
        .filter(p => {
          if (!p.createdAt || p.status !== 'completed') return false;
          const createdAt = typeof p.createdAt === 'string' 
            ? new Date(p.createdAt) 
            : p.createdAt.toDate?.() || new Date(p.createdAt);
          return createdAt >= todayStart;
        })
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      // Destek talepleri
      const ticketsSnapshot = await getDocs(collection(db, 'support_tickets'));
      const openTickets = ticketsSnapshot.docs.filter(doc => 
        doc.data().status === 'open' || doc.data().status === 'pending'
      ).length;

      // Ortalama puan hesaplama
      const ratingsSum = allBusinesses.reduce((sum, b) => sum + (b.rating || 0), 0);
      const averageRating = allBusinesses.length > 0 ? ratingsSum / allBusinesses.length : 0;

      setStats({
        totalUsers,
        activeUsers,
        todayRegistrations: todayUsers,
        premiumUsers,
        totalBusinesses,
        activeBusinesses,
        pendingApprovals,
        totalReservations,
        todayReservations,
        cancelledReservations,
        monthlyRevenue,
        dailyRevenue,
        activeSubscriptions,
        cancelledSubscriptions,
        supportTickets: openTickets,
        averageRating,
      });
    } catch (error) {
      console.error('Dashboard stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Toplam Kullanıcı',
      value: stats.totalUsers,
      change: '+12%',
      trend: 'up',
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Aktif İşletme',
      value: stats.activeBusinesses,
      change: '+8%',
      trend: 'up',
      icon: Building2,
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Bugünkü Rezervasyon',
      value: stats.todayReservations,
      change: '+15%',
      trend: 'up',
      icon: Calendar,
      color: 'from-green-500 to-emerald-500',
    },
    {
      title: 'Aylık Gelir',
      value: `₺${stats.monthlyRevenue.toLocaleString()}`,
      change: '+23%',
      trend: 'up',
      icon: DollarSign,
      color: 'from-orange-500 to-red-500',
    },
    {
      title: 'Aktif Abonelik',
      value: stats.activeSubscriptions,
      change: '+5%',
      trend: 'up',
      icon: Package,
      color: 'from-indigo-500 to-purple-500',
    },
    {
      title: 'Bekleyen Onay',
      value: stats.pendingApprovals,
      change: '-3%',
      trend: 'down',
      icon: Clock,
      color: 'from-yellow-500 to-orange-500',
    },
    {
      title: 'Destek Talebi',
      value: stats.supportTickets,
      change: '+2',
      trend: 'up',
      icon: AlertCircle,
      color: 'from-red-500 to-pink-500',
    },
    {
      title: 'Ortalama Puan',
      value: stats.averageRating.toFixed(1),
      change: '+0.2',
      trend: 'up',
      icon: Star,
      color: 'from-amber-500 to-yellow-500',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-white/60 mt-1">Sistem genel görünümü</p>
        </div>

        {/* Time Range Filter */}
        <div className="flex gap-2">
          {(['today', '7days', '30days', '90days'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${timeRange === range
                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                }
              `}
            >
              {range === 'today' && 'Bugün'}
              {range === '7days' && '7 Gün'}
              {range === '30days' && '30 Gün'}
              {range === '90days' && '90 Gün'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          const TrendIcon = card.trend === 'up' ? TrendingUp : TrendingDown;
          
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl blur-xl"
                style={{ background: `linear-gradient(to bottom right, ${card.color})` }}
              />
              <div className="relative bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${
                    card.trend === 'up' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    <TrendIcon className="w-4 h-4" />
                    <span>{card.change}</span>
                  </div>
                </div>
                <h3 className="text-white/60 text-sm font-medium mb-1">{card.title}</h3>
                <p className="text-3xl font-bold text-white">{card.value}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Kullanıcı Büyümesi</h3>
          <div className="h-64">
            <Line
              data={{
                labels: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz'],
                datasets: [
                  {
                    label: 'Kullanıcılar',
                    data: [120, 190, 300, 500, 700, 850],
                    borderColor: 'rgb(168, 85, 247)',
                    backgroundColor: 'rgba(168, 85, 247, 0.1)',
                    fill: true,
                    tension: 0.4,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  y: {
                    ticks: { color: 'rgba(255, 255, 255, 0.6)' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                  },
                  x: {
                    ticks: { color: 'rgba(255, 255, 255, 0.6)' },
                    grid: { display: false },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Gelir Grafiği</h3>
          <div className="h-64">
            <Bar
              data={{
                labels: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz'],
                datasets: [
                  {
                    label: 'Gelir (₺)',
                    data: [12000, 19000, 30000, 50000, 70000, 85000],
                    backgroundColor: 'rgba(168, 85, 247, 0.8)',
                    borderRadius: 8,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  y: {
                    ticks: { color: 'rgba(255, 255, 255, 0.6)' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                  },
                  x: {
                    ticks: { color: 'rgba(255, 255, 255, 0.6)' },
                    grid: { display: false },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Hızlı İşlemler</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button 
            onClick={() => onNavigate?.('users')}
            className="p-4 bg-white/5 hover:bg-white/10 rounded-xl text-white/80 hover:text-white transition-all text-sm font-medium group"
          >
            <Ban className="w-5 h-5 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            Kullanıcı Yönetimi
          </button>
          <button 
            onClick={() => onNavigate?.('businesses')}
            className="p-4 bg-white/5 hover:bg-white/10 rounded-xl text-white/80 hover:text-white transition-all text-sm font-medium group"
          >
            <CheckCircle className="w-5 h-5 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            İşletme Onayla
          </button>
          <button 
            onClick={() => onNavigate?.('subscriptions')}
            className="p-4 bg-white/5 hover:bg-white/10 rounded-xl text-white/80 hover:text-white transition-all text-sm font-medium group"
          >
            <Package className="w-5 h-5 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            Abonelik Yönetimi
          </button>
          <button 
            onClick={() => onNavigate?.('notifications')}
            className="p-4 bg-white/5 hover:bg-white/10 rounded-xl text-white/80 hover:text-white transition-all text-sm font-medium group"
          >
            <Activity className="w-5 h-5 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            Bildirim Gönder
          </button>
        </div>
      </div>
    </div>
  );
}
