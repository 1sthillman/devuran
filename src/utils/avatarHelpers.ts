// Default avatarlar - cinsiyet ve renk bazlı
const DEFAULT_AVATARS = {
  male: [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=c0aede',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=John&backgroundColor=ffd5dc',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=David&backgroundColor=d1d4f9',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=James&backgroundColor=ffdfbf',
  ],
  female: [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma&backgroundColor=ffd5dc',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie&backgroundColor=c0aede',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Lily&backgroundColor=b6e3f4',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucy&backgroundColor=d1d4f9',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Grace&backgroundColor=ffdfbf',
  ],
  all: [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam&backgroundColor=b6e3f4',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&backgroundColor=c0aede',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan&backgroundColor=ffd5dc',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Casey&backgroundColor=d1d4f9',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Taylor&backgroundColor=ffdfbf',
  ]
};

/**
 * Personel için default avatar döndürür
 * @param name - Personelin adı
 * @param gender - Cinsiyet ('male', 'female', 'all')
 * @returns Avatar URL
 */
export function getDefaultStaffAvatar(name: string, gender: 'male' | 'female' | 'all' = 'all'): string {
  // İsme göre deterministik bir index oluştur (aynı isim hep aynı avatarı alsın)
  const nameSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const avatarList = DEFAULT_AVATARS[gender] || DEFAULT_AVATARS.all;
  const index = nameSum % avatarList.length;
  
  return avatarList[index];
}

/**
 * Personel photo'sunu kontrol eder ve yoksa default avatar döndürür
 * @param photo - Mevcut foto URL'i
 * @param name - Personelin adı
 * @param gender - Cinsiyet
 * @returns Kullanılacak avatar URL
 */
export function getStaffAvatarUrl(photo: string | undefined, name: string, gender: 'male' | 'female' | 'all' = 'all'): string {
  if (photo && photo.trim()) {
    return photo;
  }
  return getDefaultStaffAvatar(name, gender);
}
