/**
 * Türkçe karakter desteğiyle slug oluşturma
 * Çakışma kontrolü için unique suffix ekler
 */

const trCharMap: Record<string, string> = {
  'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
  'Ç': 'c', 'Ğ': 'g', 'İ': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u'
};

/**
 * Türkçe karakterleri İngilizce karşılıklarına çevirir
 */
function replaceTurkishChars(text: string): string {
  return text.split('').map(char => trCharMap[char] || char).join('');
}

/**
 * URL-safe slug oluşturur
 * @param text - Slug oluşturulacak metin
 * @param options - Opsiyonel ayarlar
 * @returns URL-safe slug
 */
export function slugify(text: string, options?: {
  lowercase?: boolean;
  separator?: string;
}): string {
  const { lowercase = true, separator = '-' } = options || {};
  
  // Türkçe karakterleri dönüştür
  let slug = replaceTurkishChars(text);
  
  // Küçük harfe çevir (opsiyonel)
  if (lowercase) {
    slug = slug.toLowerCase();
  }
  
  // Boşlukları ve özel karakterleri temizle
  slug = slug
    .trim()
    .replace(/\s+/g, separator) // Boşlukları ayırıcıya çevir
    .replace(/[^a-z0-9-]/gi, '') // Sadece harf, rakam ve tire
    .replace(new RegExp(`${separator}+`, 'g'), separator) // Çoklu ayırıcıları tekle
    .replace(new RegExp(`^${separator}|${separator}$`, 'g'), ''); // Baştaki ve sondaki ayırıcıları sil
  
  return slug;
}

/**
 * Slug çakışmasını önlemek için unique suffix ekler
 * @param baseSlug - Temel slug
 * @param existingSlugs - Mevcut sluglar
 * @returns Benzersiz slug
 */
export function ensureUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
  let slug = baseSlug;
  let counter = 1;
  
  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
}
