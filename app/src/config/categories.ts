import {
  Scissors,
  Sparkles,
  Brush,
  Users,
  Heart,
  Camera,
  Home,
  Hotel,
  Mountain,
  Tent,
  UtensilsCrossed,
  Cake,
  Coffee,
  Building2,
  PartyPopper,
  Gift,
  Video,
  Palmtree,
} from 'lucide-react';

export type CategoryId =
  // Beauty & Personal Care
  | 'kuafor'
  | 'berber'
  | 'guzellik'
  | 'tirnak'
  // Events & Organization
  | 'dugun-organizasyon'
  | 'nisan-organizasyon'
  | 'evlilik-teklifi'
  | 'dogum-gunu'
  | 'kurumsal-etkinlik'
  // Venues
  | 'dugun-salonu'
  | 'etkinlik-alani'
  // Accommodation
  | 'bungalov'
  | 'otel'
  | 'villa'
  | 'kamp-alani'
  // Photography & Video
  | 'fotograf'
  | 'video-produksiyon'
  | 'drone-cekim'
  // Catering & Food
  | 'catering'
  | 'pasta-tatli'
  | 'kahve-ikram';

export interface Category {
  id: CategoryId;
  name: string;
  description: string;
  icon: any;
  color: string;
  gradient: string;
  groupId: string;
  keywords: string[];
  labels: {
    business: string;
    staff: string;
    service: string;
    appointment: string;
    duration: string;
  };
}

export interface CategoryGroup {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  categories: CategoryId[];
}

export const categoryGroups: CategoryGroup[] = [
  {
    id: 'beauty',
    name: 'Güzellik & Bakım',
    description: 'Kişisel bakım ve güzellik hizmetleri',
    icon: Sparkles,
    color: 'from-purple-500 to-pink-500',
    categories: ['kuafor', 'berber', 'guzellik', 'tirnak'],
  },
  {
    id: 'events',
    name: 'Etkinlik & Organizasyon',
    description: 'Özel gün ve etkinlik organizasyonları',
    icon: PartyPopper,
    color: 'from-blue-500 to-cyan-500',
    categories: [
      'dugun-organizasyon',
      'nisan-organizasyon',
      'evlilik-teklifi',
      'dogum-gunu',
      'kurumsal-etkinlik',
    ],
  },
  {
    id: 'venues',
    name: 'Mekan & Salon',
    description: 'Etkinlik ve düğün mekanları',
    icon: Building2,
    color: 'from-amber-500 to-orange-500',
    categories: ['dugun-salonu', 'etkinlik-alani'],
  },
  {
    id: 'accommodation',
    name: 'Konaklama',
    description: 'Tatil ve konaklama hizmetleri',
    icon: Home,
    color: 'from-green-500 to-emerald-500',
    categories: ['bungalov', 'otel', 'villa', 'kamp-alani'],
  },
  {
    id: 'media',
    name: 'Fotoğraf & Video',
    description: 'Profesyonel görüntü hizmetleri',
    icon: Camera,
    color: 'from-indigo-500 to-purple-500',
    categories: ['fotograf', 'video-produksiyon', 'drone-cekim'],
  },
  {
    id: 'catering',
    name: 'Yemek & İkram',
    description: 'Catering ve ikram hizmetleri',
    icon: UtensilsCrossed,
    color: 'from-red-500 to-rose-500',
    categories: ['catering', 'pasta-tatli', 'kahve-ikram'],
  },
];

