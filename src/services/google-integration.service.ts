/**
 * Google Integration Service
 * 
 * API client for Google Maps/Business Profile integration dashboard.
 * Handles OAuth, location management, statistics, settings, and logs.
 */

import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

interface IntegrationStatus {
  stage1: {
    enabled: boolean;
    connectedAt?: Date;
    googleAccountEmail?: string;
    activeLocationsCount: number;
  };
  stage2: {
    enabled: boolean;
    status: 'inactive' | 'pending_approval' | 'active';
  };
  stats: {
    last7Days: {
      totalViews: number;
      totalBookings: number;
      conversionRate: number;
    };
  };
}

interface Location {
  locationId: string;
  name: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  phone: string;
  verified: boolean;
  integrationStatus: 'active' | 'inactive' | 'pending' | 'error';
  appointmentUrl?: string;
  lastSyncAt?: Date;
  error?: string;
}

interface Statistics {
  period: {
    start: Date;
    end: Date;
  };
  totals: {
    views: number;
    bookings: number;
    conversionRate: number;
    revenue: number;
  };
  bySource: {
    source: string;
    views: number;
    bookings: number;
    conversionRate: number;
  }[];
  dailyTrend: {
    date: string;
    views: number;
    bookings: number;
  }[];
  topServices: {
    serviceId: string;
    serviceName: string;
    bookings: number;
    revenue: number;
  }[];
}

interface Settings {
  googleAccount: {
    connected: boolean;
    email?: string;
    connectedAt?: Date;
    scopes: string[];
  };
  notifications: {
    email: boolean;
    sms: boolean;
    inApp: boolean;
  };
  package: {
    name: string;
    tier: 'stage1' | 'stage2';
    status: 'active' | 'trial' | 'expired';
    startDate: Date;
    endDate: Date;
    remainingDays: number;
    autoRenew: boolean;
  };
}

interface LogEntry {
  id: string;
  timestamp: Date;
  operation: string;
  status: 'success' | 'failure' | 'pending';
  details: string;
  locationId?: string;
  locationName?: string;
  error?: string;
  duration?: number;
}

class GoogleIntegrationService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // For cookie-based auth
    });

    // Add auth token from localStorage if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }

  /**
   * OAuth Methods
   */

  async initiateOAuth(): Promise<{ authorizationUrl: string; state: string }> {
    const response = await this.api.post('/google/oauth/initiate');
    return response.data;
  }

  async revokeOAuth(): Promise<void> {
    await this.api.post('/google/oauth/revoke');
  }

  async getOAuthStatus(): Promise<{ connected: boolean; email?: string }> {
    const response = await this.api.get('/google/oauth/status');
    return response.data;
  }

  /**
   * Integration Status
   */

  async getIntegrationStatus(): Promise<IntegrationStatus> {
    const response = await this.api.get('/google/integration/status');
    return response.data;
  }

  /**
   * Location Management
   */

  async getLocations(): Promise<Location[]> {
    const response = await this.api.get('/google/gbp/locations');
    return response.data;
  }

  async syncLocations(): Promise<{ synced: number; errors: string[] }> {
    const response = await this.api.post('/google/gbp/sync');
    return response.data;
  }

  async activateLocation(locationId: string): Promise<void> {
    await this.api.post(`/google/gbp/locations/${locationId}/activate`);
  }

  async deactivateLocation(locationId: string): Promise<void> {
    await this.api.post(`/google/gbp/locations/${locationId}/deactivate`);
  }

  async getLocationAppointmentUrl(locationId: string): Promise<{ appointmentUrl: string }> {
    const response = await this.api.get(`/google/gbp/locations/${locationId}/appointment-url`);
    return response.data;
  }

  /**
   * Statistics
   */

  async getStatistics(period: '7days' | '30days' | '90days' = '30days'): Promise<Statistics> {
    const response = await this.api.get('/google/statistics', {
      params: { period },
    });
    return response.data;
  }

  /**
   * Settings
   */

  async getSettings(): Promise<Settings> {
    const response = await this.api.get('/google/settings');
    return response.data;
  }

  async updateNotificationPreferences(notifications: Settings['notifications']): Promise<void> {
    await this.api.put('/google/settings/notifications', { notifications });
  }

  /**
   * Audit Logs
   */

  async getLogs(status?: 'success' | 'failure' | 'pending'): Promise<LogEntry[]> {
    const response = await this.api.get('/google/logs', {
      params: { status, limit: 100 },
    });
    return response.data;
  }
}

// Singleton instance
export const googleIntegrationService = new GoogleIntegrationService();
export default googleIntegrationService;
