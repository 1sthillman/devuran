/**
 * wizardSchemaService.ts
 * ------------------------
 * Firestore erişim katmanı. Mevcut `firebaseService.ts` deki servis pattern'iyle
 * birebir aynı yapıyı izler (bkz. salonsService, servicesService) — projeye ekleyince
 * yabancı gibi durmasın diye.
 *
 * Koleksiyon yapısı:
 *   salons/{salonId}/wizardSchemas/{schemaId}   -> WizardSchema
 *   wizardResponses/{responseId}                -> WizardResponse (kolay sorgu için üst seviye)
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { WizardSchema, WizardResponse, WizardKind } from '@/types/wizardSchema';

const schemasCol = (salonId: string) => collection(db, 'salons', salonId, 'wizardSchemas');
const responsesCol = () => collection(db, 'wizardResponses');

export const wizardSchemaService = {
  /** Bir işletmenin belirli türdeki (setup_extra / booking) tüm aktif şemalarını getirir */
  async listByKind(salonId: string, kind: WizardKind): Promise<WizardSchema[]> {
    const q = query(schemasCol(salonId), where('kind', '==', kind));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ ...(d.data() as WizardSchema), id: d.id }))
      .sort((a, b) => a.updatedAt - b.updatedAt);
  },

  /** Tek bir şemayı getirir */
  async getById(salonId: string, schemaId: string): Promise<WizardSchema | null> {
    const ref = doc(db, 'salons', salonId, 'wizardSchemas', schemaId);
    const snap = await getDoc(ref);
    return snap.exists() ? ({ ...(snap.data() as WizardSchema), id: snap.id }) : null;
  },

  /** Oluşturur veya günceller (id zaten schema içinde var) */
  async save(salonId: string, schema: WizardSchema): Promise<void> {
    const ref = doc(db, 'salons', salonId, 'wizardSchemas', schema.id);
    await setDoc(ref, { ...schema, businessId: salonId, updatedAt: Date.now() }, { merge: true });
  },

  async delete(salonId: string, schemaId: string): Promise<void> {
    const ref = doc(db, 'salons', salonId, 'wizardSchemas', schemaId);
    await deleteDoc(ref);
  },

  /** Aktif/pasif toggle — silmeden hızlıca kapatmak için (owner "yayından kaldır" der) */
  async setActive(salonId: string, schemaId: string, isActive: boolean): Promise<void> {
    const ref = doc(db, 'salons', salonId, 'wizardSchemas', schemaId);
    await setDoc(ref, { isActive, updatedAt: Date.now() }, { merge: true });
  },
};

export const wizardResponseService = {
  async submit(response: Omit<WizardResponse, 'id'>): Promise<string> {
    const id = `r_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const ref = doc(db, 'wizardResponses', id);
    await setDoc(ref, { ...response, id });
    return id;
  },

  async listForBusiness(salonId: string, kind?: WizardKind): Promise<WizardResponse[]> {
    const base = kind
      ? query(responsesCol(), where('businessId', '==', salonId), where('kind', '==', kind))
      : query(responsesCol(), where('businessId', '==', salonId));
    const snap = await getDocs(base);
    return snap.docs
      .map((d) => d.data() as WizardResponse)
      .sort((a, b) => b.submittedAt - a.submittedAt);
  },
};
