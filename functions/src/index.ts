/**
 * 🔥 FIREBASE FUNCTIONS - MAIN ENTRY POINT
 * 
 * Tüm Cloud Functions bu dosyadan export edilir
 * 
 * @author Kiro AI
 * @date 24 Mayıs 2026
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

// TODO: Diğer functions eklenebilir
// export * from './notifications';
// export * from './analytics';
// export * from './payments';
