import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useDashboardStore } from '@/store/dashboardStore';
import { getDashboardModules, getBookingTerminology } from '@/utils/bookingTypeResolver';
import { motion } from 'framer-motion';
import { Store, Plus } from 'lucide-react';

// Services
import { salonsService } from '@/services/firebaseService';
import { authService } from '@/services/authService';

// Hooks
import { useStaffManagement } from '@/hooks/dashboard/useStaffManagement';
import { useServiceManagement } from '@/hooks/dashboard/useServiceManagement';
import { useOverviewData } from '@/hooks/dashboard/useOverviewData';
import { useBusinessData } from '@/hooks/dashboard/useBusinessData';

// Components
import { BusinessSetupWizard } from '@/components/dashboard/BusinessSetupWizard';
import { FloatingNavMenu } from '@/components/dashboard/FloatingNavMenu';
import { LegacyBusinessMigration } from '@/components/dashboard/LegacyBusinessMigration';
import { SubscriptionModal } from '@/components/subscription/SubscriptionModal';
import { RestaurantSubscriptionModal } from '@/components/subscription/RestaurantSubscriptionModal';
import { AnnouncementPopup } from '@/components/announcement/AnnouncementPopup';
import { RestaurantDashboard } from '@/components/restaurant/RestaurantDashboard';

// Modular Components
import { OverviewModule } from '@/components/dashboard/modules/OverviewModule';
import { AppointmentsModule } from '@/components/dashboard/modules/AppointmentsModule';
import { ServicesModule } from '@/components/dashboard/modules/ServicesModule';
import { StaffModule } from '@/components/dashboard/modules/StaffModule';
import { AnalyticsModule } from '@/components/dashboard/modules/AnalyticsModule';
import { SubscriptionModule } from '@/components/dashboard/modules/SubscriptionModule';
import { CustomersModule } from '@/components/dashboard/modules/CustomersModule';
import { ReviewsModule } from '@/components/dashboard/modules/ReviewsModule';
import { SettingsModule } from '@/components/dashboard/modules/SettingsModule';

import { DASHBOARD_TABS } from '@/constants/dashboard';

import type { Salon, BusinessSubscription } from '@/types';

