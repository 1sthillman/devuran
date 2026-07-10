/**
 * Google Business Profile (GBP) Type Definitions
 * 
 * Types for GBP API interactions
 */

/**
 * GBP Location from API
 */
export interface GBPLocation {
  name: string; // Resource name (e.g., "accounts/123/locations/456")
  locationName: string; // Display name
  primaryPhone?: string;
  address?: {
    addressLines?: string[];
    locality?: string; // City
    administrativeArea?: string; // State/Province
    postalCode?: string;
    regionCode?: string; // Country code (e.g., "US")
  };
  primaryCategory?: {
    displayName: string;
    categoryId: string;
  };
  websiteUrl?: string;
  regularHours?: {
    periods?: Array<{
      openDay: string;
      closeDay: string;
      openTime: string;
      closeTime: string;
    }>;
  };
  latlng?: {
    latitude: number;
    longitude: number;
  };
  metadata?: {
    canOperateHealthData?: boolean;
    hasVoiceOfMerchant?: boolean;
  };
  profile?: {
    description?: string;
  };
  locationState?: {
    isVerified?: boolean;
    isPublished?: boolean;
    isSuspended?: boolean;
    isDuplicate?: boolean;
  };
}

/**
 * Stored Location in Firestore
 */
export interface StoredLocation {
  locationId: string; // Extracted from name
  accountId: string;
  businessId: string; // Platform business ID
  locationName: string;
  address: string; // Formatted address
  phone?: string;
  category?: string;
  latitude?: number;
  longitude?: number;
  isVerified: boolean;
  isPublished: boolean;
  isSuspended: boolean;
  appointmentUrl?: string; // Appointment URL if integration active
  integrationStatus: 'inactive' | 'pending' | 'active' | 'error';
  lastSyncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * GBP API List Locations Response
 */
export interface ListLocationsResponse {
  locations: GBPLocation[];
  nextPageToken?: string;
  totalSize: number;
}

/**
 * GBP Attribute for appointment URL
 */
export interface LocationAttribute {
  attributeId: string;
  valueType: string;
  values: string[];
  urlValues?: Array<{
    url: string;
  }>;
}

/**
 * Update Location Request
 */
export interface UpdateLocationRequest {
  updateMask: string;
  attributes?: LocationAttribute[];
  [key: string]: any;
}

/**
 * GBP API Error Response
 */
export interface GBPApiError {
  error: {
    code: number;
    message: string;
    status: string;
    details?: Array<{
      '@type': string;
      violations?: Array<{
        type: string;
        subject: string;
        description: string;
      }>;
    }>;
  };
}

/**
 * Location Sync Result
 */
export interface LocationSyncResult {
  businessId: string;
  totalLocations: number;
  newLocations: number;
  updatedLocations: number;
  removedLocations: number;
  errors: Array<{
    locationId: string;
    message: string;
  }>;
}
