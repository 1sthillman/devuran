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
  Store,
  Sparkles,
  BarChart3,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Database,
  X,
  CreditCard,
  Link2,
  ChefHat,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppointmentManager } from '@/components/dashboard/AppointmentManager';
import { ReservationManager } from '@/components/dashboard/ReservationManager';
import { ModernQueueManager } from '@/components/dashboard/ModernQueueManager';
import { WorkingHoursEditor } from '@/components/dashboard/WorkingHoursEditor';
import { ServiceForm } from '@/components/dashboard/ServiceForm';
import { BusinessSetupWizard } from '@/components/dashboard/BusinessSetupWizard';
import { StaffForm } from '@/components/dashboard/StaffForm';
import { PaymentSettingsForm } from '@/components/dashboard/PaymentSettingsForm';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { CustomerList } from '@/components/crm/CustomerList';
import { ReviewList } from '@/components/reviews/ReviewList';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { MultiImageUploader } from '@/components/ui/MultiImageUploader';
import { ChromaticButton } from '@/components/ui/ChromaticButton';
import { CopyButton } from '@/components/ui/CopyButton';
import { FloatingNavMenu } from '@/components/dashboard/FloatingNavMenu';
import { toast } from 'sonner';
import { SubscriptionStatus } from '@/components/subscription/SubscriptionStatus';
import { SubscriptionModal } from '@/components/subscription/SubscriptionModal';
import { RestaurantSubscriptionModal } from '@/components/subscription/RestaurantSubscriptionModal';
import { SubscriptionGuard } from '@/components/subscription/SubscriptionGuard';
import { SubscriptionOverviewCard } from '@/components/subscription/SubscriptionOverviewCard';
import { AnnouncementPopup } from '@/components/announcement/AnnouncementPopup';
import { QRCodeCard } from '@/components/qr/ModernQRGenerator';
import { RestaurantDashboard } from '@/components/restaurant/RestaurantDashboard';
import { appointmentsService, salonsService, servicesService, staffService } from '@/services/firebaseService';
import { reservationService } from '@/services/reservationService';
import { authService } from '@/services/authService';
import { subscriptionService } from '@/services/subscriptionService';
import { storageService } from '@/services/storageService';
import { nanoid } from 'nanoid';
import type { Appointment, Salon, Service, Staff, BusinessSubscription } from '@/types';

