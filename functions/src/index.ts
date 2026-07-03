/**
 * 🔥 FIREBASE FUNCTIONS - MAIN ENTRY POINT
 * 
 * Tüm Cloud Functions bu dosyadan export edilir
 * 
 * @author Kiro AI
 * @date 24 Mayıs 2026
 * @updated 3 Temmuz 2026 - Critical fixes added
 */

// Subscription Functions
export {
  createSubscription,
  approveSubscription,
  updateUsageOnStaffCreate,
  checkPendingSubscriptions,
  sendSubscriptionReminders,
} from './subscriptions';

// Email Functions
export {
  onAppointmentCreated,
} from './email';

// ✅ Reservation Functions (Price Validation)
export {
  createReservationWithValidation,
  onReservationCreated,
  cleanupExpiredReservations,
} from './reservations';

// ✅ Push Notification Functions
export {
  sendPushNotificationOnCreate,
  sendTestNotification
} from './notifications';

// ✅ CASCADE UPDATES & ORPHAN PREVENTION (Added: 2026-07-03)
// Issue: CRITICAL #14, #15 - Data consistency fixes
export {
  onBusinessUpdate,
  onBusinessDelete,
  onStaffUpdate,
  onStaffDelete,
} from './cascadeUpdates';

// TODO: Diğer functions eklenebilir
// export * from './analytics';
// export * from './payments';
