// City coordinates for major Turkish cities
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'İstanbul': { lat: 41.0082, lng: 28.9784 },
  'Ankara': { lat: 39.9334, lng: 32.8597 },
  'İzmir': { lat: 38.4237, lng: 27.1428 },
  'Bursa': { lat: 40.1826, lng: 29.0665 },
  'Antalya': { lat: 36.8969, lng: 30.7133 },
  'Adana': { lat: 37.0000, lng: 35.3213 },
  'Konya': { lat: 37.8746, lng: 32.4932 },
  'Gaziantep': { lat: 37.0662, lng: 37.3833 },
  'Mersin': { lat: 36.8121, lng: 34.6415 },
  'Kayseri': { lat: 38.7312, lng: 35.4787 },
  'Eskişehir': { lat: 39.7767, lng: 30.5206 },
  'Diyarbakır': { lat: 37.9144, lng: 40.2306 },
  'Samsun': { lat: 41.2867, lng: 36.3300 },
  'Denizli': { lat: 37.7765, lng: 29.0864 },
  'Şanlıurfa': { lat: 37.1591, lng: 38.7969 },
  'Adapazarı': { lat: 40.7569, lng: 30.4003 },
  'Malatya': { lat: 38.3552, lng: 38.3095 },
  'Kahramanmaraş': { lat: 37.5858, lng: 36.9371 },
  'Erzurum': { lat: 39.9000, lng: 41.2700 },
  'Van': { lat: 38.4891, lng: 43.4089 },
  'Batman': { lat: 37.8812, lng: 41.1351 },
  'Elazığ': { lat: 38.6810, lng: 39.2264 },
  'Sivas': { lat: 39.7477, lng: 37.0179 },
  'Manisa': { lat: 38.6191, lng: 27.4289 },
  'Tarsus': { lat: 36.9177, lng: 34.8956 },
  'Kocaeli': { lat: 40.8533, lng: 29.8815 },
  'Balıkesir': { lat: 39.6484, lng: 27.8826 },
  'Kütahya': { lat: 39.4242, lng: 29.9833 },
  'Trabzon': { lat: 41.0015, lng: 39.7178 },
  'Çorum': { lat: 40.5506, lng: 34.9556 },
};

/**
 * Get coordinates for a city and district
 * Falls back to city center if district geocoding is not available
 */
export function getCoordinates(city: string): { lat: number; lng: number } {
  // Return city coordinates (in production, you would use a geocoding API)
  return CITY_COORDINATES[city] || { lat: 41.0082, lng: 28.9784 };
}

/**
 * Get coordinates using Google Geocoding API (requires API key)
 * This is a placeholder - implement when you have a geocoding service
 */
export async function geocodeAddress(city: string): Promise<{ lat: number; lng: number }> {
  // For now, return city coordinates
  // In production, you would call a geocoding API like:
  // const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=YOUR_API_KEY`);
  // const data = await response.json();
  // return { lat: data.results[0].geometry.location.lat, lng: data.results[0].geometry.location.lng };
  
  return getCoordinates(city);
}
