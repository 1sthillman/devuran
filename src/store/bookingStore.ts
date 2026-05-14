import { create } from 'zustand';
import type { Service } from '@/types';

interface BookingState {
  salonId: string | null;
  selectedServices: Service[];
  selectedStaffId: string | null;
  selectedDate: string | null;
  selectedTime: string | null;
  customerName: string;
  customerPhone: string;
  customerNotes: string;
  step: number;
  totalPrice: number;
  totalDuration: number;

  addService: (service: Service) => void;
  removeService: (serviceId: string) => void;
  toggleService: (service: Service) => void;
  selectStaff: (staffId: string | null) => void;
  selectDateTime: (date: string, time: string) => void;
  setCustomerInfo: (info: { name: string; phone: string; notes: string }) => void;
  nextStep: () => void;
  prevStep: () => void;
  setStep: (step: number) => void;
  init: (salonId: string) => void;
  reset: () => void;
}

const calculateTotals = (services: Service[]) => ({
  totalPrice: services.reduce((sum, s) => sum + s.price, 0),
  totalDuration: services.reduce((sum, s) => sum + s.duration, 0),
});

export const useBookingStore = create<BookingState>((set, get) => ({
  salonId: null,
  selectedServices: [],
  selectedStaffId: null,
  selectedDate: null,
  selectedTime: null,
  customerName: '',
  customerPhone: '',
  customerNotes: '',
  step: 1,
  totalPrice: 0,
  totalDuration: 0,

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
    set({ customerName: info.name, customerPhone: info.phone, customerNotes: info.notes }),

  nextStep: () => set((state) => ({ step: Math.min(state.step + 1, 4) })),
  prevStep: () => set((state) => ({ step: Math.max(state.step - 1, 1) })),
  setStep: (step) => set({ step }),

  init: (salonId) => {
    set({
      salonId,
      selectedServices: [],
      selectedStaffId: null,
      selectedDate: null,
      selectedTime: null,
      customerName: '',
      customerPhone: '',
      customerNotes: '',
      step: 1,
      totalPrice: 0,
      totalDuration: 0,
    });
  },

  reset: () => {
    set({
      salonId: null,
      selectedServices: [],
      selectedStaffId: null,
      selectedDate: null,
      selectedTime: null,
      customerName: '',
      customerPhone: '',
      customerNotes: '',
      step: 1,
      totalPrice: 0,
      totalDuration: 0,
    });
  },
}));
