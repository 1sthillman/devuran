import { create } from 'zustand';
import type { Service, Salon } from '@/types';
import { reservationService } from '@/services/reservationService';
import { useAuthStore } from './authStore';

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
  setCustomerInfo: (info: { name: string; phone: string; email: string; notes: string }) => void;
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

const getBookingType = (category: string): 'slot' | 'daily' | 'nightly' | 'project' | 'order' => {
  // Slot bazlı kategoriler
  if (['kuafor', 'berber', 'guzellik', 'tirnak', 'fotograf', 'video-produksiyon', 'drone-cekim'].includes(category)) {
    return 'slot';
  }
  // Günlük kiralama
  if (['dugun-salonu', 'etkinlik-alani'].includes(category)) {
    return 'daily';
  }
  // Gecelik konaklama
  if (['otel', 'villa', 'bungalov', 'kamp-alani'].includes(category)) {
    return 'nightly';
  }
  // Proje bazlı
  if (['dugun-organizasyon', 'nisan-organizasyon', 'evlilik-teklifi', 'dogum-gunu', 'kurumsal-etkinlik'].includes(category)) {
    return 'project';
  }
  // Sipariş bazlı
  if (['catering', 'pasta-tatli', 'kahve-ikram'].includes(category)) {
    return 'order';
  }
  return 'slot'; // Varsayılan
};

export const useBookingStore = create<BookingState>((set, get) => ({
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
    const services = [...get().selectedServices, service];
    set({ selectedServices: services, ...calculateTotals(services) });
  },

  removeService: (serviceId) => {
    const services = get().selectedServices.filter((s) => s.id !== serviceId);
    set({ selectedServices: services, ...calculateTotals(services) });
  },

  toggleService: (service) => {
    const exists = get().selectedServices.find((s) => s.id === service.id);
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
      customerName: info.name, 
      customerPhone: info.phone,
      customerEmail: info.email,
      customerNotes: info.notes 
    }),

  setEventDetails: (details) => set({ ...details }),
  
  setAccommodationDetails: (details) => set({ ...details }),
  
  setOrderDetails: (details) => set({ ...details }),

  nextStep: () => set((state) => ({ step: Math.min(state.step + 1, 4) })),
  
  prevStep: () => set((state) => ({ step: Math.max(state.step - 1, 1) })),
  
  setStep: (step) => set({ step }),

  init: (salonId, salon) => {
    const bookingType = getBookingType(salon.category);
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
    const user = useAuthStore.getState().user;
    
    if (!user) {
      throw new Error('Giriş yapmalısınız');
    }

    set({ isSubmitting: true, error: null });

    try {
      let reservationData: any = {
        businessId: state.salonId!,
        businessName: state.salon!.name,
        businessCategory: state.salon!.category,
        userId: user.uid,
        userName: state.customerName,
        userPhone: state.customerPhone,
        userEmail: state.customerEmail,
        type: state.bookingType,
        notes: state.customerNotes,
      };

      // Tip bazlı veri ekleme
      if (state.bookingType === 'slot') {
        const endTime = new Date(`2000-01-01T${state.selectedTime}`);
        endTime.setMinutes(endTime.getMinutes() + state.totalDuration);
        
        reservationData = {
          ...reservationData,
          date: state.selectedDate,
          startTime: state.selectedTime,
          endTime: endTime.toTimeString().slice(0, 5),
          duration: state.totalDuration,
          staffId: state.selectedStaffId,
          services: state.selectedServices.map(s => ({
            id: s.id,
            name: s.name,
            duration: s.duration,
            price: s.price
          })),
          location: state.location,
          address: state.address,
        };
      } else if (state.bookingType === 'daily') {
        reservationData = {
          ...reservationData,
          eventDate: state.eventDate,
          eventType: state.eventType,
          venueType: state.venueType,
          capacity: state.capacity,
          package: state.selectedPackage,
          extras: state.extras,
        };
      } else if (state.bookingType === 'nightly') {
        reservationData = {
          ...reservationData,
          checkIn: state.checkIn,
          checkOut: state.checkOut,
          nights: Math.ceil((new Date(state.checkOut!).getTime() - new Date(state.checkIn!).getTime()) / (1000 * 60 * 60 * 24)),
          roomType: state.roomType,
          roomCount: state.roomCount,
          guests: state.guests,
          mealPlan: state.mealPlan,
          extras: state.extras,
        };
      } else if (state.bookingType === 'project') {
        reservationData = {
          ...reservationData,
          eventDate: state.eventDate,
          eventType: state.eventType,
          guestCount: state.guestCount,
          budget: state.budget,
          package: state.selectedPackage,
          meetings: [],
          milestones: [],
          subServices: [],
        };
      } else if (state.bookingType === 'order') {
        reservationData = {
          ...reservationData,
          deliveryDate: state.deliveryDate,
          deliveryTime: state.deliveryTime,
          deliveryAddress: state.deliveryAddress,
          orderType: state.salon!.category,
          items: state.orderItems,
        };
      }

      const reservation = await reservationService.createReservation(reservationData);
      
      set({ isSubmitting: false });
      return reservation.id;
      
    } catch (error: any) {
      set({ isSubmitting: false, error: error.message });
      throw error;
    }
  },
}));
