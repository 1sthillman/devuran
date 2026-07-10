# Firebase Setup Script (PowerShell)
# Bu script Firebase deployment için tüm gerekli adımları otomatikleştirir

$ErrorActionPreference = "Stop"

Write-Host "🔥 Firebase Setup Başlıyor..." -ForegroundColor Blue
Write-Host ""

# 1. Firebase CLI kontrolü
Write-Host "[1/9] Firebase CLI kontrolü..." -ForegroundColor Cyan
try {
    $firebaseVersion = firebase --version
    Write-Host "✓ Firebase CLI mevcut: $firebaseVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Firebase CLI bulunamadı. Yükleniyor..." -ForegroundColor Yellow
    npm install -g firebase-tools
}
Write-Host ""

# 2. Firebase login
Write-Host "[2/9] Firebase login..." -ForegroundColor Cyan
firebase login --no-localhost
Write-Host ""

# 3. Project ID kontrolü
Write-Host "[3/9] Firebase Project ID kontrolü..." -ForegroundColor Cyan
$firebaserc = Get-Content .firebaserc -Raw
if ($firebaserc -match "your-project-id") {
    Write-Host "✗ .firebaserc dosyasında 'your-project-id' bulundu!" -ForegroundColor Red
    Write-Host "Lütfen .firebaserc dosyasını güncelleyin:" -ForegroundColor Yellow
    Write-Host ""
    Get-Content .firebaserc
    Write-Host ""
    $projectId = Read-Host "Firebase Project ID'nizi girin"
    
    $firebaserc = $firebaserc -replace "your-project-id", $projectId
    $firebaserc | Out-File -FilePath .firebaserc -Encoding UTF8 -NoNewline
    
    Write-Host "✓ .firebaserc güncellendi" -ForegroundColor Green
} else {
    Write-Host "✓ Project ID ayarlanmış" -ForegroundColor Green
}
Write-Host ""

# 4. Encryption key oluştur
Write-Host "[4/9] Encryption key oluşturuluyor..." -ForegroundColor Cyan
$encryptionKey = node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
Write-Host "✓ Encryption key oluşturuldu" -ForegroundColor Green
Write-Host "Key: $encryptionKey" -ForegroundColor Yellow
Write-Host "Bu key'i kaydedin! Tekrar gösterilmeyecek." -ForegroundColor Yellow
Write-Host ""

# 5. Google OAuth credentials
Write-Host "[5/9] Google OAuth Credentials" -ForegroundColor Cyan
Write-Host "Google Cloud Console'dan OAuth credentials alın:" -ForegroundColor Yellow
Write-Host "1. https://console.cloud.google.com/apis/credentials"
Write-Host "2. Create Credentials → OAuth 2.0 Client ID"
Write-Host "3. Redirect URI ekleyin (deploy sonrası güncelleyeceksiniz)"
Write-Host ""
$googleClientId = Read-Host "Google Client ID"
$googleClientSecret = Read-Host "Google Client Secret"
Write-Host ""

# 6. Firebase Functions config
Write-Host "[6/9] Firebase Functions config ayarları..." -ForegroundColor Cyan

# Project ID'yi al
$firebaserc = Get-Content .firebaserc -Raw | ConvertFrom-Json
$projectId = $firebaserc.projects.default

firebase functions:config:set `
  google.client_id="$googleClientId" `
  google.client_secret="$googleClientSecret" `
  google.redirect_uri="https://$projectId.web.app/api/v1/google/oauth/callback" `
  encryption.key="$encryptionKey" `
  google_integration.enabled="true" `
  redis.enabled="false"

Write-Host "✓ Functions config ayarlandı" -ForegroundColor Green
Write-Host ""

# 7. Frontend build
Write-Host "[7/9] Frontend build..." -ForegroundColor Cyan
if (-not (Test-Path "frontend")) {
    Write-Host "✗ frontend/ klasörü bulunamadı!" -ForegroundColor Red
    exit 1
}

Push-Location frontend
if (-not (Test-Path "node_modules")) {
    Write-Host "npm install çalıştırılıyor..."
    npm install
}
npm run build
Pop-Location
Write-Host "✓ Frontend build tamamlandı" -ForegroundColor Green
Write-Host ""

# 8. Functions build
Write-Host "[8/9] Functions build..." -ForegroundColor Cyan
if (-not (Test-Path "functions")) {
    Write-Host "✗ functions/ klasörü bulunamadı!" -ForegroundColor Red
    exit 1
}

Push-Location functions
if (-not (Test-Path "node_modules")) {
    Write-Host "npm install çalıştırılıyor..."
    npm install
}
npm run build
Pop-Location
Write-Host "✓ Functions build tamamlandı" -ForegroundColor Green
Write-Host ""

# 9. Deploy
Write-Host "[9/9] Firebase Deploy" -ForegroundColor Cyan
$deployChoice = Read-Host "Deploy etmek istiyor musunuz? (y/n)"

if ($deployChoice -match "^[Yy]$") {
    Write-Host "Deploy başlıyor..." -ForegroundColor Blue
    firebase deploy
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ DEPLOYMENT BAŞARILI!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📍 URL'ler:" -ForegroundColor Cyan
    Write-Host "   Hosting: https://$projectId.web.app"
    Write-Host "   API: https://$projectId.web.app/api/health"
    Write-Host "   Dashboard: https://$projectId.web.app/dashboard/google-integration"
    Write-Host ""
    Write-Host "⚠️  ÖNEMLİ: Google Cloud Console'da OAuth Redirect URI'yi güncelleyin:" -ForegroundColor Yellow
    Write-Host "   https://$projectId.web.app/api/v1/google/oauth/callback"
    Write-Host ""
    Write-Host "🧪 Test:" -ForegroundColor Cyan
    Write-Host "   curl https://$projectId.web.app/api/health"
    Write-Host ""
} else {
    Write-Host "Deploy atlandı. Manuel deploy için:" -ForegroundColor Yellow
    Write-Host "   firebase deploy"
}

Write-Host ""
Write-Host "✨ Setup tamamlandı!" -ForegroundColor Green
Write-Host ""
Write-Host "📚 Dokümantasyon:" -ForegroundColor Cyan
Write-Host "   - QUICK_FIREBASE_START.md - Hızlı başlangıç"
Write-Host "   - FIREBASE_DEPLOYMENT_GUIDE.md - Detaylı rehber"
Write-Host "   - README_FIREBASE.md - Tam dokümantasyon"
Write-Host ""
Write-Host "🔧 Yararlı komutlar:" -ForegroundColor Cyan
Write-Host "   firebase emulators:start    # Local test"
Write-Host "   firebase functions:log      # Logs"
Write-Host "   firebase deploy --only hosting    # Sadece frontend"
Write-Host "   firebase deploy --only functions  # Sadece backend"
Write-Host ""