const sidebarItems = [
  { key: 'overview', label: 'Genel Bakış', icon: LayoutDashboard },
  { key: 'subscription', label: 'Abonelik', icon: CreditCard },
  { key: 'appointments', label: 'Randevular', icon: CalendarIcon },
  { key: 'restaurant', label: 'Restoran', icon: ChefHat },
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
    bookingSettings: false,
    payment: false,
    workingHours: false,
  });
  const [subscription, setSubscription] = useState<BusinessSubscription | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showBusinessLink, setShowBusinessLink] = useState(false); // Default: KAPALI
  const [showSubscriptionCard, setShowSubscriptionCard] = useState(false); // Default: KAPALI
  const [showQRCodes, setShowQRCodes] = useState(false); // QR codes collapsible

  // QR Styles - Minimal and professional
  const qrStyles = [
    {
      id: 'classic',
      name: 'Klasik',
      config: {
        width: 400,
        height: 400,
        margin: 10,
        dotsOptions: {
          type: 'rounded' as const,
          color: '#1a1a1a'
        },
        cornersSquareOptions: {
          type: 'extra-rounded' as const,
          color: '#1a1a1a'
        },
        cornersDotOptions: {
          type: 'dot' as const,
          color: '#1a1a1a'
        },
        backgroundOptions: {
          color: '#ffffff'
        }
      }
    },
    {
      id: 'modern',
      name: 'Modern',
      config: {
        width: 400,
        height: 400,
        margin: 10,
        dotsOptions: {
          type: 'dots' as const,
          color: '#2563eb'
        },
        cornersSquareOptions: {
          type: 'extra-rounded' as const,
          color: '#1d4ed8'
        },
        cornersDotOptions: {
          type: 'dot' as const,
          color: '#2563eb'
        },
        backgroundOptions: {
          color: '#ffffff'
        }
      }
    },
    {
      id: 'minimal',
      name: 'Minimal',
      config: {
        width: 400,
        height: 400,
        margin: 10,
        dotsOptions: {
          type: 'square' as const,
          color: '#0f172a'
        },
        cornersSquareOptions: {
          type: 'square' as const,
          color: '#0f172a'
        },
        cornersDotOptions: {
          type: 'square' as const,
          color: '#0f172a'
        },
        backgroundOptions: {
          color: '#ffffff'
        }
      }
    },
    {
      id: 'elegant',
      name: 'Zarif',
      config: {
        width: 400,
        height: 400,
        margin: 10,
        dotsOptions: {
          type: 'classy-rounded' as const,
          color: '#059669'
        },
        cornersSquareOptions: {
          type: 'extra-rounded' as const,
          color: '#047857'
        },
        cornersDotOptions: {
          type: 'dot' as const,
          color: '#059669'
        },
        backgroundOptions: {
          color: '#ffffff'
        }
      }
    },
    {
      id: 'professional',
      name: 'Profesyonel',
      config: {
        width: 400,
        height: 400,
        margin: 10,
        dotsOptions: {
          type: 'extra-rounded' as const,
          color: '#7c3aed'
        },
        cornersSquareOptions: {
          type: 'extra-rounded' as const,
          color: '#6d28d9'
        },
        cornersDotOptions: {
          type: 'dot' as const,
          color: '#7c3aed'
        },
        backgroundOptions: {
          color: '#ffffff'
        }
      }
    }
  ];

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
      
      // 🍽️ Hizmetleri yükle - Restoran için salon.services array'ini de ekle
      let allServices = [...servicesData];
      if (salonData && salonData.services && Array.isArray(salonData.services) && salonData.services.length > 0) {
        const salonServices = salonData.services.filter((s: any) => s.isActive !== false);
        allServices = [...allServices, ...salonServices];
        
        // Duplicate kontrolü
        const uniqueServices = allServices.reduce((acc: any[], curr: any) => {
          if (!acc.find(s => s.id === curr.id)) {
            acc.push(curr);
          }
          return acc;
        }, []);
        allServices = uniqueServices;
        
        console.log(`📊 Toplam ${allServices.length} hizmet yüklendi (${servicesData.length} collection + ${salonServices.length} array)`);
      }
      setServices(allServices);
      
      // 🍽️ RESTORAN İÇİN OTOMATIK MASA-HİZMET MİGRASYONU
      if (salonData && (salonData.category === 'restoran' || (salonData as any).category === 'restaurant')) {
        try {
          console.log('🍽️ Restoran kategorisi tespit edildi, masa-hizmet kontrolü yapılıyor...');
          
          // Eğer hizmet yoksa veya çok azsa, migration yap
          if (servicesData.length === 0) {
            console.log('⚠️ Hizmet bulunamadı, masa migration başlatılıyor...');
            const { migrateTableToServices } = await import('@/scripts/migrateTableToServices');
            const result = await migrateTableToServices(user.salonId);
            
            if (result.success && result.servicesCreated > 0) {
              console.log(`✅ ${result.servicesCreated} masa hizmete dönüştürüldü`);
              
              // Salon'u yeniden yükle (services array güncellenmiş olacak)
              const freshSalon = await salonsService.getById(user.salonId);
              if (freshSalon && freshSalon.services) {
                const salonServices = freshSalon.services.filter((s: any) => s.isActive !== false);
                console.log(`📊 Salon services array'inden ${salonServices.length} hizmet yüklendi`);
                setServices(salonServices);
                setSalon(freshSalon);
              }
              
              // Bilgi toast'ı göster
              toast.success('Masalar Rezervasyona Hazır!', {
                description: `${result.servicesCreated} masa artık müşteriler tarafından rezerve edilebilir`,
                duration: 5000
              });
            }
          }
        } catch (migrationError) {
          console.error('❌ Otomatik migration hatası:', migrationError);
          // Migration hata verse bile devam et
        }
      }
      
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
      // setServices ve setStaff yukarıda zaten set edildi
      setStaff(staffData);

      // Update subscription usage stats
      if (user?.salonId) {
        try {
          await subscriptionService.updateUsageStats(user.salonId, {
            staffCount: staffData.length,
            serviceCount: allServices.length, // Güncellenmiş hizmet sayısını kullan
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
        <BusinessSetupWizard
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
              
              // Redirect to overview tab (genel) instead of settings
              window.location.href = '/dashboard?tab=overview';
              return;
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
            className="text-center max-w-lg"
          >
            {/* Modern Icon with Gradient Background */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring",
                stiffness: 200,
                damping: 20
              }}
              className="mb-8"
            >
              <div className="relative w-24 h-24 mx-auto">
                {/* Glowing Background */}
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 blur-2xl"
                />
                
                {/* Icon Container */}
                <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 p-[2px]">
                  <div className="w-full h-full rounded-3xl bg-[var(--void)] flex items-center justify-center">
                    <Store size={48} className="text-white" strokeWidth={1.5} />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Welcome Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 mb-4">
                <Sparkles size={16} className="text-purple-400" />
                <span className="text-sm font-semibold text-purple-300">Hoşgeldiniz</span>
              </div>
              
              <h2 className="font-heading font-bold text-3xl sm:text-4xl text-[var(--chrome-white)] mb-3">
                İşletmenizi Oluşturun
              </h2>
              
              <p className="text-base text-[var(--muted-lead)] leading-relaxed">
                İşletme panelinizi kullanmaya başlamak için önce işletmenizi oluşturmanız gerekiyor.
              </p>
            </motion.div>
            
            {/* Main Action Button */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="mb-6"
            >
              <motion.button
                onClick={() => setShowSalonSetup(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative inline-flex items-center gap-2.5 px-8 py-4 rounded-full font-heading font-bold text-base text-white overflow-hidden transition-all shadow-2xl shadow-purple-500/20"
              >
                {/* Animated Background */}
                <motion.div
                  animate={{ 
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 via-purple-600 to-pink-600 bg-[length:200%_100%]"
                />
                
                {/* Glow Effect */}
                <motion.div
                  animate={{ 
                    opacity: [0.4, 0.8, 0.4],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 blur-xl"
                />
                
                <span className="relative z-10 flex items-center gap-2.5">
                  <Plus size={20} strokeWidth={2.5} />
                  <span>İşletme Oluştur</span>
                </span>
              </motion.button>
            </motion.div>

            {/* Info Text */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-sm text-[var(--muted-lead)] leading-relaxed"
            >
              İşletme bilgilerinizi girdikten sonra randevu yönetimi, hizmet ekleme ve daha fazlasına erişebileceksiniz.
            </motion.p>
          </motion.div>
        </div>
      </>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];
  
  // SADECE reservations'dan hesapla (appointments içinde zaten _source='reservation' olanlar var)
  const todayApps = reservations.filter((r: any) => {
    const resDate = r.date || r.eventDate || r.checkIn || r.deliveryDate || '';
    const isToday = resDate === todayStr;
    const isActive = r.status === 'confirmed' || r.status === 'pending' || r.status === 'deposit_paid';
    return isToday && isActive;
  });
  
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date();
  weekEnd.setDate(weekEnd.getDate() + 7);
  weekEnd.setHours(23, 59, 59, 999);
  
  // SADECE reservations'dan hesapla
  const weekApps = reservations.filter((r: any) => {
    const resDate = r.date || r.eventDate || r.checkIn || r.deliveryDate || '';
    if (!resDate) return false;
    const appDate = new Date(resDate);
    const inWeek = appDate >= weekStart && appDate <= weekEnd;
    const isActive = r.status === 'confirmed' || r.status === 'pending' || r.status === 'deposit_paid';
    return inWeek && isActive;
  });
  
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  
  // SADECE reservations'dan hesapla (appointments içinde zaten _source='reservation' olanlar var, iki kere saymayalım)
  const monthlyRevenue = reservations
    .filter((r: any) => {
      const resDate = r.date || r.eventDate || r.checkIn || r.deliveryDate || '';
      const isCompleted = r.status === 'completed' || r.status === 'confirmed' || r.status === 'fully_paid';
      const isThisMonth = resDate.startsWith(currentMonth);
      return isCompleted && isThisMonth;
    })
    .reduce((sum: number, r: any) => sum + (r.pricing?.totalAmount || r.totalPrice || 0), 0);

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
        // 🍽️ Eğer masa hizmeti ise (tableId varsa), salon.services array'ini güncelle
        if ((serviceData as any).tableId || (selectedService as any).tableId) {
          console.log('🍽️ Masa hizmeti güncelleniyor (array içinde)');
          
          const currentServices = salon?.services || [];
          const updatedServices = currentServices.map(s => 
            s.id === selectedService.id ? { ...s, ...serviceData, id: selectedService.id } : s
          );
          
          await salonsService.update(salon!.id, {
            services: updatedServices
          });
        } else {
          // Normal hizmet - collection'dan güncelle
          await servicesService.update(selectedService.id, serviceData);
        }
      } else {
        // Yeni hizmet - tableId varsa array'e, yoksa collection'a ekle
        if ((serviceData as any).tableId) {
          console.log('🍽️ Yeni masa hizmeti ekleniyor (array içinde)');
          
          const currentServices = salon?.services || [];
          const newService = {
            ...serviceData,
            id: nanoid(12),
            salonId: salon!.id
          };
          
          await salonsService.update(salon!.id, {
            services: [...currentServices, newService]
          });
        } else {
          // Normal hizmet - collection'a ekle
          await servicesService.create(serviceData);
        }
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
      // 🍽️ Eğer masa hizmeti ise (tableId varsa), salon.services array'inden sil
      const serviceToDelete = salon?.services?.find(s => s.id === serviceId);
      
      // 🗑️ R2'den görseli sil (eğer varsa)
      if (serviceToDelete?.image && !serviceToDelete.image.startsWith('data:')) {
        try {
          const urlObj = new URL(serviceToDelete.image);
          const r2Path = urlObj.pathname.substring(1);
          console.log(`🗑️ R2'den hizmet görseli siliniyor: ${r2Path}`);
          await storageService.deleteFile(r2Path, 'r2');
          console.log('✅ R2 hizmet görseli silindi');
        } catch (deleteError) {
          console.warn('⚠️ R2 görseli silinemedi:', deleteError);
        }
      }
      
      if (serviceToDelete && (serviceToDelete as any).tableId) {
        console.log('🍽️ Masa hizmeti siliniyor (array içinden)');
        
        const currentServices = salon?.services || [];
        const updatedServices = currentServices.filter(s => s.id !== serviceId);
        
        await salonsService.update(salon!.id, {
          services: updatedServices
        });
      } else {
        // Normal hizmet - collection'dan sil
        await servicesService.delete(serviceId);
      }
      
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
    const staffMember = staff.find(s => s.id === staffId);
    
    if (!confirm(`"${staffMember?.name || 'Bu personel'}" personelini silmek istediğinize emin misiniz?`)) {
      return;
    }
    
    try {
      // 🗑️ R2'den görselleri sil
      if (staffMember) {
        // Ana fotoğrafı sil
        if (staffMember.photo && !staffMember.photo.startsWith('data:') && !staffMember.photo.includes('ui-avatars.com')) {
          try {
            const urlObj = new URL(staffMember.photo);
            const r2Path = urlObj.pathname.substring(1);
            console.log(`🗑️ R2'den personel fotoğrafı siliniyor: ${r2Path}`);
            await storageService.deleteFile(r2Path, 'r2');
          } catch (deleteError) {
            console.warn('⚠️ R2 fotoğrafı silinemedi:', deleteError);
          }
        }
        
        // Media array'deki görselleri sil
        if (staffMember.media && staffMember.media.length > 0) {
          for (const mediaItem of staffMember.media) {
            if (mediaItem.url && !mediaItem.url.startsWith('data:')) {
              try {
                const urlObj = new URL(mediaItem.url);
                const r2Path = urlObj.pathname.substring(1);
                console.log(`🗑️ R2'den personel medyası siliniyor: ${r2Path}`);
                await storageService.deleteFile(r2Path, 'r2');
              } catch (deleteError) {
                console.warn('⚠️ R2 medyası silinemedi:', deleteError);
              }
            }
          }
        }
      }
      
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
        <BusinessSetupWizard
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
              
              // Redirect to overview tab (genel) instead of settings
              window.location.href = '/dashboard?tab=overview';
              return;
            }
            setShowSalonSetup(false);
          }}
          onClose={() => setShowSalonSetup(false)}
        />
      )}

      {/* If owner has no salon yet, show setup message */}
      {(!user?.salonId || !salon) ? (
        <div className="min-h-screen flex items-center justify-center px-4 w-full relative overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 -left-20 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-pink-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-conic from-purple-500/10 via-pink-500/10 to-purple-500/10 rounded-full blur-3xl animate-spin" style={{ animationDuration: '20s' }} />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl relative z-10"
          >
            {/* Animated Scissors with Ribbon */}
            <div className="relative mb-12">
              {/* Ribbon */}
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: [1, 0.3, 0] }}
                transition={{ duration: 1.5, delay: 1.2, ease: "easeInOut" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-2 bg-gradient-to-r from-red-500 via-rose-400 to-red-500 rounded-full origin-center"
                style={{ transformOrigin: 'center' }}
              />
              
              {/* Glow Effect */}
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-purple-500/30 rounded-full blur-2xl"
              />
              
              {/* Scissors Icon */}
              <motion.div
                initial={{ x: -100, rotate: 0 }}
                animate={{ x: 0, rotate: [0, -15, 15, 0] }}
                transition={{ 
                  x: { duration: 1, delay: 0.3 },
                  rotate: { duration: 0.6, delay: 1, repeat: 2 }
                }}
                className="relative w-32 h-32 mx-auto flex items-center justify-center"
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-purple-500/20 backdrop-blur-sm border border-white/10" />
                <Scissors size={64} className="text-transparent bg-clip-text bg-gradient-to-br from-purple-400 via-pink-400 to-purple-400" strokeWidth={1.5} />
              </motion.div>
              
              {/* Confetti Effect */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1, delay: 2.5 }}
                className="absolute inset-0 pointer-events-none"
              >
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ 
                      x: '50%', 
                      y: '50%',
                      scale: 0,
                      opacity: 1
                    }}
                    animate={{ 
                      x: `${50 + (Math.cos(i * 30 * Math.PI / 180) * 150)}%`,
                      y: `${50 + (Math.sin(i * 30 * Math.PI / 180) * 150)}%`,
                      scale: [0, 1.5, 0],
                      opacity: [1, 1, 0]
                    }}
                    transition={{ 
                      duration: 1.2,
                      delay: 2.5,
                      ease: "easeOut"
                    }}
                    className={`absolute w-2 h-2 rounded-full ${
                      i % 3 === 0 ? 'bg-purple-400' : i % 3 === 1 ? 'bg-pink-400' : 'bg-cyan-400'
                    }`}
                  />
                ))}
              </motion.div>
            </div>

            {/* Welcome Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <h1 className="font-heading font-bold text-4xl sm:text-5xl md:text-6xl mb-4 relative">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 animate-gradient-x">
                  Hoşgeldiniz{user?.displayName ? `, ${user.displayName}` : ''}
                </span>
                <motion.span
                  animate={{ 
                    opacity: [0.5, 1, 0.5],
                    textShadow: [
                      '0 0 20px rgba(168, 85, 247, 0.5)',
                      '0 0 40px rgba(236, 72, 153, 0.8)',
                      '0 0 20px rgba(168, 85, 247, 0.5)'
                    ]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute inset-0 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 blur-sm"
                >
                  Hoşgeldiniz{user?.displayName ? `, ${user.displayName}` : ''}
                </motion.span>
              </h1>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="font-display font-bold text-3xl sm:text-4xl text-[var(--chrome-white)] mb-4"
            >
              İşletmenizi Oluşturun
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="font-body text-lg text-[var(--muted-lead)] mb-10 max-w-xl mx-auto leading-relaxed"
            >
              İşletme panelinizi kullanmaya başlamak için önce işletmenizi oluşturmanız gerekiyor. 
              Randevu yönetimi, hizmet ekleme ve daha fazlasına erişin.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, duration: 0.6 }}
            >
              <motion.button
                onClick={() => setShowSalonSetup(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group relative inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-heading font-bold text-lg text-white overflow-hidden transition-all mx-auto"
              >
                {/* Animated Background */}
                <motion.div
                  animate={{ 
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 via-purple-600 to-pink-600 bg-[length:200%_100%]"
                />
                
                {/* Glow Effect */}
                <motion.div
                  animate={{ 
                    opacity: [0.5, 1, 0.5],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 blur-xl opacity-75"
                />
                
                {/* Border Shine */}
                <motion.div
                  animate={{ 
                    rotate: [0, 360]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background: 'conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                  }}
                />
                
                <span className="relative z-10 flex items-center gap-3">
                  <Plus size={24} strokeWidth={2.5} />
                  <span>İşletme Oluştur</span>
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ 
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    →
                  </motion.span>
                </span>
              </motion.button>
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12"
            >
              {[
                { icon: '📅', text: 'Randevu Yönetimi' },
                { icon: '💼', text: 'Hizmet Ekleme' },
                { icon: '📊', text: 'Detaylı Raporlar' }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4 + (i * 0.1), duration: 0.6 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <div className="text-2xl mb-2">{feature.icon}</div>
                    <p className="text-sm font-medium text-[var(--silver-frost)]">{feature.text}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
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
            {/* Floating Navigation Menu Button - Hidden when BusinessSetupWizard or Restaurant panel is open */}
            {!showSalonSetup && activeTab !== 'restaurant' && <FloatingNavMenu activeTab={activeTab} onTabChange={setActiveTab} />}
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
                const backgroundGif = '/asset/Kaliteyi_bozmadan_loop_olmasn_istiyorum_kar.gif'; // HER ZAMAN KARANLIK GIF
                
                return (
                  <motion.button
                    key={stat.label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => setActiveTab(stat.tab)}
                    className="relative overflow-hidden obsidian-card p-5 text-left hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer group"
                  >
                    {/* Animated Background - Aydınlık modda çok daha belirgin */}
                    <div className={`absolute inset-0 group-hover:opacity-[0.70] transition-opacity pointer-events-none ${
                      actualTheme === 'light' ? 'opacity-[0.60]' : 'opacity-[0.25]'
                    }`}>
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

                    {/* Gradient Overlay - Aydınlık modda koyu overlay */}
                    <div className={`absolute inset-0 transition-all pointer-events-none ${
                      actualTheme === 'light'
                        ? 'bg-gradient-to-br from-gray-900/85 via-gray-900/80 to-gray-900/85 group-hover:from-gray-900/80 group-hover:via-gray-900/75 group-hover:to-gray-900/80'
                        : 'bg-gradient-to-br from-[var(--slate-surface)]/95 via-[var(--slate-surface)]/90 to-[var(--slate-surface)]/95 group-hover:from-[var(--slate-surface)]/90 group-hover:via-[var(--slate-surface)]/85 group-hover:to-[var(--slate-surface)]/90'
                    }`} />

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
                      <p className="font-mono font-bold text-3xl text-white mb-1">
                        {stat.value}
                      </p>
                      <p className="font-heading font-medium text-sm text-gray-300">{stat.label}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Abonelik Kartı - Modern Collapsible */}
            {salon && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 }}
                className="relative overflow-hidden rounded-3xl border border-white/[0.08] backdrop-blur-xl"
                style={{
                  background: actualTheme === 'light' 
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.08) 100%)'
                    : 'rgba(255, 255, 255, 0.02)'
                }}
              >
                {/* Modern gradient overlay */}
                <div className={`absolute inset-0 pointer-events-none ${
                  actualTheme === 'light'
                    ? 'bg-gradient-to-br from-emerald-600/[0.08] via-transparent to-teal-600/[0.08]'
                    : 'bg-gradient-to-br from-emerald-500/[0.02] via-transparent to-teal-500/[0.02]'
                }`} />
                
                <div className="relative">
                  <button
                    onClick={() => setShowSubscriptionCard(!showSubscriptionCard)}
                    className="w-full p-6 flex items-center justify-between hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-3xl border flex items-center justify-center ${
                        actualTheme === 'light'
                          ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-500/30'
                          : 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-white/[0.08]'
                      }`}>
                        <CreditCard size={20} className="text-emerald-400" strokeWidth={2} />
                      </div>
                      <div className="text-left">
                        <h3 
                          className="font-heading font-semibold text-base"
                          style={{ color: actualTheme === 'light' ? '#111827' : 'white' }}
                        >
                          Abonelik Durumu
                        </h3>
                        <p 
                          className="text-xs mt-0.5"
                          style={{ color: actualTheme === 'light' ? '#6b7280' : '#d1d5db' }}
                        >
                          Plan ve kullanım bilgileri
                        </p>
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: showSubscriptionCard ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown size={20} className="text-gray-300" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {showSubscriptionCard && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 border-t border-white/[0.08] pt-4">
                          <SubscriptionOverviewCard
                            businessId={salon.id}
                            onViewPlans={() => setShowSubscriptionModal(true)}
                            className="border-0"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* İşletme Linki - Modern Tasarım */}
            {salon?.slug && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.02] via-transparent to-blue-500/[0.02] pointer-events-none" />
                
                <div className="relative">
                  <button
                    onClick={() => setShowBusinessLink(!showBusinessLink)}
                    className="w-full p-6 flex items-center justify-between hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-3xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-white/[0.08] flex items-center justify-center">
                        <Link2 size={20} className="text-cyan-400" strokeWidth={2} />
                      </div>
                      <div className="text-left">
                        <h3 className="font-heading font-semibold text-base text-[var(--chrome-white)]">
                          İşletme Linkim
                        </h3>
                        <p className="text-xs text-[var(--muted-lead)] mt-0.5">
                          Müşterilerle paylaş ve rezervasyon al
                        </p>
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: showBusinessLink ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown size={20} className="text-[var(--muted-lead)]" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {showBusinessLink && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 border-t border-white/[0.08] space-y-3 pt-4">
                          {/* Link Display */}
                          <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/[0.08]">
                            <label className="block mb-4">
                              <span className="font-heading font-semibold text-sm text-[var(--chrome-white)] flex items-center gap-2">
                                <Link2 size={16} className="text-cyan-400" />
                                İşletme Bağlantısı
                              </span>
                              <span className="text-xs text-[var(--muted-lead)] block mt-1.5">
                                Bu linki müşterilerinizle paylaşın
                              </span>
                            </label>
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-12 px-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center">
                                <code className="text-sm font-mono font-semibold text-cyan-400 truncate">
                                  randevu.app/{salon.slug}
                                </code>
                              </div>
                              <CopyButton 
                                text={`https://app-ruby-ten-20.vercel.app/salon/${salon.slug}`}
                                onCopy={() => addToast('📋 Link kopyalandı!', 'success')}
                              />
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="grid grid-cols-2 gap-3">
                            <a
                              href={`/salon/${salon.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-12 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center gap-2 transition-all font-heading font-semibold text-sm text-cyan-400 hover:text-cyan-300"
                            >
                              <ExternalLink size={16} strokeWidth={2} />
                              Önizle
                            </a>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(`https://app-ruby-ten-20.vercel.app/salon/${salon.slug}`);
                                addToast('🎉 Link kopyalandı!', 'success');
                              }}
                              className="h-12 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center gap-2 transition-all font-heading font-semibold text-sm text-emerald-400 hover:text-emerald-300"
                            >
                              <Link2 size={16} strokeWidth={2} />
                              Paylaş
                            </button>
                          </div>

                          {/* QR Code Section - Collapsible */}
                          <button
                            onClick={() => setShowQRCodes(!showQRCodes)}
                            className="w-full p-5 rounded-3xl bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.03] transition-all text-left"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-white/[0.08] flex items-center justify-center">
                                  <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                  </svg>
                                </div>
                                <div>
                                  <h4 className="font-heading font-semibold text-base text-[var(--chrome-white)] mb-0.5">
                                    QR Kodlar
                                  </h4>
                                  <p className="text-xs text-[var(--muted-lead)]">
                                    5 farklı stil • Yazdırılabilir
                                  </p>
                                </div>
                              </div>
                              <motion.div
                                animate={{ rotate: showQRCodes ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <ChevronDown size={20} className="text-[var(--muted-lead)]" />
                              </motion.div>
                            </div>
                          </button>

                          <AnimatePresence>
                            {showQRCodes && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-3 p-5 rounded-3xl bg-white/[0.02] border border-white/[0.08]">
                                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                                    {qrStyles.map((style) => (
                                      <QRCodeCard
                                        key={style.id}
                                        url={`https://app-ruby-ten-20.vercel.app/salon/${salon.slug}`}
                                        businessName={salon.name}
                                        style={style}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Info */}
                          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                                <Sparkles size={14} className="text-purple-400" />
                              </div>
                              <div>
                                <p className="text-sm font-heading font-semibold text-purple-300 mb-1">
                                  Linki Nerede Paylaşabilirsiniz?
                                </p>
                                <p className="text-xs text-purple-300/80 leading-relaxed">
                                  Instagram bio, WhatsApp durumu, Google Business profili, Facebook sayfası veya doğrudan müşterilerle paylaşabilirsiniz
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* RESTORAN PANELİ KARTI */}
            {salon && (salon.category === 'restoran' || salon.category === 'kafe') && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                onClick={() => setActiveTab('restaurant')}
                className="relative w-full overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.02] to-transparent backdrop-blur-xl p-6 hover:bg-white/[0.05] transition-colors group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-red-500/5 pointer-events-none" />
                
                <div className="relative flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-white/[0.08] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ChefHat size={24} className="text-orange-400" strokeWidth={2} />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-heading font-bold text-lg text-[var(--chrome-white)] mb-1">
                      Restoran Paneli
                    </h3>
                    <p className="text-xs text-[var(--muted-lead)] mt-0.5">
                      Mutfak, Garson, Kasiyer, Menü ve Masa Yönetimi
                    </p>
                  </div>
                  <ChevronDown className="w-5 h-5 text-[var(--muted-lead)] -rotate-90 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.button>
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
            {/* 🍽️ Restoran için özel bilgilendirme */}
            {salon && (salon.category === 'restoran' || (salon as any).category === 'restaurant') && (
              <div className="obsidian-card p-4 border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                <div className="flex items-start gap-3">
                  <ChefHat className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h4 className="font-heading font-bold text-[var(--chrome-white)] mb-2">
                      🍽️ Masa Rezervasyon Sistemi
                    </h4>
                    <p className="text-sm text-[var(--muted-lead)] mb-3">
                      Masalarınız otomatik olarak rezervasyon hizmeti olarak ekleniyor. 
                      Müşteriler "Randevu Al" butonundan masalarınıza rezervasyon yapabilir.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-purple-400">
                      <span className="flex items-center gap-1">
                        ✅ Otomatik hizmet oluşturma
                      </span>
                      <span className="text-[var(--muted-lead)]">•</span>
                      <span className="flex items-center gap-1">
                        ✅ Online rezervasyon
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
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

            {services.length === 0 && salon && (salon.category === 'restoran' || (salon as any).category === 'restaurant') ? (
              <div className="obsidian-card p-8 text-center">
                <ChefHat className="w-16 h-16 mx-auto mb-4 text-orange-500/50" />
                <h3 className="font-heading font-bold text-xl text-[var(--chrome-white)] mb-2">
                  Masalarınızı Ekleyin
                </h3>
                <p className="text-[var(--muted-lead)] mb-4">
                  "Restoran Dashboard" → "Masalar" bölümünden masalarınızı ekleyin.
                  Masalar otomatik olarak rezervasyon hizmeti olarak burada görünecek.
                </p>
              </div>
            ) : services.length === 0 ? (
              <div className="obsidian-card p-8 text-center">
                <Scissors className="w-16 h-16 mx-auto mb-4 text-purple-500/50" />
                <h3 className="font-heading font-bold text-xl text-[var(--chrome-white)] mb-2">
                  Henüz Hizmet Yok
                </h3>
                <p className="text-[var(--muted-lead)]">
                  İlk hizmetinizi ekleyerek başlayın
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className={cn(
                      "obsidian-card p-4 hover:border-[var(--liquid-chrome)] transition-colors cursor-pointer",
                      service.tableId && "border-l-4 border-l-orange-500"
                    )}
                    onClick={() => {
                      setSelectedService(service);
                      setShowServiceForm(true);
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-heading font-semibold text-[var(--chrome-white)]">
                            {service.name}
                          </h4>
                          {service.tableId && (
                            <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded-full font-bold">
                              MASA
                            </span>
                          )}
                        </div>
                        <p className="font-body text-sm text-[var(--muted-lead)] mb-2">
                          {service.description || service.category}
                        </p>
                        <div className="flex items-center gap-3 text-sm">
                          {/* Sadece slot-based kategorilerde dakika göster */}
                          {salon && ['kuafor', 'berber', 'guzellik', 'tirnak', 'fotograf', 'video-produksiyon', 'drone-cekim'].includes(salon.category) && (
                            <span className="font-mono text-[var(--silver-frost)]">
                              {service.duration} dk
                            </span>
                          )}
                          {service.tableId && service.pricingRules?.maxGuests && (
                            <span className="font-mono text-[var(--silver-frost)]">
                              {service.pricingRules.maxGuests} kişi
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
            )}
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

        {/* RESTAURANT PANEL - Rendered via portal to body */}
        {activeTab === 'restaurant' && salon && createPortal(
          <div className="fixed inset-0 z-[9998] bg-[var(--void)] overflow-y-auto">
            <RestaurantDashboard />
          </div>,
          document.body
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

            {/* Rezervasyon Ayarları */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-slate-500/[0.02] via-transparent to-slate-600/[0.02] pointer-events-none" />
              
              <div className="relative">
                <button
                  onClick={() => setExpandedSettings(prev => ({ ...prev, bookingSettings: !prev.bookingSettings }))}
                  className="w-full p-6 flex items-center justify-between hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-3xl bg-gradient-to-br from-slate-500/10 to-slate-600/10 border border-white/[0.08] flex items-center justify-center">
                      <Clock size={20} className="text-slate-400" strokeWidth={2} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-heading font-semibold text-base text-[var(--chrome-white)]">
                        Rezervasyon Ayarları
                      </h3>
                      <p className="text-xs text-[var(--muted-lead)] mt-0.5">
                        Randevu ve sipariş kuralları
                      </p>
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: expandedSettings.bookingSettings ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={20} className="text-[var(--muted-lead)]" />
                  </motion.div>
                </button>
                
                <AnimatePresence>
                  {expandedSettings.bookingSettings && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 border-t border-white/[0.08] space-y-3 pt-4">
                        {/* Minimum Sipariş Süresi */}
                        <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/[0.08]">
                          <label className="block mb-4">
                            <span className="font-heading font-semibold text-sm text-[var(--chrome-white)] flex items-center gap-2">
                              <CalendarIcon size={16} className="text-slate-400" />
                              Minimum Sipariş/Rezervasyon Süresi
                            </span>
                            <span className="text-xs text-[var(--muted-lead)] block mt-1.5">
                              Müşteriler en az kaç gün önceden sipariş verebilir? (0 = anında sipariş alınabilir)
                            </span>
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              min="0"
                              max="30"
                              value={salon.settings.minOrderDays || 0}
                              onChange={async (e) => {
                                const value = parseInt(e.target.value) || 0;
                                try {
                                  await salonsService.update(salon.id, {
                                    settings: {
                                      ...salon.settings,
                                      minOrderDays: value,
                                    },
                                  });
                                  await loadData();
                                  addToast('Minimum sipariş süresi güncellendi', 'success');
                                } catch (error) {
                                  console.error('Error updating minOrderDays:', error);
                                  addToast('Ayar güncellenemedi', 'error');
                                }
                              }}
                              className="w-24 h-11 px-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-[var(--chrome-white)] font-heading font-semibold text-center outline-none focus:border-[var(--liquid-chrome)] focus:bg-white/[0.05] transition-all"
                            />
                            <span className="text-sm text-[var(--muted-lead)] font-heading">gün</span>
                          </div>
                          <p className="text-xs text-[var(--muted-lead)] mt-3 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                            {(salon.settings.minOrderDays || 0) === 0 
                              ? 'Müşteriler bugün için bile sipariş verebilir'
                              : `Müşteriler en az ${salon.settings.minOrderDays} gün önceden sipariş verebilir`}
                          </p>
                        </div>

                        {/* İleri Rezervasyon Süresi */}
                        <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/[0.08]">
                          <label className="block mb-4">
                            <span className="font-heading font-semibold text-sm text-[var(--chrome-white)] flex items-center gap-2">
                              <TrendingUp size={16} className="text-slate-400" />
                              Maksimum İleri Rezervasyon
                            </span>
                            <span className="text-xs text-[var(--muted-lead)] block mt-1.5">
                              Müşteriler en fazla kaç gün sonrasına rezervasyon yapabilir?
                            </span>
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              min="7"
                              max="365"
                              value={salon.settings.advanceBookingDays || 30}
                              onChange={async (e) => {
                                const value = parseInt(e.target.value) || 30;
                                try {
                                  await salonsService.update(salon.id, {
                                    settings: {
                                      ...salon.settings,
                                      advanceBookingDays: value,
                                    },
                                  });
                                  await loadData();
                                  addToast('İleri rezervasyon süresi güncellendi', 'success');
                                } catch (error) {
                                  console.error('Error updating advanceBookingDays:', error);
                                  addToast('Ayar güncellenemedi', 'error');
                                }
                              }}
                              className="w-24 h-11 px-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-[var(--chrome-white)] font-heading font-semibold text-center outline-none focus:border-[var(--liquid-chrome)] focus:bg-white/[0.05] transition-all"
                            />
                            <span className="text-sm text-[var(--muted-lead)] font-heading">gün</span>
                          </div>
                        </div>

                        {/* İptal Ayarları */}
                        <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/[0.08]">
                          <label className="block mb-4">
                            <span className="font-heading font-semibold text-sm text-[var(--chrome-white)] flex items-center gap-2">
                              <X size={16} className="text-slate-400" />
                              İptal Süresi
                            </span>
                            <span className="text-xs text-[var(--muted-lead)] block mt-1.5">
                              Müşteriler randevudan en az kaç saat önce iptal edebilir?
                            </span>
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              min="1"
                              max="72"
                              value={salon.settings.cancellationHours || 24}
                              onChange={async (e) => {
                                const value = parseInt(e.target.value) || 24;
                                try {
                                  await salonsService.update(salon.id, {
                                    settings: {
                                      ...salon.settings,
                                      cancellationHours: value,
                                    },
                                  });
                                  await loadData();
                                  addToast('İptal süresi güncellendi', 'success');
                                } catch (error) {
                                  console.error('Error updating cancellationHours:', error);
                                  addToast('Ayar güncellenemedi', 'error');
                                }
                              }}
                              className="w-24 h-11 px-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-[var(--chrome-white)] font-heading font-semibold text-center outline-none focus:border-[var(--liquid-chrome)] focus:bg-white/[0.05] transition-all"
                            />
                            <span className="text-sm text-[var(--muted-lead)] font-heading">saat</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Ödeme Ayarları */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-slate-500/[0.02] via-transparent to-slate-600/[0.02] pointer-events-none" />
              
              <div className="relative">
                <button
                  onClick={() => setExpandedSettings(prev => ({ ...prev, payment: !prev.payment }))}
                  className="w-full p-6 flex items-center justify-between hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-3xl bg-gradient-to-br from-slate-500/10 to-slate-600/10 border border-white/[0.08] flex items-center justify-center">
                      <DollarSign size={20} className="text-slate-400" strokeWidth={2} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-heading font-semibold text-base text-[var(--chrome-white)]">
                        Ödeme Ayarları
                      </h3>
                      <p className="text-xs text-[var(--muted-lead)] mt-0.5">
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
                      <div className="px-6 pb-6 border-t border-white/[0.08] pt-4">
                        <PaymentSettingsForm
                          settings={salon.paymentSettings || { bankTransferEnabled: false }}
                          onSave={async (paymentSettings) => {
                            await salonsService.update(salon.id, { paymentSettings });
                            await loadData();
                          }}
                        />
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
              className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-slate-500/[0.02] via-transparent to-slate-600/[0.02] pointer-events-none" />
              
              <div className="relative">
                <button
                  onClick={() => setExpandedSettings(prev => ({ ...prev, workingHours: !prev.workingHours }))}
                  className="w-full p-6 flex items-center justify-between hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-3xl bg-gradient-to-br from-slate-500/10 to-slate-600/10 border border-white/[0.08] flex items-center justify-center">
                      <Clock size={20} className="text-slate-400" strokeWidth={2} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-heading font-semibold text-base text-[var(--chrome-white)]">
                        Çalışma Saatleri
                      </h3>
                      <p className="text-xs text-[var(--muted-lead)] mt-0.5">
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
        <BusinessSetupWizard
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
              
              // Redirect to overview tab (genel) instead of settings
              window.location.href = '/dashboard?tab=overview';
              return;
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
        <>
          {(salon.businessType === 'restaurant' || salon.businessType === 'cafe' || salon.category === 'restoran' || salon.category === 'kafe') ? (
            <RestaurantSubscriptionModal
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
          ) : (
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
        </>
      )}

      </div>
    </div>

    {/* Announcement Popup for Business Owners */}
    {salon && (
      <>
        <AnnouncementPopup 
          userType="owner" 
          businessId={salon.id}
        />
      </>
    )}
    </>
  );
}


