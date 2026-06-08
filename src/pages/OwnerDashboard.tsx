import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useDashboardStore } from '@/store/dashboardStore';
import { useThemeStore } from '@/store/themeStore';
import { useUIStore } from '@/store/uiStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Calendar as CalendarIcon,
  Scissors,
  Users,
  Clock,
  TrendingUp,
  DollarSign,
  Settings,
  Plus,
  Save,
  Star,
  BarChart3,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Database,
  X,
  CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppointmentManager } from '@/components/dashboard/AppointmentManager';
import { ReservationManager } from '@/components/dashboard/ReservationManager';
import { ModernQueueManager } from '@/components/dashboard/ModernQueueManager';
import { WorkingHoursEditor } from '@/components/dashboard/WorkingHoursEditor';
import { ServiceForm } from '@/components/dashboard/ServiceForm';
import { SalonSetupForm } from '@/components/dashboard/SalonSetupForm';
import { StaffForm } from '@/components/dashboard/StaffForm';
import { PaymentSettingsForm } from '@/components/dashboard/PaymentSettingsForm';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { CustomerList } from '@/components/crm/CustomerList';
import { ReviewList } from '@/components/reviews/ReviewList';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { MultiImageUploader } from '@/components/ui/MultiImageUploader';
import { ChromaticButton } from '@/components/ui/ChromaticButton';
import { FloatingNavMenu } from '@/components/dashboard/FloatingNavMenu';
import { SubscriptionStatus } from '@/components/subscription/SubscriptionStatus';
import { SubscriptionModal } from '@/components/subscription/SubscriptionModal';
import { SubscriptionGuard } from '@/components/subscription/SubscriptionGuard';
import { SubscriptionOverviewCard } from '@/components/subscription/SubscriptionOverviewCard';
import { appointmentsService, salonsService, servicesService, staffService } from '@/services/firebaseService';
import { reservationService } from '@/services/reservationService';
import { authService } from '@/services/authService';
import { subscriptionService } from '@/services/subscriptionService';
import type { Appointment, Salon, Service, Staff, BusinessSubscription } from '@/types';

const sidebarItems = [
  { key: 'overview', label: 'Genel Bakis', icon: LayoutDashboard },
  { key: 'subscription', label: 'Abonelik', icon: CreditCard },
  { key: 'appointments', label: 'Randevular', icon: CalendarIcon },
  { key: 'analytics', label: 'Analitik', icon: BarChart3 },
  { key: 'customers', label: 'Musteriler', icon: UserCheck },
  { key: 'reviews', label: 'Yorumlar', icon: Star },
  { key: 'services', label: 'Hizmetler', icon: Scissors },
  { key: 'staff', label: 'Personel', icon: Users },
  { key: 'settings', label: 'Ayarlar', icon: Settings },
];

