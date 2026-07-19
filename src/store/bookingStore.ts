import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Service, Salon } from '@/types';
import { reservationServiceBackend } from '@/services/reservationServiceBackend';
import { useAuthStore } from './authStore';
import { rateLimiter } from '@/utils/rateLimiter';
import { sanitizeInput, sanitizePhone, sanitizeEmail } from '@/utils/sanitize';
import { determineBookingType, getBookingTypeFromCategory } from '@/utils/bookingTypeResolver';

// ⚠️ GÜVENLİK: Backend validation TEMPORARILY DISABLED
// 
// CORS hatası nedeniyle geçici olarak kapatıldı.
// Cloud Function'a CORS header'ları eklendikten sonra tekrar aktif edilecek.
// 
// TODO: Cloud Function'da CORS ayarları:
// - Access-Control-Allow-Origin: production domain
// - Access-Control-Allow-Methods: POST, OPTIONS
// - Access-Control-Allow-Headers: Content-Type, Authorization
// 
// ⚠️ CRITICAL SECURITY ISSUE: Backend price validation DISABLED
// Date: 2026-07-10 (Updated: 2026-07-19)
// Issue: CORS - No 'Access-Control-Allow-Origin' header
// Risk: Client-side price manipulation possible via browser console
// Impact: Financial loss, fraudulent bookings
// 
// TODO - HIGH PRIORITY:
// 1. Configure Firebase Functions CORS headers
// 2. Test backend validation endpoint
// 3. Set USE_BACKEND_VALIDATION = true
// 4. Remove client-side price calculation fallback
const USE_BACKEND_VALIDATION = false; // 🔴 TEMPORARILY DISABLED - SECURITY RISK

interface BookingState {
  // Ortak alanlar
  salonId: string | null;
  salon: Salon | null;
  bookingType: 'slot' | 'daily' | 'nightly' | 'project' | 'order' | null;
  
  // Slot bazlı (Kuaför, Fotoğraf)
  selectedServices: Service[];
  selectedStaffId: string | null;
  selectedDate: string | null;
  selectedTime: string | null;
  location?: 'studio' | 'outdoor' | 'home' | 'business';
  address?: string;
  gpsLocation?: { lat: number; lng: number };
  
  // Günlük kiralama (Salon, Etkinlik)
  eventDate: string | null;
  eventType: 'wedding' | 'engagement' | 'birthday' | 'corporate' | 'other' | null;
  venueType: string | null;
  capacity: number;
  selectedPackage: any | null;
  extras: any[];
  
  // Gecelik konaklama (Otel, Villa)
  checkIn: string | null;
  checkOut: string | null;
  roomType: string | null;
  roomCount: number;
  guests: { adults: number; children: number; infants: number };
  mealPlan: 'none' | 'breakfast' | 'half_board' | 'full_board' | 'all_inclusive' | null;
  
  // Proje bazlı (Organizasyon)
  budget: { min: number; max: number } | null;
  guestCount: number;
  
  // Sipariş bazlı (Catering)
  deliveryDate: string | null;
  deliveryTime: string | null;
  deliveryAddress: string | null;
  orderItems: any[];
  
  // Müşteri bilgileri
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerNotes: string;
  
  // UI state
  step: number;
  totalPrice: number;
  totalDuration: number;
  isSubmitting: boolean;
  error: string | null;

  // Actions
  addService: (service: Service) => void;
  removeService: (serviceId: string) => void;
  toggleService: (service: Service) => void;
  selectStaff: (staffId: string | null) => void;
  selectDateTime: (date: string, time: string) => void;
  setCustomerInfo: (info: { name: string; phone: string; email: string; notes: string; address?: string; location?: { lat: number; lng: number }; guestCount?: number }) => void;
  setEventDetails: (details: any) => void;
  setAccommodationDetails: (details: any) => void;
  setOrderDetails: (details: any) => void;
  nextStep: () => void;
  prevStep: () => void;
  setStep: (step: number) => void;
  init: (salonId: string, salon: Salon) => void;
  reset: () => void;
  submitReservation: () => Promise<string>;
}

const calculateTotals = (services: Service[]) => ({
  totalPrice: services.reduce((sum, s) => sum + s.price, 0),
  totalDuration: services.reduce((sum, s) => sum + s.duration, 0),
});

/**
 * AKILLI BOOKING TYPE BELİRLEME
 * Önce capabilities varsa onu kullan, yoksa legacy category mapping'e düş
 */
