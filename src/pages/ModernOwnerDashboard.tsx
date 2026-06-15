import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  TrendingUp,
  Eye,
  X,
  Sparkles,
  Clock,
  Phone,
  CheckCircle2,
  Scissors,
  Star,
  UserCheck,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModernQueueManager } from '@/components/dashboard/ModernQueueManager';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { CustomerList } from '@/components/crm/CustomerList';
import { ReviewList } from '@/components/reviews/ReviewList';
import { ServiceForm } from '@/components/dashboard/ServiceForm';
import { StaffForm } from '@/components/dashboard/StaffForm';
import { SalonSetupForm } from '@/components/dashboard/SalonSetupForm';
import { CancelAppointmentDialog } from '@/components/booking/CancelAppointmentDialog';
import { salonsService, servicesService, staffService } from '@/services/firebaseService';
import { reservationService } from '@/services/reservationService';
import { useUIStore } from '@/store/uiStore';
import { reservationToCalendarEvent, getDefaultCalendarAction } from '@/utils/calendarUtils';
import type { Salon, Service, Staff } from '@/types';

// 8 ana sekme - tüm özellikler dahil
const tabs = [
  { key: 'overview', label: 'Genel', icon: LayoutDashboard },
  { key: 'reservations', label: 'Randevular', icon: Calendar },
  { key: 'queue', label: 'Sıra', icon: Users },
  { key: 'services', label: 'Hizmetler', icon: Scissors },
  { key: 'customers', label: 'Müşteriler', icon: UserCheck },
  { key: 'reviews', label: 'Yorumlar', icon: Star },
  { key: 'analytics', label: 'Analitik', icon: TrendingUp },
  { key: 'settings', label: 'Ayarlar', icon: Settings },
];