export function OwnerDashboard() {
  const { isAuthenticated, isOwner, user, isLoading: authLoading } = useAuthStore();
  const { actualTheme } = useThemeStore();
  const { activeTab, setActiveTab } = useDashboardStore();
  const { addToast } = useUIStore();
  const location = useLocation();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [queueCount, setQueueCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [showSalonSetup, setShowSalonSetup] = useState(false);
  const [expandedSettings, setExpandedSettings] = useState<Record<string, boolean>>({
    salonInfo: false,
    bookingSystem: true,
    payment: false,
    workingHours: false,
  });
  const [subscription, setSubscription] = useState<BusinessSubscription | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Restore active tab from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabFromUrl = params.get('tab');
    if (tabFromUrl && sidebarItems.some(item => item.key === tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [location.search, setActiveTab]);

  // Update URL when tab changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const currentTab = params.get('tab');
    if (currentTab !== activeTab) {
      params.set('tab', activeTab);
      window.history.replaceState({}, '', `${location.pathname}?${params.toString()}`);
    }
  }, [activeTab, location.pathname, location.search]);

  useEffect(() => {
    if (user?.salonId) {
      loadData();
      loadSubscription();
      // Queue count'u yükle
      appointmentsService.getQueue(user.salonId).then(queue => {
        setQueueCount(queue.length);
      });
    } else if (user) {
      // User is owner but has no salon yet
      setLoading(false);
    }
  }, [user?.salonId, user]);

  const loadSubscription = async () => {
    if (!user?.salonId) {
      console.log('No salonId found for user:', user?.uid);
      return;
    }
    
    console.log('Loading subscription for salonId:', user.salonId);
    
    try {
      const sub = await subscriptionService.getBusinessSubscription(user.salonId);
      console.log('Subscription loaded:', sub);
      setSubscription(sub);
      
      // Check and update status
      if (sub) {
        await subscriptionService.checkAndUpdateSubscriptionStatus(user.salonId);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
      // Don't throw - just log the error
    }
  };

  const loadData = async () => {
    if (!user?.salonId) {
      console.log('No salonId found for user:', user?.uid);
      return;
    }
    
    console.log('Loading data for salonId:', user.salonId);
    setLoading(true);
    
    try {
      const [salonData, reservationsData, servicesData, staffData] = await Promise.all([
        salonsService.getById(user.salonId),
        // DÜZELTME: reservations collection'ından oku
        reservationService.getBusinessReservations(user.salonId),
        servicesService.getBySalon(user.salonId),
        staffService.getBySalon(user.salonId),
      ]);

      console.log('Data loaded successfully:', { 
        salon: !!salonData, 
        reservations: reservationsData.length,
        services: servicesData.length,
        staff: staffData.length 
      });

      setSalon(salonData);
      // Reservations'ı hem orijinal hem de appointments formatında sakla
      setReservations(reservationsData);
      
      // Reservations'ı appointments formatına çevir (eski sistemle uyumluluk için)
      const appointmentsData = reservationsData.map((res: any) => ({
        id: res.id,
        userId: res.userId,
        salonId: res.businessId,
        salonName: res.businessName,
        staffId: res.staffId || '',
        customerName: res.userName,
        customerPhone: res.userPhone,
        services: res.services || [],
        date: res.date || res.eventDate || res.checkIn || res.deliveryDate || '',
        time: res.startTime || res.deliveryTime || '00:00',
        totalPrice: res.pricing?.totalAmount || res.totalPrice || 0,
        totalDuration: res.duration || res.totalDuration || 0,
        status: res.status,
        notes: res.notes || '',
        salonCover: (salonData as any)?.coverImage || '',
        salonAddress: typeof salonData?.address === 'string' ? salonData.address : salonData?.address?.full || '',
        staffName: '',
        staffPhoto: '',
        whatsappNumber: (salonData as any)?.whatsapp || '',
        endTime: res.endTime || '',
        createdAt: res.createdAt,
      })) as Appointment[];
      setAppointments(appointmentsData);
      setServices(servicesData);
      setStaff(staffData);

      // Update subscription usage stats
      if (user?.salonId) {
        try {
          await subscriptionService.updateUsageStats(user.salonId, {
            staffCount: staffData.length,
            serviceCount: servicesData.length,
            monthlyBookings: appointmentsData.filter(a => {
              const appointmentDate = new Date(a.date);
              const now = new Date();
              return appointmentDate.getMonth() === now.getMonth() && 
                     appointmentDate.getFullYear() === now.getFullYear();
            }).length,
          });
        } catch (statsError) {
          console.error('Error updating usage stats:', statsError);
          // Don't fail the whole load if stats update fails
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const handleSaveSalon = async (salonData: Omit<Salon, 'id' | 'stats' | 'isPremium' | 'isActive' | 'isAcceptingBookings'>) => {
    try {
      if (salon) {
        // Edit mode - update existing salon
        await salonsService.update(salon.id, salonData);
        await loadData();
      } else {
        // Create mode - create new salon
        const newSalon = await salonsService.create({
          ...salonData,
          stats: {
            averageRating: 0,
            reviewCount: 0,
            totalAppointments: 0,
          },
          isPremium: false,
          isActive: true,
          isAcceptingBookings: true,
        });
        
        // Update user with salonId
        if (user) {
          await authService.updateUserProfile(user.uid, { salonId: newSalon.id });
          // Wait for Firestore to sync
          await new Promise(resolve => setTimeout(resolve, 1000));
          // Redirect to dashboard
          window.location.href = '/dashboard';
          return;
        }
      }
      setShowSalonSetup(false);
    } catch (error) {
      console.error('Error saving salon:', error);
      addToast('Salon kaydedilemedi. Lütfen tekrar deneyin.', 'error');
      throw error;
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isOwner) {
    return <Navigate to="/appointments" replace />;
  }

  // Show loading only during initial auth check
  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--liquid-chrome)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-body text-[var(--muted-lead)]">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--liquid-chrome)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-body text-[var(--muted-lead)]">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // If owner has no salon yet, show setup message
  if (!user?.salonId || !salon) {
    return (
      <>
      {/* Salon Setup/Edit Modal */}
      {showSalonSetup && (
        <SalonSetupForm
          salon={salon || undefined}
          onSave={async (salonData) => {
            if (salon) {
              // Edit mode - update existing salon
              await salonsService.update(salon.id, salonData);
              await loadData();
            } else {
              // Create mode - create new salon
              const newSalon = await salonsService.create({
                ...salonData,
                stats: {
                  averageRating: 0,
                  reviewCount: 0,
                  totalAppointments: 0,
                },
                isPremium: false,
                isActive: true,
                isAcceptingBookings: true,
              });
              
              // Update user with salonId
              if (user) {
                await authService.updateUserProfile(user.uid, { salonId: newSalon.id });
              }
              
              window.location.reload();
            }
            setShowSalonSetup(false);
          }}
          onClose={() => setShowSalonSetup(false)}
        />
      )}
        
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <div className="w-20 h-20 rounded-full bg-[var(--liquid-chrome)]/10 flex items-center justify-center mx-auto mb-6">
              <Scissors size={40} className="text-[var(--liquid-chrome)]" />
            </div>
            <h2 className="font-display font-bold text-2xl text-[var(--chrome-white)] mb-3">
              İşletmenizi Oluşturun
            </h2>
            <p className="font-body text-[var(--muted-lead)] mb-6">
              İşletme panelinizi kullanmaya başlamak için önce işletmenizi oluşturmanız gerekiyor.
            </p>
            <ChromaticButton
              onClick={() => setShowSalonSetup(true)}
              className="flex items-center gap-2 mx-auto"
            >
              <Plus size={20} />
              <span>İşletme Oluştur</span>
            </ChromaticButton>
            <p className="font-body text-xs text-[var(--muted-lead)] mt-6">
              İşletme bilgilerinizi girdikten sonra randevu yönetimi, hizmet ekleme ve daha fazlasına erişebileceksiniz.
            </p>
          </motion.div>
        </div>
      </>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];
  
  console.log('📊 Dashboard Stats Debug:', {
    todayStr,
    reservationsCount: reservations.length,
    appointmentsCount: appointments.length,
    reservations: reservations.map(r => ({
      date: r.date || r.eventDate || r.checkIn || r.deliveryDate,
      status: r.status
    })),
    appointments: appointments.map(a => ({
      date: a.date,
      status: a.status
    }))
  });
  
  // Hem reservations hem de appointments'dan hesapla
  const todayApps = [
    ...reservations.filter((r: any) => {
      const resDate = r.date || r.eventDate || r.checkIn || r.deliveryDate || '';
      const isToday = resDate === todayStr;
      // Sadece confirmed ve pending status'leri say
      const isActive = r.status === 'confirmed' || r.status === 'pending';
      console.log('Reservation check:', { resDate, todayStr, isToday, status: r.status, isActive });
      return isToday && isActive;
    }),
    ...appointments.filter((a: Appointment) => {
      const isToday = a.date === todayStr;
      // Sadece confirmed ve pending status'leri say
      const isActive = a.status === 'confirmed' || a.status === 'pending';
      console.log('Appointment check:', { date: a.date, todayStr, isToday, status: a.status, isActive });
      return isToday && isActive;
    })
  ];
  
  console.log('📊 Today Apps Result:', todayApps.length, todayApps);
  
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date();
  weekEnd.setDate(weekEnd.getDate() + 7);
  weekEnd.setHours(23, 59, 59, 999);
  
  // Hem reservations hem de appointments'dan hesapla
  const weekApps = [
    ...reservations.filter((r: any) => {
      const resDate = r.date || r.eventDate || r.checkIn || r.deliveryDate || '';
      if (!resDate) return false;
      const appDate = new Date(resDate);
      const inWeek = appDate >= weekStart && appDate <= weekEnd;
      const isActive = r.status === 'confirmed' || r.status === 'pending';
      return inWeek && isActive;
    }),
    ...appointments.filter((a: Appointment) => {
      if (!a.date) return false;
      const appDate = new Date(a.date);
      const inWeek = appDate >= weekStart && appDate <= weekEnd;
      const isActive = a.status === 'confirmed' || a.status === 'pending';
      return inWeek && isActive;
    })
  ];
  
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  
  // Hem reservations hem de appointments'dan hesapla
  const monthlyRevenue = [
    ...reservations
      .filter((r: any) => {
        const resDate = r.date || r.eventDate || r.checkIn || r.deliveryDate || '';
        const isCompleted = r.status === 'completed' || r.status === 'confirmed';
        const isThisMonth = resDate.startsWith(currentMonth);
        return isCompleted && isThisMonth;
      })
      .map((r: any) => r.pricing?.totalAmount || r.totalPrice || 0),
    ...appointments
      .filter((a: Appointment) => {
        const isCompleted = a.status === 'completed' || a.status === 'confirmed';
        const isThisMonth = a.date.startsWith(currentMonth);
        return isCompleted && isThisMonth;
      })
      .map((a: Appointment) => a.totalPrice || 0)
  ].reduce((sum: number, price: number) => sum + price, 0);

  const handleSaveWorkingHours = async (hours: any) => {
    if (!salon) {
      console.error('No salon found');
      return;
    }
    try {
      console.log('handleSaveWorkingHours called with:', hours);
      console.log('Current user:', user);
      console.log('Salon ID:', salon.id);
      console.log('Salon ownerId:', salon.ownerId);
      console.log('User UID:', user?.uid);
      console.log('Match?', salon.ownerId === user?.uid);
      
      await salonsService.update(salon.id, { workingHours: hours });
      console.log('Working hours updated in Firestore, reloading data...');
      await loadData();
      console.log('Data reloaded successfully');
    } catch (error) {
      console.error('Error in handleSaveWorkingHours:', error);
      alert('Hata: Çalışma saatleri kaydedilemedi. Konsolu kontrol edin.');
    }
  };

  const handleSaveService = async (serviceData: Omit<Service, 'id'>) => {
    try {
      if (selectedService) {
        await servicesService.update(selectedService.id, serviceData);
      } else {
        await servicesService.create(serviceData);
      }
      await loadData();
      addToast('Hizmet başarıyla kaydedildi', 'success');
    } catch (error: any) {
      console.error('Error saving service:', error);
      addToast(error?.message || 'Hizmet kaydedilemedi. Lütfen tekrar deneyin.', 'error');
      throw error;
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      await servicesService.delete(serviceId);
      await loadData();
      addToast('Hizmet başarıyla silindi', 'success');
    } catch (error: any) {
      console.error('Error deleting service:', error);
      addToast(error?.message || 'Hizmet silinemedi. Lütfen tekrar deneyin.', 'error');
      throw error;
    }
  };

  const handleSaveStaff = async (staffData: Omit<Staff, 'id'>) => {
    try {
      if (selectedStaff) {
        await staffService.update(selectedStaff.id, staffData);
      } else {
        await staffService.create(staffData);
      }
      await loadData();
      addToast('Personel başarıyla kaydedildi', 'success');
    } catch (error: any) {
      console.error('Error saving staff:', error);
      addToast(error?.message || 'Personel kaydedilemedi. Lütfen tekrar deneyin.', 'error');
      throw error;
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    try {
      await staffService.delete(staffId);
      await loadData();
      addToast('Personel başarıyla silindi', 'success');
    } catch (error: any) {
      console.error('Error deleting staff:', error);
      addToast(error?.message || 'Personel silinemedi. Lütfen tekrar deneyin.', 'error');
      throw error;
    }
  };

  return (
    <>
    <div className="min-h-screen pb-0">
      <div className="flex flex-col lg:flex-row gap-6">
      {/* Salon Setup/Edit Modal */}
      {showSalonSetup && (
        <SalonSetupForm
          salon={salon || undefined}
          onSave={async (salonData) => {
            if (salon) {
              // Edit mode - update existing salon
              await salonsService.update(salon.id, salonData);
              await loadData();
            } else {
              // Create mode - create new salon
              const newSalon = await salonsService.create({
                ...salonData,
                stats: {
                  averageRating: 0,
                  reviewCount: 0,
                  totalAppointments: 0,
                },
                isPremium: false,
                isActive: true,
                isAcceptingBookings: true,
              });
              
              // Update user with salonId
              if (user) {
                await authService.updateUserProfile(user.uid, { salonId: newSalon.id });
              }
              
              window.location.reload();
            }
            setShowSalonSetup(false);
          }}
          onClose={() => setShowSalonSetup(false)}
        />
      )}

      {/* If owner has no salon yet, show setup message */}
      {(!user?.salonId || !salon) ? (
        <div className="min-h-[60vh] flex items-center justify-center px-4 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <div className="w-20 h-20 rounded-full bg-[var(--liquid-chrome)]/10 flex items-center justify-center mx-auto mb-6">
              <Scissors size={40} className="text-[var(--liquid-chrome)]" />
            </div>
            <h2 className="font-display font-bold text-2xl text-[var(--chrome-white)] mb-3">
              İşletmenizi Oluşturun
            </h2>
            <p className="font-body text-[var(--muted-lead)] mb-6">
              İşletme panelinizi kullanmaya başlamak için önce işletmenizi oluşturmanız gerekiyor.
            </p>
            <ChromaticButton
              onClick={() => setShowSalonSetup(true)}
              className="flex items-center gap-2 mx-auto"
            >
              <Plus size={20} />
              <span>İşletme Oluştur</span>
            </ChromaticButton>
            <p className="font-body text-xs text-[var(--muted-lead)] mt-6">
              İşletme bilgilerinizi girdikten sonra randevu yönetimi, hizmet ekleme ve daha fazlasına erişebileceksiniz.
            </p>
          </motion.div>
        </div>
      ) : (
        <>
      {/* Sidebar - REMOVED */}

      {/* Main Content */}
      <div className="flex-1 overflow-x-hidden w-full pb-6 lg:pb-0">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h1 className="font-display font-bold text-2xl text-[var(--chrome-white)]">
              {sidebarItems.find((i) => i.key === activeTab)?.label}
            </h1>
            {/* Floating Navigation Menu Button */}
            <FloatingNavMenu activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
          {salon && (
            <p className="font-body text-sm text-[var(--muted-lead)] truncate max-w-[200px]">
              {salon.name}
            </p>
          )}
        </div>

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* ⚠️ PENDING SUBSCRIPTION UYARISI */}
            {subscription?.status === 'pending' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-3xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <Clock size={24} className="text-amber-400" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading font-bold text-lg text-amber-300 mb-2">
                      ⏳ Abonelik Onayı Bekleniyor
                    </h3>
                    <p className="font-body text-sm text-amber-200/80 mb-3">
                      Abonelik talebiniz oluşturuldu ve admin onayı bekleniyor. Onaylandıktan sonra:
                    </p>
                    <ul className="space-y-1.5 text-sm text-amber-200/70">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span>İşletmeniz anasayfada görünecek</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span>Müşteriler randevu alabilecek</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span>Tüm özellikler aktif olacak</span>
                      </li>
                    </ul>
                    <p className="font-body text-xs text-amber-200/60 mt-3">
                      Plan: <span className="font-semibold capitalize">{subscription.planType}</span> • 
                      Fiyat: <span className="font-semibold">{subscription.price}₺</span> • 
                      Periyot: <span className="font-semibold capitalize">{subscription.interval}</span>
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Bugunku Randevu", value: todayApps.length, icon: Clock, color: '#2DC24E', tab: 'appointments' },
                { label: "Bekleyen Sıra", value: queueCount, icon: Users, color: '#E5A522', tab: 'appointments' },
                { label: "Bu Hafta", value: weekApps.length, icon: CalendarIcon, color: '#60a5fa', tab: 'appointments' },
                { label: "Bu Ay Gelir", value: `${monthlyRevenue.toLocaleString()}₺`, icon: DollarSign, color: '#c8c8d4', tab: 'analytics' },
              ].map((stat, i) => {
                const Icon = stat.icon;
                const backgroundGif = actualTheme === 'light'
                  ? '/asset/Loop_ancak_tasarmn_formunu_bozmadan_ok_gz.gif'
                  : '/asset/Kaliteyi_bozmadan_loop_olmasn_istiyorum_kar.gif';
                
                return (
                  <motion.button
                    key={stat.label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => setActiveTab(stat.tab)}
                    className="relative overflow-hidden obsidian-card p-5 text-left hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer group"
                  >
                    {/* Animated Background */}
                    <div className="absolute inset-0 opacity-[0.15] group-hover:opacity-[0.25] transition-opacity pointer-events-none">
                      <img
                        src={backgroundGif}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                        style={{
                          imageRendering: 'auto',
                          willChange: 'auto',
                        }}
                      />
                    </div>

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--slate-surface)]/95 via-[var(--slate-surface)]/90 to-[var(--slate-surface)]/95 group-hover:from-[var(--slate-surface)]/90 group-hover:via-[var(--slate-surface)]/85 group-hover:to-[var(--slate-surface)]/90 transition-all pointer-events-none" />

                    {/* Content */}
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"
                          style={{ backgroundColor: `${stat.color}20` }}
                        >
                          <Icon size={20} style={{ color: stat.color }} strokeWidth={2.5} />
                        </div>
                      </div>
                      <p className="font-mono font-bold text-3xl text-[var(--chrome-white)] mb-1">
                        {stat.value}
                      </p>
                      <p className="font-heading font-medium text-sm text-[var(--muted-lead)]">{stat.label}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Subscription Overview Card */}
            {salon && (
              <SubscriptionOverviewCard
                businessId={salon.id}
                onViewPlans={() => setShowSubscriptionModal(true)}
              />
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => setActiveTab('appointments')}
                className="obsidian-card p-4 rounded-3xl flex items-center gap-3 hover:bg-white/5 transition-all active:scale-95 group"
              >
                <div className="w-12 h-12 rounded-full bg-[#2DC24E]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus size={20} className="text-[#2DC24E]" strokeWidth={2.5} />
                </div>
                <span className="font-heading font-semibold text-sm text-[var(--chrome-white)]">
                  Randevu Yönet
                </span>
              </button>

              <button
                onClick={() => setActiveTab('services')}
                className="obsidian-card p-4 rounded-3xl flex items-center gap-3 hover:bg-white/5 transition-all active:scale-95 group"
              >
                <div className="w-12 h-12 rounded-full bg-[#60a5fa]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Scissors size={20} className="text-[#60a5fa]" strokeWidth={2.5} />
                </div>
                <span className="font-heading font-semibold text-sm text-[var(--chrome-white)]">
                  Hizmetler
                </span>
              </button>

              <button
                onClick={() => setActiveTab('staff')}
                className="obsidian-card p-4 rounded-3xl flex items-center gap-3 hover:bg-white/5 transition-all active:scale-95 group"
              >
                <div className="w-12 h-12 rounded-full bg-[#E5A522]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users size={20} className="text-[#E5A522]" strokeWidth={2.5} />
                </div>
                <span className="font-heading font-semibold text-sm text-[var(--chrome-white)]">
                  Personel
                </span>
              </button>
            </div>
          </div>
        )}

        {/* APPOINTMENTS */}
        {activeTab === 'appointments' && salon && (
          <div className="space-y-6">
            {/* Modern Rezervasyon Listesi */}
            <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.02] to-transparent backdrop-blur-xl p-6">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <CalendarIcon size={24} className="text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="font-heading text-xl font-bold text-[var(--chrome-white)]">
                      Rezervasyon Yönetimi
                    </h2>
                    <p className="text-sm text-[var(--muted-lead)]">
                      Tüm rezervasyonlarınızı buradan yönetin
                    </p>
                  </div>
                </div>
                <ReservationManager
                  reservations={reservations}
                  onRefresh={loadData}
                />
              </div>
            </div>
            
            {/* Modern Queue Manager */}
            <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.02] to-transparent backdrop-blur-xl p-6">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                    <Users size={24} className="text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="font-heading text-xl font-bold text-[var(--chrome-white)]">
                      Sıra Yönetimi
                    </h2>
                    <p className="text-sm text-[var(--muted-lead)]">
                      Bekleyen müşterileri randevuya atayın
                    </p>
                  </div>
                </div>
                <ModernQueueManager
                  salonId={salon.id}
                  onRefresh={loadData}
                />
              </div>
            </div>
          </div>
        )}

        {/* SERVICES */}
        {activeTab === 'services' && (
          <div className="space-y-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setSelectedService(null);
                setShowServiceForm(true);
              }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-heading font-bold text-sm shadow-lg shadow-purple-500/30 transition-all flex items-center justify-center gap-2.5"
            >
              <Plus size={20} strokeWidth={2.5} />
              <span>Yeni Hizmet Ekle</span>
            </motion.button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="obsidian-card p-4 hover:border-[var(--liquid-chrome)] transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedService(service);
                    setShowServiceForm(true);
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-heading font-semibold text-[var(--chrome-white)] mb-1">
                        {service.name}
                      </h4>
                      <p className="font-body text-sm text-[var(--muted-lead)] mb-2">
                        {service.category}
                      </p>
                      <div className="flex items-center gap-3 text-sm">
                        {/* Sadece slot-based kategorilerde dakika göster */}
                        {salon && ['kuafor', 'berber', 'guzellik', 'tirnak', 'fotograf', 'video-produksiyon', 'drone-cekim'].includes(salon.category) && (
                          <span className="font-mono text-[var(--silver-frost)]">
                            {service.duration} dk
                          </span>
                        )}
                        <span className="font-mono font-semibold text-[var(--chrome-white)]">
                          {service.price} TL
                        </span>
                      </div>
                    </div>
                    <div
                      className={`w-10 h-6 rounded-full relative transition-colors ${
                        service.isActive ? 'bg-[var(--success)]' : 'bg-[var(--slate-elevated)]'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                          service.isActive ? 'translate-x-4' : 'translate-x-0.5'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STAFF */}
        {activeTab === 'staff' && (
          <div className="space-y-4">
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
          </div>
        )}

        {/* ANALYTICS */}
        {activeTab === 'analytics' && salon && (
          <SubscriptionGuard
            businessId={salon.id}
            feature="advancedAnalytics"
            onUpgrade={() => setShowSubscriptionModal(true)}
          >
            <AnalyticsDashboard salonId={salon.id} />
          </SubscriptionGuard>
        )}

        {/* SUBSCRIPTION */}
        {activeTab === 'subscription' && salon && (
          <div className="space-y-6">
            {/* Main Subscription Card */}
            <SubscriptionOverviewCard
              businessId={salon.id}
              onViewPlans={() => setShowSubscriptionModal(true)}
            />
            
            {/* Detailed Status */}
            <div className="obsidian-card p-6">
              <h3 className="text-xl font-bold text-[var(--chrome-white)] mb-4 flex items-center gap-2">
                <CreditCard size={24} className="text-primary" />
                Abonelik Detayları
              </h3>
              <SubscriptionStatus
                businessId={salon.id}
                onUpgrade={() => setShowSubscriptionModal(true)}
              />
            </div>
            
            {/* Plan Comparison */}
            <div className="obsidian-card p-6">
              <h3 className="text-xl font-bold text-[var(--chrome-white)] mb-2">
                Paket Değiştir veya Yükselt
              </h3>
              <p className="text-sm text-[var(--muted-lead)] mb-6">
                İhtiyaçlarınıza uygun paketi seçerek işletmenizi büyütün. Yıllık ödemelerde %20'ye varan indirimler.
              </p>
              <button
                onClick={() => setShowSubscriptionModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-600 text-white rounded-xl font-heading font-semibold shadow-lg shadow-primary/30 transition-all hover:scale-105"
              >
                <TrendingUp size={20} strokeWidth={2.5} />
                Tüm Paketleri Görüntüle
              </button>
            </div>
          </div>
        )}

        {/* CUSTOMERS */}
        {activeTab === 'customers' && salon && (
          <SubscriptionGuard
            businessId={salon.id}
            feature="customerManagement"
            onUpgrade={() => setShowSubscriptionModal(true)}
          >
            <CustomerList salonId={salon.id} />
          </SubscriptionGuard>
        )}

        {/* REVIEWS */}
        {activeTab === 'reviews' && salon && (
          <ReviewList salonId={salon.id} limit={50} showOwnerActions={true} />
        )}

        {/* SETTINGS */}
        {activeTab === 'settings' && salon && (
          <div className="space-y-3">
            {/* İşletme Bilgileri */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.02] to-transparent backdrop-blur-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 pointer-events-none" />
              
              <div className="relative p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                      <Settings size={22} className="text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-lg text-[var(--chrome-white)]">
                        İşletme Bilgileri
                      </h3>
                      <p className="text-xs text-[var(--muted-lead)]">
                        Temel bilgileriniz
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSalonSetup(true)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-2 transition-all active:scale-95 group"
                  >
                    <Settings size={14} className="text-purple-400 group-hover:rotate-90 transition-transform duration-300" strokeWidth={2.5} />
                    <span className="font-heading font-semibold text-xs text-[var(--chrome-white)]">Düzenle</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                    <p className="text-[var(--muted-lead)] text-[10px] font-heading font-medium uppercase tracking-wider mb-1">İşletme Adı</p>
                    <p className="text-[var(--chrome-white)] font-heading font-semibold text-sm truncate">{salon.name}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                    <p className="text-[var(--muted-lead)] text-[10px] font-heading font-medium uppercase tracking-wider mb-1">Kategori</p>
                    <p className="text-[var(--chrome-white)] font-heading font-semibold text-sm capitalize">{salon.category}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                    <p className="text-[var(--muted-lead)] text-[10px] font-heading font-medium uppercase tracking-wider mb-1">Telefon</p>
                    <p className="text-[var(--chrome-white)] font-heading font-semibold text-sm">{salon.phone}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                    <p className="text-[var(--muted-lead)] text-[10px] font-heading font-medium uppercase tracking-wider mb-1">E-posta</p>
                    <p className="text-[var(--chrome-white)] font-heading font-semibold text-sm truncate">{salon.email || '-'}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] sm:col-span-2">
                    <p className="text-[var(--muted-lead)] text-[10px] font-heading font-medium uppercase tracking-wider mb-1">Adres</p>
                    <p className="text-[var(--chrome-white)] font-heading font-semibold text-sm">{salon.address.city}, {salon.address.district}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Randevu Sistemi */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.02] to-transparent backdrop-blur-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-emerald-500/5 pointer-events-none" />
              
              <div className="relative p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                      <CalendarIcon size={22} className="text-white" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-heading font-bold text-lg text-[var(--chrome-white)]">
                        Randevu Sistemi
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`w-2 h-2 rounded-full ${
                          salon.isAcceptingBookings ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                        }`} />
                        <p className="text-xs text-[var(--muted-lead)]">
                          {salon.isAcceptingBookings ? 'Randevu alınıyor' : 'Randevu kapalı'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        console.log('Current user:', user);
                        console.log('Salon ID:', salon.id);
                        console.log('Salon ownerId:', salon.ownerId);
                        console.log('User UID:', user?.uid);
                        console.log('Match?', salon.ownerId === user?.uid);
                        
                        const newStatus = !salon.isAcceptingBookings;
                        console.log('Toggling booking status to:', newStatus);
                        await salonsService.update(salon.id, { isAcceptingBookings: newStatus });
                        console.log('Booking status updated, reloading data...');
                        await loadData();
                        console.log('Data reloaded successfully');
                      } catch (error) {
                        console.error('Error toggling booking status:', error);
                        alert('Hata: Randevu sistemi durumu değiştirilemedi. Konsolu kontrol edin.');
                      }
                    }}
                    className={`relative w-14 h-7 rounded-full transition-all duration-300 flex-shrink-0 ${
                      salon.isAcceptingBookings 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/30' 
                        : 'bg-white/10'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-lg transition-all duration-300 ${
                        salon.isAcceptingBookings ? 'translate-x-7' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Ödeme Ayarları */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.02] to-transparent backdrop-blur-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-yellow-500/5 pointer-events-none" />
              
              <div className="relative">
                <button
                  onClick={() => setExpandedSettings(prev => ({ ...prev, payment: !prev.payment }))}
                  className="w-full p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                      <DollarSign size={22} className="text-white" strokeWidth={2.5} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-heading font-bold text-lg text-[var(--chrome-white)]">
                        Ödeme Ayarları
                      </h3>
                      <p className="text-xs text-[var(--muted-lead)]">
                        Havale/EFT bilgileri
                      </p>
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: expandedSettings.payment ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={20} className="text-[var(--muted-lead)]" />
                  </motion.div>
                </button>
                
                <AnimatePresence>
                  {expandedSettings.payment && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 border-t border-white/[0.08]">
                        <div className="mt-4">
                          <PaymentSettingsForm
                            settings={salon.paymentSettings || { bankTransferEnabled: false }}
                            onSave={async (paymentSettings) => {
                              await salonsService.update(salon.id, { paymentSettings });
                              await loadData();
                            }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Çalışma Saatleri */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.02] to-transparent backdrop-blur-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
              
              <div className="relative">
                <button
                  onClick={() => setExpandedSettings(prev => ({ ...prev, workingHours: !prev.workingHours }))}
                  className="w-full p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                      <Clock size={22} className="text-white" strokeWidth={2.5} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-heading font-bold text-lg text-[var(--chrome-white)]">
                        Çalışma Saatleri
                      </h3>
                      <p className="text-xs text-[var(--muted-lead)]">
                        Haftalık çalışma programı
                      </p>
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: expandedSettings.workingHours ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={20} className="text-[var(--muted-lead)]" />
                  </motion.div>
                </button>
                
                <AnimatePresence>
                  {expandedSettings.workingHours && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 border-t border-white/[0.08]">
                        <div className="mt-4">
                          <WorkingHoursEditor
                            initialHours={salon.workingHours as any}
                            onSave={handleSaveWorkingHours}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      </>
      )}

      {/* Salon Setup/Edit Modal */}
      {showSalonSetup && (
        <SalonSetupForm
          salon={salon || undefined}
          onSave={async (salonData) => {
            if (salon) {
              // Edit mode - update existing salon
              await salonsService.update(salon.id, salonData);
              await loadData();
            } else {
              // Create mode - create new salon
              const newSalon = await salonsService.create({
                ...salonData,
                stats: {
                  averageRating: 0,
                  reviewCount: 0,
                  totalAppointments: 0,
                },
                isPremium: false,
                isActive: true,
                isAcceptingBookings: true,
              });
              
              // Update user with salonId
              if (user) {
                await authService.updateUserProfile(user.uid, { salonId: newSalon.id });
              }
              
              window.location.reload();
            }
            setShowSalonSetup(false);
          }}
          onClose={() => setShowSalonSetup(false)}
        />
      )}

      {/* Service Form Bottom Sheet */}
      {showServiceForm && salon && (
        <ServiceForm
          service={selectedService || undefined}
          salonId={salon.id}
          category={salon.category}
          onSave={handleSaveService}
          onDelete={selectedService ? handleDeleteService : undefined}
          onClose={() => {
            setShowServiceForm(false);
            setSelectedService(null);
          }}
        />
      )}

      {/* Staff Form Bottom Sheet */}
      {showStaffForm && salon && (
        <StaffForm
          staff={selectedStaff || undefined}
          salonId={salon.id}
          onSave={handleSaveStaff}
          onDelete={selectedStaff ? handleDeleteStaff : undefined}
          onClose={() => {
            setShowStaffForm(false);
            setSelectedStaff(null);
          }}
        />
      )}

      {/* Subscription Modal */}
      {showSubscriptionModal && salon && (
        <SubscriptionModal
          isOpen={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
          businessId={salon.id}
          businessName={salon.name}
          currentPlan={subscription?.planType}
          onSuccess={() => {
            loadSubscription();
            loadData();
          }}
        />
      )}

      </div>
    </div>
    </>
  );
}


