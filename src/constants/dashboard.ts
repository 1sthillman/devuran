import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  Scissors, 
  Users, 
  Settings, 
  Star, 
  UserCheck, 
  BarChart3, 
  ChefHat, 
  CreditCard 
} from 'lucide-react';

export const DASHBOARD_TABS = [
  { key: 'overview', label: 'Genel Bakış', icon: LayoutDashboard, color: '#8B5CF6' },
  { key: 'subscription', label: 'Abonelik', icon: CreditCard, color: '#EC4899' },
  { key: 'appointments', label: 'Randevular', icon: CalendarIcon, color: '#3B82F6' },
  { key: 'restaurant', label: 'Restoran', icon: ChefHat, color: '#F97316' },
  { key: 'analytics', label: 'Analitik', icon: BarChart3, color: '#10B981' },
  { key: 'customers', label: 'Musteriler', icon: UserCheck, color: '#F59E0B' },
  { key: 'reviews', label: 'Yorumlar', icon: Star, color: '#06B6D4' },
  { key: 'services', label: 'Hizmetler', icon: Scissors, color: '#8B5CF6' },
  { key: 'staff', label: 'Personel', icon: Users, color: '#6B7280' },
  { key: 'settings', label: 'Ayarlar', icon: Settings, color: '#6B7280' },
] as const;

export type DashboardTab = typeof DASHBOARD_TABS[number]['key'];

export const STAT_COLORS = {
  today: '#2DC24E',
  queue: '#E5A522',
  week: '#60a5fa',
  revenue: '#c8c8d4',
} as const;
