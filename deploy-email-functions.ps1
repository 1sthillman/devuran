# 📧 Email Functions Deployment Script (PowerShell)
# Firebase Cloud Functions + Resend entegrasyonu

Write-Host "🚀 Email Functions Deployment Başlıyor..." -ForegroundColor Cyan
Write-Host ""

# 1. Build kontrolü
Write-Host "📦 1/4 - Build kontrol ediliyor..." -ForegroundColor Yellow
Set-Location functions
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build başarısız! Hataları düzeltin." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build başarılı" -ForegroundColor Green
Write-Host ""

# 2. API Key kontrolü
Write-Host "🔑 2/4 - Resend API Key kontrol ediliyor..." -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  RESEND_API_KEY secret'ını eklediniz mi?" -ForegroundColor Yellow
Write-Host ""
Write-Host "Eğer eklemediyseniz, şimdi ekleyin:"
Write-Host "  firebase functions:secrets:set RESEND_API_KEY" -ForegroundColor Cyan
Write-Host ""
$response = Read-Host "API Key eklendi mi? (y/n)"
if ($response -notmatch '^[Yy]$') {
    Write-Host "❌ Önce API key'i ekleyin, sonra tekrar çalıştırın." -ForegroundColor Red
    exit 1
}
Write-Host "✅ API Key hazır" -ForegroundColor Green
Write-Host ""

# 3. Deploy
Write-Host "🚀 3/4 - Functions deploy ediliyor..." -ForegroundColor Yellow
Set-Location ..
firebase deploy --only functions
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deploy başarısız!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Deploy başarılı" -ForegroundColor Green
Write-Host ""

# 4. Test talimatları
Write-Host "🎉 4/4 - Deployment tamamlandı!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Test için:" -ForegroundColor Cyan
Write-Host "  1. Uygulamada yeni randevu oluştur"
Write-Host "  2. Firebase Console → Functions → Logs"
Write-Host "  3. Resend Dashboard → Logs"
Write-Host ""
Write-Host "✅ Email bildirimleri aktif!" -ForegroundColor Green
