/**
 * 🔥 FIREBASE FUNCTIONS - CASCADE UPDATES & ORPHAN PREVENTION
 * 
 * ✅ DATA CONSISTENCY: Denormalized data cascade updates
 * ✅ ORPHAN PREVENTION: Soft delete reservations when business/staff deleted
 * 
 * Issue: CRITICAL #14, #15 - Data consistency fixes
 * Date: 2026-07-03
 * 
 * @author Kiro AI Security Team
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * ✅ CRITICAL FIX #14: Business name cascade update
 * 
 * When a business name changes, update all reservations with new name
 * Maintains data consistency across denormalized data
 */
export const onBusinessUpdate = functions
  .region('europe-west1')
  .firestore
  .document('salons/{salonId}')
  .onUpdate(async (change, context) => {
    const oldData = change.before.data();
    const newData = change.after.data();
    const salonId = context.params.salonId;
    
    // İsim değişti mi?
    if (oldData.name !== newData.name) {
      console.log(`[CASCADE] Business name changed: ${oldData.name} → ${newData.name}`);
      
      try {
        // Rezervasyonları batch ile güncelle
        const batch = db.batch();
        
        const reservations = await db
          .collection('reservations')
          .where('businessId', '==', salonId)
          .get();
        
        reservations.forEach(doc => {
          batch.update(doc.ref, { 
            businessName: newData.name,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        });
        
        await batch.commit();
        console.log(`[CASCADE] Updated ${reservations.size} reservations with new business name`);
        
      } catch (error) {
        console.error('[CASCADE] Business name update error:', error);
        // Don't throw - let the business update succeed even if cascade fails
      }
    }
    
    // Kategori değişti mi? (Çok nadir ama olabilir)
    if (oldData.category !== newData.category) {
      console.log(`[CASCADE] Business category changed: ${oldData.category} → ${newData.category}`);
      
      try {
        const batch = db.batch();
        
        const reservations = await db
          .collection('reservations')
          .where('businessId', '==', salonId)
          .get();
        
        reservations.forEach(doc => {
          batch.update(doc.ref, { 
            businessCategory: newData.category,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        });
        
        await batch.commit();
        console.log(`[CASCADE] Updated ${reservations.size} reservations with new category`);
        
      } catch (error) {
        console.error('[CASCADE] Business category update error:', error);
      }
    }
  });

/**
 * ✅ CRITICAL FIX #15: Staff delete orphan prevention
 * 
 * When staff is deleted, soft-delete all their pending/confirmed reservations
 * Prevents orphaned reservations and UI errors
 */
export const onStaffDelete = functions
  .region('europe-west1')
  .firestore
  .document('staff/{staffId}')
  .onDelete(async (snap, context) => {
    const staffData = snap.data();
    const staffId = context.params.staffId;
    
    console.log(`[ORPHAN PREVENTION] Staff deleted: ${staffData.name} (${staffId})`);
    
    try {
      const batch = db.batch();
      
      // İlgili rezervasyonları soft delete
      const reservations = await db
        .collection('reservations')
        .where('type', '==', 'slot')
        .where('staffId', '==', staffId)
        .where('status', 'in', ['pending', 'confirmed', 'deposit_paid'])
        .get();
      
      reservations.forEach(doc => {
        batch.update(doc.ref, {
          status: 'cancelled_by_business',
          cancellationReason: 'Personel artık çalışmıyor',
          staffDeleted: true,
          staffDeletedAt: admin.firestore.FieldValue.serverTimestamp(),
          cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });
      
      await batch.commit();
      console.log(`[ORPHAN PREVENTION] Cancelled ${reservations.size} reservations for deleted staff`);
      
      // TODO: Send notifications to affected customers
      
    } catch (error) {
      console.error('[ORPHAN PREVENTION] Staff delete cascade error:', error);
      // Don't throw - staff is already deleted
    }
  });

/**
 * ✅ CRITICAL FIX #15: Business delete orphan prevention
 * 
 * When business is deleted, soft-delete all their reservations
 * Maintains referential integrity
 */
export const onBusinessDelete = functions
  .region('europe-west1')
  .firestore
  .document('salons/{salonId}')
  .onDelete(async (snap, context) => {
    const businessData = snap.data();
    const salonId = context.params.salonId;
    
    console.log(`[ORPHAN PREVENTION] Business deleted: ${businessData.name} (${salonId})`);
    
    try {
      const batch = db.batch();
      
      // Tüm rezervasyonları iptal et
      const reservations = await db
        .collection('reservations')
        .where('businessId', '==', salonId)
        .where('status', 'in', ['pending', 'confirmed', 'deposit_paid', 'fully_paid'])
        .get();
      
      reservations.forEach(doc => {
        batch.update(doc.ref, {
          status: 'cancelled_by_business',
          cancellationReason: 'İşletme kapatıldı',
          businessDeleted: true,
          businessDeletedAt: admin.firestore.FieldValue.serverTimestamp(),
          cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });
      
      await batch.commit();
      console.log(`[ORPHAN PREVENTION] Cancelled ${reservations.size} reservations for deleted business`);
      
      // TODO: Send notifications to affected customers
      // TODO: Process refunds if applicable
      
    } catch (error) {
      console.error('[ORPHAN PREVENTION] Business delete cascade error:', error);
    }
  });

/**
 * ✅ BEST PRACTICE: Staff name cascade update
 * 
 * When staff name changes, update reservations for better UX
 * Not critical but improves data consistency
 */
export const onStaffUpdate = functions
  .region('europe-west1')
  .firestore
  .document('staff/{staffId}')
  .onUpdate(async (change, context) => {
    const oldData = change.before.data();
    const newData = change.after.data();
    const staffId = context.params.staffId;
    
    // İsim değişti mi?
    if (oldData.name !== newData.name) {
      console.log(`[CASCADE] Staff name changed: ${oldData.name} → ${newData.name}`);
      
      try {
        const batch = db.batch();
        
        // Sadece gelecekteki rezervasyonları güncelle (past reservations keep old name)
        const reservations = await db
          .collection('reservations')
          .where('type', '==', 'slot')
          .where('staffId', '==', staffId)
          .where('status', 'in', ['pending', 'confirmed', 'deposit_paid'])
          .get();
        
        reservations.forEach(doc => {
          batch.update(doc.ref, { 
            staffName: newData.name,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        });
        
        await batch.commit();
        console.log(`[CASCADE] Updated ${reservations.size} reservations with new staff name`);
        
      } catch (error) {
        console.error('[CASCADE] Staff name update error:', error);
      }
    }
  });
