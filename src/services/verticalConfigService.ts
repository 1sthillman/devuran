/**
 * Vertical Config Service
 * Firestore'dan vertical configuration'ları okur ve cache'ler
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { VerticalConfig, BusinessType } from '@/types/wizard';
import type { VerticalConfigDocument } from '@/types/verticalConfig';

class VerticalConfigService {
  private collectionName = 'verticalConfigs';
  private cache: Map<string, VerticalConfig> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private CACHE_TTL = 5 * 60 * 1000; // 5 dakika

  /**
   * Business type'a göre aktif config'i getir
   */
  async getConfigByBusinessType(businessType: BusinessType): Promise<VerticalConfig | null> {
    const cacheKey = `type_${businessType}`;
    
    // Cache kontrolü
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey) || null;
    }

    try {
      const q = query(
        collection(db, this.collectionName),
        where('businessType', '==', businessType),
        where('metadata.isActive', '==', true),
        orderBy('version', 'desc')
      );

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        console.warn(`No active config found for business type: ${businessType}`);
        return null;
      }

      // En yüksek version'ı al
      const configDoc = snapshot.docs[0];
      const config = this.convertToVerticalConfig(configDoc.data() as VerticalConfigDocument);

      // Cache'e kaydet
      this.cache.set(cacheKey, config);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL);

      return config;
    } catch (error) {
      console.error('Error fetching vertical config:', error);
      return null;
    }
  }

  /**
   * Config ID ile direkt getir
   */
  async getConfigById(configId: string): Promise<VerticalConfig | null> {
    const cacheKey = `id_${configId}`;
    
    // Cache kontrolü
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey) || null;
    }

    try {
      const docRef = doc(db, this.collectionName, configId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        console.warn(`Config not found: ${configId}`);
        return null;
      }

      const config = this.convertToVerticalConfig(docSnap.data() as VerticalConfigDocument);

      // Cache'e kaydet
      this.cache.set(cacheKey, config);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL);

      return config;
    } catch (error) {
      console.error('Error fetching config by ID:', error);
      return null;
    }
  }

  /**
   * Tüm aktif config'leri listele
   */
  async getAllActiveConfigs(): Promise<VerticalConfig[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('metadata.isActive', '==', true)
      );

      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => 
        this.convertToVerticalConfig(doc.data() as VerticalConfigDocument)
      );
    } catch (error) {
      console.error('Error fetching all configs:', error);
      return [];
    }
  }

  /**
   * Firestore Timestamp'leri string'e çevir
   */
  private convertToVerticalConfig(doc: VerticalConfigDocument): VerticalConfig {
    return {
      ...doc,
      metadata: {
        createdAt: (doc.metadata.createdAt as Timestamp).toDate().toISOString(),
        updatedAt: (doc.metadata.updatedAt as Timestamp).toDate().toISOString(),
        isActive: doc.metadata.isActive,
      },
    };
  }

  /**
   * Cache geçerli mi?
   */
  private isCacheValid(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    if (!expiry) return false;
    
    if (Date.now() > expiry) {
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
      return false;
    }
    
    return this.cache.has(key);
  }

  /**
   * Cache'i temizle
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  /**
   * Belirli bir config'in cache'ini temizle
   */
  invalidateCache(configId: string): void {
    this.cache.delete(`id_${configId}`);
    this.cacheExpiry.delete(`id_${configId}`);
  }
}

export const verticalConfigService = new VerticalConfigService();