export const categories: Record<CategoryId, Category> = {
  // Beauty & Personal Care
  kuafor: {
    id: 'kuafor',
    name: 'Kuaför',
    description: 'Saç bakımı ve şekillendirme hizmetleri',
    icon: Scissors,
    color: 'purple',
    gradient: 'from-purple-500 to-pink-500',
    groupId: 'beauty',
    keywords: ['saç', 'kesim', 'boya', 'fön', 'maşa'],
    labels: {
      business: 'Kuaför Salonu',
      staff: 'Kuaför',
      service: 'Hizmet',
      appointment: 'Randevu',
      duration: 'dakika',
    },
  },
  berber: {
    id: 'berber',
    name: 'Berber',
    description: 'Erkek kuaförlük ve tıraş hizmetleri',
    icon: Scissors,
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-500',
    groupId: 'beauty',
    keywords: ['saç', 'sakal', 'tıraş', 'kesim'],
    labels: {
      business: 'Berber Salonu',
      staff: 'Berber',
      service: 'Hizmet',
      appointment: 'Randevu',
      duration: 'dakika',
    },
  },
  guzellik: {
    id: 'guzellik',
    name: 'Güzellik Merkezi',
    description: 'Cilt bakımı ve güzellik uygulamaları',
    icon: Sparkles,
    color: 'pink',
    gradient: 'from-pink-500 to-rose-500',
    groupId: 'beauty',
    keywords: ['cilt', 'bakım', 'masaj', 'epilasyon', 'makyaj'],
    labels: {
      business: 'Güzellik Merkezi',
      staff: 'Güzellik Uzmanı',
      service: 'Hizmet',
      appointment: 'Randevu',
      duration: 'dakika',
    },
  },
  tirnak: {
    id: 'tirnak',
    name: 'Tırnak Salonu',
    description: 'Tırnak bakımı ve tasarım hizmetleri',
    icon: Brush,
    color: 'rose',
    gradient: 'from-rose-500 to-pink-500',
    groupId: 'beauty',
    keywords: ['tırnak', 'manikür', 'pedikür', 'protez', 'jel'],
    labels: {
      business: 'Tırnak Salonu',
      staff: 'Tırnak Teknisyeni',
      service: 'Hizmet',
      appointment: 'Randevu',
      duration: 'dakika',
    },
  },

  // Events & Organization
  'dugun-organizasyon': {
    id: 'dugun-organizasyon',
    name: 'Düğün Organizasyonu',
    description: 'Profesyonel düğün planlama ve organizasyon',
    icon: Heart,
    color: 'red',
    gradient: 'from-red-500 to-pink-500',
    groupId: 'events',
    keywords: ['düğün', 'organizasyon', 'planlama', 'koordinasyon'],
    labels: {
      business: 'Organizasyon Firması',
      staff: 'Düğün Organizatörü',
      service: 'Paket',
      appointment: 'Görüşme',
      duration: 'saat',
    },
  },
  'nisan-organizasyon': {
    id: 'nisan-organizasyon',
    name: 'Nişan Organizasyonu',
    description: 'Nişan töreni planlama ve organizasyon',
    icon: Gift,
    color: 'blue',
    gradient: 'from-blue-500 to-indigo-500',
    groupId: 'events',
    keywords: ['nişan', 'organizasyon', 'planlama', 'tören'],
    labels: {
      business: 'Organizasyon Firması',
      staff: 'Etkinlik Organizatörü',
      service: 'Paket',
      appointment: 'Görüşme',
      duration: 'saat',
    },
  },
  'evlilik-teklifi': {
    id: 'evlilik-teklifi',
    name: 'Evlilik Teklifi',
    description: 'Romantik evlilik teklifi organizasyonu',
    icon: Heart,
    color: 'pink',
    gradient: 'from-pink-500 to-red-500',
    groupId: 'events',
    keywords: ['evlilik', 'teklif', 'romantik', 'sürpriz'],
    labels: {
      business: 'Organizasyon Firması',
      staff: 'Organizatör',
      service: 'Paket',
      appointment: 'Görüşme',
      duration: 'saat',
    },
  },
  'dogum-gunu': {
    id: 'dogum-gunu',
    name: 'Doğum Günü',
    description: 'Doğum günü partisi organizasyonu',
    icon: PartyPopper,
    color: 'yellow',
    gradient: 'from-yellow-500 to-orange-500',
    groupId: 'events',
    keywords: ['doğum günü', 'parti', 'organizasyon', 'çocuk'],
    labels: {
      business: 'Organizasyon Firması',
      staff: 'Parti Organizatörü',
      service: 'Paket',
      appointment: 'Görüşme',
      duration: 'saat',
    },
  },
  'kurumsal-etkinlik': {
    id: 'kurumsal-etkinlik',
    name: 'Kurumsal Etkinlik',
    description: 'Şirket etkinlikleri ve organizasyonlar',
    icon: Building2,
    color: 'slate',
    gradient: 'from-slate-500 to-gray-500',
    groupId: 'events',
    keywords: ['kurumsal', 'etkinlik', 'toplantı', 'konferans'],
    labels: {
      business: 'Organizasyon Firması',
      staff: 'Etkinlik Yöneticisi',
      service: 'Paket',
      appointment: 'Görüşme',
      duration: 'saat',
    },
  },

  // Venues
  'dugun-salonu': {
    id: 'dugun-salonu',
    name: 'Düğün Salonu',
    description: 'Düğün ve nikah mekanları',
    icon: Building2,
    color: 'amber',
    gradient: 'from-amber-500 to-orange-500',
    groupId: 'venues',
    keywords: ['düğün', 'salon', 'mekan', 'nikah'],
    labels: {
      business: 'Düğün Salonu',
      staff: 'Mekan Sorumlusu',
      service: 'Paket',
      appointment: 'Rezervasyon',
      duration: 'saat',
    },
  },
  'etkinlik-alani': {
    id: 'etkinlik-alani',
    name: 'Etkinlik Alanı',
    description: 'Çok amaçlı etkinlik mekanları',
    icon: Building2,
    color: 'orange',
    gradient: 'from-orange-500 to-red-500',
    groupId: 'venues',
    keywords: ['etkinlik', 'alan', 'mekan', 'toplantı'],
    labels: {
      business: 'Etkinlik Alanı',
      staff: 'Mekan Sorumlusu',
      service: 'Paket',
      appointment: 'Rezervasyon',
      duration: 'saat',
    },
  },

  // Accommodation
  bungalov: {
    id: 'bungalov',
    name: 'Bungalov',
    description: 'Doğa içinde bungalov konaklama',
    icon: Home,
    color: 'green',
    gradient: 'from-green-500 to-emerald-500',
    groupId: 'accommodation',
    keywords: ['bungalov', 'konaklama', 'tatil', 'doğa'],
    labels: {
      business: 'Bungalov Tesisi',
      staff: 'Tesis Görevlisi',
      service: 'Konaklama',
      appointment: 'Rezervasyon',
      duration: 'gece',
    },
  },
  otel: {
    id: 'otel',
    name: 'Otel',
    description: 'Otel ve apart konaklama',
    icon: Hotel,
    color: 'teal',
    gradient: 'from-teal-500 to-cyan-500',
    groupId: 'accommodation',
    keywords: ['otel', 'konaklama', 'apart', 'tatil'],
    labels: {
      business: 'Otel',
      staff: 'Resepsiyon',
      service: 'Oda',
      appointment: 'Rezervasyon',
      duration: 'gece',
    },
  },
  villa: {
    id: 'villa',
    name: 'Villa',
    description: 'Lüks villa kiralama',
    icon: Palmtree,
    color: 'cyan',
    gradient: 'from-cyan-500 to-blue-500',
    groupId: 'accommodation',
    keywords: ['villa', 'kiralama', 'tatil', 'lüks'],
    labels: {
      business: 'Villa',
      staff: 'Villa Sorumlusu',
      service: 'Kiralama',
      appointment: 'Rezervasyon',
      duration: 'gün',
    },
  },
  'kamp-alani': {
    id: 'kamp-alani',
    name: 'Kamp Alanı',
    description: 'Kamp ve karavan alanları',
    icon: Tent,
    color: 'lime',
    gradient: 'from-lime-500 to-green-500',
    groupId: 'accommodation',
    keywords: ['kamp', 'karavan', 'çadır', 'doğa'],
    labels: {
      business: 'Kamp Alanı',
      staff: 'Alan Sorumlusu',
      service: 'Alan',
      appointment: 'Rezervasyon',
      duration: 'gece',
    },
  },

  // Photography & Video
  fotograf: {
    id: 'fotograf',
    name: 'Fotoğraf',
    description: 'Profesyonel fotoğraf çekimi',
    icon: Camera,
    color: 'indigo',
    gradient: 'from-indigo-500 to-purple-500',
    groupId: 'media',
    keywords: ['fotoğraf', 'çekim', 'düğün', 'stüdyo'],
    labels: {
      business: 'Fotoğraf Stüdyosu',
      staff: 'Fotoğrafçı',
      service: 'Çekim Paketi',
      appointment: 'Rezervasyon',
      duration: 'saat',
    },
  },
  'video-produksiyon': {
    id: 'video-produksiyon',
    name: 'Video Prodüksiyon',
    description: 'Profesyonel video çekimi ve kurgu',
    icon: Video,
    color: 'purple',
    gradient: 'from-purple-500 to-pink-500',
    groupId: 'media',
    keywords: ['video', 'çekim', 'kurgu', 'prodüksiyon'],
    labels: {
      business: 'Prodüksiyon Firması',
      staff: 'Kameraman',
      service: 'Çekim Paketi',
      appointment: 'Rezervasyon',
      duration: 'saat',
    },
  },
  'drone-cekim': {
    id: 'drone-cekim',
    name: 'Drone Çekim',
    description: 'Havadan drone görüntüleme',
    icon: Mountain,
    color: 'sky',
    gradient: 'from-sky-500 to-blue-500',
    groupId: 'media',
    keywords: ['drone', 'havadan', 'çekim', 'video'],
    labels: {
      business: 'Drone Çekim',
      staff: 'Drone Pilotu',
      service: 'Çekim Paketi',
      appointment: 'Rezervasyon',
      duration: 'saat',
    },
  },

  // Catering & Food
  catering: {
    id: 'catering',
    name: 'Catering',
    description: 'Etkinlik yemek hizmeti',
    icon: UtensilsCrossed,
    color: 'red',
    gradient: 'from-red-500 to-orange-500',
    groupId: 'catering',
    keywords: ['catering', 'yemek', 'ikram', 'etkinlik'],
    labels: {
      business: 'Catering Firması',
      staff: 'Şef',
      service: 'Menü',
      appointment: 'Görüşme',
      duration: 'kişi',
    },
  },
  'pasta-tatli': {
    id: 'pasta-tatli',
    name: 'Pasta & Tatlı',
    description: 'Özel gün pastaları ve tatlılar',
    icon: Cake,
    color: 'pink',
    gradient: 'from-pink-500 to-rose-500',
    groupId: 'catering',
    keywords: ['pasta', 'tatlı', 'düğün', 'doğum günü'],
    labels: {
      business: 'Pastane',
      staff: 'Pastacı',
      service: 'Ürün',
      appointment: 'Sipariş',
      duration: 'kişi',
    },
  },
  'kahve-ikram': {
    id: 'kahve-ikram',
    name: 'Kahve & İkram',
    description: 'Mobil kahve ve ikram hizmeti',
    icon: Coffee,
    color: 'amber',
    gradient: 'from-amber-500 to-yellow-500',
    groupId: 'catering',
    keywords: ['kahve', 'ikram', 'mobil', 'etkinlik'],
    labels: {
      business: 'İkram Hizmeti',
      staff: 'Barista',
      service: 'Paket',
      appointment: 'Rezervasyon',
      duration: 'saat',
    },
  },
};

// Helper functions
export const getCategoryById = (id: CategoryId): Category => {
  return categories[id];
};

export const getCategoriesByGroup = (groupId: string): Category[] => {
  return Object.values(categories).filter((cat) => cat.groupId === groupId);
};

export const getGroupById = (id: string): CategoryGroup | undefined => {
  return categoryGroups.find((group) => group.id === id);
};

export const getAllCategories = (): Category[] => {
  return Object.values(categories);
};

export const searchCategories = (query: string): Category[] => {
  const lowerQuery = query.toLowerCase();
  return Object.values(categories).filter(
    (cat) =>
      cat.name.toLowerCase().includes(lowerQuery) ||
      cat.description.toLowerCase().includes(lowerQuery) ||
      cat.keywords.some((keyword) => keyword.toLowerCase().includes(lowerQuery))
  );
};
