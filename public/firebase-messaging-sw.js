// Firebase Cloud Messaging Service Worker
// Bu dosya arka planda bildirim almak için gereklidir

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase config - environment variables kullanılamaz, hardcoded olmalı
// NOT: Bu değerleri .env dosyanızdan alın ve buraya yapıştırın
firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
});

const messaging = firebase.messaging();

// Arka planda bildirim alındığında
messaging.onBackgroundMessage((payload) => {
  console.log('📬 Arka plan bildirimi alındı:', payload);

  const notificationTitle = payload.notification?.title || 'Yeni Bildirim';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/favicon.svg',
    badge: '/favicon.svg',
    tag: payload.data?.type || 'default',
    requireInteraction: true, // Kullanıcı kapatana kadar ekranda kalsın
    vibrate: [200, 100, 200], // Titreşim paterni
    data: payload.data,
    actions: payload.data?.type === 'waiter_call' || payload.data?.type === 'coal_request' || payload.data?.type === 'bill_request'
      ? [
          { action: 'respond', title: '✓ Geliyorum' },
          { action: 'dismiss', title: '✕ Kapat' }
        ]
      : []
  };

  // Ses çal (arka plan bildirimleri için tarayıcı desteği sınırlı)
  if (payload.data?.soundUrl) {
    // Service Worker'da ses çalma sınırlı, notification ile birlikte default ses çalar
  }

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Bildirime tıklandığında
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Bildirime tıklandı:', event.action);
  
  event.notification.close();

  if (event.action === 'respond') {
    // "Geliyorum" butonuna tıklandı
    event.waitUntil(
      clients.openWindow(`/restaurant/${event.notification.data.restaurantId}/waiter`)
    );
  } else if (event.action === 'dismiss') {
    // "Kapat" butonuna tıklandı - sadece kapat
    return;
  } else {
    // Bildirim gövdesine tıklandı - uygulamayı aç
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Zaten açık bir pencere varsa onu öne getir
        for (const client of clientList) {
          if ('focus' in client) {
            return client.focus();
          }
        }
        // Yoksa yeni pencere aç
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});
