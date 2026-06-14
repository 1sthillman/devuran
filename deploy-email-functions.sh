#!/bin/bash

# 📧 Email Functions Deployment Script
# Firebase Cloud Functions + Resend entegrasyonu

echo "🚀 Email Functions Deployment Başlıyor..."
echo ""

# 1. Build kontrolü
echo "📦 1/4 - Build kontrol ediliyor..."
cd functions
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build başarısız! Hataları düzeltin."
    exit 1
fi
echo "✅ Build başarılı"
echo ""

# 2. API Key kontrolü
echo "🔑 2/4 - Resend API Key kontrol ediliyor..."
echo ""
echo "⚠️  RESEND_API_KEY secret'ını eklediniz mi?"
echo ""
echo "Eğer eklemediyseniz, şimdi ekleyin:"
echo "  firebase functions:secrets:set RESEND_API_KEY"
echo ""
read -p "API Key eklendi mi? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Önce API key'i ekleyin, sonra tekrar çalıştırın."
    exit 1
fi
echo "✅ API Key hazır"
echo ""

# 3. Deploy
echo "🚀 3/4 - Functions deploy ediliyor..."
cd ..
firebase deploy --only functions
if [ $? -ne 0 ]; then
    echo "❌ Deploy başarısız!"
    exit 1
fi
echo "✅ Deploy başarılı"
echo ""

# 4. Test talimatları
echo "🎉 4/4 - Deployment tamamlandı!"
echo ""
echo "📝 Test için:"
echo "  1. Uygulamada yeni randevu oluştur"
echo "  2. Firebase Console → Functions → Logs"
echo "  3. Resend Dashboard → Logs"
echo ""
echo "✅ Email bildirimleri aktif!"
