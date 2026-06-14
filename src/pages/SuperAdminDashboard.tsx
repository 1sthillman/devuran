import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Building2,
  UserCog,
  Calendar,
  CreditCard,
  Package,
  CheckCircle,
  Bell,
  MessageSquare,
  LifeBuoy,
  FileText,
  Settings,
  Shield,
  Activity,
  TrendingUp,
  DollarSign,
  AlertCircle,
  UserCheck,
  Ban,
  Clock,
  Star,
  Zap,
  Megaphone,
} from 'lucide-react';

// Admin modülleri
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { UserManagement } from '@/components/admin/UserManagement';
import { BusinessManagement } from '@/components/admin/BusinessManagement';
import { StaffManagement } from '@/components/admin/StaffManagement';
import { ReservationManagement } from '@/components/admin/ReservationManagement';
import { SubscriptionManagement } from '@/components/admin/SubscriptionManagement';
import { PaymentManagement } from '@/components/admin/PaymentManagement';
import { ServiceManagement } from '@/components/admin/ServiceManagement';
import { ApprovalManagement } from '@/components/admin/ApprovalManagement';
import { NotificationCenter } from '@/components/admin/NotificationCenter';
import { AnnouncementManagement } from '@/components/admin/AnnouncementManagement';
import { SupportTickets } from '@/components/admin/SupportTickets';
import { ReportsAnalytics } from '@/components/admin/ReportsAnalytics';
import { SystemSettings } from '@/components/admin/SystemSettings';
import { SecurityLogs } from '@/components/admin/SecurityLogs';
import { AdminPermissions } from '@/components/admin/AdminPermissions';

const SUPER_ADMIN_EMAIL = 'minifinise@gmail.com';

type AdminTab = 
  | 'dashboard'
  | 'users'
  | 'businesses'
  | 'staff'
  | 'reservations'
  | 'subscriptions'
  | 'payments'
  | 'services'
  | 'approvals'
  | 'notifications'
  | 'announcements'
  | 'support'
  | 'reports'
  | 'settings'
  | 'security'
  | 'permissions';

interface NavItem {
  id: AdminTab;
  label: string;
  icon: any;
  badge?: number;
}

const navigationItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'Kullanıcılar', icon: Users },
  { id: 'businesses', label: 'İşletmeler', icon: Building2 },
  { id: 'staff', label: 'Personeller', icon: UserCog },
  { id: 'reservations', label: 'Rezervasyonlar', icon: Calendar },
  { id: 'subscriptions', label: 'Abonelikler', icon: Package },
  { id: 'payments', label: 'Ödemeler', icon: CreditCard },
  { id: 'services', label: 'Hizmetler', icon: Zap },
  { id: 'approvals', label: 'Onaylar', icon: CheckCircle, badge: 0 },
  { id: 'notifications', label: 'Bildirimler', icon: Bell },
  { id: 'announcements', label: 'Duyurular', icon: Megaphone },
  { id: 'support', label: 'Destek', icon: LifeBuoy, badge: 0 },
  { id: 'reports', label: 'Raporlar', icon: TrendingUp },
  { id: 'settings', label: 'Ayarlar', icon: Settings },
  { id: 'security', label: 'Güvenlik', icon: Shield },
  { id: 'permissions', label: 'Yetkiler', icon: UserCheck },
];

export function SuperAdminDashboard() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pendingSubscriptionsCount, setPendingSubscriptionsCount] = useState(0);

  // Sadece minifinise@gmail.com erişebilir
  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;

  // Pending subscriptions sayısını yükle
  useEffect(() => {
    if (isSuperAdmin) {
      loadPendingSubscriptionsCount();
      // Her 30 saniyede bir güncelle
      const interval = setInterval(loadPendingSubscriptionsCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isSuperAdmin]);

  const loadPendingSubscriptionsCount = async () => {
    try {
      const { collection, getDocs, query, where } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      const q = query(
        collection(db, 'subscriptions'),
        where('status', '==', 'pending')
      );
      
      const snapshot = await getDocs(q);
      setPendingSubscriptionsCount(snapshot.size);
    } catch (error) {
      console.error('Error loading pending subscriptions count:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-white/60">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard onNavigate={setActiveTab} />;
      case 'users':
        return <UserManagement />;
      case 'businesses':
        return <BusinessManagement />;
      case 'staff':
        return <StaffManagement />;
      case 'reservations':
        return <ReservationManagement />;
      case 'subscriptions':
        return <SubscriptionManagement />;
      case 'payments':
        return <PaymentManagement />;
      case 'services':
        return <ServiceManagement />;
      case 'approvals':
        return <ApprovalManagement />;
      case 'notifications':
        return <NotificationCenter />;
      case 'announcements':
        return <AnnouncementManagement />;
      case 'support':
        return <SupportTickets />;
      case 'reports':
        return <ReportsAnalytics />;
      case 'settings':
        return <SystemSettings />;
      case 'security':
        return <SecurityLogs />;
      case 'permissions':
        return <AdminPermissions />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-1 min-h-0 bg-slate-900/50 backdrop-blur-xl border-r border-white/10">
          {/* Logo */}
          <div className="flex items-center h-16 flex-shrink-0 px-6 border-b border-white/10">
            <Shield className="w-8 h-8 text-purple-400" />
            <div className="ml-3">
              <h1 className="text-lg font-bold text-white">Super Admin</h1>
              <p className="text-xs text-white/40">Yönetim Paneli</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              // Subscriptions sekmesi için pending sayısını göster
              const badgeCount = item.id === 'subscriptions' ? pendingSubscriptionsCount : item.badge;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`
                    w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-xl
                    transition-all duration-200 relative group
                    ${isActive 
                      ? 'bg-purple-500/20 text-purple-300 shadow-lg shadow-purple-500/20' 
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-purple-400' : ''}`} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {badgeCount !== undefined && badgeCount > 0 && (
                    <span className={`ml-auto text-white text-xs px-2 py-0.5 rounded-full font-bold ${
                      item.id === 'subscriptions' 
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 animate-pulse shadow-lg shadow-amber-500/30' 
                        : 'bg-red-500'
                    }`}>
                      {badgeCount}
                    </span>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="flex-shrink-0 p-4 border-t border-white/10">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {user?.displayName?.charAt(0) || 'A'}
                  </span>
                </div>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.displayName}
                </p>
                <p className="text-xs text-white/40 truncate">Super Admin</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center">
            <Shield className="w-6 h-6 text-purple-400" />
            <span className="ml-2 text-white font-bold">Super Admin</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-white/10 bg-slate-900/95 backdrop-blur-xl"
            >
              <nav className="px-2 py-3 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  
                  // Subscriptions sekmesi için pending sayısını göster
                  const badgeCount = item.id === 'subscriptions' ? pendingSubscriptionsCount : item.badge;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`
                        w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-xl
                        transition-all duration-200
                        ${isActive 
                          ? 'bg-purple-500/20 text-purple-300' 
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {badgeCount !== undefined && badgeCount > 0 && (
                        <span className={`ml-auto text-white text-xs px-2 py-0.5 rounded-full font-bold ${
                          item.id === 'subscriptions' 
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 animate-pulse shadow-lg shadow-amber-500/30' 
                            : 'bg-red-500'
                        }`}>
                          {badgeCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Content */}
      <div className="lg:pl-72">
        <main className="pt-16 lg:pt-0">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
