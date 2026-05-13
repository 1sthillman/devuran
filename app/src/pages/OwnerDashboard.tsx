import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useDashboardStore } from '@/store/dashboardStore';
import { useThemeStore } from '@/store/themeStore';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppointmentManager } from '@/components/dashboard/AppointmentManager';
import { QueueManager } from '@/components/dashboard/QueueManager';
import { WorkingHoursEditor } from '@/components/dashboard/WorkingHoursEditor';
import { ServiceForm } from '@/components/dashboard/ServiceForm';
import { SalonSetupForm } from '@/components/dashboard/SalonSetupForm';
import { StaffForm } from '@/components/dashboard/StaffForm';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { MultiImageUploader } from '@/components/ui/MultiImageUploader';
import { ChromaticButton } from '@/components/ui/ChromaticButton';
import { appointmentsService, salonsService, servicesService, staffService } from '@/services/firebaseService';
import { authService } from '@/services/authService';
import type { Appointment, Salon, Service, Staff } from '@/types';

const sidebarItems = [
  { key: 'overview', label: 'Genel Bakis', icon: LayoutDashboard },
  { key: 'appointments', label: 'Randevular', icon: CalendarIcon },
  { key: 'services', label: 'Hizmetler', icon: Scissors },
  { key: 'staff', label: 'Personel', icon: Users },
  { key: 'settings', label: 'Ayarlar', icon: Settings },
]; // Exactly 5 items for mobile navigation

