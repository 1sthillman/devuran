#!/bin/bash

# Firebase Setup Script
# Bu script Firebase deployment için tüm gerekli adımları otomatikleştirir

set -e  # Hata olursa dur

echo "🔥 Firebase Setup Başlıyor..."
echo ""

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Firebase CLI kontrolü
echo -e "${BLUE}[1/9] Firebase CLI kontrolü...${NC}"
if ! command -v firebase &> /dev/null; then
    echo -e "${YELLOW}Firebase CLI bulunamadı. Yükleniyor...${NC}"
    npm install -g firebase-tools
else
    echo -e "${GREEN}✓ Firebase CLI mevcut${NC}"
fi
echo ""

# 2. Firebase login
echo -e "${BLUE}[2/9] Firebase login...${NC}"
firebase login --no-localhost
echo ""

# 3. Project ID kontrolü
echo -e "${BLUE}[3/9] Firebase Project ID kontrolü...${NC}"
if grep -q "your-project-id" .firebaserc; then
    echo -e "${RED}✗ .firebaserc dosyasında 'your-project-id' bulundu!${NC}"
    echo -e "${YELLOW}Lütfen .firebaserc dosyasını güncelleyin:${NC}"
    echo ""
    cat .firebaserc
    echo ""
    read -p "Firebase Project ID'nizi girin: " PROJECT_ID
    
    # macOS ve Linux uyumlu sed
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/your-project-id/$PROJECT_ID/g" .firebaserc
    else
        sed -i "s/your-project-id/$PROJECT_ID/g" .firebaserc
    fi
    
    echo -e "${GREEN}✓ .firebaserc güncellendi${NC}"
else
    echo -e "${GREEN}✓ Project ID ayarlanmış${NC}"
fi
echo ""

# 4. Encryption key oluştur
echo -e "${BLUE}[4/9] Encryption key oluşturuluyor...${NC}"
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
echo -e "${GREEN}✓ Encryption key oluşturuldu${NC}"
echo -e "${YELLOW}Key: $ENCRYPTION_KEY${NC}"
echo -e "${YELLOW}Bu key'i kaydedin! Tekrar gösterilmeyecek.${NC}"
echo ""

# 5. Google OAuth credentials
echo -e "${BLUE}[5/9] Google OAuth Credentials${NC}"
echo -e "${YELLOW}Google Cloud Console'dan OAuth credentials alın:${NC}"
echo "1. https://console.cloud.google.com/apis/credentials"
echo "2. Create Credentials → OAuth 2.0 Client ID"
echo "3. Redirect URI ekleyin (deploy sonrası güncelleyeceksiniz)"
echo ""
read -p "Google Client ID: " GOOGLE_CLIENT_ID
read -p "Google Client Secret: " GOOGLE_CLIENT_SECRET
echo ""

# 6. Firebase Functions config
echo -e "${BLUE}[6/9] Firebase Functions config ayarları...${NC}"

# Project ID'yi al
PROJECT_ID=$(grep -o '"default": "[^"]*"' .firebaserc | cut -d'"' -f4)

firebase functions:config:set \
  google.client_id="$GOOGLE_CLIENT_ID" \
  google.client_secret="$GOOGLE_CLIENT_SECRET" \
  google.redirect_uri="https://$PROJECT_ID.web.app/api/v1/google/oauth/callback" \
  encryption.key="$ENCRYPTION_KEY" \
  google_integration.enabled="true" \
  redis.enabled="false"

echo -e "${GREEN}✓ Functions config ayarlandı${NC}"
echo ""

# 7. Frontend build
echo -e "${BLUE}[7/9] Frontend build...${NC}"
if [ ! -d "frontend" ]; then
    echo -e "${RED}✗ frontend/ klasörü bulunamadı!${NC}"
    exit 1
fi

cd frontend
if [ ! -d "node_modules" ]; then
    echo "npm install çalıştırılıyor..."
    npm install
fi
npm run build
cd ..
echo -e "${GREEN}✓ Frontend build tamamlandı${NC}"
echo ""

# 8. Functions build
echo -e "${BLUE}[8/9] Functions build...${NC}"
if [ ! -d "functions" ]; then
    echo -e "${RED}✗ functions/ klasörü bulunamadı!${NC}"
    exit 1
fi

cd functions
if [ ! -d "node_modules" ]; then
    echo "npm install çalıştırılıyor..."
    npm install
fi
npm run build
cd ..
echo -e "${GREEN}✓ Functions build tamamlandı${NC}"
echo ""

# 9. Deploy
echo -e "${BLUE}[9/9] Firebase Deploy${NC}"
echo -e "${YELLOW}Deploy etmek istiyor musunuz? (y/n)${NC}"
read -p "> " DEPLOY_CHOICE

if [[ "$DEPLOY_CHOICE" =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Deploy başlıyor...${NC}"
    firebase deploy
    
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✅ DEPLOYMENT BAŞARILI!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${BLUE}📍 URL'ler:${NC}"
    echo "   Hosting: https://$PROJECT_ID.web.app"
    echo "   API: https://$PROJECT_ID.web.app/api/health"
    echo "   Dashboard: https://$PROJECT_ID.web.app/dashboard/google-integration"
    echo ""
    echo -e "${YELLOW}⚠️  ÖNEMLİ: Google Cloud Console'da OAuth Redirect URI'yi güncelleyin:${NC}"
    echo "   https://$PROJECT_ID.web.app/api/v1/google/oauth/callback"
    echo ""
    echo -e "${BLUE}🧪 Test:${NC}"
    echo "   curl https://$PROJECT_ID.web.app/api/health"
    echo ""
else
    echo -e "${YELLOW}Deploy atlandı. Manuel deploy için:${NC}"
    echo "   firebase deploy"
fi

echo ""
echo -e "${GREEN}✨ Setup tamamlandı!${NC}"
echo ""
echo -e "${BLUE}📚 Dokümantasyon:${NC}"
echo "   - QUICK_FIREBASE_START.md - Hızlı başlangıç"
echo "   - FIREBASE_DEPLOYMENT_GUIDE.md - Detaylı rehber"
echo "   - README_FIREBASE.md - Tam dokümantasyon"
echo ""
echo -e "${BLUE}🔧 Yararlı komutlar:${NC}"
echo "   firebase emulators:start    # Local test"
echo "   firebase functions:log      # Logs"
echo "   firebase deploy --only hosting    # Sadece frontend"
echo "   firebase deploy --only functions  # Sadece backend"
echo ""
