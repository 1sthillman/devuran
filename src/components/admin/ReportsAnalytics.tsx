import { useEffect, useState } from 'react';
import { TrendingUp, Users, Building2, Calendar, DollarSign, BarChart3, Download, Filter } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface AnalyticsData {
  totalUsers: number;
  totalBusinesses: number;
  totalReservations: number;
  totalRevenue: number;
  activeSubscriptions: number;
  monthlyGrowth: {
    users: number;
    businesses: number;
    revenue: number;
  };
  topCategories: { name: string; count: number }[];
  recentActivity: { date: string; users: number; businesses: number; revenue: number }[];
}

export function ReportsAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalUsers: 0,
    totalBusinesses: 0,
    totalReservations: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
    monthlyGrowth: { users: 0, businesses: 0, revenue: 0 },
    topCategories: [],
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Load users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const totalUsers = usersSnapshot.size;

      // Load businesses
      const businessesSnapshot = await getDocs(collection(db, 'salons'));
      const totalBusinesses = businessesSnapshot.size;

      // Load reservations
      const reservationsSnapshot = await getDocs(collection(db, 'appointments'));
      const totalReservations = reservationsSnapshot.size;

      // Load subscriptions
      const subscriptionsSnapshot = await getDocs(collection(db, 'subscriptions'));
      const activeSubscriptions = subscriptionsSnapshot.docs.filter(doc => doc.data().status === 'active').length;
      
      // Calculate revenue
      const totalRevenue = subscriptionsSnapshot.docs.reduce((sum, doc) => {
        const data = doc.data();
        return sum + (data.price || 0);
      }, 0);

      // Top categories
      const categoryCount: Record<string, number> = {};
      businessesSnapshot.docs.forEach(doc => {
        const category = doc.data().category;
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });
      const topCategories = Object.entries(categoryCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Monthly growth (mock data for now)
      const monthlyGrowth = {
        users: 12.5,
        businesses: 8.3,
        revenue: 15.7,
      };

      // Recent activity (mock data)
      const recentActivity = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return {
          date: date.toISOString().split('T')[0],
          users: Math.floor(Math.random() * 50) + 10,
          businesses: Math.floor(Math.random() * 20) + 5,
          revenue: Math.floor(Math.random() * 5000) + 1000,
        };
      }).reverse();

      setAnalytics({
        totalUsers,
        totalBusinesses,
        totalReservations,
        totalRevenue,
        activeSubscriptions,
        monthlyGrowth,
        topCategories,
        recentActivity,
      });
    } catch (error) {
      console.error('Load analytics error:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    const csvContent = [
      ['Metrik', 'Değer'],
      ['Toplam Kullanıcı', analytics.totalUsers],
      ['Toplam İşletme', analytics.totalBusinesses],
      ['Toplam Rezervasyon', analytics.totalReservations],
      ['Toplam Gelir', analytics.totalRevenue],
      ['Aktif Abonelik', analytics.activeSubscriptions],
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapor-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Raporlar ve Analitik</h1>
          <p className="text-white/60 mt-1">Detaylı raporlar ve analizler</p>
        </div>
        <button
          onClick={exportReport}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Rapor İndir
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-white/60" />
          <div className="flex gap-2">
            {(['7d', '30d', '90d', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`
                  px-4 py-2 rounded-lg transition-colors
                  ${dateRange === range ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50' : 'bg-white/5 text-white/60 border border-white/10'}
                `}
              >
                {range === '7d' && 'Son 7 Gün'}
                {range === '30d' && 'Son 30 Gün'}
                {range === '90d' && 'Son 90 Gün'}
                {range === 'all' && 'Tüm Zamanlar'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-white/60 text-sm">Kullanıcılar</span>
          </div>
          <p className="text-2xl font-bold text-white mb-1">{analytics.totalUsers}</p>
          <p className="text-xs text-green-400">+{analytics.monthlyGrowth.users}% bu ay</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Building2 className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-white/60 text-sm">İşletmeler</span>
          </div>
          <p className="text-2xl font-bold text-white mb-1">{analytics.totalBusinesses}</p>
          <p className="text-xs text-green-400">+{analytics.monthlyGrowth.businesses}% bu ay</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Calendar className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-white/60 text-sm">Rezervasyonlar</span>
          </div>
          <p className="text-2xl font-bold text-white">{analytics.totalReservations}</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-yellow-400" />
            </div>
            <span className="text-white/60 text-sm">Toplam Gelir</span>
          </div>
          <p className="text-2xl font-bold text-white mb-1">{analytics.totalRevenue.toLocaleString()} ₺</p>
          <p className="text-xs text-green-400">+{analytics.monthlyGrowth.revenue}% bu ay</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-pink-500/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-pink-400" />
            </div>
            <span className="text-white/60 text-sm">Aktif Abonelik</span>
          </div>
          <p className="text-2xl font-bold text-white">{analytics.activeSubscriptions}</p>
        </div>
      </div>

      {/* Top Categories */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          En Popüler Kategoriler
        </h2>
        <div className="space-y-3">
          {analytics.topCategories.map((category, index) => (
            <div key={category.name} className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white/80 capitalize">{category.name}</span>
                  <span className="text-white/60 text-sm">{category.count} işletme</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                    style={{ width: `${(category.count / analytics.totalBusinesses) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Son Aktivite</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase">Tarih</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase">Yeni Kullanıcı</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase">Yeni İşletme</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase">Gelir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {analytics.recentActivity.map((activity) => (
                <tr key={activity.date} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-sm text-white/80">{new Date(activity.date).toLocaleDateString('tr-TR')}</td>
                  <td className="px-4 py-3 text-sm text-white/80">{activity.users}</td>
                  <td className="px-4 py-3 text-sm text-white/80">{activity.businesses}</td>
                  <td className="px-4 py-3 text-sm text-white/80">{activity.revenue.toLocaleString()} ₺</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