export function ModernOwnerDashboard() {
  const { isAuthenticated, isOwner, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('reservations');
  const [salon, setSalon] = useState<Salon | null>(null);
  const [reservations, setReservations] = useState<any[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [showSalonSetup, setShowSalonSetup] = useState(false);

  useEffect(() => {
    if (user?.salonId) {
      loadData();
    }
  }, [user?.salonId]);

  const loadData = async () => {
    if (!user?.salonId) return;
    
    setLoading(true);
    try {
      const [salonData, reservationsData, servicesData, staffData] = await Promise.all([
        salonsService.getById(user.salonId),
        reservationService.getBusinessReservations(user.salonId),
        servicesService.getBySalon(user.salonId),
        staffService.getBySalon(user.salonId),
      ]);

      setSalon(salonData);
      setReservations(reservationsData);
      setServices(servicesData);
      setStaff(staffData);
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
    }
    setLoading(false);
  };

  // Service CRUD operations
  const addService = async (serviceData: Omit<Service, 'id'>) => {
    if (!user?.salonId) return;
    await servicesService.create(serviceData);
  };

  const updateService = async (serviceId: string, serviceData: Partial<Service>) => {
    await servicesService.update(serviceId, serviceData);
  };

  const deleteService = async (serviceId: string) => {
    await servicesService.delete(serviceId);
  };

  // Staff CRUD operations
  const addStaff = async (staffData: Omit<Staff, 'id'>) => {
    if (!user?.salonId) return;
    await staffService.create(staffData);
  };

  const updateStaff = async (staffId: string, staffData: Partial<Staff>) => {
    await staffService.update(staffId, staffData);
  };

  const deleteStaff = async (staffId: string) => {
    await staffService.delete(staffId);
  };

  // Salon update operation
  const updateSalon = async (salonId: string, salonData: Partial<Salon>) => {
    await salonsService.update(salonId, salonData);
  };

  const handleViewDetails = (reservation: any) => {
    setSelectedReservation(reservation);
    setShowDetailModal(true);
  };

  if (!isAuthenticated || !isOwner) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--void)] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--void)]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[var(--void)]/80 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <h1 className="font-heading font-bold text-lg text-[var(--chrome-white)]">
                  {salon?.name || 'Dashboard'}
                </h1>
                <p className="text-xs text-[var(--muted-lead)]">İşletme Yönetimi</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="sticky top-16 z-30 bg-[var(--void)]/80 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-2 rounded-xl font-heading font-semibold text-sm whitespace-nowrap transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30"
                      : "bg-white/[0.03] text-[var(--muted-lead)] hover:bg-white/[0.05] hover:text-[var(--chrome-white)]"
                  )}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <OverviewTab
                reservations={reservations}
                services={services}
                staff={staff}
              />
            </motion.div>
          )}

          {activeTab === 'reservations' && (
            <motion.div
              key="reservations"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <ReservationsList
                reservations={reservations}
                onViewDetails={handleViewDetails}
              />
            </motion.div>
          )}

          {activeTab === 'queue' && salon && (
            <motion.div
              key="queue"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <ModernQueueManager
                salonId={salon.id}
                onRefresh={loadData}
              />
            </motion.div>
          )}

          {activeTab === 'services' && salon && (
            <motion.div
              key="services"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <ServicesTab
                services={services}
                onAdd={() => {
                  setSelectedService(null);
                  setShowServiceForm(true);
                }}
                onEdit={(service) => {
                  setSelectedService(service);
                  setShowServiceForm(true);
                }}
                onRefresh={loadData}
              />
            </motion.div>
          )}

          {activeTab === 'customers' && salon && (
            <motion.div
              key="customers"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <CustomerList salonId={salon.id} />
            </motion.div>
          )}

          {activeTab === 'reviews' && salon && (
            <motion.div
              key="reviews"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <ReviewList salonId={salon.id} />
            </motion.div>
          )}

          {activeTab === 'analytics' && salon && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <AnalyticsDashboard salonId={salon.id} />
            </motion.div>
          )}

          {activeTab === 'settings' && salon && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <SettingsTab
                salon={salon}
                staff={staff}
                onEditSalon={() => setShowSalonSetup(true)}
                onAddStaff={() => {
                  setSelectedStaff(null);
                  setShowStaffForm(true);
                }}
                onEditStaff={(staffMember) => {
                  setSelectedStaff(staffMember);
                  setShowStaffForm(true);
                }}
                onRefresh={loadData}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      {showDetailModal && selectedReservation && (
        <ReservationDetailModal
          reservation={selectedReservation}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedReservation(null);
          }}
          onCancel={() => {
            loadData();
          }}
        />
      )}

      {showServiceForm && salon && (
        <ServiceForm
          salonId={salon.id}
          service={selectedService}
          category={salon.category}
          onSave={async (serviceData) => {
            if (selectedService) {
              await updateService(selectedService.id, serviceData);
            } else {
              await addService(serviceData);
            }
          }}
          onDelete={selectedService ? async (id) => await deleteService(id) : undefined}
          onClose={() => {
            setShowServiceForm(false);
            setSelectedService(null);
            loadData();
          }}
        />
      )}

      {showStaffForm && salon && (
        <StaffForm
          salonId={salon.id}
          staff={selectedStaff}
          onSave={async (staffData) => {
            if (selectedStaff) {
              await updateStaff(selectedStaff.id, staffData);
            } else {
              await addStaff(staffData);
            }
          }}
          onDelete={selectedStaff ? async (id) => await deleteStaff(id) : undefined}
          onClose={() => {
            setShowStaffForm(false);
            setSelectedStaff(null);
            loadData();
          }}
        />
      )}

      {showSalonSetup && salon && (
        <SalonSetupForm
          salon={salon}
          onSave={async (salonData) => {
            await updateSalon(salon.id, salonData);
          }}
          onClose={() => {
            setShowSalonSetup(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

// Overview Tab
function OverviewTab({
  reservations,
  services,
  staff,
}: {
  reservations: any[];
  services: Service[];
  staff: Staff[];
}) {
  const todayReservations = reservations.filter(r => r.date === new Date().toISOString().split('T')[0]);
  const pendingReservations = reservations.filter(r => r.status === 'pending');
  
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl" />
          <div className="relative">
            <p className="text-sm text-[var(--muted-lead)] mb-1">Bugünkü Randevular</p>
            <p className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {todayReservations.length}
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full blur-3xl" />
          <div className="relative">
            <p className="text-sm text-[var(--muted-lead)] mb-1">Bekleyen</p>
            <p className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              {pendingReservations.length}
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl" />
          <div className="relative">
            <p className="text-sm text-[var(--muted-lead)] mb-1">Hizmetler</p>
            <p className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              {services.length}
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full blur-3xl" />
          <div className="relative">
            <p className="text-sm text-[var(--muted-lead)] mb-1">Personel</p>
            <p className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              {staff.filter(s => s.isActive).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Services Tab
function ServicesTab({
  services,
  onAdd,
  onEdit,
  onRefresh,
}: {
  services: Service[];
  onAdd: () => void;
  onEdit: (service: Service) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-xl text-[var(--chrome-white)]">
          Hizmetler ({services.length})
        </h2>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg hover:shadow-purple-500/30 text-white font-heading font-semibold text-sm transition-all duration-200"
        >
          <Plus size={16} />
          Yeni Hizmet
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service, index) => (
          <motion.button
            key={service.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onEdit(service)}
            className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-5 hover:border-purple-500/30 transition-all duration-200 text-left"
          >
            <h4 className="font-heading font-bold text-base text-[var(--chrome-white)] mb-2">
              {service.name}
            </h4>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--muted-lead)]">{service.duration} dk</span>
              <span className="font-bold text-lg bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {service.price}₺
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// Settings Tab
function SettingsTab({
  salon,
  staff,
  onEditSalon,
  onAddStaff,
  onEditStaff,
  onRefresh,
}: {
  salon: Salon;
  staff: Staff[];
  onEditSalon: () => void;
  onAddStaff: () => void;
  onEditStaff: (staff: Staff) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Salon Settings */}
      <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-bold text-lg text-[var(--chrome-white)]">
            İşletme Bilgileri
          </h3>
          <button
            onClick={onEditSalon}
            className="px-4 py-2 rounded-2xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-300 font-semibold text-sm transition-all duration-200"
          >
            Düzenle
          </button>
        </div>
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-white/[0.03]">
            <p className="text-xs text-[var(--muted-lead)] mb-1">İşletme Adı</p>
            <p className="font-semibold text-[var(--chrome-white)]">{salon.name}</p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03]">
            <p className="text-xs text-[var(--muted-lead)] mb-1">Adres</p>
            <p className="text-sm text-[var(--chrome-white)]">
              {salon.address && typeof salon.address === 'object' && salon.address.full 
                ? salon.address.full 
                : salon.address && typeof salon.address === 'string'
                ? salon.address
                : 'Adres belirtilmemiş'}
            </p>
          </div>
          {salon.phone && (
            <div className="p-3 rounded-xl bg-white/[0.03]">
              <p className="text-xs text-[var(--muted-lead)] mb-1">Telefon</p>
              <p className="text-sm text-[var(--chrome-white)]">{salon.phone}</p>
            </div>
          )}
          {salon.category && (
            <div className="p-3 rounded-xl bg-white/[0.03]">
              <p className="text-xs text-[var(--muted-lead)] mb-1">Kategori</p>
              <p className="text-sm text-[var(--chrome-white)] capitalize">{salon.category}</p>
            </div>
          )}
        </div>
      </div>

      {/* Staff Management */}
      <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-bold text-lg text-[var(--chrome-white)]">
            Personel ({staff.length})
          </h3>
          <button
            onClick={onAddStaff}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-lg hover:shadow-emerald-500/30 text-white font-heading font-semibold text-sm transition-all duration-200"
          >
            <Plus size={16} />
            Yeni Personel
          </button>
        </div>

        {staff.length === 0 ? (
          <div className="text-center py-8">
            <Users size={40} className="text-[var(--muted-lead)] mx-auto mb-3" />
            <p className="text-sm text-[var(--muted-lead)]">Henüz personel eklenmemiş</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {staff.map((staffMember) => (
              <button
                key={staffMember.id}
                onClick={() => onEditStaff(staffMember)}
                className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 hover:border-emerald-500/30 transition-all duration-200 text-left"
              >
                <div className="flex items-center gap-3">
                  {staffMember.photo ? (
                    <img
                      src={staffMember.photo}
                      alt={staffMember.name}
                      className="w-12 h-12 rounded-xl object-cover ring-2 ring-white/10"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                      <span className="font-heading font-bold text-lg text-emerald-400">
                        {staffMember.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-heading font-bold text-sm text-[var(--chrome-white)] truncate">
                      {staffMember.name}
                    </h4>
                    <p className="text-xs text-[var(--muted-lead)] truncate">{staffMember.title}</p>
                    {!staffMember.isActive && (
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-semibold">
                        Pasif
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Modern Reservations List Component
function ReservationsList({
  reservations,
  onViewDetails,
}: {
  reservations: any[];
  onViewDetails: (reservation: any) => void;
}) {
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'pending'>('all');
  const [cancelDialogReservation, setCancelDialogReservation] = useState<any | null>(null);
  const [bulkCalendarDate, setBulkCalendarDate] = useState<string | null>(null);
  const { addToast } = useUIStore();

  const handleCancelReservation = async (reason: string) => {
    if (!cancelDialogReservation) return;
    
    try {
      await reservationService.cancelReservation(
        cancelDialogReservation.id,
        'business',
        reason
      );
      addToast('Randevu iptal edildi', 'success');
      setCancelDialogReservation(null);
      // Trigger refresh by calling parent
      window.location.reload();
    } catch (error: any) {
      console.error('Error cancelling reservation:', error);
      addToast(error?.message || 'Randevu iptal edilemedi', 'error');
    }
  };

  const filteredReservations = reservations.filter((res) => {
    if (filter === 'all') return true;
    return res.status === filter;
  });

  // Tarihe göre gruplama
  const groupedByDate = filteredReservations.reduce((acc, res) => {
    const date = res.date || res.checkIn || res.eventDate || res.deliveryDate;
    if (!acc[date]) acc[date] = [];
    acc[date].push(res);
    return acc;
  }, {} as Record<string, any[]>);

  // Toplu takvime ekleme
  const handleBulkAddToCalendar = (date: string) => {
    const dateReservations = groupedByDate[date];
    if (!dateReservations || dateReservations.length === 0) return;

    // Tüm randevuları CalendarEvent'e çevir
    const events = dateReservations.map(res => reservationToCalendarEvent(res));
    
    // Çoklu event ICS dosyası oluştur
    const icsContent = events.map(event => {
      // Her event için ayrı ICS bloğu
      const lines = [
        'BEGIN:VEVENT',
        `DTSTART:${event.startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTEND:${event.endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
        event.location ? `LOCATION:${event.location}` : '',
        `UID:${Date.now()}-${Math.random().toString(36).substring(2)}@randevu-sistemi.com`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        'STATUS:CONFIRMED',
        // Alarmlar
        'BEGIN:VALARM',
        'TRIGGER:-PT1H',
        'ACTION:DISPLAY',
        'DESCRIPTION:1 Saat Sonra Randevunuz',
        'END:VALARM',
        'BEGIN:VALARM',
        'TRIGGER:-PT15M',
        'ACTION:DISPLAY',
        'DESCRIPTION:15 Dakika Sonra Randevunuz',
        'END:VALARM',
        'END:VEVENT'
      ].filter(Boolean);
      return lines.join('\r\n');
    }).join('\r\n');

    // ICS dosyası oluştur
    const fullICS = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Randevu Sistemi//TR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      icsContent,
      'END:VCALENDAR'
    ].join('\r\n');

    // Dosyayı indir
    const blob = new Blob([fullICS], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `randevular-${date}.ics`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);

    addToast(`${dateReservations.length} randevu takvime eklendi`, 'success');
  };

  if (reservations.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center mx-auto mb-4">
          <Calendar size={40} className="text-purple-400" />
        </div>
        <h3 className="font-heading font-bold text-lg text-[var(--chrome-white)] mb-2">
          Henüz Randevu Yok
        </h3>
        <p className="text-sm text-[var(--muted-lead)]">
          Müşteriler randevu oluşturdukça burada görünecekler
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            "px-4 py-2 rounded-xl font-heading font-semibold text-sm transition-all duration-200",
            filter === 'all'
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30"
              : "bg-white/[0.03] text-[var(--muted-lead)] hover:bg-white/[0.05]"
          )}
        >
          Tümü ({reservations.length})
        </button>
        <button
          onClick={() => setFilter('confirmed')}
          className={cn(
            "px-4 py-2 rounded-xl font-heading font-semibold text-sm transition-all duration-200",
            filter === 'confirmed'
              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30"
              : "bg-white/[0.03] text-[var(--muted-lead)] hover:bg-white/[0.05]"
          )}
        >
          Onaylı ({reservations.filter(r => r.status === 'confirmed').length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={cn(
            "px-4 py-2 rounded-xl font-heading font-semibold text-sm transition-all duration-200",
            filter === 'pending'
              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30"
              : "bg-white/[0.03] text-[var(--muted-lead)] hover:bg-white/[0.05]"
          )}
        >
          Bekleyen ({reservations.filter(r => r.status === 'pending').length})
        </button>
      </div>

      {/* Tarihe Göre Gruplu Gösterim */}
      <div className="space-y-6">
        {Object.entries(groupedByDate).map(([date, dateReservations]) => {
          const reservationsArray = dateReservations as any[];
          
          return (
            <div key={date} className="space-y-3">
              {/* Tarih Başlığı ve Toplu Takvim Butonu */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <Calendar size={20} className="text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base text-[var(--chrome-white)]">
                      {new Date(date).toLocaleDateString('tr-TR', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric',
                        weekday: 'long'
                      })}
                    </h3>
                    <p className="text-xs text-[var(--muted-lead)]">
                      {reservationsArray.length} randevu
                    </p>
                  </div>
                </div>
                
                {/* Toplu Takvime Ekle Butonu */}
                <button
                  onClick={() => handleBulkAddToCalendar(date)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/20 hover:to-blue-500/20 border border-cyan-500/20 hover:border-cyan-500/40 text-cyan-400 font-heading font-semibold text-sm transition-all duration-200"
                >
                  <Calendar size={16} />
                  Tümünü Takvime Ekle
                </button>
              </div>

              {/* Reservations Grid for this date */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {reservationsArray.map((reservation, index) => (
          <motion.div
            key={reservation.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-4 hover:border-purple-500/30 transition-all duration-200"
          >
            {/* Status Badge */}
            <div className="absolute top-3 right-3">
              {reservation.status === 'confirmed' ? (
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle2 size={12} className="text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-400">Onaylandı</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Clock size={12} className="text-amber-400" />
                  <span className="text-xs font-semibold text-amber-400">Bekliyor</span>
                </div>
              )}
            </div>

            {/* Customer Name */}
            <h4 className="font-heading font-bold text-base text-[var(--chrome-white)] mb-3 pr-24">
              {reservation.userName || reservation.customerName}
            </h4>

            {/* Info Grid */}
            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar size={14} className="text-purple-400" />
                <span className="text-[var(--chrome-white)]">{reservation.date || reservation.checkIn}</span>
              </div>
              {reservation.startTime && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock size={14} className="text-cyan-400" />
                  <span className="text-[var(--chrome-white)]">{reservation.startTime} - {reservation.endTime}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Phone size={14} className="text-pink-400" />
                <span className="text-[var(--chrome-white)]">{reservation.userPhone || reservation.customerPhone}</span>
              </div>
            </div>

            {/* Price and Actions */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/[0.08]">
              <span className="font-bold text-lg bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {reservation.pricing?.totalAmount || reservation.totalPrice}₺
              </span>
              <div className="flex items-center gap-2">
                {/* Takvime Ekle Butonu */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    try {
                      const event = reservationToCalendarEvent(reservation);
                      const calendarAction = getDefaultCalendarAction(event);
                      calendarAction();
                    } catch (error) {
                      console.error('Takvime ekleme hatası:', error);
                    }
                  }}
                  className="p-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 transition-all duration-200"
                  title="Takvime Ekle"
                >
                  <Calendar size={16} />
                </button>
                
                {(reservation.status === 'pending' || reservation.status === 'confirmed') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCancelDialogReservation(reservation);
                    }}
                    className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-all duration-200"
                    title="İptal Et"
                  >
                    <X size={16} />
                  </button>
                )}
                <button
                  onClick={() => onViewDetails(reservation)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-300 font-semibold text-sm transition-all duration-200"
                >
                  <Eye size={14} />
                  Detay
                </button>
              </div>
            </div>
          </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cancel Dialog */}
      {cancelDialogReservation && (
        <CancelAppointmentDialog
          isOpen={true}
          onClose={() => setCancelDialogReservation(null)}
          onConfirm={handleCancelReservation}
          appointmentId={cancelDialogReservation.id}
          cancelledBy="salon"
        />
      )}
    </div>
  );
}

// Modern Detail Modal
function ReservationDetailModal({
  reservation,
  onClose,
  onCancel,
}: {
  reservation: any;
  onClose: () => void;
  onCancel?: () => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const { addToast } = useUIStore();

  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
    };
  }, []);

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await reservationService.cancelReservation(reservation.id, 'business');
      addToast('Randevu iptal edildi ve müşteriye bildirim gönderildi', 'success');
      setShowCancelModal(false);
      onCancel?.();
      onClose();
    } catch (error) {
      console.error('İptal hatası:', error);
      addToast('Randevu iptal edilemedi', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  const modalContent = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="fixed inset-x-0 bottom-0 sm:absolute sm:inset-4 sm:top-auto sm:bottom-auto sm:left-1/2 sm:-translate-x-1/2 sm:max-w-lg sm:my-auto h-[85vh] sm:h-auto sm:max-h-[90vh] bg-[var(--void)] rounded-t-3xl sm:rounded-3xl border-t border-white/[0.08] sm:border overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/[0.08] flex-shrink-0">
          <div className="relative flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-lg text-[var(--chrome-white)]">
                Randevu Detayları
              </h3>
              <p className="text-xs text-[var(--muted-lead)]">
                #{reservation.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] flex items-center justify-center transition-colors"
            >
              <X size={20} className="text-[var(--muted-lead)]" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Customer Info */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
            <h4 className="font-heading font-semibold text-sm text-[var(--chrome-white)] mb-3">
              Müşteri Bilgileri
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--muted-lead)]">Ad Soyad</span>
                <span className="text-sm font-semibold text-[var(--chrome-white)]">
                  {reservation.userName || reservation.customerName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--muted-lead)]">Telefon</span>
                <span className="text-sm font-semibold text-[var(--chrome-white)]">
                  {reservation.userPhone || reservation.customerPhone}
                </span>
              </div>
              {reservation.userEmail && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--muted-lead)]">E-posta</span>
                  <span className="text-sm font-semibold text-[var(--chrome-white)]">
                    {reservation.userEmail}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Date & Time */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
            <h4 className="font-heading font-semibold text-sm text-[var(--chrome-white)] mb-3">
              Tarih ve Saat
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--muted-lead)]">Tarih</span>
                <span className="text-sm font-semibold text-[var(--chrome-white)]">
                  {reservation.date || reservation.checkIn}
                </span>
              </div>
              {reservation.startTime && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--muted-lead)]">Saat</span>
                  <span className="text-sm font-semibold text-[var(--chrome-white)]">
                    {reservation.startTime} - {reservation.endTime}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Price */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--muted-lead)]">Toplam Tutar</span>
              <span className="font-bold text-2xl bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                {reservation.pricing?.totalAmount || reservation.totalPrice}₺
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/[0.08] space-y-3">
          {/* Add to Calendar Button */}
          <button
            onClick={() => {
              try {
                const event = reservationToCalendarEvent(reservation);
                const calendarAction = getDefaultCalendarAction(event);
                calendarAction();
              } catch (error) {
                console.error('Takvime ekleme hatası:', error);
              }
            }}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/20 hover:to-blue-500/20 border border-cyan-500/30 hover:border-cyan-500/50 text-cyan-400 hover:text-cyan-300 font-heading font-bold transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-cyan-500/10"
          >
            <Calendar size={18} strokeWidth={2.5} />
            <span>Takvime Ekle</span>
          </button>
          
          {(reservation.status === 'pending' || reservation.status === 'confirmed' || reservation.status === 'deposit_paid' || reservation.status === 'fully_paid') && (
            <button
              onClick={handleCancel}
              disabled={isCancelling}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-red-500/10 to-pink-500/10 hover:from-red-500/20 hover:to-pink-500/20 border border-red-500/30 hover:border-red-500/50 text-red-400 hover:text-red-300 font-heading font-bold transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-red-500/10"
            >
              {isCancelling ? (
                <>
                  <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                  <span>İptal Ediliyor...</span>
                </>
              ) : (
                <>
                  <X size={18} strokeWidth={2.5} />
                  <span>Randevuyu İptal Et</span>
                </>
              )}
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full h-12 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] text-[var(--chrome-white)] font-heading font-semibold transition-all duration-200 active:scale-95"
          >
            Kapat
          </button>
        </div>
      </motion.div>
    </motion.div>
  );

  return createPortal(modalContent, document.body);
}
