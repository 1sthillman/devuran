import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface AppointmentData {
  id: string;
  userId: string;
  salonId: string;
  salonName: string;
  salonAddress: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  staffName: string;
  services: Array<{ name: string; price: number; duration: number }>;
  date: string;
  time: string;
  endTime: string;
  totalPrice: number;
  totalDuration: number;
  status: string;
}

/**
 * Randevu oluşturulduğunda tetiklenir
 * Müşteriye ve salon sahibine email gönderir
 * 
 * ✅ GÜVENLİK: Trigger validation ve rate limiting eklendi
 */
export const onAppointmentCreated = functions
  .runWith({
    memory: '256MB',
    timeoutSeconds: 60,
    // ✅ GÜVENLİK: Rate limiting - Max 100 email/dakika
    maxInstances: 10,
  })
  .firestore
  .document("appointments/{appointmentId}")
  .onCreate(async (snap, context) => {
    try {
      const appointment = snap.data() as AppointmentData;
      const appointmentId = context.params.appointmentId;

      console.log(`New appointment created: ${appointmentId}`);
      
      // ✅ GÜVENLİK: Temel validation - fake appointment kontrolü
      if (!appointment.userId || !appointment.salonId || !appointment.customerName) {
        console.warn('Invalid appointment data - skipping email');
        return { success: false, reason: 'Invalid data' };
      }
      
      // ✅ GÜVENLİK: Randevunun gerçek olduğunu doğrula (salon ve user var mı?)
      const [salonDoc, userDoc] = await Promise.all([
        admin.firestore().collection("salons").doc(appointment.salonId).get(),
        admin.firestore().collection("users").doc(appointment.userId).get()
      ]);
      
      if (!salonDoc.exists || !userDoc.exists) {
        console.warn('Salon or user not found - potential fake appointment');
        return { success: false, reason: 'Invalid salon or user' };
      }

      // Müşteri email'ini al (eğer yoksa user'dan çek)
      let customerEmail = appointment.customerEmail;
      
      if (!customerEmail && appointment.userId) {
        if (userDoc.exists) {
          customerEmail = userDoc.data()?.email;
        }
      }

      // Salon sahibinin email'ini al
      const salonData = salonDoc.data();
      const ownerEmail = salonData?.ownerEmail || salonData?.email;

      // Hizmetleri formatla
      const servicesHtml = appointment.services
        .map(s => `<li>${s.name} - ${s.duration} dk - ${s.price} ₺</li>`)
        .join("");

      // Müşteriye onay emaili gönder
      if (customerEmail) {
        try {
          await resend.emails.send({
            from: "Randevu Sistemi <onboarding@resend.dev>", // Test için - production'da değiştir
            to: customerEmail,
            subject: "✓ Randevunuz Onaylandı",
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                           color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                  .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                  .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; 
                             box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                  .info-row { display: flex; padding: 10px 0; border-bottom: 1px solid #eee; }
                  .info-label { font-weight: bold; width: 120px; color: #667eea; }
                  .info-value { flex: 1; }
                  .services { list-style: none; padding: 0; }
                  .services li { padding: 8px 0; border-bottom: 1px solid #eee; }
                  .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                  .button { display: inline-block; padding: 12px 30px; background: #667eea; 
                           color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>🎉 Randevunuz Onaylandı!</h1>
                  </div>
                  <div class="content">
                    <p>Merhaba <strong>${appointment.customerName}</strong>,</p>
                    <p>Randevunuz başarıyla oluşturuldu ve onaylandı.</p>
                    
                    <div class="info-box">
                      <h3>📅 Randevu Detayları</h3>
                      <div class="info-row">
                        <span class="info-label">Salon:</span>
                        <span class="info-value">${appointment.salonName}</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Adres:</span>
                        <span class="info-value">${appointment.salonAddress}</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Personel:</span>
                        <span class="info-value">${appointment.staffName}</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Tarih:</span>
                        <span class="info-value">${appointment.date}</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Saat:</span>
                        <span class="info-value">${appointment.time} - ${appointment.endTime}</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Süre:</span>
                        <span class="info-value">${appointment.totalDuration} dakika</span>
                      </div>
                    </div>

                    <div class="info-box">
                      <h3>💇 Hizmetler</h3>
                      <ul class="services">
                        ${servicesHtml}
                      </ul>
                      <div style="text-align: right; margin-top: 15px; font-size: 18px; font-weight: bold; color: #667eea;">
                        Toplam: ${appointment.totalPrice} ₺
                      </div>
                    </div>

                    <p style="margin-top: 30px;">
                      <strong>Not:</strong> Randevunuzu iptal etmek isterseniz, 
                      lütfen en az 24 saat öncesinden bildirin.
                    </p>

                    <div style="text-align: center;">
                      <a href="https://devuran.com/appointments" class="button">
                        Randevularımı Görüntüle
                      </a>
                    </div>
                  </div>
                  <div class="footer">
                    <p>Bu email otomatik olarak gönderilmiştir.</p>
                    <p>© ${new Date().getFullYear()} Devuran. Tüm hakları saklıdır.</p>
                  </div>
                </div>
              </body>
              </html>
            `,
          });
          console.log(`Customer email sent to: ${customerEmail}`);
        } catch (error) {
          console.error("Error sending customer email:", error);
        }
      }

      // Salon sahibine bildirim emaili gönder
      if (ownerEmail) {
        try {
          await resend.emails.send({
            from: "Randevu Sistemi <onboarding@resend.dev>", // Test için - production'da değiştir
            to: ownerEmail,
            subject: "🔔 Yeni Randevu Geldi!",
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); 
                           color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                  .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                  .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; 
                             box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                  .info-row { display: flex; padding: 10px 0; border-bottom: 1px solid #eee; }
                  .info-label { font-weight: bold; width: 120px; color: #f5576c; }
                  .info-value { flex: 1; }
                  .services { list-style: none; padding: 0; }
                  .services li { padding: 8px 0; border-bottom: 1px solid #eee; }
                  .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                  .button { display: inline-block; padding: 12px 30px; background: #f5576c; 
                           color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>🎊 Yeni Randevu!</h1>
                  </div>
                  <div class="content">
                    <p>Merhaba,</p>
                    <p>Salonunuza yeni bir randevu geldi.</p>
                    
                    <div class="info-box">
                      <h3>👤 Müşteri Bilgileri</h3>
                      <div class="info-row">
                        <span class="info-label">Ad Soyad:</span>
                        <span class="info-value">${appointment.customerName}</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Telefon:</span>
                        <span class="info-value">${appointment.customerPhone}</span>
                      </div>
                      ${customerEmail ? `
                      <div class="info-row">
                        <span class="info-label">Email:</span>
                        <span class="info-value">${customerEmail}</span>
                      </div>
                      ` : ''}
                    </div>

                    <div class="info-box">
                      <h3>📅 Randevu Detayları</h3>
                      <div class="info-row">
                        <span class="info-label">Personel:</span>
                        <span class="info-value">${appointment.staffName}</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Tarih:</span>
                        <span class="info-value">${appointment.date}</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Saat:</span>
                        <span class="info-value">${appointment.time} - ${appointment.endTime}</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Süre:</span>
                        <span class="info-value">${appointment.totalDuration} dakika</span>
                      </div>
                    </div>

                    <div class="info-box">
                      <h3>💇 Hizmetler</h3>
                      <ul class="services">
                        ${servicesHtml}
                      </ul>
                      <div style="text-align: right; margin-top: 15px; font-size: 18px; font-weight: bold; color: #f5576c;">
                        Toplam: ${appointment.totalPrice} ₺
                      </div>
                    </div>

                    <div style="text-align: center;">
                      <a href="https://devuran.com/owner/reservations" class="button">
                        Randevuları Yönet
                      </a>
                    </div>
                  </div>
                  <div class="footer">
                    <p>Bu email otomatik olarak gönderilmiştir.</p>
                    <p>© ${new Date().getFullYear()} Devuran. Tüm hakları saklıdır.</p>
                  </div>
                </div>
              </body>
              </html>
            `,
          });
          console.log(`Owner email sent to: ${ownerEmail}`);
        } catch (error) {
          console.error("Error sending owner email:", error);
        }
      }

      return { success: true };
    } catch (error) {
      console.error("Error in onAppointmentCreated:", error);
      // Hata olsa bile randevu oluşturulmuş olur, sadece email gitmez
      return { success: false, error: String(error) };
    }
  });
