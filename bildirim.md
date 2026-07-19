Firebase veritabanı (Firestore veya Realtime Database) kullanıyorsanız, bu sistemi kurmanın en modern ve güvenilir yolu Firebase Cloud Messaging (FCM) ve Cloud Functions (Bulut Fonksiyonları) kullanmaktır.
Bu sayede harici bir sunucu kiralamanıza veya 24 saat açık bir bilgisayar barındırmanıza gerek kalmaz. Her şey Firebase ekosistemi içinde otomatik döner.
Sistemi adım adım nasıl kuracağınızı ve yazmanız gereken kodları aşağıda bulabilirsiniz:
## 1. Adım: Kullanıcı İzni Alma ve Token Kaydetme (Frontend - Web Sitesi)
Müşteri sitenize girdiğinde bildirim izni istenir. Onay verirse Firebase bir FCM Token üretir. Bu tokenı ve randevu tarihini Firestore veritabanına kaydedersiniz.
Örnek JavaScript (Web) Kodu:

import { initializeApp } from "firebase/app";import { getMessaging, getToken } from "firebase/messaging";import { getFirestore, doc, setDoc } from "firebase/firestore";
const firebaseConfig = { /* Firebase Proje Bilgileriniz */ };const app = initializeApp(firebaseConfig);const db = getFirestore(app);const messaging = getMessaging(app);
// Kullanıcıdan izin iste ve Token alasync function bildirimIzniniAlVeKaydet(kullaniciId, randevuTarihi) {
  try {
    const currentToken = await getToken(messaging, { vapidKey: 'BURAYA_PUBLIC_VAPID_KEY_GELECEK' });
    if (currentToken) {
      // Token ve Randevu Bilgisini Firestore'a kaydet
      // Randevu tarihini 'YYYY-MM-DD' formatında veya Timestamp olarak tutun
      await setDoc(doc(db, "randevular", kullaniciId), {
        fcmToken: currentToken,
        randevuTarihi: randevuTarihi, // Örn: "2026-08-15"
        durum: "bekliyor"
      });
      console.log("Token başarıyla kaydedildi.");
    } else {
      console.log("Bildirim izni reddedildi.");
    }
  } catch (err) {
    console.error("Hata oluştu:", err);
  }
}

## 2. Adım: Arka Planda Çalışacak Kod (firebase-messaging-sw.js)
Web siteniz kapalıyken bildirimi yakalayacak olan Service Worker dosyasıdır. Bu dosyayı projenizin kök dizinine (public klasörüne) tam olarak bu isimle eklemelisiniz.
firebase-messaging-sw.js içeriği:

importScripts('https://gstatic.com');
importScripts('https://gstatic.com');

firebase.initializeApp({ /* Firebase Proje Bilgileriniz */ });const messaging = firebase.messaging();
// Site kapalıyken bildirimi yakalayan fonksiyon
messaging.onBackgroundMessage((payload) => {
  console.log('Arka planda bildirim alındı: ', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png' // Bildirimde görünecek ikon
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

## 3. Adım: Zamanı Gelince Bildirimi Tetikleme (Backend - Firebase Cloud Functions)
Günü gelen randevuları kontrol etmek için her gün otomatik çalışacak bir Cloud Function (zamanlanmış görev/cron job) yazarız. Bu kod sunucusuz (serverless) çalışır ve siteniz kapalı olsa bile Firebase tarafından her gün tetiklenir.
index.js (Cloud Functions Klasörü İçinde):

const functions = require("firebase-functions");const admin = require("firebase-admin");
admin.initializeApp();
// Her sabah saat 09:00'da çalışacak zamanlanmış görev (Cron Job)
exports.randevuHatirlatici = functions.pubsub.schedule("0 9 * * *")
  .timeZone("Europe/Istanbul")
  .onRun(async (context) => {
    
    // Bugünün tarihini al (YYYY-MM-DD formatında)
    const bugun = new Date().toISOString().split('T')[0]; 
    const db = admin.firestore();

    // Firestore'da bugün randevusu olan ve henüz bildirim atılmamış kişileri bul
    const snapshot = await db.collection("randevular")
      .where("randevuTarihi", "==", bugun)
      .where("durum", "==", "bekliyor")
      .get();

    if (snapshot.empty) {
      console.log("Bugün gönderilecek randevu bulunamadı.");
      return null;
    }

    // Her kullanıcıya bildirim gönder
    const promises = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      const message = {
        notification: {
          title: "Randevu Hatırlatması",
          body: "Merhaba, bugün randevu gününüz! Detaylar için tıklayın.",
        },
        token: data.fcmToken // Ayın 1'inde kaydettiğimiz tarayıcı tokenı
      };

      // Bildirimi gönder ve veritabanında durumu güncelle
      const sendPromise = admin.messaging().send(message)
        .then(() => {
          return doc.ref.update({ durum: "bildirim_gonderildi" });
        })
        .catch((error) => {
          console.error("Bildirim gönderme hatası:", error);
        });

      promises.push(sendPromise);
    });

    return Promise.all(promises);
  });

## Özet Çalışma Mantığı

   1. Müşteri randevu aldığında 1. Adım çalışır ve tarayıcısının gizli anahtarı (Token) Firestore'a yazılır.
   2. Ayın 15'i geldiğinde, 3. Adımdaki Firebase fonksiyonu sabah 09:00'da otomatik uyanır. Veritabanından o günün randevularını ve tokenlarını çeker.
   3. Firebase, Google/Apple sunucuları üzerinden müşterinin cihazına sinyal gönderir.
   4. Müşterinin tarayıcısı kapalı olsa bile 2. Adımdaki Service Worker uyanır ve bildirimi ekranda gösterir.

Bu entegrasyon adımlarında takıldığınız veya projenizin mimarisine (örneğin React, Next.js veya düz HTML/JS kullanıp kullanmadığınıza) göre detaylandırmamı istediğiniz bir kısım var mı?

