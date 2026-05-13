import { create } from 'zustand';

interface DashboardStore {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  activeTab: 'overview',
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