export function OwnerDashboard() {
  const { isAuthenticated, isOwner, user, isLoading: authLoading } = useAuthStore();
  const { activeTab, setActiveTab } = useDashboardStore();
  const location = useLocation();

  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showSalonSetup, setShowSalonSetup] = useState(false);
  const [showMigrationModal, setShowMigrationModal] = useState(false);

  // Business data
  const {
    salon,
    reservations,
    services,
    staff,
    queueCount,
    subscription,
    loading,
    loadData,
  } = useBusinessData(user?.salonId);

  // Business logic hooks  
  const staffManagement = useStaffManagement(loadData);
  const serviceManagement = salon ? useServiceManagement(salon, loadData) : { handleSave: async () => {}, handleDelete: async () => {} };

  const dashboardModules = useMemo(() => {
    if (!salon) return null;
    return getDashboardModules((salon as any).capabilities);
  }, [salon]);

  const terminology = useMemo(() => {
    if (!salon) return { plural: 'Randevular' };
    return getBookingTerminology((salon as any).capabilities);
  }, [salon]);

  const visibleSidebarItems = useMemo(() => {
    if (!dashboardModules) return DASHBOARD_TABS;
    return DASHBOARD_TABS.filter(item => {
      if (item.key === 'staff') return dashboardModules.showStaff;
      if (item.key === 'restaurant') return dashboardModules.showRestaurant;
      return true;
    }).map(item => item.key === 'appointments' ? { ...item, label: terminology.plural } : item);
  }, [dashboardModules, terminology]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabFromUrl = params.get('tab');
    const showSetup = params.get('show_setup') === 'true';
    const userCategory = params.get('user_category');
    
    // ✅ KRİTİK FIX: BusinessSetup.tsx'ten yönlendirilmişse wizard'ı aç
    // Date: 2026-07-20
    if (showSetup && !salon) {
      if (userCategory && user) {
        const updatedUser = { ...user, businessCategory: userCategory };
        useAuthStore.setState({ user: updatedUser });
      }
      setShowSalonSetup(true);
    }
    
    if (tabFromUrl && DASHBOARD_TABS.some(item => item.key === tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [location.search, setActiveTab, salon, user]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('tab') !== activeTab) {
      params.set('tab', activeTab);
      window.history.replaceState({}, '', `${location.pathname}?${params.toString()}`);
    }
  }, [activeTab, location.pathname, location.search]);

  useEffect(() => {
    if (salon && !(salon as any).capabilities) {
      const skipped = sessionStorage.getItem(`migration_skipped_${salon.id}`);
      if (!skipped || new Date(parseInt(skipped)).toDateString() !== new Date().toDateString()) {
        setShowMigrationModal(true);
      }
    }
  }, [salon]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isOwner) return <Navigate to="/appointments" replace />;
  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[var(--liquid-chrome)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user?.salonId || !salon) {
    return (
      <>
        {showSalonSetup && user && !showMigrationModal && (
          <BusinessSetupWizard
            salon={salon || undefined}
            currentUserId={user.uid}
            userBusinessCategory={user.businessCategory}
            onSave={async (data) => {
              if (salon) {
                await salonsService.update(salon.id, data);
                await loadData();
              } else {
                const newSalon = await salonsService.create({
                  ...data,
                  stats: { averageRating: 0, reviewCount: 0, totalAppointments: 0 },
                  isPremium: false,
                  isActive: true,
                  isAcceptingBookings: true,
                });
                if (user) await authService.updateUserProfile(user.uid, { salonId: newSalon.id });
                window.location.href = '/dashboard?tab=overview';
                return;
              }
              setShowSalonSetup(false);
            }}
            onClose={() => setShowSalonSetup(false)}
          />
        )}
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-2xl">
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Store size={48} className="text-white" />
            </div>
            <h2 className="font-heading font-bold text-3xl text-[var(--chrome-white)] mb-3">İşletmenizi Oluşturun</h2>
            <p className="text-[var(--muted-lead)] mb-6">İşletme panelinizi kullanmaya başlamak için önce işletmenizi oluşturmanız gerekiyor.</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSalonSetup(true)}
              className="px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-heading font-bold flex items-center gap-2 mx-auto"
            >
              <Plus size={20} />
              <span>İşletme Oluştur</span>
            </motion.button>
          </motion.div>
        </div>
      </>
    );
  }

  // Overview data
  const { todayApps, weekApps, monthlyRevenue } = useOverviewData({ reservations });

  return (
    <>
      <AnnouncementPopup userType="owner" />

      {showMigrationModal && !showSalonSetup && salon && (
        <LegacyBusinessMigration salon={salon} onMigrationComplete={() => { setShowMigrationModal(false); window.location.reload(); }} />
      )}

      {showSalonSetup && user && !showMigrationModal && (
        <BusinessSetupWizard
          salon={salon}
          currentUserId={user.uid}
          userBusinessCategory={user.businessCategory}
          onSave={async (data) => {
            await salonsService.update(salon.id, data);
            await loadData();
            setShowSalonSetup(false);
          }}
          onClose={() => setShowSalonSetup(false)}
        />
      )}

      {showSubscriptionModal && salon && (
        dashboardModules?.showRestaurant ? (
          <RestaurantSubscriptionModal 
            isOpen={showSubscriptionModal}
            businessId={salon.id}
            businessName={salon.name}
            onClose={() => setShowSubscriptionModal(false)} 
          />
        ) : (
          <SubscriptionModal 
            isOpen={showSubscriptionModal}
            businessId={salon.id}
            businessName={salon.name}
            onClose={() => setShowSubscriptionModal(false)} 
          />
        )
      )}

      <div className="min-h-screen pb-0">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 overflow-x-hidden w-full pb-6 lg:pb-0">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <h1 className="font-display font-bold text-2xl text-[var(--chrome-white)]">
                  {visibleSidebarItems.find((i) => i.key === activeTab)?.label}
                </h1>
                {!showSalonSetup && activeTab !== 'restaurant' && (
                  <FloatingNavMenu
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    items={visibleSidebarItems.map(item => ({ ...item, color: '#8B5CF6' }))}
                  />
                )}
              </div>
              {salon && <p className="text-sm text-[var(--muted-lead)] truncate max-w-[200px]">{salon.name}</p>}
            </div>

            {activeTab === 'overview' && (
              <OverviewModule
                salon={salon}
                todayApps={todayApps}
                weekApps={weekApps}
                queueCount={queueCount}
                monthlyRevenue={monthlyRevenue}
                subscription={subscription}
                onTabChange={setActiveTab}
              />
            )}

            {activeTab === 'appointments' && <AppointmentsModule salon={salon} reservations={reservations} onRefresh={loadData} />}
            {activeTab === 'services' && <ServicesModule salon={salon} services={services} onSaveService={serviceManagement.handleSave} onDeleteService={serviceManagement.handleDelete} />}
            {activeTab === 'staff' && dashboardModules?.showStaff && <StaffModule salon={salon} staff={staff} onSaveStaff={staffManagement.handleSave} onDeleteStaff={(id) => staffManagement.handleDelete(id, staff)} />}
            {activeTab === 'analytics' && <AnalyticsModule businessId={salon.id} onUpgrade={() => setShowSubscriptionModal(true)} />}
            {activeTab === 'subscription' && <SubscriptionModule businessId={salon.id} onViewPlans={() => setShowSubscriptionModal(true)} />}
            {activeTab === 'customers' && <CustomersModule businessId={salon.id} onUpgrade={() => setShowSubscriptionModal(true)} />}
            {activeTab === 'reviews' && <ReviewsModule salonId={salon.id} />}
            {activeTab === 'restaurant' && createPortal(<div className="fixed inset-0 z-[9998] bg-[var(--void)] overflow-y-auto"><RestaurantDashboard /></div>, document.body)}
            {activeTab === 'settings' && <SettingsModule salon={salon} onEdit={() => setShowSalonSetup(true)} onRefresh={loadData} />}
          </div>
        </div>
      </div>
    </>
  );
}
