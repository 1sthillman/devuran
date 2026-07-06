import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, User, Phone, Clock, MapPin, Check, X, Search, Mail, Edit,
  DollarSign, Users, Filter, ChevronDown, Home, Briefcase, ShoppingBag, Plus, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { reservationService } from '@/services/reservationService';
import { notificationService } from '@/services/notificationService';
import { fcmService } from '@/services/fcmService';
import { useUIStore } from '@/store/uiStore';
import { useThemeStore } from '@/store/themeStore';
import { db } from '@/lib/firebase';
import { getDoc, doc } from 'firebase/firestore';
import { ModernDateTimePicker } from './ModernDateTimePicker';
import type { Reservation, SlotReservation, DailyRentalReservation, NightlyBookingReservation, ProjectReservation, OrderReservation } from '@/types';
import '@/styles/calendar.css';

interface ReservationManagerProps {
  reservations: Reservation[];
  onRefresh: () => void;
}

export function ReservationManager({ reservations, onRefresh }: ReservationManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'confirmed' | 'pending'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'slot' | 'daily' | 'nightly' | 'project' | 'order'>('all');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [cancellingReservation, setCancellingReservation] = useState<Reservation | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showOperations, setShowOperations] = useState(false);
  const [showManualReservation, setShowManualReservation] = useState(false);
  const [manualFormData, setManualFormData] = useState({
    userName: '',
    userPhone: '',
    userEmail: '',
    date: '',
    startTime: '',
    endTime: '',
    notes: '',
    services: [] as any[],
    staffId: '',
    totalAmount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const { addToast } = useUIStore();
  const { actualTheme } = useThemeStore();

  const filteredReservations = useMemo(() => {
    return reservations.filter(reservation => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const searchableText = [reservation.userName, reservation.userPhone, reservation.userEmail, reservation.id]
          .filter(Boolean).join(' ').toLowerCase();
        if (!searchableText.includes(query)) return false;
      }
      if (activeFilter === 'pending' && reservation.status !== 'pending') return false;
      if (activeFilter === 'confirmed' && !['confirmed', 'deposit_paid', 'fully_paid'].includes(reservation.status)) return false;
      if (typeFilter !== 'all' && reservation.type !== typeFilter) return false;
      return true;
    });
  }, [reservations, searchQuery, activeFilter, typeFilter]);

  const stats = useMemo(() => ({
    total: reservations.length,
    pending: reservations.filter(r => r.status === 'pending').length,
    confirmed: reservations.filter(r => ['confirmed', 'deposit_paid', 'fully_paid'].includes(r.status)).length,
    revenue: reservations.filter(r => ['confirmed', 'deposit_paid', 'fully_paid', 'completed'].includes(r.status))
      .reduce((sum, r) => sum + r.pricing.totalAmount, 0)
  }), [reservations]);

  const handleApprove = async (id: string) => {
    setLoading(true);
    try {
      await reservationService.confirmReservation(id);
      const r = reservations.find(x => x.id === id);
      if (r) {
        await notificationService.sendReservationConfirmed({
          userId: r.userId, userName: r.userName, userEmail: r.userEmail, userPhone: r.userPhone,
          businessName: r.businessName, reservationId: r.id, date: getEventDate(r) || '', time: getEventTime(r)
        });
        await sendPush(r.userId, 'Rezervasyon Onaylandı ✅', `${r.businessName} rezervasyonunuz onaylandı`);
      }
      addToast('Rezervasyon onaylandı', 'success');
      setSelectedReservation(null);
      onRefresh();
    } catch (e: any) {
      addToast(e.message || 'Hata', 'error');
    }
    setLoading(false);
  };

  const handleCancel = async () => {
    if (!cancellingReservation || !cancelReason.trim()) {
      addToast('İptal sebebi giriniz', 'error');
      return;
    }
    setLoading(true);
    try {
      await reservationService.cancelReservation(cancellingReservation.id, 'business', cancelReason);
      await notificationService.sendReservationCancelled({
        userId: cancellingReservation.userId, 
        userName: cancellingReservation.userName, 
        userEmail: cancellingReservation.userEmail, 
        userPhone: cancellingReservation.userPhone,
        businessName: cancellingReservation.businessName, 
        reservationId: cancellingReservation.id, 
        cancelledBy: 'business', 
        reason: cancelReason
      });
      await sendPush(cancellingReservation.userId, 'Rezervasyon İptal Edildi', `${cancellingReservation.businessName} rezervasyonunuz iptal edildi`);
      addToast('Rezervasyon iptal edildi', 'success');
      setCancellingReservation(null);
      setCancelReason('');
      setSelectedReservation(null);
      onRefresh();
    } catch (e: any) {
      addToast(e.message || 'Hata', 'error');
    }
    setLoading(false);
  };

  const handleEdit = async () => {
    if (!editingReservation) return;
    
    // Validation
    try {
      // Tarih kontrolü
      if (editingReservation.type === 'slot') {
        const res = editingReservation as SlotReservation;
        if (!res.date || !res.startTime || !res.endTime) {
          addToast('Tarih ve saat bilgileri eksik', 'error');
          return;
        }
        // Start < End kontrolü
        if (res.startTime >= res.endTime) {
          addToast('Başlangıç saati bitiş saatinden önce olmalı', 'error');
          return;
        }
      }
      
      if (editingReservation.type === 'daily') {
        const res = editingReservation as DailyRentalReservation;
        if (!res.eventDate || !res.startTime || !res.endTime) {
          addToast('Tarih ve saat bilgileri eksik', 'error');
          return;
        }
        if (res.startTime >= res.endTime) {
          addToast('Başlangıç saati bitiş saatinden önce olmalı', 'error');
          return;
        }
      }
      
      if (editingReservation.type === 'nightly') {
        const res = editingReservation as NightlyBookingReservation;
        if (!res.checkIn || !res.checkOut) {
          addToast('Giriş ve çıkış tarihleri eksik', 'error');
          return;
        }
        if (res.checkIn >= res.checkOut) {
          addToast('Giriş tarihi çıkış tarihinden önce olmalı', 'error');
          return;
        }
      }
      
      if (editingReservation.type === 'order') {
        const res = editingReservation as OrderReservation;
        if (!res.deliveryDate || !res.deliveryTime) {
          addToast('Teslimat tarihi ve saati eksik', 'error');
          return;
        }
      }
      
      if (editingReservation.type === 'project') {
        const res = editingReservation as ProjectReservation;
        if (!res.eventDate) {
          addToast('Etkinlik tarihi eksik', 'error');
          return;
        }
      }
      
      setLoading(true);
      await reservationService.updateReservation(editingReservation.id, editingReservation);
      
      // Müşteriye bildirim gönder
      await notificationService.sendReservationUpdated({
        userId: editingReservation.userId,
        userName: editingReservation.userName,
        userEmail: editingReservation.userEmail,
        userPhone: editingReservation.userPhone,
        businessName: editingReservation.businessName,
        reservationId: editingReservation.id
      });
      
      addToast('Rezervasyon güncellendi ve müşteri bilgilendirildi', 'success');
      setEditingReservation(null);
      setSelectedReservation(null);
      onRefresh();
    } catch (e: any) {
      addToast(e.message || 'Güncelleme başarısız', 'error');
    }
    setLoading(false);
  };

  const handleManualReservation = async () => {
    // Validation
    if (!manualFormData.userName.trim()) {
      addToast('Müşteri adı gerekli', 'error');
      return;
    }
    if (!manualFormData.userPhone.trim()) {
      addToast('Telefon numarası gerekli', 'error');
      return;
    }
    if (!manualFormData.date) {
      addToast('Tarih seçiniz', 'error');
      return;
    }
    if (!manualFormData.startTime) {
      addToast('Başlangıç saati seçiniz', 'error');
      return;
    }

    setLoading(true);
    try {
      // Dummy userId oluştur (telefon numarasından)
      const tempUserId = 'manual_' + manualFormData.userPhone.replace(/\D/g, '');
      
      // İlk rezervasyondan businessId ve businessName al
      const businessId = reservations[0]?.businessId || '';
      const businessName = reservations[0]?.businessName || '';
      
      if (!businessId) {
        addToast('İşletme bilgisi bulunamadı', 'error');
        setLoading(false);
        return;
      }
      
      // Slot reservation oluştur
      const newReservation: Partial<SlotReservation> = {
        type: 'slot',
        userId: tempUserId,
        userName: manualFormData.userName,
        userPhone: manualFormData.userPhone,
        userEmail: manualFormData.userEmail || '',
        businessId: businessId,
        businessName: businessName,
        staffId: manualFormData.staffId || '',
        staffName: '',
        date: manualFormData.date,
        startTime: manualFormData.startTime,
        endTime: manualFormData.endTime || manualFormData.startTime,
        services: manualFormData.services.length > 0 ? manualFormData.services : [{
          id: 'manual',
          name: 'Manuel Rezervasyon',
          price: manualFormData.totalAmount,
          duration: 60
        }],
        status: 'confirmed', // Manuel eklenenler direkt onaylı
        notes: manualFormData.notes,
        pricing: {
          basePrice: manualFormData.totalAmount,
          extrasTotal: 0,
          discountAmount: 0,
          taxAmount: 0,
          totalAmount: manualFormData.totalAmount,
          depositRequired: false,
          depositPercentage: 0,
          depositAmount: 0,
          finalAmount: manualFormData.totalAmount,
          currency: 'TRY' as const,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await reservationService.createReservation(newReservation as any);
      
      addToast('✅ Manuel rezervasyon başarıyla oluşturuldu', 'success');
      setShowManualReservation(false);
      setManualFormData({
        userName: '',
        userPhone: '',
        userEmail: '',
        date: '',
        startTime: '',
        endTime: '',
        notes: '',
        services: [],
        staffId: '',
        totalAmount: 0,
      });
      onRefresh();
    } catch (e: any) {
      console.error('Manuel rezervasyon hatası:', e);
      addToast(e.message || 'Rezervasyon oluşturulamadı', 'error');
    }
    setLoading(false);
  };

  const sendPush = async (userId: string, title: string, body: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) return;
      const fcmToken = userDoc.data()?.fcmToken;
      if (!fcmToken) return;
      if (fcmService.isNotificationSupported() && fcmService.getPermissionStatus() === 'granted') {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification(title, {
          body, icon: '/favicon.svg', badge: '/favicon.svg', tag: `res-${Date.now()}`,
          requireInteraction: true, data: { userId }
        } as any);
      }
    } catch (e) {
      console.error('Push error:', e);
    }
  };

  const getEventDate = (r: Reservation) => {
    if (r.type === 'slot') return (r as SlotReservation).date;
    if (r.type === 'daily') return (r as DailyRentalReservation).eventDate;
    if (r.type === 'nightly') return (r as NightlyBookingReservation).checkIn;
    if (r.type === 'project') return (r as ProjectReservation).eventDate;
    if (r.type === 'order') return (r as OrderReservation).deliveryDate;
  };

  const getEventTime = (r: Reservation) => {
    if (r.type === 'slot') return (r as SlotReservation).startTime;
    if (r.type === 'daily') return (r as DailyRentalReservation).startTime;
    if (r.type === 'order') return (r as OrderReservation).deliveryTime;
  };

  const getStatusBadge = (s: string) => {
    const cfg: Record<string, { label: string; className: string }> = {
      pending: { label: 'Bekliyor', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
      confirmed: { label: 'Onaylandı', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
      deposit_paid: { label: 'Kapora Ödendi', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
      fully_paid: { label: 'Ödendi', className: 'bg-green-500/10 text-green-400 border-green-500/20' },
      cancelled_by_user: { label: 'İptal', className: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
      cancelled_by_business: { label: 'İptal', className: 'bg-rose-500/10 text-rose-400 border-rose-500/20' }
    };
    const c = cfg[s] || cfg.pending;
    return <span className={cn('px-3 py-1 text-xs font-semibold rounded-full border whitespace-nowrap', c.className)}>{c.label}</span>;
  };

  const getTypeIcon = (t: string) => {
    if (t === 'slot') return <Clock className="w-4 h-4" />;
    if (t === 'daily') return <Calendar className="w-4 h-4" />;
    if (t === 'nightly') return <Home className="w-4 h-4" />;
    if (t === 'project') return <Briefcase className="w-4 h-4" />;
    if (t === 'order') return <ShoppingBag className="w-4 h-4" />;
    return <Calendar className="w-4 h-4" />;
  };

  const getTypeLabel = (t: string) => {
    if (t === 'slot') return 'Randevu';
    if (t === 'daily') return 'Günlük';
    if (t === 'nightly') return 'Konaklama';
    if (t === 'project') return 'Proje';
    if (t === 'order') return 'Sipariş';
    return t;
  };

  // Debug modal states
  console.log('ReservationManager render - Modal states:', {
    selectedReservation: !!selectedReservation,
    editingReservation: !!editingReservation,
    cancellingReservation: !!cancellingReservation,
    showOperations
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-white/10">
            <Calendar size={20} className="text-purple-400" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-xl" style={{ color: actualTheme === 'light' ? '#1f2937' : 'white' }}>Rezervasyon Yönetimi</h2>
            <p className="text-xs mt-0.5" style={{ color: actualTheme === 'light' ? '#6b7280' : 'rgba(255, 255, 255, 0.5)' }}>Tüm rezervasyonlarınızı yönetin</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            type="button"
            onClick={(e) => { 
              e.preventDefault(); 
              e.stopPropagation(); 
              console.log('Operasyon button clicked');
              setShowManualReservation(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl text-sm font-semibold transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Manuel Rezervasyon</span>
            <span className="sm:hidden">Ekle</span>
          </button>
          
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all"
            style={{
              backgroundColor: actualTheme === 'light' ? 'rgba(249, 250, 251, 0.8)' : 'rgba(255, 255, 255, 0.05)',
              borderWidth: '1px',
              borderColor: actualTheme === 'light' ? 'rgba(209, 213, 219, 0.8)' : 'rgba(255, 255, 255, 0.1)',
              color: actualTheme === 'light' ? '#1f2937' : 'white'
            }}
          >
            <Filter className="w-4 h-4" style={{ color: actualTheme === 'light' ? '#1f2937' : 'white' }} />
            <ChevronDown className={cn("w-4 h-4 transition-transform", showFilters && "rotate-180")} style={{ color: actualTheme === 'light' ? '#1f2937' : 'white' }} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button onClick={() => setActiveFilter('all')} className={cn("rounded-2xl p-4 text-left border-2 transition-all", activeFilter === 'all' ? "bg-white/10 border-white/20" : actualTheme === 'light' ? "hover:shadow-md" : "hover:bg-white/[0.07]")}
          style={{
            backgroundColor: actualTheme === 'light' ? (activeFilter === 'all' ? '#f3f4f6' : 'white') : (activeFilter === 'all' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)'),
            borderColor: actualTheme === 'light' ? (activeFilter === 'all' ? '#9ca3af' : '#d1d5db') : (activeFilter === 'all' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'),
            boxShadow: actualTheme === 'light' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
          }}>
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4" style={{ color: actualTheme === 'light' ? '#6b7280' : '#9ca3af' }} />
            <div className="text-xs font-bold uppercase tracking-wider" style={{ color: actualTheme === 'light' ? '#6b7280' : '#9ca3af' }}>TÜMÜ</div>
          </div>
          <div className="text-3xl font-heading font-bold" style={{ color: actualTheme === 'light' ? '#1f2937' : 'white' }}>{stats.total}</div>
        </button>
        <button onClick={() => setActiveFilter('pending')} className={cn("rounded-2xl p-4 text-left border-2 transition-all", activeFilter === 'pending' ? "bg-amber-500/10 border-amber-500/30" : actualTheme === 'light' ? "hover:shadow-md" : "hover:bg-white/[0.07]")}
          style={{
            backgroundColor: actualTheme === 'light' ? (activeFilter === 'pending' ? '#fef3c7' : 'white') : (activeFilter === 'pending' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255, 255, 255, 0.05)'),
            borderColor: actualTheme === 'light' ? (activeFilter === 'pending' ? '#f59e0b' : '#d1d5db') : (activeFilter === 'pending' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(255, 255, 255, 0.1)'),
            boxShadow: actualTheme === 'light' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
          }}>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4" style={{ color: actualTheme === 'light' ? '#d97706' : '#fbbf24' }} />
            <div className="text-xs font-bold uppercase tracking-wider" style={{ color: actualTheme === 'light' ? '#d97706' : '#fbbf24' }}>BEKLEYEN</div>
          </div>
          <div className="text-3xl font-heading font-bold" style={{ color: actualTheme === 'light' ? '#d97706' : '#fbbf24' }}>{stats.pending}</div>
        </button>
        <button onClick={() => setActiveFilter('confirmed')} className={cn("rounded-2xl p-4 text-left border-2 transition-all", activeFilter === 'confirmed' ? "bg-emerald-500/10 border-emerald-500/30" : actualTheme === 'light' ? "hover:shadow-md" : "hover:bg-white/[0.07]")}
          style={{
            backgroundColor: actualTheme === 'light' ? (activeFilter === 'confirmed' ? '#d1fae5' : 'white') : (activeFilter === 'confirmed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)'),
            borderColor: actualTheme === 'light' ? (activeFilter === 'confirmed' ? '#10b981' : '#d1d5db') : (activeFilter === 'confirmed' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)'),
            boxShadow: actualTheme === 'light' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
          }}>
          <div className="flex items-center gap-2 mb-2">
            <Check className="w-4 h-4" style={{ color: actualTheme === 'light' ? '#059669' : '#6ee7b7' }} />
            <div className="text-xs font-bold uppercase tracking-wider" style={{ color: actualTheme === 'light' ? '#059669' : '#6ee7b7' }}>ONAYLANMIŞ</div>
          </div>
          <div className="text-3xl font-heading font-bold" style={{ color: actualTheme === 'light' ? '#059669' : '#6ee7b7' }}>{stats.confirmed}</div>
        </button>
        <div className="rounded-2xl p-4 border-2" style={{
          backgroundColor: actualTheme === 'light' ? 'white' : 'rgba(255, 255, 255, 0.05)',
          borderColor: actualTheme === 'light' ? '#d1d5db' : 'rgba(255, 255, 255, 0.1)',
          boxShadow: actualTheme === 'light' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
        }}>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4" style={{ color: actualTheme === 'light' ? '#7c3aed' : '#c4b5fd' }} />
            <div className="text-xs font-bold uppercase tracking-wider" style={{ color: actualTheme === 'light' ? '#7c3aed' : '#c4b5fd' }}>TOPLAM</div>
          </div>
          <div className="text-2xl font-heading font-bold" style={{ color: actualTheme === 'light' ? '#7c3aed' : '#c4b5fd' }}>{stats.revenue.toLocaleString('tr-TR')} ₺</div>
        </div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="rounded-2xl p-4" style={{
              backgroundColor: actualTheme === 'light' ? 'rgba(249, 250, 251, 0.9)' : 'rgba(255, 255, 255, 0.05)',
              borderWidth: '1px',
              borderColor: actualTheme === 'light' ? 'rgba(209, 213, 219, 0.5)' : 'rgba(255, 255, 255, 0.1)'
            }}>
              <label className="text-xs font-semibold mb-2 block" style={{ color: actualTheme === 'light' ? '#6b7280' : 'rgba(255, 255, 255, 0.5)' }}>TİP</label>
              <div className="flex flex-wrap gap-2">
                {(['all', 'slot', 'daily', 'nightly', 'project', 'order'] as const).map((t) => (
                  <button 
                    key={t} 
                    onClick={() => setTypeFilter(t)} 
                    className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all border")}
                    style={{
                      backgroundColor: typeFilter === t 
                        ? (actualTheme === 'light' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(168, 85, 247, 0.2)')
                        : (actualTheme === 'light' ? 'white' : 'rgba(255, 255, 255, 0.05)'),
                      borderColor: typeFilter === t
                        ? (actualTheme === 'light' ? 'rgba(139, 92, 246, 0.4)' : 'rgba(168, 85, 247, 0.3)')
                        : (actualTheme === 'light' ? 'rgba(209, 213, 219, 0.5)' : 'rgba(255, 255, 255, 0.1)'),
                      color: typeFilter === t
                        ? (actualTheme === 'light' ? '#7c3aed' : '#c084fc')
                        : (actualTheme === 'light' ? '#374151' : 'rgba(255, 255, 255, 0.7)')
                    }}
                  >
                    {t !== 'all' && getTypeIcon(t)}
                    {t === 'all' ? 'Tümü' : getTypeLabel(t)}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: actualTheme === 'light' ? '#9ca3af' : 'rgba(255, 255, 255, 0.4)' }} />
        <input type="text" placeholder="İsim, telefon, email, ID ara..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          style={{
            backgroundColor: actualTheme === 'light' ? 'white' : 'rgba(255, 255, 255, 0.05)',
            borderWidth: '1px',
            borderColor: actualTheme === 'light' ? '#d1d5db' : 'rgba(255, 255, 255, 0.1)',
            color: actualTheme === 'light' ? '#1f2937' : 'white',
            boxShadow: actualTheme === 'light' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
          }}
        />
      </div>

      {/* List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredReservations.length === 0 ? (
          <div className="col-span-full text-center py-12 text-white/40"><Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Rezervasyon bulunamadı</p></div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredReservations.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.02 }}
                className="group border hover:border-purple-500/40 rounded-2xl p-5 transition-all hover:shadow-lg"
                style={{
                  backgroundColor: actualTheme === 'light' ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.05)',
                  borderColor: actualTheme === 'light' ? 'rgba(209, 213, 219, 0.8)' : 'rgba(255, 255, 255, 0.1)',
                  boxShadow: actualTheme === 'light' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading font-bold group-hover:text-purple-300 transition-colors truncate" style={{ color: actualTheme === 'light' ? '#1f2937' : 'white' }}>{r.userName}</h3>
                      <p className="text-xs" style={{ color: actualTheme === 'light' ? '#9ca3af' : 'rgba(255, 255, 255, 0.4)' }}>{r.userPhone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">{getStatusBadge(r.status)}</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div className="flex items-center gap-2"><MapPin className="w-4 h-4 flex-shrink-0" style={{ color: actualTheme === 'light' ? '#9ca3af' : 'rgba(255, 255, 255, 0.4)' }} /><span className="truncate text-xs" style={{ color: actualTheme === 'light' ? '#6b7280' : 'rgba(255, 255, 255, 0.7)' }}>{r.businessName}</span></div>
                  <div className="flex items-center gap-2">{getTypeIcon(r.type)}<span className="text-xs" style={{ color: actualTheme === 'light' ? '#6b7280' : 'rgba(255, 255, 255, 0.7)' }}>{getTypeLabel(r.type)}</span></div>
                  {getEventDate(r) && <div className="flex items-center gap-2"><Calendar className="w-4 h-4 flex-shrink-0" style={{ color: actualTheme === 'light' ? '#9ca3af' : 'rgba(255, 255, 255, 0.4)' }} /><span className="text-xs" style={{ color: actualTheme === 'light' ? '#6b7280' : 'rgba(255, 255, 255, 0.7)' }}>{getEventDate(r)}</span></div>}
                  {getEventTime(r) && <div className="flex items-center gap-2"><Clock className="w-4 h-4 flex-shrink-0" style={{ color: actualTheme === 'light' ? '#9ca3af' : 'rgba(255, 255, 255, 0.4)' }} /><span className="text-xs" style={{ color: actualTheme === 'light' ? '#6b7280' : 'rgba(255, 255, 255, 0.7)' }}>{getEventTime(r)}</span></div>}
                  <div className="flex items-center gap-2 col-span-2"><DollarSign className="w-4 h-4 flex-shrink-0" style={{ color: actualTheme === 'light' ? '#9ca3af' : 'rgba(255, 255, 255, 0.4)' }} /><span className="font-semibold text-xs" style={{ color: actualTheme === 'light' ? '#1f2937' : 'rgba(255, 255, 255, 0.7)' }}>{r.pricing.totalAmount.toLocaleString('tr-TR')} ₺</span></div>
                </div>
                
                {/* Butonlar */}
                <div className="flex gap-2 pt-3" style={{ borderTop: `1px solid ${actualTheme === 'light' ? 'rgba(209, 213, 219, 0.5)' : 'rgba(255, 255, 255, 0.1)'}` }}>
                  <button
                    type="button"
                    onClick={(e) => { 
                      e.preventDefault(); 
                      e.stopPropagation(); 
                      console.log('Detay clicked for:', r.id, 'Selected reservation:', r);
                      setSelectedReservation(r);
                      console.log('State should be updated to:', r); 
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 rounded-lg text-xs font-semibold transition-colors border border-blue-500/20"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    Detay
                  </button>
                  
                  {r.status === 'pending' && (
                    <button
                      type="button"
                      onClick={(e) => { 
                        e.preventDefault(); 
                        e.stopPropagation(); 
                        console.log('Approve clicked for:', r.id);
                        handleApprove(r.id); 
                      }}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-semibold transition-colors border border-emerald-500/20 disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Onayla
                    </button>
                  )}
                  
                  <button
                    type="button"
                    onClick={(e) => { 
                      e.preventDefault(); 
                      e.stopPropagation(); 
                      console.log('Edit clicked for:', r.id);
                      setEditingReservation(r); 
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 rounded-lg text-xs font-semibold transition-colors border border-purple-500/20"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  
                  {!['cancelled_by_user', 'cancelled_by_business'].includes(r.status) && (
                    <button
                      type="button"
                      onClick={(e) => { 
                        e.preventDefault(); 
                        e.stopPropagation(); 
                        console.log('Cancel clicked for:', r.id);
                        setCancellingReservation(r); 
                      }}
                      disabled={loading}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-lg text-xs font-semibold transition-colors border border-rose-500/20 disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Detail Modal - Bottom Sheet */}
      {selectedReservation && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Backdrop clicked - closing modal');
              setSelectedReservation(null);
            }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-3xl max-h-[90vh] bg-gray-900 border border-white/20 rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}>
            <div className="overflow-y-auto max-h-[90vh] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <div className="p-6 md:p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-2xl font-heading font-bold text-white">Detaylar</h3>
                      {getStatusBadge(selectedReservation.status)}
                    </div>
                    <div className="flex items-center gap-2 text-white/50 text-sm">
                      <span>#{selectedReservation.id.slice(0, 8).toUpperCase()}</span><span>•</span>
                      <div className="flex items-center gap-1">{getTypeIcon(selectedReservation.type)}<span>{getTypeLabel(selectedReservation.type)}</span></div>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Close detail modal clicked');
                      setSelectedReservation(null);
                    }} 
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex-shrink-0">
                    <X className="w-5 h-5 text-white/60" />
                  </button>
                </div>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold text-white/40 mb-3">MÜŞTERİ</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3"><User className="w-5 h-5 text-white/40 flex-shrink-0" /><span className="text-white">{selectedReservation.userName}</span></div>
                      <div className="flex items-center gap-3"><Phone className="w-5 h-5 text-white/40 flex-shrink-0" /><a href={`tel:${selectedReservation.userPhone}`} className="text-white hover:text-purple-300 transition-colors">{selectedReservation.userPhone}</a></div>
                      {selectedReservation.userEmail && <div className="flex items-center gap-3"><Mail className="w-5 h-5 text-white/40 flex-shrink-0" /><a href={`mailto:${selectedReservation.userEmail}`} className="text-white hover:text-purple-300 transition-colors break-all">{selectedReservation.userEmail}</a></div>}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white/40 mb-3">REZERVASYON</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3"><MapPin className="w-5 h-5 text-white/40 flex-shrink-0" /><span className="text-white">{selectedReservation.businessName}</span></div>
                      {getEventDate(selectedReservation) && <div className="flex items-center gap-3"><Calendar className="w-5 h-5 text-white/40 flex-shrink-0" /><span className="text-white">{getEventDate(selectedReservation)}</span></div>}
                      {getEventTime(selectedReservation) && <div className="flex items-center gap-3"><Clock className="w-5 h-5 text-white/40 flex-shrink-0" /><span className="text-white">{getEventTime(selectedReservation)}</span></div>}
                      {selectedReservation.type === 'slot' && (selectedReservation as SlotReservation).staffName && (
                        <div className="flex items-start gap-3"><Users className="w-5 h-5 text-white/40 flex-shrink-0 mt-0.5" /><div><span className="text-white/40 text-sm block">Personel:</span><span className="text-white">{(selectedReservation as SlotReservation).staffName}</span></div></div>
                      )}
                      {selectedReservation.type === 'slot' && (selectedReservation as SlotReservation).services && (
                        <div className="flex items-start gap-3"><ShoppingBag className="w-5 h-5 text-white/40 flex-shrink-0 mt-0.5" /><div><span className="text-white/40 text-sm block">Hizmetler:</span><span className="text-white">{(selectedReservation as SlotReservation).services.map(s => s.name).join(', ')}</span></div></div>
                      )}
                      {selectedReservation.notes && <div className="flex items-start gap-3"><span className="text-white/40 text-sm flex-shrink-0 mt-0.5">Not:</span><span className="text-white text-sm">{selectedReservation.notes}</span></div>}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white/40 mb-3">ÖDEME</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between"><span className="text-white/70">Toplam:</span><span className="text-white font-semibold">{selectedReservation.pricing.totalAmount.toLocaleString('tr-TR')} ₺</span></div>
                      {selectedReservation.pricing.depositRequired && (
                        <>
                          <div className="flex items-center justify-between"><span className="text-white/70">Kapora ({selectedReservation.pricing.depositPercentage}%):</span><span className="text-amber-400 font-semibold">{selectedReservation.pricing.depositAmount.toLocaleString('tr-TR')} ₺</span></div>
                          <div className="flex items-center justify-between"><span className="text-white/70">Kalan:</span><span className="text-white font-semibold">{selectedReservation.pricing.finalAmount.toLocaleString('tr-TR')} ₺</span></div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-white/10">
                    {selectedReservation.status === 'pending' && (
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleApprove(selectedReservation.id);
                        }} 
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50">
                        <Check className="w-5 h-5" />{loading ? 'Onaylanıyor...' : 'Onayla'}
                      </button>
                    )}
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditingReservation(selectedReservation);
                        setSelectedReservation(null);
                      }}
                      className="flex-1 px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-xl font-semibold transition-colors border border-blue-500/20">
                      <Edit className="w-5 h-5 inline mr-2" />Düzenle
                    </button>
                    {!['cancelled_by_user', 'cancelled_by_business'].includes(selectedReservation.status) && (
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setCancellingReservation(selectedReservation);
                          setSelectedReservation(null);
                        }} 
                        disabled={loading}
                        className="flex-1 px-6 py-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl font-semibold transition-colors border border-rose-500/20 disabled:opacity-50">
                        <X className="w-5 h-5 inline mr-2" />İptal
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>,
        document.body
      )}

      {/* Edit Modal */}
      {editingReservation && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setEditingReservation(null);
              }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-2xl max-h-[90vh] bg-gray-900 border border-white/20 rounded-3xl shadow-2xl overflow-hidden z-10"
              onClick={(e) => e.stopPropagation()}>
              <div className="overflow-y-auto max-h-[90vh] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                <div className="p-6 md:p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div><h3 className="text-2xl font-heading font-bold text-white mb-2">Düzenle</h3><p className="text-white/50">#{editingReservation.id.slice(0, 8).toUpperCase()}</p></div>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditingReservation(null);
                      }} 
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex-shrink-0">
                      <X className="w-5 h-5 text-white/60" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    {editingReservation.type === 'slot' && (
                      <>
                        <ModernDateTimePicker
                          date={(editingReservation as SlotReservation).date}
                          time={(editingReservation as SlotReservation).startTime}
                          onDateChange={(newDate) => setEditingReservation({ ...editingReservation, date: newDate } as any)}
                          onTimeChange={(newTime) => setEditingReservation({ ...editingReservation, startTime: newTime } as any)}
                          label="Randevu Tarihi"
                          timeLabel="Başlangıç Saati"
                        />
                        <div>
                          <label className="text-sm font-semibold text-white/70 mb-2 block">Bitiş Saati</label>
                          <ModernDateTimePicker
                            date={(editingReservation as SlotReservation).date}
                            time={(editingReservation as SlotReservation).endTime}
                            onDateChange={() => {}}
                            onTimeChange={(newTime) => setEditingReservation({ ...editingReservation, endTime: newTime } as any)}
                            label=""
                            showTime={true}
                            timeLabel="Bitiş Saati"
                          />
                        </div>
                      </>
                    )}
                    {editingReservation.type === 'daily' && (
                      <>
                        <ModernDateTimePicker
                          date={(editingReservation as DailyRentalReservation).eventDate}
                          time={(editingReservation as DailyRentalReservation).startTime}
                          onDateChange={(newDate) => setEditingReservation({ ...editingReservation, eventDate: newDate } as any)}
                          onTimeChange={(newTime) => setEditingReservation({ ...editingReservation, startTime: newTime } as any)}
                          label="Etkinlik Tarihi"
                          timeLabel="Başlangıç Saati"
                        />
                        <div>
                          <label className="text-sm font-semibold text-white/70 mb-2 block">Bitiş Saati</label>
                          <ModernDateTimePicker
                            date={(editingReservation as DailyRentalReservation).eventDate}
                            time={(editingReservation as DailyRentalReservation).endTime}
                            onDateChange={() => {}}
                            onTimeChange={(newTime) => setEditingReservation({ ...editingReservation, endTime: newTime } as any)}
                            label=""
                            showTime={true}
                            timeLabel="Bitiş Saati"
                          />
                        </div>
                      </>
                    )}
                    {editingReservation.type === 'nightly' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ModernDateTimePicker
                          date={(editingReservation as NightlyBookingReservation).checkIn}
                          onDateChange={(newDate) => setEditingReservation({ ...editingReservation, checkIn: newDate } as any)}
                          label="Giriş Tarihi"
                          showTime={false}
                        />
                        <ModernDateTimePicker
                          date={(editingReservation as NightlyBookingReservation).checkOut}
                          onDateChange={(newDate) => setEditingReservation({ ...editingReservation, checkOut: newDate } as any)}
                          label="Çıkış Tarihi"
                          showTime={false}
                          minDate={(editingReservation as NightlyBookingReservation).checkIn}
                        />
                      </div>
                    )}
                    {editingReservation.type === 'order' && (
                      <>
                        <ModernDateTimePicker
                          date={(editingReservation as OrderReservation).deliveryDate}
                          time={(editingReservation as OrderReservation).deliveryTime}
                          onDateChange={(newDate) => setEditingReservation({ ...editingReservation, deliveryDate: newDate } as any)}
                          onTimeChange={(newTime) => setEditingReservation({ ...editingReservation, deliveryTime: newTime } as any)}
                          label="Teslimat Tarihi"
                          timeLabel="Teslimat Saati"
                        />
                      </>
                    )}
                    {editingReservation.type === 'project' && (
                      <ModernDateTimePicker
                        date={(editingReservation as ProjectReservation).eventDate}
                        onDateChange={(newDate) => setEditingReservation({ ...editingReservation, eventDate: newDate } as any)}
                        label="Proje Tarihi"
                        showTime={false}
                      />
                    )}
                    <div><label className="text-sm font-semibold text-white/70 mb-2 block">Dahili Notlar</label>
                      <textarea value={editingReservation.internalNotes || ''} onChange={(e) => setEditingReservation({ ...editingReservation, internalNotes: e.target.value })}
                        rows={3} placeholder="İşletme notu (müşteri görmez)..." className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-white/20 transition-colors resize-none" />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleEdit();
                        }} 
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50">
                        <Check className="w-5 h-5" />{loading ? 'Kaydediliyor...' : 'Kaydet'}
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setEditingReservation(null);
                        }} 
                        className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold transition-colors border border-white/10">
                        İptal
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>,
          document.body
        )}

      {/* Manual Reservation Modal */}
      {showManualReservation && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => setShowManualReservation(false)} 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl max-h-[90vh] bg-gray-900 border border-white/20 rounded-3xl shadow-2xl overflow-hidden z-10"
            onClick={(e) => e.stopPropagation()}>
            <div className="overflow-y-auto max-h-[90vh] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <div className="p-6 md:p-8">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-heading font-bold text-white mb-2">Manuel Rezervasyon</h3>
                    <p className="text-white/50">Telefon veya yüz yüze alınan rezervasyonları kaydedin</p>
                  </div>
                  <button 
                    onClick={() => setShowManualReservation(false)} 
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex-shrink-0">
                    <X className="w-5 h-5 text-white/60" />
                  </button>
                </div>

                {/* Form */}
                <div className="space-y-4">
                  {/* Müşteri Bilgileri */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-white/70">Müşteri Bilgileri</h4>
                    
                    <input
                      type="text"
                      value={manualFormData.userName}
                      onChange={(e) => setManualFormData({...manualFormData, userName: e.target.value})}
                      placeholder="Müşteri Adı Soyadı *"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 transition-colors"
                      required
                    />
                    
                    <input
                      type="tel"
                      value={manualFormData.userPhone}
                      onChange={(e) => setManualFormData({...manualFormData, userPhone: e.target.value})}
                      placeholder="Telefon Numarası *"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 transition-colors"
                      required
                    />
                    
                    <input
                      type="email"
                      value={manualFormData.userEmail}
                      onChange={(e) => setManualFormData({...manualFormData, userEmail: e.target.value})}
                      placeholder="E-posta (opsiyonel)"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 transition-colors"
                    />
                  </div>

                  {/* Tarih ve Saat */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-white/70">Tarih ve Saat</h4>
                    
                    <ModernDateTimePicker
                      date={manualFormData.date}
                      time={manualFormData.startTime}
                      onDateChange={(date) => setManualFormData({...manualFormData, date})}
                      onTimeChange={(time) => setManualFormData({...manualFormData, startTime: time})}
                      label="Rezervasyon Tarihi"
                      timeLabel="Başlangıç Saati"
                    />
                    
                    <div>
                      <label className="text-sm font-semibold text-white/70 mb-2 block">Bitiş Saati (opsiyonel)</label>
                      <ModernDateTimePicker
                        date={manualFormData.date}
                        time={manualFormData.endTime}
                        onDateChange={() => {}}
                        onTimeChange={(time) => setManualFormData({...manualFormData, endTime: time})}
                        label=""
                        showTime={true}
                        timeLabel="Bitiş Saati"
                      />
                    </div>
                  </div>

                  {/* Ücret */}
                  <div>
                    <label className="text-sm font-semibold text-white/70 mb-2 block">Toplam Ücret (TL)</label>
                    <input
                      type="number"
                      value={manualFormData.totalAmount}
                      onChange={(e) => setManualFormData({...manualFormData, totalAmount: parseFloat(e.target.value) || 0})}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 transition-colors font-mono text-lg"
                    />
                  </div>

                  {/* Notlar */}
                  <div>
                    <label className="text-sm font-semibold text-white/70 mb-2 block">Notlar</label>
                    <textarea
                      value={manualFormData.notes}
                      onChange={(e) => setManualFormData({...manualFormData, notes: e.target.value})}
                      rows={3}
                      placeholder="Rezervasyon hakkında notlar..."
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 transition-colors resize-none"
                    />
                  </div>

                  {/* Info Box */}
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-200">
                        <p className="font-semibold mb-1">Manuel rezervasyon otomatik onaylıdır</p>
                        <p className="text-blue-200/70">Bu rezervasyon direkt olarak "Onaylanmış" durumunda kaydedilecek. Müşteri telefon veya yüz yüze bilgilendirilmelidir.</p>
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button 
                      type="button"
                      onClick={handleManualReservation}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50">
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          <span>Rezervasyonu Kaydet</span>
                        </>
                      )}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setShowManualReservation(false)} 
                      className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold transition-colors border border-white/10">
                      İptal
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>,
        document.body
      )}

      {/* Operations Modal - IMPROVED WITH REAL ACTIONS */}
      {showOperations && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowOperations(false);
              }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-2xl max-h-[90vh] bg-gray-900 border border-white/20 rounded-3xl shadow-2xl overflow-hidden z-10"
              onClick={(e) => e.stopPropagation()}>
              <div className="overflow-y-auto max-h-[90vh] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                <div className="p-6 md:p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-heading font-bold text-white mb-2">Hızlı İşlemler</h3>
                      <p className="text-white/50">Rezervasyon yönetimi araçları</p>
                    </div>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowOperations(false);
                      }} 
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex-shrink-0">
                      <X className="w-5 h-5 text-white/60" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Bekleyen Rezervasyonları Onayla */}
                    {stats.pending > 0 && (
                      <button
                        type="button"
                        onClick={async () => {
                          const pendingReservations = reservations.filter(r => r.status === 'pending');
                          if (confirm(`${pendingReservations.length} bekleyen rezervasyonu toplu onayla?`)) {
                            setLoading(true);
                            try {
                              for (const res of pendingReservations) {
                                await handleApprove(res.id);
                              }
                              addToast(`${pendingReservations.length} rezervasyon onaylandı`, 'success');
                              setShowOperations(false);
                            } catch (e) {
                              addToast('Bazı rezervasyonlar onaylanamadı', 'error');
                            }
                            setLoading(false);
                          }
                        }}
                        disabled={loading}
                        className="group relative p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/30 hover:border-emerald-500/50 transition-all overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-green-500/0 group-hover:from-emerald-500/20 group-hover:to-green-500/20 transition-all" />
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                            <Check className="w-6 h-6 text-emerald-400" />
                          </div>
                          <h4 className="font-heading font-bold text-emerald-300 mb-2">Toplu Onayla</h4>
                          <p className="text-sm text-emerald-200/70 mb-3">Bekleyen {stats.pending} rezervasyonu onayla</p>
                          <div className="text-xs text-emerald-400/80">Müşterilere bildirim gönderilir</div>
                        </div>
                      </button>
                    )}

                    {/* Bugünkü Rezervasyonlar */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveFilter('all');
                        setSearchQuery(new Date().toISOString().split('T')[0]);
                        setShowOperations(false);
                      }}
                      className="group relative p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 hover:border-blue-500/50 transition-all overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-cyan-500/0 group-hover:from-blue-500/20 group-hover:to-cyan-500/20 transition-all" />
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
                          <Calendar className="w-6 h-6 text-blue-400" />
                        </div>
                        <h4 className="font-heading font-bold text-blue-300 mb-2">Bugünkü Rezervasyonlar</h4>
                        <p className="text-sm text-blue-200/70 mb-3">Bugün için {reservations.filter(r => {
                          const today = new Date().toISOString().split('T')[0];
                          const resDate = getEventDate(r) || '';
                          return resDate === today;
                        }).length} rezervasyon</p>
                        <div className="text-xs text-blue-400/80">Hızlı filtreleme</div>
                      </div>
                    </button>

                    {/* Tüm Onaylanmış */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveFilter('confirmed');
                        setSearchQuery('');
                        setShowOperations(false);
                      }}
                      className="group relative p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 hover:border-purple-500/50 transition-all overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/20 group-hover:to-pink-500/20 transition-all" />
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                          <Users className="w-6 h-6 text-purple-400" />
                        </div>
                        <h4 className="font-heading font-bold text-purple-300 mb-2">Onaylı Rezervasyonlar</h4>
                        <p className="text-sm text-purple-200/70 mb-3">{stats.confirmed} onaylanmış rezervasyon</p>
                        <div className="text-xs text-purple-400/80">Filtreye git</div>
                      </div>
                    </button>

                    {/* Yenile */}
                    <button
                      type="button"
                      onClick={() => {
                        onRefresh();
                        setShowOperations(false);
                        addToast('Rezervasyonlar güncellendi', 'success');
                      }}
                      className="group relative p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 hover:border-amber-500/50 transition-all overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 to-orange-500/0 group-hover:from-amber-500/20 group-hover:to-orange-500/20 transition-all" />
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                            <Clock className="w-6 h-6 text-amber-400" />
                          </motion.div>
                        </div>
                        <h4 className="font-heading font-bold text-amber-300 mb-2">Yenile</h4>
                        <p className="text-sm text-amber-200/70 mb-3">Rezervasyonları güncelle</p>
                        <div className="text-xs text-amber-400/80">En güncel verileri çek</div>
                      </div>
                    </button>
                  </div>

                  {/* İstatistikler */}
                  <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/10">
                    <h4 className="font-heading font-bold text-white mb-3">Özet İstatistikler</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{stats.total}</div>
                        <div className="text-xs text-white/50">Toplam</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-amber-400">{stats.pending}</div>
                        <div className="text-xs text-white/50">Bekleyen</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-400">{stats.confirmed}</div>
                        <div className="text-xs text-white/50">Onaylı</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-400">{stats.revenue.toLocaleString('tr-TR')} ₺</div>
                        <div className="text-xs text-white/50">Gelir</div>
                      </div>
                    </div>
                  </div>

                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowOperations(false);
                    }} 
                    className="w-full mt-6 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold transition-colors border border-white/10">
                    Kapat
                  </button>
                </div>
              </div>
            </motion.div>
          </div>,
          document.body
        )}

      {/* Cancel Modal */}
      {cancellingReservation && createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => { setCancellingReservation(null); setCancelReason(''); }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-gray-900 border border-white/20 rounded-3xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}>
              <div className="p-6 md:p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-heading font-bold text-white mb-2">Rezervasyon İptali</h3>
                    <p className="text-white/50">İptal sebebini belirtin</p>
                  </div>
                  <button 
                    onClick={() => { setCancellingReservation(null); setCancelReason(''); }} 
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex-shrink-0">
                    <X className="w-5 h-5 text-white/60" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="w-5 h-5 text-rose-300" />
                      <span className="text-white font-semibold">{cancellingReservation.userName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/50">
                      <span>{cancellingReservation.businessName}</span>
                      {getEventDate(cancellingReservation) && (
                        <><span>•</span><span>{getEventDate(cancellingReservation)}</span></>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-white/70 mb-2 block">İptal Sebebi</label>
                    <textarea 
                      value={cancelReason} 
                      onChange={(e) => setCancelReason(e.target.value)}
                      rows={4} 
                      placeholder="Müşteriye bildirilecek iptal sebebini yazın..."
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-rose-500/30 transition-colors resize-none"
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={handleCancel} 
                      disabled={loading || !cancelReason.trim()}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X className="w-5 h-5" />
                      {loading ? 'İptal Ediliyor...' : 'Rezervasyonu İptal Et'}
                    </button>
                    <button 
                      onClick={() => { setCancellingReservation(null); setCancelReason(''); }} 
                      className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold transition-colors border border-white/10"
                    >
                      Vazgeç
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>,
          document.body
        )}
    </div>
  );
}
