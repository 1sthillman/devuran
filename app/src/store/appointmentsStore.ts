import { create } from 'zustand';
import type { Appointment } from '@/types';
import { appointmentsService } from '@/services/firebaseService';

interface AppointmentsState {
  appointments: Appointment[];
  filter: 'upcoming' | 'past';
  isLoading: boolean;
  error: string | null;
  unsubscribe: (() => void) | null;
  
  setFilter: (filter: 'upcoming' | 'past') => void;
  cancelAppointment: (id: string) => Promise<void>;
  rescheduleAppointment: (id: string, newDate: string, newTime: string) => Promise<void>;
  addAppointment: (appointment: Omit<Appointment, 'id'>) => Promise<Appointment>;
  getFilteredAppointments: () => Appointment[];
  fetchUserAppointments: (userId: string) => Promise<void>;
  subscribeToUserAppointments: (userId: string) => void;
  unsubscribeFromAppointments: () => void;
  clearError: () => void;
}

export const useAppointmentsStore = create<AppointmentsState>((set, get) => ({
  appointments: [],
  filter: 'upcoming',
  isLoading: false,
  error: null,
  unsubscribe: null,

  setFilter: (filter) => set({ filter }),

  cancelAppointment: async (id) => {
    try {
      set({ isLoading: true, error: null });
      await appointmentsService.cancel(id, 'Müşteri tarafından iptal edildi', 'customer');
      
      set((state) => ({
        appointments: state.appointments.map((a) =>
          a.id === id ? { ...a, status: 'cancelled' as const } : a
        ),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  rescheduleAppointment: async (id, newDate, newTime) => {
    try {
      set({ isLoading: true, error: null });
      await appointmentsService.reschedule(id, newDate, newTime);
      
      set((state) => ({
        appointments: state.appointments.map((a) =>
          a.id === id ? { ...a, date: newDate, time: newTime, status: 'confirmed' as const } : a
        ),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  addAppointment: async (appointmentData) => {
    try {
      set({ isLoading: true, error: null });
      const appointment = await appointmentsService.create(appointmentData);
      
      set((state) => ({
        appointments: [appointment, ...state.appointments],
        isLoading: false,
      }));
      
      return appointment;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  getFilteredAppointments: () => {
    const { appointments, filter } = get();
    const today = new Date().toISOString().split('T')[0];
    
    if (filter === 'upcoming') {
      return appointments.filter(
        (a) => a.date >= today && a.status !== 'cancelled' && a.status !== 'completed'
      ).sort((a, b) => a.date.localeCompare(b.date));
    }
    
    return appointments.filter(
      (a) => a.date < today || a.status === 'completed' || a.status === 'cancelled'
    ).sort((a, b) => b.date.localeCompare(a.date));
  },

  fetchUserAppointments: async (userId) => {
    try {
      set({ isLoading: true, error: null });
      const appointments = await appointmentsService.getUserAppointments(userId);
      set({ appointments, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  subscribeToUserAppointments: (userId) => {
    // Unsubscribe from previous subscription if exists
    const currentUnsubscribe = get().unsubscribe;
    if (currentUnsubscribe) {
      currentUnsubscribe();
    }

    // Subscribe to real-time updates
    const unsubscribe = appointmentsService.subscribeToAppointments(userId, (appointments) => {
      set({ appointments, isLoading: false });
    });

    set({ unsubscribe, isLoading: true });
  },

  unsubscribeFromAppointments: () => {
    const unsubscribe = get().unsubscribe;
    if (unsubscribe) {
      unsubscribe();
      set({ unsubscribe: null });
    }
  },

  clearError: () => set({ error: null }),
}));