const getBookingType = (salon: Salon): 'slot' | 'daily' | 'nightly' | 'project' | 'order' => {
  // Yeni sistem: capabilities bazlı
  const anySalon = salon as any;
  if (anySalon.capabilities) {
    const typeInfo = determineBookingType(anySalon.capabilities);
    return typeInfo.primary;
  }
  
  // Legacy sistem: category bazlı (geriye uyumluluk)
  return getBookingTypeFromCategory(salon.category);
};

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
  // Ortak alanlar
  salonId: null,
  salon: null,
  bookingType: null,
  
  // Slot bazlı
  selectedServices: [],
  selectedStaffId: null,
  selectedDate: null,
  selectedTime: null,
  location: undefined,
  address: undefined,
  gpsLocation: undefined,
  
  // Günlük kiralama
  eventDate: null,
  eventType: null,
  venueType: null,
  capacity: 0,
  selectedPackage: null,
  extras: [],
  
  // Gecelik konaklama
  checkIn: null,
  checkOut: null,
  roomType: null,
  roomCount: 1,
  guests: { adults: 2, children: 0, infants: 0 },
  mealPlan: null,
  
  // Proje bazlı
  budget: null,
  guestCount: 0,
  
  // Sipariş bazlı
  deliveryDate: null,
  deliveryTime: null,
  deliveryAddress: null,
  orderItems: [],
  
  // Müşteri bilgileri
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  customerNotes: '',
  
  // UI state
  step: 1,
  totalPrice: 0,
  totalDuration: 0,
  isSubmitting: false,
  error: null,

  addService: (service) => {
    const currentServices = get().selectedServices;
    const services = [...currentServices, service];
    const totals = calculateTotals(services);
    set({ selectedServices: services, ...totals });
  },

  removeService: (serviceId) => {
    const currentServices = get().selectedServices;
    const services = currentServices.filter((s) => s.id !== serviceId);
    const totals = calculateTotals(services);
    set({ selectedServices: services, ...totals });
  },

  toggleService: (service) => {
    const currentServices = get().selectedServices;
    const exists = currentServices.find((s) => s.id === service.id);
    if (exists) {
      get().removeService(service.id);
    } else {
      get().addService(service);
    }
  },

  selectStaff: (staffId) => set({ selectedStaffId: staffId }),

  selectDateTime: (date, time) => set({ selectedDate: date, selectedTime: time }),

  setCustomerInfo: (info) =>
    set({ 
      customerName: sanitizeInput(info.name), 
      customerPhone: sanitizePhone(info.phone),
      customerEmail: sanitizeEmail(info.email),
      customerNotes: sanitizeInput(info.notes),
      address: info.address ? sanitizeInput(info.address) : undefined,
      gpsLocation: info.location
    }),

  setEventDetails: (details) => set({ ...details }),
  
  setAccommodationDetails: (details) => set({ ...details }),
  
  setOrderDetails: (details) => set({ ...details }),

  nextStep: () => set((state) => ({ step: Math.min(state.step + 1, 4) })),
  
  prevStep: () => set((state) => ({ step: Math.max(state.step - 1, 1) })),
  
  setStep: (step) => set({ step }),

  init: (salonId, salon) => {
    const bookingType = getBookingType(salon);
    set({
      salonId,
      salon,
      bookingType,
      selectedServices: [],
      selectedStaffId: null,
      selectedDate: null,
      selectedTime: null,
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      customerNotes: '',
      step: 1,
      totalPrice: 0,
      totalDuration: 0,
      isSubmitting: false,
      error: null,
    });
  },

  reset: () => {
    set({
      salonId: null,
      salon: null,
      bookingType: null,
      selectedServices: [],
      selectedStaffId: null,
      selectedDate: null,
      selectedTime: null,
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      customerNotes: '',
      step: 1,
      totalPrice: 0,
      totalDuration: 0,
      isSubmitting: false,
      error: null,
    });
  },

  submitReservation: async () => {
    const state = get();
    
    // ✅ Firebase Auth'dan direkt al (zustand store gecikmesi olabilir)
    const { auth } = await import('@/lib/firebase');
    const firebaseUser = auth.currentUser;
    
    if (!firebaseUser) {
      throw new Error('Giriş yapmalısınız');
    }
    
    const userId = firebaseUser.uid;
    const userEmail = firebaseUser.email || '';
    
    // Security: Rate limiting
    if (!rateLimiter.isAllowed('reservation:create', userId)) {
      const resetTime = Math.ceil(rateLimiter.getResetTime('reservation:create', userId) / 1000);
      throw new Error(`Çok fazla istek. Lütfen ${resetTime} saniye bekleyin.`);
    }

    set({ isSubmitting: true, error: null });

    try {
      // ✅ CRITICAL: Fresh salon verisi çek (cache değil!)
      const { salonsService } = await import('@/services/firebaseService');
      const freshSalon = await salonsService.getById(state.salonId!);
      
      if (!freshSalon) {
        throw new Error('İşletme bilgileri yüklenemedi. Lütfen tekrar deneyin.');
      }
      
      // ✅ IBAN kontrolü (fresh data ile)
      const hasValidIBAN = freshSalon?.paymentSettings?.bankTransferEnabled && 
                           freshSalon?.paymentSettings?.bankAccounts &&
                           freshSalon.paymentSettings.bankAccounts.length > 0 &&
                           freshSalon.paymentSettings.bankAccounts.some(acc => 
                             acc.iban && acc.iban.trim().length > 0
                           );
      
      // Salon bilgilerini kullan (fresh data)
      const salonData = freshSalon;
      
      // ✅ TYPE SAFETY: Proper type casting with fallback
      const whatsappNumber = (salonData as any).whatsapp || salonData.phone || '';
      const salonCover = salonData.coverImage || '';
      const salonAddress = typeof salonData.address === 'string' 
        ? salonData.address 
        : salonData.address?.full || '';

      let reservationData: any = {
        businessId: state.salonId!,
        businessName: freshSalon.name,
        businessCategory: freshSalon.category,
        userId: userId,
        userName: state.customerName,
        userPhone: state.customerPhone,
        userEmail: state.customerEmail || userEmail,
        type: state.bookingType,
        notes: state.customerNotes || '',
        whatsappNumber,
        salonCover,
        salonAddress,
        // ✅ GÜVENLİK: IBAN bilgisi metadata olarak ekle
        _hasValidIBAN: hasValidIBAN,
      };

      // ⚠️ ÖNEMLİ: Fiyat hesaplama client-side yapılır ama backend'de doğrulanmalıdır
      // TODO: Backend validation eklenmelidir (Firebase Functions)
      
      // Tip bazlı veri ekleme
      if (state.bookingType === 'slot') {
        const endTime = new Date(`2000-01-01T${state.selectedTime}`);
        endTime.setMinutes(endTime.getMinutes() + state.totalDuration);
        
        // 🍽️ Restoran kontrolü - businessCategory ile
        const isRestaurant = freshSalon.category === 'restoran' || freshSalon.category === 'kafe';
        
        reservationData = {
          ...reservationData,
          date: state.selectedDate,
          startTime: state.selectedTime,
          endTime: endTime.toTimeString().slice(0, 5),
          duration: state.totalDuration,
          staffId: state.selectedStaffId,
          services: state.selectedServices.map(s => {
            // 🔥 KRİTİK: Restoran için tableId kullan, diğerleri için service id
            const serviceId = (s as any)?.tableId || s.id;
            
            console.log('📋 Service kaydediliyor:', {
              originalId: s.id,
              tableId: (s as any)?.tableId,
              finalId: serviceId,
              name: s.name
            });
            
            return {
              id: serviceId, // 🔥 Masa için tableId, normal hizmet için service.id
              name: s.name,
              duration: s.duration,
              price: s.price
            };
          }),
          businessCategory: state.salon?.category,
          totalPrice: state.totalPrice,
          _requiresPriceValidation: true,
          ...(state.gpsLocation && { gpsLocation: state.gpsLocation }),
          ...(state.address && { address: state.address }),
        };
        
        // 🍽️ Restoran için ek bilgiler
        if (isRestaurant && state.selectedServices.length > 0) {
          const selectedTable = state.selectedServices[0];
          const tableId = (selectedTable as any)?.tableId || selectedTable.id;
          const capacity = (selectedTable as any)?.pricingRules?.maxGuests || 4;
          
          reservationData.tableId = tableId;
          reservationData.tableName = selectedTable.name;
          reservationData.capacity = capacity;
          
          console.log('🍽️ RESTORAN REZERVASYON DETAYLARI:', {
            tableId,
            tableName: selectedTable.name,
            serviceIdInArray: reservationData.services[0].id,
            match: tableId === reservationData.services[0].id
          });
        }
      } else if (state.bookingType === 'nightly') {
        const roomPrice = state.selectedPackage?.price || 0;
        const nights = Math.ceil((new Date(state.checkOut!).getTime() - new Date(state.checkIn!).getTime()) / (1000 * 60 * 60 * 24));
        const extrasTotal = state.extras?.reduce((sum: number, e: any) => sum + (e.price || 0), 0) || 0;
        
        // ✅ GÜVENLİK: Fiyat hesaplama (backend validation gerekli)
        const calculatedPrice = roomPrice * nights + extrasTotal;

        reservationData = {
          ...reservationData,
          checkIn: state.checkIn,
          checkOut: state.checkOut,
          nights,
          roomType: state.roomType,
          roomPrice,
          mealPlan: null,
          mealPricePerNight: 0,
          guests: state.guests,
          extras: state.extras || [],
          extrasTotal,
          totalPrice: calculatedPrice,
          // ⚠️ UYARI: Backend'de paket ID'den fiyat yeniden hesaplanmalı
          _requiresPriceValidation: true,
          _packageId: state.selectedPackage?.id,
        };
        
        set({ totalPrice: calculatedPrice });
      } else if (state.bookingType === 'project') {
        const packagePrice = state.selectedPackage?.price || 0;
        
        reservationData = {
          ...reservationData,
          eventDate: state.eventDate,
          eventType: state.eventType,
          guestCount: state.guestCount,
          budget: state.budget,
          package: state.selectedPackage,
          totalPrice: packagePrice,
          meetings: [],
          milestones: [],
          subServices: [],
          // ⚠️ UYARI: Backend'de paket ID'den fiyat yeniden hesaplanmalı
          _requiresPriceValidation: true,
          _packageId: state.selectedPackage?.id,
        };
        
        set({ totalPrice: packagePrice });
      } else if (state.bookingType === 'order') {
        // ✅ GÜVENLİK: Sipariş toplamı hesaplama (backend validation gerekli)
        const orderTotal = state.orderItems.reduce((sum: number, item: any) => 
          sum + (item.price * item.quantity), 0);
        
        reservationData = {
          ...reservationData,
          deliveryDate: state.deliveryDate,
          deliveryTime: state.deliveryTime,
          deliveryAddress: state.deliveryAddress,
          orderType: state.salon!.category,
          items: state.orderItems,
          totalPrice: orderTotal,
          // ⚠️ UYARI: Backend'de item ID'lerinden fiyat yeniden hesaplanmalı
          _requiresPriceValidation: true,
        };
        
        set({ totalPrice: orderTotal });
      } else if (state.bookingType === 'daily') {
        const packagePrice = state.selectedPackage?.price || 0;
        const extrasTotal = state.extras?.reduce((sum: number, e: any) => sum + (e.price || 0), 0) || 0;
        const calculatedPrice = packagePrice + extrasTotal;
        
        reservationData = {
          ...reservationData,
          eventDate: state.eventDate,
          eventType: state.eventType,
          venueType: state.venueType,
          capacity: state.capacity,
          package: state.selectedPackage,
          extras: state.extras || [],
          extrasTotal,
          totalPrice: calculatedPrice,
          // ⚠️ UYARI: Backend'de paket ID'den fiyat yeniden hesaplanmalı
          _requiresPriceValidation: true,
          _packageId: state.selectedPackage?.id,
        };
        
        set({ totalPrice: calculatedPrice });
      }

      const reservation = await (async () => {
        // ✅ GÜVENLİK: Backend validation kullan
        if (USE_BACKEND_VALIDATION) {
          console.log('🔒 Using backend validation...');
          const result = await reservationServiceBackend.createReservationWithValidation(reservationData);
          
          // Backend'den dönen fiyatı log'la
          console.log('💰 Price validation:', {
            clientPrice: reservationData.totalPrice,
            validatedPrice: result.validatedPrice,
            diff: Math.abs(reservationData.totalPrice - result.validatedPrice)
          });
          
          // Rezervasyon ID'sini döndür
          return { id: result.reservationId };
        } else {
          // Legacy direkt Firestore write (DEPRECATED)
          console.warn('⚠️ Backend validation DISABLED - using legacy client-side pricing');
          console.warn('💡 To enable secure backend validation:');
          console.warn('   1. Deploy Firebase Functions');
          console.warn('   2. Set USE_BACKEND_VALIDATION = true');
          
          const { reservationService } = await import('@/services/reservationService');
          return reservationService.createReservation(reservationData);
        }
      })();
      
      // Başarılı olduğundan emin ol
      if (!reservation || !reservation.id) {
        throw new Error('Rezervasyon oluşturulamadı');
      }
      
      set({ isSubmitting: false, error: null });
      return reservation.id;
      
    } catch (error: any) {
      console.error('Rezervasyon hatası:', error);
      set({ isSubmitting: false, error: error.message || 'Rezervasyon oluşturulamadı' });
      throw error;
    }
  },
}),
    {
      name: 'booking-progress',
      partialize: (state) => ({
        // Sadece wizard progress'i kaydet, salon bilgilerini kaydetme
        salonId: state.salonId,
        bookingType: state.bookingType,
        selectedServices: state.selectedServices,
        selectedStaffId: state.selectedStaffId,
        selectedDate: state.selectedDate,
        selectedTime: state.selectedTime,
        customerName: state.customerName,
        customerPhone: state.customerPhone,
        customerEmail: state.customerEmail,
        customerNotes: state.customerNotes,
        step: state.step,
        totalPrice: state.totalPrice,
        totalDuration: state.totalDuration,
        // Diğer booking type'lar için
        eventDate: state.eventDate,
        eventType: state.eventType,
        capacity: state.capacity,
        checkIn: state.checkIn,
        checkOut: state.checkOut,
        guests: state.guests,
        deliveryDate: state.deliveryDate,
        deliveryTime: state.deliveryTime,
        deliveryAddress: state.deliveryAddress,
        orderItems: state.orderItems,
      }),
    }
  )
);