export function OwnerDashboard() {
  const { isAuthenticated, isOwner, user } = useAuthStore();
  const { actualTheme } = useThemeStore();
  const { activeTab, setActiveTab } = useDashboardStore();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [showSalonSetup, setShowSalonSetup] = useState(false);

  useEffect(() => {
    if (user?.salonId) {
      loadData();
    } else if (user) {
      // User is owner but has no salon yet
      setLoading(false);
    }
  }, [user?.salonId, user]);

  const loadData = async () => {
    if (!user?.salonId) return;
    
    setLoading(true);
    try {
      const [salonData, appointmentsData, servicesData, staffData] = await Promise.all([
        salonsService.getById(user.salonId),
        appointmentsService.getSalonAppointments(user.salonId),
        servicesService.getBySalon(user.salonId),
        staffService.getBySalon(user.salonId),
      ]);

      setSalon(salonData);
      setAppointments(appointmentsData);
      setServices(servicesData);
      setStaff(staffData);
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
      alert('Salon kaydedilemedi. Lütfen tekrar deneyin.');
      throw error;
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isOwner) {
    return <Navigate to="/appointments" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--liquid-chrome)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-body text-[var(--muted-lead)]">Yukleniyor...</p>
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
              Salonunuzu Olusturun
            </h2>
            <p className="font-body text-[var(--muted-lead)] mb-6">
              Isletme panelinizi kullanmaya baslamak icin once salonunuzu olusturmaniz gerekiyor.
            </p>
            <ChromaticButton
              onClick={() => setShowSalonSetup(true)}
              className="flex items-center gap-2 mx-auto"
            >
              <Plus size={20} />
              <span>Salon Olustur</span>
            </ChromaticButton>
            <p className="font-body text-xs text-[var(--muted-lead)] mt-6">
              Salon bilgilerinizi girdikten sonra randevu yonetimi, hizmet ekleme ve daha fazlasina erisebileceksiniz.
            </p>
          </motion.div>
        </div>
      </>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const todayApps = appointments.filter((a) => a.date === todayStr && a.status !== 'cancelled');
  const pendingApps = appointments.filter((a) => a.status === 'pending');
  const weekStart = new Date();
  const weekEnd = new Date();
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekApps = appointments.filter((a) => {
    const appDate = new Date(a.date);
    return appDate >= weekStart && appDate <= weekEnd;
  });
  const monthlyRevenue = appointments
    .filter((a) => a.status === 'completed' && a.date.startsWith(new Date().toISOString().slice(0, 7)))
    .reduce((sum, a) => sum + a.totalPrice, 0);

  const handleSaveWorkingHours = async (hours: any) => {
    if (!salon) return;
    await salonsService.update(salon.id, { workingHours: hours });
    await loadData();
  };

  const handleSaveService = async (serviceData: Omit<Service, 'id'>) => {
    try {
      if (selectedService) {
        await servicesService.update(selectedService.id, serviceData);
      } else {
        await servicesService.create(serviceData);
      }
      await loadData();
    } catch (error: any) {
      console.error('Error saving service:', error);
      alert(error?.message || 'Hizmet kaydedilemedi. Lütfen tekrar deneyin.');
      throw error;
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      await servicesService.delete(serviceId);
      await loadData();
    } catch (error: any) {
      console.error('Error deleting service:', error);
      alert(error?.message || 'Hizmet silinemedi. Lütfen tekrar deneyin.');
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
    } catch (error: any) {
      console.error('Error saving staff:', error);
      alert(error?.message || 'Personel kaydedilemedi. Lütfen tekrar deneyin.');
      throw error;
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    try {
      await staffService.delete(staffId);
      await loadData();
    } catch (error: any) {
      console.error('Error deleting staff:', error);
      alert(error?.message || 'Personel silinemedi. Lütfen tekrar deneyin.');
      throw error;
    }
  };

  return (
    <div className="min-h-screen flex gap-6">
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
              Salonunuzu Olusturun
            </h2>
            <p className="font-body text-[var(--muted-lead)] mb-6">
              Isletme panelinizi kullanmaya baslamak icin once salonunuzu olusturmaniz gerekiyor.
            </p>
            <ChromaticButton
              onClick={() => setShowSalonSetup(true)}
              className="flex items-center gap-2 mx-auto"
            >
              <Plus size={20} />
              <span>Salon Olustur</span>
            </ChromaticButton>
            <p className="font-body text-xs text-[var(--muted-lead)] mt-6">
              Salon bilgilerinizi girdikten sonra randevu yonetimi, hizmet ekleme ve daha fazlasina erisebileceksiniz.
            </p>
          </motion.div>
        </div>
      ) : (
        <>
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:block w-60 flex-shrink-0">
        <div className="sticky top-24">
          <div className="obsidian-card p-3 space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-full font-heading font-medium text-sm transition-all',
                    activeTab === item.key
                      ? 'text-[var(--chrome-white)] bg-white/5'
                      : 'text-[var(--muted-lead)] hover:text-[var(--silver-frost)]'
                  )}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-x-hidden">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="font-display font-bold text-2xl text-[var(--chrome-white)]">
            {sidebarItems.find((i) => i.key === activeTab)?.label}
          </h1>
          {salon && (
            <p className="font-body text-sm text-[var(--muted-lead)] truncate max-w-[200px]">
              {salon.name}
            </p>
          )}
        </div>

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Bugunku Randevu", value: todayApps.length, icon: Clock, color: '#2DC24E', tab: 'appointments' },
                { label: "Bekleyen Onay", value: pendingApps.length, icon: TrendingUp, color: '#E5A522', tab: 'appointments' },
                { label: "Bu Hafta", value: weekApps.length, icon: CalendarIcon, color: '#60a5fa', tab: 'appointments' },
                { label: "Bu Ay Gelir", value: `${monthlyRevenue.toLocaleString()} TL`, icon: DollarSign, color: '#c8c8d4', tab: 'overview' },
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
                    onClick={() => stat.tab !== 'overview' && setActiveTab(stat.tab)}
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
            <AppointmentManager
              appointments={appointments}
              salonId={salon.id}
              onRefresh={loadData}
            />
            
            {/* Queue Manager */}
            <div className="obsidian-card p-6 rounded-3xl">
              <h2 className="font-heading text-xl font-bold text-[var(--chrome-white)] mb-4">
                Sıra Yönetimi
              </h2>
              <QueueManager
                salonId={salon.id}
                onRefresh={loadData}
              />
            </div>
          </div>
        )}

        {/* SERVICES */}
        {activeTab === 'services' && (
          <div className="space-y-4">
            <ChromaticButton
              onClick={() => {
                setSelectedService(null);
                setShowServiceForm(true);
              }}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              <span>Yeni Hizmet Ekle</span>
            </ChromaticButton>

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
                        <span className="font-mono text-[var(--silver-frost)]">
                          {service.duration} dk
                        </span>
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
            <ChromaticButton
              onClick={() => {
                setSelectedStaff(null);
                setShowStaffForm(true);
              }}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              <span>Yeni Personel Ekle</span>
            </ChromaticButton>

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

        {/* SETTINGS */}
        {activeTab === 'settings' && salon && (
          <div className="space-y-6">
            {/* Salon Bilgilerini Düzenle - Modern Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="obsidian-card overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                      <Settings size={28} className="text-purple-400" strokeWidth={2} />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-2xl text-[var(--chrome-white)]">
                        Salon Bilgileri
                      </h3>
                      <p className="font-body text-sm text-[var(--muted-lead)] mt-1">
                        İşletme bilgilerinizi görüntüleyin ve düzenleyin
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSalonSetup(true)}
                    className="obsidian-card px-6 py-3 rounded-full flex items-center gap-2 hover:bg-white/5 transition-all active:scale-95 group"
                  >
                    <Settings size={18} className="text-[var(--liquid-chrome)] group-hover:rotate-90 transition-transform duration-300" strokeWidth={2.5} />
                    <span className="hidden sm:inline font-heading font-semibold text-sm text-[var(--chrome-white)]">Düzenle</span>
                  </button>
                </div>
              
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-5 rounded-3xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-[var(--obsidian-rim)] hover:border-[var(--liquid-chrome)]/30 transition-colors">
                    <p className="text-[var(--muted-lead)] text-xs font-heading font-medium uppercase tracking-wider mb-2">Salon Adı</p>
                    <p className="text-[var(--chrome-white)] font-heading font-semibold text-lg truncate">{salon.name}</p>
                  </div>
                  <div className="p-5 rounded-3xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-[var(--obsidian-rim)] hover:border-[var(--liquid-chrome)]/30 transition-colors">
                    <p className="text-[var(--muted-lead)] text-xs font-heading font-medium uppercase tracking-wider mb-2">Kategori</p>
                    <p className="text-[var(--chrome-white)] font-heading font-semibold text-lg capitalize">{salon.category}</p>
                  </div>
                  <div className="p-5 rounded-3xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-[var(--obsidian-rim)] hover:border-[var(--liquid-chrome)]/30 transition-colors">
                    <p className="text-[var(--muted-lead)] text-xs font-heading font-medium uppercase tracking-wider mb-2">Telefon</p>
                    <p className="text-[var(--chrome-white)] font-heading font-semibold text-lg">{salon.phone}</p>
                  </div>
                  <div className="p-5 rounded-3xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-[var(--obsidian-rim)] hover:border-[var(--liquid-chrome)]/30 transition-colors">
                    <p className="text-[var(--muted-lead)] text-xs font-heading font-medium uppercase tracking-wider mb-2">Şehir</p>
                    <p className="text-[var(--chrome-white)] font-heading font-semibold text-lg">{salon.address.city}</p>
                  </div>
                  <div className="p-5 rounded-3xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-[var(--obsidian-rim)] hover:border-[var(--liquid-chrome)]/30 transition-colors">
                    <p className="text-[var(--muted-lead)] text-xs font-heading font-medium uppercase tracking-wider mb-2">İlçe</p>
                    <p className="text-[var(--chrome-white)] font-heading font-semibold text-lg">{salon.address.district}</p>
                  </div>
                  <div className="p-5 rounded-3xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-[var(--obsidian-rim)] hover:border-[var(--liquid-chrome)]/30 transition-colors">
                    <p className="text-[var(--muted-lead)] text-xs font-heading font-medium uppercase tracking-wider mb-2">E-posta</p>
                    <p className="text-[var(--chrome-white)] font-heading font-semibold text-lg truncate">{salon.email || '-'}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Randevu Açık/Kapalı Toggle */}
            <div className="obsidian-card p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-semibold text-xl md:text-2xl text-[var(--chrome-white)] mb-2">
                    Randevu Sistemi
                  </h3>
                  <p className="font-body text-sm md:text-base text-[var(--muted-lead)]">
                    Randevu almayı anlık olarak açıp kapatabilirsiniz
                  </p>
                </div>
                <button
                  onClick={async () => {
                    const newStatus = !salon.isAcceptingBookings;
                    await salonsService.update(salon.id, { isAcceptingBookings: newStatus });
                    await loadData();
                  }}
                  className={`relative w-20 h-10 rounded-full transition-all duration-300 flex-shrink-0 ${
                    salon.isAcceptingBookings 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/30' 
                      : 'bg-[var(--slate-elevated)]'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-8 h-8 rounded-full bg-white shadow-lg transition-all duration-300 ${
                      salon.isAcceptingBookings ? 'translate-x-10' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="mt-4 p-4 rounded-3xl bg-white/[0.03] border border-[var(--obsidian-rim)]">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    salon.isAcceptingBookings ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                  }`} />
                  <p className="font-body text-sm md:text-base text-[var(--silver-frost)]">
                    Durum: {salon.isAcceptingBookings ? (
                      <span className="text-green-400 font-semibold ml-2">Randevu Alınıyor</span>
                    ) : (
                      <span className="text-red-400 font-semibold ml-2">Randevu Kapalı</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <WorkingHoursEditor
              initialHours={salon.workingHours as any}
              onSave={handleSaveWorkingHours}
            />
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

      {/* Service Form Modal */}
      {showServiceForm && salon && (
        <ServiceForm
          service={selectedService || undefined}
          salonId={salon.id}
          onSave={handleSaveService}
          onDelete={selectedService ? handleDeleteService : undefined}
          onClose={() => {
            setShowServiceForm(false);
            setSelectedService(null);
          }}
        />
      )}

      {/* Staff Form Modal */}
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
    </div>
  );
}

