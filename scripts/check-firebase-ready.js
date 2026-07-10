#!/usr/bin/env node

/**
 * Firebase Deployment Readiness Checker
 * 
 * Bu script Firebase deployment için tüm gereksinimleri kontrol eder.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Renkler
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkCommand(command, name) {
  try {
    execSync(`${command} --version`, { stdio: 'pipe' });
    log(`✓ ${name} mevcut`, 'green');
    return true;
  } catch (error) {
    log(`✗ ${name} bulunamadı`, 'red');
    return false;
  }
}

function checkFile(filePath, name) {
  if (fs.existsSync(filePath)) {
    log(`✓ ${name} var`, 'green');
    return true;
  } else {
    log(`✗ ${name} bulunamadı`, 'red');
    return false;
  }
}

function checkFileContent(filePath, searchString, name) {
  if (!fs.existsSync(filePath)) {
    log(`✗ ${name}: Dosya bulunamadı`, 'red');
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(searchString)) {
    log(`✗ ${name}: "${searchString}" bulundu (güncellenmeli)`, 'red');
    return false;
  } else {
    log(`✓ ${name} güncellendi`, 'green');
    return true;
  }
}

function checkDirectory(dirPath, name) {
  if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
    const files = fs.readdirSync(dirPath);
    if (files.length > 0) {
      log(`✓ ${name} var (${files.length} dosya)`, 'green');
      return true;
    } else {
      log(`✗ ${name} boş`, 'yellow');
      return false;
    }
  } else {
    log(`✗ ${name} bulunamadı`, 'red');
    return false;
  }
}

async function main() {
  log('\n🔍 Firebase Deployment Hazırlık Kontrolü\n', 'blue');
  
  const checks = {
    required: [],
    optional: [],
    warnings: [],
  };
  
  // 1. CLI Tools
  log('📦 CLI Tools:', 'cyan');
  checks.required.push(checkCommand('node', 'Node.js'));
  checks.required.push(checkCommand('npm', 'npm'));
  checks.required.push(checkCommand('firebase', 'Firebase CLI'));
  console.log();
  
  // 2. Firebase Configuration Files
  log('🔧 Firebase Configuration:', 'cyan');
  checks.required.push(checkFile('firebase.json', 'firebase.json'));
  checks.required.push(checkFile('.firebaserc', '.firebaserc'));
  checks.required.push(checkFile('firestore.rules', 'firestore.rules'));
  checks.required.push(checkFile('firestore.indexes.json', 'firestore.indexes.json'));
  checks.required.push(checkFileContent('.firebaserc', 'your-project-id', '.firebaserc project ID'));
  console.log();
  
  // 3. Functions
  log('⚡ Functions:', 'cyan');
  checks.required.push(checkDirectory('functions', 'functions/'));
  checks.required.push(checkFile('functions/package.json', 'functions/package.json'));
  checks.required.push(checkFile('functions/tsconfig.json', 'functions/tsconfig.json'));
  checks.required.push(checkFile('functions/src/index.ts', 'functions/src/index.ts'));
  
  if (fs.existsSync('functions/node_modules')) {
    log('✓ functions/node_modules/ var', 'green');
  } else {
    log('⚠ functions/node_modules/ yok (npm install gerekli)', 'yellow');
    checks.warnings.push('functions dependencies');
  }
  
  if (fs.existsSync('functions/lib')) {
    log('✓ functions/lib/ var (build edilmiş)', 'green');
  } else {
    log('⚠ functions/lib/ yok (npm run build gerekli)', 'yellow');
    checks.warnings.push('functions build');
  }
  console.log();
  
  // 4. Backend Source
  log('🔧 Backend Source:', 'cyan');
  checks.required.push(checkDirectory('src', 'src/'));
  checks.required.push(checkFile('src/app.ts', 'src/app.ts'));
  checks.required.push(checkDirectory('src/routes', 'src/routes/'));
  checks.required.push(checkDirectory('src/services', 'src/services/'));
  console.log();
  
  // 5. Frontend
  log('🎨 Frontend:', 'cyan');
  checks.required.push(checkDirectory('frontend', 'frontend/'));
  checks.required.push(checkFile('frontend/package.json', 'frontend/package.json'));
  
  if (fs.existsSync('frontend/node_modules')) {
    log('✓ frontend/node_modules/ var', 'green');
  } else {
    log('⚠ frontend/node_modules/ yok (npm install gerekli)', 'yellow');
    checks.warnings.push('frontend dependencies');
  }
  
  if (fs.existsSync('frontend/dist')) {
    const distFiles = fs.readdirSync('frontend/dist');
    if (distFiles.length > 0) {
      log(`✓ frontend/dist/ var (${distFiles.length} dosya)`, 'green');
    } else {
      log('⚠ frontend/dist/ boş (npm run build gerekli)', 'yellow');
      checks.warnings.push('frontend build');
    }
  } else {
    log('⚠ frontend/dist/ yok (npm run build gerekli)', 'yellow');
    checks.warnings.push('frontend build');
  }
  console.log();
  
  // 6. Environment Variables Check
  log('🔐 Environment Variables:', 'cyan');
  log('ℹ️  Firebase Functions config kontrol edilemiyor (manuel kontrol edin)', 'yellow');
  log('   Komut: firebase functions:config:get', 'yellow');
  console.log();
  
  // 7. Documentation
  log('📚 Documentation:', 'cyan');
  checks.optional.push(checkFile('FIREBASE_DEPLOYMENT_GUIDE.md', 'FIREBASE_DEPLOYMENT_GUIDE.md'));
  checks.optional.push(checkFile('QUICK_FIREBASE_START.md', 'QUICK_FIREBASE_START.md'));
  checks.optional.push(checkFile('README_FIREBASE.md', 'README_FIREBASE.md'));
  console.log();
  
  // Sonuç
  const requiredPassed = checks.required.filter(Boolean).length;
  const requiredTotal = checks.required.length;
  const optionalPassed = checks.optional.filter(Boolean).length;
  const optionalTotal = checks.optional.length;
  
  log('\n📊 Sonuç:', 'cyan');
  log(`Gerekli kontroller: ${requiredPassed}/${requiredTotal}`, requiredPassed === requiredTotal ? 'green' : 'red');
  log(`Opsiyonel kontroller: ${optionalPassed}/${optionalTotal}`, 'blue');
  
  if (checks.warnings.length > 0) {
    log(`\n⚠️  Uyarılar (${checks.warnings.length}):`, 'yellow');
    checks.warnings.forEach(warning => {
      log(`  - ${warning}`, 'yellow');
    });
  }
  
  console.log();
  
  if (requiredPassed === requiredTotal && checks.warnings.length === 0) {
    log('✅ TÜM KONTROLLER BAŞARILI! Deploy için hazırsınız.', 'green');
    log('\nDeployment için:', 'cyan');
    log('  firebase deploy', 'blue');
    console.log();
    process.exit(0);
  } else if (requiredPassed === requiredTotal) {
    log('⚠️  Tüm gerekli kontroller başarılı ama bazı uyarılar var.', 'yellow');
    log('\nEksikleri tamamlamak için:', 'cyan');
    if (checks.warnings.includes('functions dependencies')) {
      log('  cd functions && npm install', 'blue');
    }
    if (checks.warnings.includes('functions build')) {
      log('  cd functions && npm run build', 'blue');
    }
    if (checks.warnings.includes('frontend dependencies')) {
      log('  cd frontend && npm install', 'blue');
    }
    if (checks.warnings.includes('frontend build')) {
      log('  cd frontend && npm run build', 'blue');
    }
    log('\nVeya hepsini birden:', 'cyan');
    log('  npm run firebase:build', 'blue');
    console.log();
    process.exit(0);
  } else {
    log('❌ Bazı gerekli kontroller başarısız!', 'red');
    log('\nLütfen eksikleri tamamlayın ve tekrar deneyin.', 'yellow');
    log('\nYardım için:', 'cyan');
    log('  - FIREBASE_DEPLOYMENT_GUIDE.md', 'blue');
    log('  - QUICK_FIREBASE_START.md', 'blue');
    console.log();
    process.exit(1);
  }
}

main().catch(error => {
  log(`\n❌ Hata: ${error.message}`, 'red');
  process.exit(1);
});
